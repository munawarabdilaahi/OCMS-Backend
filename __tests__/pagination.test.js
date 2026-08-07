import { describe, it, expect } from '@jest/globals';
import { buildPaginationMeta } from '../src/utils/pagination.js';

describe('buildPaginationMeta', () => {
    it('calculates totalPages correctly', () => {
        const meta = buildPaginationMeta(1, 10, 25);
        expect(meta).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });
    });

    it('returns 0 for empty results', () => {
        const meta = buildPaginationMeta(1, 10, 0);
        expect(meta.totalPages).toBe(0);
    });

    it('rounds up totalPages', () => {
        const meta = buildPaginationMeta(1, 10, 11);
        expect(meta.totalPages).toBe(2);
    });

    it('handles single page', () => {
        const meta = buildPaginationMeta(1, 10, 5);
        expect(meta.totalPages).toBe(1);
    });
});

describe('getPaginationParams', () => {
    it('returns defaults when no query params are provided', async () => {
        const { getPaginationParams } = await import('../src/utils/pagination.js');
        const result = getPaginationParams({});
        expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('parses page and limit from query', async () => {
        const { getPaginationParams } = await import('../src/utils/pagination.js');
        const result = getPaginationParams({ page: '3', limit: '25' });
        expect(result).toEqual({ page: 3, limit: 25, skip: 50 });
    });

    it('enforces minimum values', async () => {
        const { getPaginationParams } = await import('../src/utils/pagination.js');
        const result = getPaginationParams({ page: '0', limit: '-5' });
        expect(result.page).toBe(1);
        expect(result.limit).toBe(1);
    });

    it('enforces maximum limit', async () => {
        const { getPaginationParams } = await import('../src/utils/pagination.js');
        const result = getPaginationParams({ limit: '500' });
        expect(result.limit).toBe(100);
    });

    it('falls back to page 1 for non-numeric page', async () => {
        const { getPaginationParams } = await import('../src/utils/pagination.js');
        const result = getPaginationParams({ page: 'abc' });
        expect(result.page).toBe(1);
        expect(result.skip).toBe(0);
    });

    it('falls back to the default limit for non-numeric limit', async () => {
        const { getPaginationParams } = await import('../src/utils/pagination.js');
        const result = getPaginationParams({ limit: 'xyz' });
        expect(result.limit).toBe(20);
    });

    it('never returns NaN for garbage pagination input', async () => {
        const { getPaginationParams } = await import('../src/utils/pagination.js');
        const result = getPaginationParams({ page: 'abc', limit: 'xyz', pageSize: 'oops' });
        expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
        expect(Number.isFinite(result.page)).toBe(true);
        expect(Number.isFinite(result.limit)).toBe(true);
        expect(Number.isFinite(result.skip)).toBe(true);
    });

    it('truncates fractional page and limit', async () => {
        const { getPaginationParams } = await import('../src/utils/pagination.js');
        const result = getPaginationParams({ page: '2.5', limit: '2.5' });
        expect(result.page).toBe(2);
        expect(result.limit).toBe(2);
    });
});
