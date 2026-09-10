import process from 'node:process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { generateApi } from 'swagger-typescript-api';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceIndex = process.argv.indexOf('--source');
const source = sourceIndex >= 0 ? resolve(process.argv[sourceIndex + 1]) : resolve(root, 'contracts/openapi.json');
const text = await readFile(source, 'utf8');
const spec = JSON.parse(text);
const result = await generateApi({
  spec,
  name: 'api.ts',
  generateClient: false,
  generateUnionEnums: true,
  silent: true,
});
const content = result.files.find((file) => file.fileName.toLowerCase().replace(/\.ts$/, '') === 'api')?.fileContent;
if (!content) throw new Error('Generator did not produce api.ts');
const normalized = content.replace('// @ts-nocheck\n', '').replaceAll('\r\n', '\n').trimEnd() + '\n';
const target = resolve(root, 'src/types/generated/api.ts');
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== normalized) {
    throw new Error('Generated contracts differ. Run npm run generate:types and review consumers.');
  }
} else {
  await mkdir(resolve(root, 'src/types/generated'), { recursive: true });
  await writeFile(target, normalized);
  if (sourceIndex >= 0) await writeFile(resolve(root, 'contracts/openapi.json'), text);
}