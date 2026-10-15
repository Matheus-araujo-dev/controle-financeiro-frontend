import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { expect, it } from 'vitest';

it('keeps application table markup in AppDataTable so every list uses the shared responsive renderer', () => {
  const root = resolve('src');
  const offenders: string[] = [];
  function inspect(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) inspect(path);
      else if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx') && entry.name !== 'AppDataTable.tsx' && /<(?:table|Table)\b/.test(readFileSync(path, 'utf8'))) offenders.push(relative(root, path));
    }
  }
  inspect(root);
  expect(offenders).toEqual([]);
});
