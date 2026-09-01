import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workId = String(process.argv[2] || '').trim();
if (!/^[a-z0-9][a-z0-9-]*$/.test(workId)) {
  throw new Error('작품 ID를 입력하세요. 예: npm.cmd run voice:import -- aristophanes-clouds');
}

const workDir = path.join(projectRoot, 'content', 'voice', workId);
const manifestPath = path.join(workDir, 'work.json');

function resolveUnitPath(file) {
  const unitPath = path.resolve(workDir, file);
  if (!unitPath.startsWith(`${workDir}${path.sep}`)) {
    throw new Error(`단위 파일이 작품 폴더 밖을 가리킵니다: ${file}`);
  }
  return unitPath;
}

function decodeXml(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function xmlText(xml) {
  return decodeXml(
    xml
      .replace(/<choice>[\s\S]*?<corr\b[^>]*>([\s\S]*?)<\/corr>[\s\S]*?<\/choice>/gi, '$1')
      .replace(/<note\b[^>]*>[\s\S]*?<\/note>/gi, '')
      .replace(/<[^>]+>/g, '')
  ).replace(/\s+/g, ' ').trim().normalize('NFC');
}

function attribute(attributes, name) {
  return attributes.match(new RegExp(`\\b${name}="([^"]+)"`, 'i'))?.[1] || null;
}

function speakerGreek(speaker) {
  if (!speaker) return null;
  if (typeof speaker === 'string') return speaker.normalize('NFC');
  return String(speaker.greek || speaker.label || '').trim().normalize('NFC') || null;
}

function collectKnownSpeakers(existingUnits) {
  const knownSpeakers = new Map();
  for (const passages of existingUnits.values()) {
    for (const passage of passages) {
      const greek = speakerGreek(passage.speaker);
      if (greek && typeof passage.speaker === 'object') knownSpeakers.set(greek, passage.speaker);
    }
  }
  return knownSpeakers;
}

function speakerWithKnownTranslations(greek, knownSpeakers) {
  const known = knownSpeakers.get(greek);
  return known ? { ...known, greek } : { greek };
}

function preserveManualFields(passage, existing) {
  passage.koreanText = String(existing?.koreanText || '(준비중입니다)').normalize('NFC');
  if (existing?.audio) passage.audio = existing.audio;
  if (existing?.paragraphStart) passage.paragraphStart = true;
  if (existing?.omitted) passage.omitted = true;
  return passage;
}

function parseLines(xml, existingPassages) {
  const existingById = new Map(existingPassages.map((passage) => [String(passage.id), passage]));
  const passages = [];
  const seenIds = new Set();

  for (const lineMatch of xml.matchAll(/<l\b([^>]*)>([\s\S]*?)<\/l>/gi)) {
    const id = attribute(lineMatch[1], 'n');
    const greekText = xmlText(lineMatch[2]);
    if (!id || !greekText) continue;
    if (seenIds.has(id)) throw new Error(`원문에 중복된 행 번호가 있습니다: ${id}`);
    seenIds.add(id);

    const existing = existingById.get(id);
    const passage = preserveManualFields({
      id,
      label: existing?.label ? String(existing.label) : id,
      greekText,
    }, existing);
    if (/<milestone\b[^>]*unit="para"/i.test(lineMatch[2])) passage.paragraphStart = true;
    passages.push(passage);
  }
  return passages;
}

function parseDrama(xml, existingPassages, knownSpeakers) {
  const existingById = new Map(existingPassages.map((passage) => [String(passage.id), passage]));
  const passages = [];
  const seenIds = new Set();
  let previousSpeaker = null;

  for (const speechMatch of xml.matchAll(/<sp\b[^>]*>([\s\S]*?)<\/sp>/gi)) {
    const speechXml = speechMatch[1];
    const speakerMatch = speechXml.match(/<speaker\b[^>]*>([\s\S]*?)<\/speaker>/i);
    const speaker = speakerMatch ? xmlText(speakerMatch[1]) : null;
    const lines = [];

    for (const lineMatch of speechXml.matchAll(/<l\b([^>]*)>([\s\S]*?)<\/l>/gi)) {
      const id = attribute(lineMatch[1], 'n');
      const greekText = xmlText(lineMatch[2]);
      if (!id || !greekText) continue;
      if (seenIds.has(id)) throw new Error(`원문에 중복된 행 번호가 있습니다: ${id}`);
      seenIds.add(id);
      lines.push({ id, greekText });
    }

    if (lines.length === 0) continue;
    const speakerChanged = Boolean(speaker && speaker !== previousSpeaker);
    for (const [index, line] of lines.entries()) {
      const existing = existingById.get(line.id);
      passages.push(preserveManualFields({
        id: line.id,
        label: existing?.label ? String(existing.label) : line.id,
        ...(speakerChanged && index === 0 ? { speaker: speakerWithKnownTranslations(speaker, knownSpeakers) } : {}),
        greekText: line.greekText,
      }, existing));
    }
    if (speaker) previousSpeaker = speaker;
  }
  return passages;
}

function findBookParts(xml) {
  const parts = [];
  const pattern = /<div\b(?=[^>]*\btype="textpart")(?=[^>]*\bsubtype="book")([^>]*)>([\s\S]*?)<\/div>/gi;
  for (const match of xml.matchAll(pattern)) {
    const id = attribute(match[1], 'n');
    if (id) parts.push({ id, xml: match[2] });
  }
  return parts;
}

function detectStructure(xml, requested) {
  if (requested && requested !== 'auto') return requested;
  if (/<sp\b/i.test(xml) && /<speaker\b/i.test(xml)) return 'drama';
  if (/<div\b(?=[^>]*\bsubtype="book")/i.test(xml)) return 'books';
  return 'single';
}

async function readExistingUnits(manifest) {
  const units = new Map();
  for (const unit of manifest.units || []) {
    const unitPath = resolveUnitPath(unit.file);
    try {
      const data = JSON.parse(await fs.readFile(unitPath, 'utf8'));
      units.set(String(unit.id), data.passages || []);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      units.set(String(unit.id), []);
    }
  }
  return units;
}

async function downloadXml(url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url, { headers: { 'user-agent': 'leonld94-blog-content-importer/1.0' } });
    if (response.ok) return response.text();
    if (attempt === 3) throw new Error(`원문 XML을 받을 수 없습니다: HTTP ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  throw new Error('원문 XML을 받을 수 없습니다.');
}

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const importConfig = manifest.textImport;
if (importConfig?.format !== 'perseus-tei' || !importConfig.xmlUrl) {
  throw new Error(`${manifestPath}에 textImport.format="perseus-tei"와 textImport.xmlUrl을 설정하세요.`);
}
if (!/^https?:\/\//i.test(importConfig.xmlUrl)) {
  throw new Error('textImport.xmlUrl은 http 또는 https 주소여야 합니다.');
}

const existingUnits = await readExistingUnits(manifest);
const knownSpeakers = collectKnownSpeakers(existingUnits);
const xml = await downloadXml(importConfig.xmlUrl);
const structure = detectStructure(xml, importConfig.structure);
let parsedUnits;

if (structure === 'drama') {
  const unit = manifest.units?.[0] || { id: '1', label: '1', file: 'units/01.json' };
  parsedUnits = [{ id: String(unit.id), label: String(unit.label || unit.id), passages: parseDrama(xml, existingUnits.get(String(unit.id)) || [], knownSpeakers) }];
} else if (structure === 'books') {
  parsedUnits = findBookParts(xml).map((part) => ({
    id: part.id,
    label: String(manifest.units?.find((unit) => String(unit.id) === part.id)?.label || part.id),
    passages: parseLines(part.xml, existingUnits.get(part.id) || []),
  }));
} else if (structure === 'single') {
  const unit = manifest.units?.[0] || { id: '1', label: '1' };
  parsedUnits = [{ id: String(unit.id), label: String(unit.label || unit.id), passages: parseLines(xml, existingUnits.get(String(unit.id)) || []) }];
} else {
  throw new Error(`지원하지 않는 textImport.structure입니다: ${structure}`);
}

const passageCount = parsedUnits.reduce((sum, unit) => sum + unit.passages.length, 0);
const minimumPassages = Number(importConfig.minimumPassages || 1);
if (passageCount < minimumPassages) {
  throw new Error(`가져온 구절이 예상보다 적습니다: ${passageCount}개 (최소 ${minimumPassages}개)`);
}

await fs.mkdir(path.join(workDir, 'units'), { recursive: true });
const units = [];
for (const [index, unit] of parsedUnits.entries()) {
  const existingUnit = manifest.units?.find((item) => String(item.id) === unit.id);
  const file = existingUnit?.file || `units/${String(index + 1).padStart(2, '0')}.json`;
  await fs.writeFile(resolveUnitPath(file), `${JSON.stringify({ passages: unit.passages }, null, 2)}\n`, 'utf8');
  units.push({ id: unit.id, label: unit.label, order: index + 1, file });
}

manifest.units = units;
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const speakerChanges = parsedUnits.flatMap((unit) => unit.passages).filter((passage) => passage.speaker).length;
console.log(`[voice-import] ${workId}: ${structure}, ${units.length}개 단위, ${passageCount}개 구절, ${speakerChanges}번의 화자 변경을 저장했습니다.`);
