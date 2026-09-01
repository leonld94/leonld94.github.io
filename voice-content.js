import fs from 'node:fs';
import path from 'node:path';

export const VIRTUAL_VOICE_UNIT_PREFIX = 'virtual:voice-unit/';

function fail(filePath, message) {
  throw new Error(`[voice-contents] ${path.basename(filePath)}: ${message}`);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(filePath, `올바른 JSON 파일이 아닙니다. ${error.message}`);
  }
}

function requiredText(value, filePath, field) {
  const text = String(value ?? '').trim();
  if (!text) fail(filePath, `${field} 값이 필요합니다.`);
  return text;
}

function normalizeSource(data) {
  if (!data.source) return null;
  if (typeof data.source === 'string') {
    return {
      url: data.source,
      label: data.sourceLabel || '원문 보기',
      credit: data.credit || null,
    };
  }
  return {
    url: String(data.source.url || ''),
    label: String(data.source.label || '원문 보기'),
    credit: data.source.credit ? String(data.source.credit) : null,
  };
}

function normalizeNavigation(data) {
  const unit = data.navigation?.unit || {};
  const passage = data.navigation?.passage || {};
  return {
    unit: {
      label: String(unit.label || '단위'),
      singular: String(unit.singular || 'UNIT'),
      plural: String(unit.plural || 'UNITS'),
    },
    passage: {
      label: String(passage.label || '구절'),
      singular: String(passage.singular || 'PASSAGE'),
      plural: String(passage.plural || 'PASSAGES'),
    },
  };
}

function localAudioExists(audioUrl, projectRoot, filePath) {
  if (!audioUrl?.startsWith('/')) return Boolean(audioUrl);
  const publicRoot = path.resolve(projectRoot, 'public');
  const audioPath = path.resolve(publicRoot, audioUrl.slice(1));
  if (!audioPath.startsWith(`${publicRoot}${path.sep}`)) {
    fail(filePath, `음성 경로가 public 폴더 밖을 가리킵니다: ${audioUrl}`);
  }
  return fs.existsSync(audioPath);
}

function inferredAudioUrl(audioConfig, workId, unitId, passageId) {
  if (!audioConfig?.pattern) return null;
  const relativePath = String(audioConfig.pattern)
    .replaceAll('{work}', workId)
    .replaceAll('{unit}', unitId)
    .replaceAll('{passage}', passageId)
    .replace(/^\/+/, '');
  return `${String(audioConfig.basePath || `/audio/voice/${workId}`).replace(/\/+$/, '')}/${relativePath}`;
}

function normalizePassages({ raw, unit, work, unitFile, projectRoot }) {
  const input = Array.isArray(raw) ? raw : raw.passages;
  if (!Array.isArray(input)) fail(unitFile, 'passages 배열이 필요합니다.');
  const seenIds = new Set();

  return input.map((passage, index) => {
    const id = String(passage.id ?? passage.number ?? index + 1);
    if (seenIds.has(id)) fail(unitFile, `중복된 구절 id "${id}"가 있습니다.`);
    seenIds.add(id);

    const greekText = requiredText(passage.greekText ?? passage.text, unitFile, `${id} ${work.navigation.passage.label}의 greekText`)
      .normalize('NFC');
    const koreanText = String(passage.koreanText ?? '(준비중입니다)').trim().normalize('NFC');
    if (!koreanText) fail(unitFile, `${id} ${work.navigation.passage.label}의 koreanText가 비어 있습니다.`);

    const explicitAudio = passage.audio ? String(passage.audio) : null;
    if (explicitAudio && !localAudioExists(explicitAudio, projectRoot, unitFile)) {
      fail(unitFile, `${id} ${work.navigation.passage.label}의 음성 파일을 찾을 수 없습니다: ${explicitAudio}`);
    }
    const inferredAudio = inferredAudioUrl(work.audio, work.id, unit.id, id);
    const audio = explicitAudio || (inferredAudio && localAudioExists(inferredAudio, projectRoot, unitFile) ? inferredAudio : null);

    return {
      id,
      label: String(passage.label ?? passage.number ?? id),
      order: Number.isFinite(Number(passage.order)) ? Number(passage.order) : index + 1,
      greekText,
      koreanText,
      audio,
      ...(passage.paragraphStart ? { paragraphStart: true } : {}),
      ...(passage.omitted ? { omitted: true } : {}),
    };
  });
}

