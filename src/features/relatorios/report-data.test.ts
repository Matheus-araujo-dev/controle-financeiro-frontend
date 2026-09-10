import { describe, expect, it, vi } from 'vitest';
import { loadAllReportPages, reportNeedsSource } from './report-data';

describe('report data integrity', () => {
  it('loads every page including rows after the old 250 row limit', async () => {
    const rows = Array.from({ length: 251 }, (_, index) => index);
    const fetch = vi.fn(async (page: number) => ({ items: rows.slice((page - 1) * 250, page * 250), page, pageSize: 250, totalItems: 251, totalPages: 2 }));
    expect((await loadAllReportPages(fetch)).items).toEqual(rows);
    expect(fetch.mock.calls).toEqual([[1], [2]]);
  });
  it('propagates later page failures instead of exporting partial data', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ items: [1], page: 1, pageSize: 1, totalItems: 2, totalPages: 2 }).mockRejectedValueOnce(new Error('network'));
    await expect(loadAllReportPages(fetch)).rejects.toThrow('network');
  });
  it('rejects incomplete pagination', async () => {
    await expect(loadAllReportPages(async (page) => ({ items: page === 1 ? [1] : [], page, pageSize: 1, totalItems: 2, totalPages: 2 }))).rejects.toThrow('incompletos');
  });
  it('loads only sources required by each tab and common metrics', () => {
    expect(reportNeedsSource('geral', 'resumo')).toBe(true);
    expect(reportNeedsSource('geral', 'faturas')).toBe(false);
    expect(reportNeedsSource('faturas', 'faturas')).toBe(true);
    expect(reportNeedsSource('alertas', 'fluxoCaixa')).toBe(true);
    expect(reportNeedsSource('dre', 'responsaveis')).toBe(true);
  });
});
