import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(projectRoot, 'content', 'voice', 'odyssey.json');
const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

if (!Array.isArray(data.books) || data.books.length !== 24) {
  throw new Error(`로컬 오뒷세이아 데이터가 24권이 아닙니다: ${data.books?.length ?? 0}권`);
}

let lineCount = 0;
for (const book of data.books) {
  if (!Array.isArray(book.lines) || book.lines.length === 0) {
    throw new Error(`${book.number}권의 로컬 행 데이터가 비어 있습니다.`);
  }
  for (const line of book.lines) {
    if (!Number.isFinite(Number(line.number)) || !String(line.greekText || '').trim() || !String(line.koreanText || '').trim()) {
      throw new Error(`${book.number}권에 유효하지 않은 로컬 행이 있습니다.`);
    }
    lineCount += 1;
  }
}

console.log(`[odyssey-local] ${data.books.length}권, ${lineCount}행이 로컬 JSON에 저장되어 있습니다.`);