export function buildVoiceCatalog({ contentDir, projectRoot = path.dirname(contentDir) }) {
  const voicePath = path.join(contentDir, 'voice');
  if (!fs.existsSync(voicePath)) return { works: [], unitsByVirtualId: new Map(), filesByVirtualId: new Map() };

  const seenWorkIds = new Set();
  const unitsByVirtualId = new Map();
  const filesByVirtualId = new Map();
  const works = fs.readdirSync(voicePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const workDir = path.join(voicePath, entry.name);
      const manifestPath = path.join(workDir, 'work.json');
      if (!fs.existsSync(manifestPath)) return null;
      const data = readJson(manifestPath);
      const id = requiredText(data.id, manifestPath, 'id');
      if (seenWorkIds.has(id)) fail(manifestPath, `중복된 작품 id "${id}"가 있습니다.`);
      seenWorkIds.add(id);
      if (!Array.isArray(data.units) || data.units.length === 0) fail(manifestPath, 'units 배열이 필요합니다.');

      const navigation = normalizeNavigation(data);
      const work = {
        id,
        order: Number.isFinite(Number(data.order)) ? Number(data.order) : 999,
        greek: requiredText(data.titles?.greek, manifestPath, 'titles.greek'),
        english: requiredText(data.titles?.english, manifestPath, 'titles.english'),
        korean: requiredText(data.titles?.korean, manifestPath, 'titles.korean'),
        source: normalizeSource(data),
        navigation,
        audio: data.audio && typeof data.audio === 'object' ? data.audio : null,
      };
      const seenUnitIds = new Set();
      const units = data.units.map((unit, index) => {
        const unitId = String(unit.id ?? unit.number ?? index + 1);
        if (seenUnitIds.has(unitId)) fail(manifestPath, `중복된 단위 id "${unitId}"가 있습니다.`);
        seenUnitIds.add(unitId);
        const relativeFile = requiredText(unit.file, manifestPath, `${unitId} 단위의 file`);
        const unitFile = path.resolve(workDir, relativeFile);
        if (!unitFile.startsWith(`${workDir}${path.sep}`)) fail(manifestPath, `${unitId} 단위 파일이 작품 폴더 밖을 가리킵니다.`);
        if (!fs.existsSync(unitFile)) fail(manifestPath, `${unitId} 단위 파일을 찾을 수 없습니다: ${relativeFile}`);
        const passages = normalizePassages({ raw: readJson(unitFile), unit: { id: unitId }, work, unitFile, projectRoot });
        if (passages.length === 0) fail(unitFile, 'passages가 비어 있습니다.');
        const virtualId = `${VIRTUAL_VOICE_UNIT_PREFIX}${encodeURIComponent(id)}/${encodeURIComponent(unitId)}`;
        unitsByVirtualId.set(virtualId, passages);
        filesByVirtualId.set(virtualId, unitFile);
        return {
          id: unitId,
          label: String(unit.label ?? unitId),
          order: Number.isFinite(Number(unit.order)) ? Number(unit.order) : index + 1,
          passageCount: passages.length,
          virtualId,
        };
      }).sort((left, right) => left.order - right.order);

      return { ...work, units };
    })
    .filter(Boolean)
    .sort((left, right) => left.order - right.order || left.korean.localeCompare(right.korean, 'ko'));

  return { works, unitsByVirtualId, filesByVirtualId };
}
