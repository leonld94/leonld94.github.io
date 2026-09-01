import fs from 'node:fs/promises';
import path from 'node:path';

function passageFromLine(line, index) {
  const passage = {
    id: String(line.id ?? line.number ?? index + 1),
    label: String(line.label ?? line.number ?? line.id ?? index + 1),
    greekText: String(line.greekText ?? line.text ?? '').normalize('NFC'),
  };
  if (line.koreanText && line.koreanText !== '(준비중입니다)') passage.koreanText = String(line.koreanText).normalize('NFC');
  if (line.audio) passage.audio = String(line.audio);
  if (line.paragraphStart) passage.paragraphStart = true;
  if (line.omitted) passage.omitted = true;
  return passage;
}

export async function writeVoiceWork({ projectRoot, data, sourceLabel = '원문 보기' }) {
  const workDir = path.join(projectRoot, 'content', 'voice', data.id);
  const unitsDir = path.join(workDir, 'units');
  await fs.mkdir(unitsDir, { recursive: true });

  const rawUnits = data.units || data.books || [{ id: '1', label: '1', passages: data.passages || data.lines }];
  const units = [];
  let passageCount = 0;
  for (const [index, rawUnit] of rawUnits.entries()) {
    const id = String(rawUnit.id ?? rawUnit.number ?? index + 1);
    const fileName = `${String(index + 1).padStart(2, '0')}.json`;
    const rawPassages = rawUnit.passages || rawUnit.lines || [];
    const passages = rawPassages.map(passageFromLine);
    passageCount += passages.length;
    await fs.writeFile(path.join(unitsDir, fileName), `${JSON.stringify({ passages }, null, 2)}\n`, 'utf8');
    units.push({ id, label: String(rawUnit.label ?? id), order: index + 1, file: `units/${fileName}` });
  }

  const source = typeof data.source === 'string'
    ? { url: data.source, label: sourceLabel, ...(data.credit ? { credit: data.credit } : {}) }
    : data.source || null;
  const manifest = {
    id: data.id,
    order: Number(data.order) || 999,
    titles: data.titles,
    navigation: data.navigation || {
      unit: { label: '권', singular: 'BOOK', plural: 'BOOKS' },
      passage: { label: '행', singular: 'LINE', plural: 'LINES' },
    },
    ...(source ? { source } : {}),
    audio: data.audio || {
      basePath: `/audio/voice/${data.id}`,
      pattern: '{unit}/{passage}.wav',
    },
    units,
  };
  await fs.writeFile(path.join(workDir, 'work.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { workDir, unitCount: units.length, passageCount };
}
