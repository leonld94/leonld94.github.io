import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const id = String(process.argv[2] || '').trim();
if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
  throw new Error('작품 ID를 영문 소문자, 숫자, 하이픈으로 입력하세요. 예: plato-apology');
}

const workDir = path.join(projectRoot, 'content', 'voice', id);
const unitsDir = path.join(workDir, 'units');
const audioDir = path.join(projectRoot, 'public', 'audio', 'voice', id, '1');
try {
  await fs.access(workDir);
  throw new Error(`이미 존재하는 작품 폴더입니다: ${workDir}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

await fs.mkdir(unitsDir, { recursive: true });
await fs.mkdir(audioDir, { recursive: true });
const manifest = {
  id,
  order: 999,
  titles: {
    greek: '원어 제목',
    english: 'English title',
    korean: '한국어 제목',
  },
  navigation: {
    unit: { label: '장', singular: 'SECTION', plural: 'SECTIONS' },
    passage: { label: '문장', singular: 'PASSAGE', plural: 'PASSAGES' },
  },
  source: { url: '', label: '원문 보기' },
  audio: {
    basePath: `/audio/voice/${id}`,
    pattern: '{unit}/{passage}.wav',
  },
  units: [{ id: '1', label: '1', order: 1, file: 'units/01.json' }],
};
const unit = {
  passages: [{ id: '1', label: '1', greekText: '고전 그리스어 원문을 입력하세요.', koreanText: '(준비중입니다)' }],
};
await fs.writeFile(path.join(workDir, 'work.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await fs.writeFile(path.join(unitsDir, '01.json'), `${JSON.stringify(unit, null, 2)}\n`, 'utf8');
console.log(`[voice-new] ${id} 작품 골격을 생성했습니다: ${workDir}`);
