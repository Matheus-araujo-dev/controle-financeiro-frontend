import { test, expect } from '@playwright/test';

test('publica manifesto e ícones PWA utilizáveis', async ({ request }) => {
  const manifestResponse = await request.get('/manifest.json');
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();

  for (const icon of manifest.icons.filter((item: { type?: string }) => item.type === 'image/png')) {
    const response = await request.get(icon.src);
    expect(response.ok(), `${icon.src} deve existir`).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
  }

  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
    expect.objectContaining({ sizes: '512x512', type: 'image/png', purpose: 'maskable' }),
  ]));
});
