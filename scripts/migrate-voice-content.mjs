import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeVoiceWork } from './voice-work-files.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const voiceDir = path.join(projectRoot, 'content', 'voice');
const legacyFiles = ['iliad.json', 'odyssey.json'];

for (const file of legacyFiles) {
  const legacyPath = path.join(voiceDir, file);
  try {
    const data = JSON.parse(await fs.readFile(legacyPath, 'utf8'));
    const result = await writeVoiceWork({ projectRoot, data, sourceLabel: 'PERSEUS 원문' });
    await fs.unlink(legacyPath);
    console.log(`[voice-migrate] ${data.id}: ${result.unitCount}개 단위, ${result.passageCount}개 구절`);
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
}
