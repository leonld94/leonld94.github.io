import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVoiceCatalog } from '../voice-content.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { works, unitsByVirtualId } = buildVoiceCatalog({
  projectRoot,
  contentDir: path.join(projectRoot, 'content'),
});

let passageCount = 0;
for (const passages of unitsByVirtualId.values()) passageCount += passages.length;
console.log(`[voice-validate] ${works.length}개 작품, ${unitsByVirtualId.size}개 단위, ${passageCount}개 구절이 유효합니다.`);
