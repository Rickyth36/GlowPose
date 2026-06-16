// Copies the MediaPipe Tasks Vision WASM runtime out of node_modules into public/, so Vite
// serves it from our own origin instead of depending on jsdelivr's CDN at runtime. Runs
// automatically on `npm install` (see package.json's "postinstall") so it's always in sync
// with whatever version of @mediapipe/tasks-vision is actually installed.
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const destDir = join(__dirname, '..', 'public', 'mediapipe', 'wasm');

if(!existsSync(srcDir)){
  console.warn('[copy-mediapipe-wasm] source not found, skipping:', srcDir);
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });

let count = 0;
for(const file of readdirSync(srcDir)){
  copyFileSync(join(srcDir, file), join(destDir, file));
  count++;
}

console.log(`[copy-mediapipe-wasm] copied ${count} file(s) to public/mediapipe/wasm`);
