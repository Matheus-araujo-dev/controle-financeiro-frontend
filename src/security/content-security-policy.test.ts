import { buildContentSecurityPolicy } from './content-security-policy';
import workerScript from '../../public/clear-api-cache.js?raw';
import vm from 'node:vm';

it('restricts production to the configured API and Google without eval or local connections', () => {
  const csp = buildContentSecurityPolicy(false, 'https://api.example.com/api/v1');
  expect(csp).toContain('https://api.example.com');
  expect(csp).toContain('https://accounts.google.com');
  expect(csp).not.toMatch(/unsafe-eval|localhost|127\.0\.0\.1|\*\.up\.railway/);
  expect(csp.match(/script-src[^;]+/)?.[0]).not.toContain('unsafe-inline');
});
it('permits local Vite connections only during development', () => {
  expect(buildContentSecurityPolicy(true)).toContain('ws://localhost:*');
  expect(buildContentSecurityPolicy(false)).not.toContain('localhost');
});
it('deletes the legacy API cache when the worker activates', async () => {
  const remove = vi.fn().mockResolvedValue(true);
  let activate!: (event: { waitUntil: (promise: Promise<unknown>) => void }) => void;
  vm.runInNewContext(workerScript, {
    self: { addEventListener: (_name: string, callback: typeof activate) => { activate = callback; }, caches: { delete: remove } },
  });
  let completion!: Promise<unknown>;
  activate({ waitUntil: (promise) => { completion = promise; } });
  await completion;
  expect(remove).toHaveBeenCalledWith('api-cache');
});


it('permits the inline React Refresh preamble only in development', () => {
  expect(buildContentSecurityPolicy(true).match(/script-src[^;]+/)?.[0]).toContain("'unsafe-inline'");
  expect(buildContentSecurityPolicy(false).match(/script-src[^;]+/)?.[0]).not.toContain("'unsafe-inline'");
  expect(buildContentSecurityPolicy(true)).not.toContain("'unsafe-eval'");
});
