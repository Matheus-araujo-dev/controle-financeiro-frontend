import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(resolve(root, 'public/manifest.json'), 'utf8'));
const icons = manifest.icons ?? [];

const required = [
  ['/icons/icon-192.png', '192x192', 'any'],
  ['/icons/icon-512.png', '512x512', 'any'],
  ['/icons/icon-maskable-512.png', '512x512', 'maskable'],
];

for (const [src, sizes, purpose] of required) {
  const entry = icons.find((icon) => icon.src === src && icon.sizes === sizes && icon.purpose === purpose);
  if (!entry || entry.type !== 'image/png') {
    throw new Error(`Manifesto sem o ícone obrigatório ${src} (${sizes}, ${purpose}).`);
  }

  const file = resolve(root, 'public', src.slice(1));
  const info = await stat(file);
  if (!info.isFile() || info.size < 100) throw new Error(`Ícone PWA inválido: ${src}.`);

  const signature = (await readFile(file)).subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') throw new Error(`O arquivo ${src} não é um PNG válido.`);
}

const pushHandler = await readFile(resolve(root, 'public/push-handler.js'), 'utf8');
if (pushHandler.includes('/logo192.png')) throw new Error('Push handler ainda referencia o ícone removido.');
if (!pushHandler.includes('/icons/icon-192.png')) throw new Error('Push handler não referencia o ícone PWA válido.');
