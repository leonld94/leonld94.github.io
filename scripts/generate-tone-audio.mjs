import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, '../public/audio/voice/tones');
const sampleRate = 44_100;
const durationSeconds = 0.72;
const fadeSeconds = 0.035;

const tones = [
  { file: '01-do.wav', frequency: 261.63 },
  { file: '02-re.wav', frequency: 293.66 },
  { file: '03-mi.wav', frequency: 329.63 },
  { file: '04-fa.wav', frequency: 349.23 },
  { file: '05-sol.wav', frequency: 392.0 },
  { file: '06-la.wav', frequency: 440.0 },
  { file: '07-si.wav', frequency: 493.88 },
  { file: '08-do-high.wav', frequency: 523.25 },
];

function writeAscii(buffer, offset, value) {
  buffer.write(value, offset, value.length, 'ascii');
}

function createTone(frequency) {
  const frameCount = Math.floor(sampleRate * durationSeconds);
  const dataSize = frameCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  writeAscii(buffer, 0, 'RIFF');
  buffer.writeUInt32LE(36 + dataSize, 4);
  writeAscii(buffer, 8, 'WAVE');
  writeAscii(buffer, 12, 'fmt ');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  writeAscii(buffer, 36, 'data');
  buffer.writeUInt32LE(dataSize, 40);

  const fadeFrames = Math.floor(sampleRate * fadeSeconds);
  for (let frame = 0; frame < frameCount; frame += 1) {
    const attack = Math.min(1, frame / fadeFrames);
    const release = Math.min(1, (frameCount - frame - 1) / fadeFrames);
    const envelope = Math.min(attack, release);
    const sample = Math.sin((2 * Math.PI * frequency * frame) / sampleRate);
    buffer.writeInt16LE(Math.round(sample * envelope * 0.24 * 32767), 44 + frame * 2);
  }

  return buffer;
}

fs.mkdirSync(outputDir, { recursive: true });
for (const tone of tones) {
  fs.writeFileSync(path.join(outputDir, tone.file), createTone(tone.frequency));
}

console.log(`Generated ${tones.length} tone files in ${outputDir}`);
