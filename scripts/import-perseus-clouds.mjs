import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workDir = path.join(projectRoot, 'content', 'voice', 'aristophanes-clouds');
const manifestPath = path.join(workDir, 'work.json');
const unitPath = path.join(workDir, 'units', '01.json');
const sourceXml = 'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0019/tlg003/tlg0019.tlg003.perseus-grc2.xml';

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

function speakerGreek(speaker) {
  if (!speaker) return null;
  if (typeof speaker === 'string') return speaker.normalize('NFC');
  return String(speaker.greek || speaker.label || '').trim().normalize('NFC') || null;
}

function speakerWithKnownTranslations(greek, knownSpeakers) {
  const known = knownSpeakers.get(greek);
  return known ? { ...known, greek } : { greek };
}

function parsePassages(xml, existingPassages) {
  const existingById = new Map(existingPassages.map((passage) => [String(passage.id), passage]));
  const knownSpeakers = new Map();
  for (const passage of existingPassages) {
    const greek = speakerGreek(passage.speaker);
    if (greek && typeof passage.speaker === 'object') knownSpeakers.set(greek, passage.speaker);
  }

  const passages = [];
  const seenIds = new Set();
  let previousSpeaker = null;
  const speechPattern = /<sp\b[^>]*>([\s\S]*?)<\/sp>/gi;

  for (const speechMatch of xml.matchAll(speechPattern)) {
    const speechXml = speechMatch[1];
    const speakerMatch = speechXml.match(/<speaker\b[^>]*>([\s\S]*?)<\/speaker>/i);
    const speaker = speakerMatch ? xmlText(speakerMatch[1]) : null;
    const lines = [];

    for (const lineMatch of speechXml.matchAll(/<l\b([^>]*)>([\s\S]*?)<\/l>/gi)) {
      const idMatch = lineMatch[1].match(/\bn="([^"]+)"/i);
      const greekText = xmlText(lineMatch[2]);
      if (!idMatch || !greekText) continue;

      const id = idMatch[1];
      if (seenIds.has(id)) throw new Error(`Perseus 원문에 중복된 행 번호가 있습니다: ${id}`);
      seenIds.add(id);
      lines.push({ id, greekText });
    }

    if (lines.length === 0) continue;
    const speakerChanged = Boolean(speaker && speaker !== previousSpeaker);
    for (const [index, line] of lines.entries()) {
      const existing = existingById.get(line.id);
      const passage = {
        id: line.id,
        label: existing?.label ? String(existing.label) : line.id,
        ...(speakerChanged && index === 0 ? { speaker: speakerWithKnownTranslations(speaker, knownSpeakers) } : {}),
        greekText: line.greekText,
        koreanText: String(existing?.koreanText || '(준비중입니다)').normalize('NFC'),
      };
      if (existing?.audio) passage.audio = existing.audio;
      if (existing?.paragraphStart) passage.paragraphStart = true;
      if (existing?.omitted) passage.omitted = true;
      passages.push(passage);
    }
    if (speaker) previousSpeaker = speaker;
  }

  return passages;
}

async function downloadXml() {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(sourceXml, { headers: { 'user-agent': 'leonld94-blog-content-importer/1.0' } });
    if (response.ok) return response.text();
    if (attempt === 3) throw new Error(`Perseus 원문을 받을 수 없습니다: HTTP ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  throw new Error('Perseus 원문을 받을 수 없습니다.');
}

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
if (!manifest.source?.url?.includes('Perseus:text:1999.01.0027')) {
  throw new Error('work.json의 source가 아리스토파네스 《구름》 Perseus 판본을 가리키지 않습니다.');
}
const currentUnit = JSON.parse(await fs.readFile(unitPath, 'utf8'));
const passages = parsePassages(await downloadXml(), currentUnit.passages || []);
if (passages.length < 1500) throw new Error(`가져온 행이 예상보다 적습니다: ${passages.length}행`);

await fs.writeFile(unitPath, `${JSON.stringify({ passages }, null, 2)}\n`, 'utf8');
const speakerChanges = passages.filter((passage) => passage.speaker).length;
console.log(`[clouds-import] ${passages.length}행과 ${speakerChanges}번의 화자 변경을 저장했습니다.`);
