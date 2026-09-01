import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(projectRoot, 'content', 'voice', 'odyssey.json');
const sourcePage = 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0135';
const sourceXml = 'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0012/tlg002/tlg0012.tlg002.perseus-grc2.xml';

const testAudio = [
  '/audio/voice/tones/01-do.wav',
  '/audio/voice/tones/02-re.wav',
  '/audio/voice/tones/03-mi.wav',
  '/audio/voice/tones/04-fa.wav',
  '/audio/voice/tones/05-sol.wav',
  '/audio/voice/tones/06-la.wav',
  '/audio/voice/tones/07-si.wav',
  '/audio/voice/tones/08-do-high.wav',
];

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

function lineText(xml) {
  return decodeXml(
    xml
      .replace(/<choice>[\s\S]*?<corr[^>]*>([\s\S]*?)<\/corr>[\s\S]*?<\/choice>/gi, '$1')
      .replace(/<note\b[^>]*>[\s\S]*?<\/note>/gi, '')
      .replace(/<[^>]+>/g, '')
  ).replace(/\s+/g, ' ').trim().normalize('NFC');
}

function fillOmittedLines(lines) {
  if (lines.length === 0) return lines;
  const migratedLines = lines.map((line) => {
    const { text, ...rest } = line;
    return {
      ...rest,
      greekText: String(line.greekText ?? text ?? '').normalize('NFC'),
      koreanText: String(line.koreanText ?? '(준비중입니다)').normalize('NFC'),
    };
  });
  const byNumber = new Map(migratedLines.map((line) => [line.number, line]));
  const filled = [];
  for (let number = migratedLines[0].number; number <= migratedLines.at(-1).number; number += 1) {
    filled.push(byNumber.get(number) ?? {
      number,
      greekText: 'This edition omits these lines',
      koreanText: '(준비중입니다)',
      omitted: true,
    });
  }
  return filled;
}

function parseBooks(xml) {
  const books = [];
  const bookPattern = /<div\b(?=[^>]*\btype="textpart")(?=[^>]*\bsubtype="book")(?=[^>]*\bn="(\d+)")[^>]*>([\s\S]*?)<\/div>/gi;

  for (const bookMatch of xml.matchAll(bookPattern)) {
    const number = Number(bookMatch[1]);
    const lines = [];
    const linePattern = /<l\s+n="(\d+)"[^>]*>([\s\S]*?)<\/l>/g;

    for (const lineMatch of bookMatch[2].matchAll(linePattern)) {
      const lineNumber = Number(lineMatch[1]);
      const text = lineText(lineMatch[2]);
      if (!text) continue;
      const line = {
        number: lineNumber,
        greekText: text,
        koreanText: '(준비중입니다)',
      };
      if (/<milestone\b[^>]*unit="para"/i.test(lineMatch[2])) line.paragraphStart = true;
      if (number === 1 && lineNumber <= testAudio.length) {
        line.audio = testAudio[lineNumber - 1];
      }
      lines.push(line);
    }

    if (lines.length > 0) books.push({ number, label: String(number), lines: fillOmittedLines(lines) });
  }
  return books;
}

async function downloadXml() {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(sourceXml, { headers: { 'user-agent': 'leonld94-blog-content-importer/1.0' } });
    if (response.ok) return response.text();
    if (response.status !== 503 || attempt === 3) {
      throw new Error(`원문을 받을 수 없습니다: HTTP ${response.status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  throw new Error('원문을 받을 수 없습니다.');
}

const fillLocalOnly = process.argv.includes('--fill-local');
let data;
if (fillLocalOnly) {
  data = JSON.parse(await fs.readFile(outputPath, 'utf8'));
  data.books = data.books.map((book) => ({ ...book, lines: fillOmittedLines(book.lines) }));
} else {
  const xml = await downloadXml();
  const books = parseBooks(xml);
  if (books.length !== 24) {
    console.warn(`[odyssey-import] 24권 중 ${books.length}권만 수집되었습니다. 접근할 수 없는 권은 건너뜁니다.`);
  }
  data = {
    id: 'odyssey',
    order: 2,
    titles: {
      greek: 'Ὅμηρος – Ὀδύσσεια',
      english: 'Homer – Odyssey',
      korean: '호메로스 – 오뒷세이아',
    },
    source: sourcePage,
    credit: 'Text provided by Perseus Digital Library, with funding from The Annenberg CPB/Project.',
    books,
  };
}

await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
const lineCount = data.books.reduce((total, book) => total + book.lines.length, 0);
console.log(`[odyssey-import] ${data.books.length}권, ${lineCount}행을 ${path.relative(projectRoot, outputPath)}에 저장했습니다.`);
