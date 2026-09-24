import { filtersToParams } from '../services/api';
import { DEFAULT_FILTERS } from '../store/useAppStore';
import { formatHours, formatMonth, formatRelative } from './format';

describe('formatHours', () => {
    it.each([
        [0, 'Never played'],
        [0.5, '30 min'],
        [45.5, '45.5 h'],
    ])('%p -> %p', (h, expected) => expect(formatHours(h)).toBe(expected));
});

describe('formatRelative', () => {
    const now = new Date('2026-09-15T12:00:00Z').getTime();
    it('describes past times', () => {
        expect(formatRelative('2026-09-15T11:59:30Z', now)).toBe('just now');
        expect(formatRelative('2026-09-15T09:00:00Z', now)).toBe('3 hours ago');
        expect(formatRelative('2026-09-14T12:00:00Z', now)).toBe('yesterday');
        expect(formatRelative(null, now)).toBe('never');
    });
});

it('formats month keys', () => {
    expect(formatMonth('2026-01')).toBe('Jan');
});

describe('filtersToParams', () => {
    it('omits empty filters', () => {
        expect(filtersToParams(DEFAULT_FILTERS)).toEqual({ sort: 'title', order: 'asc' });
    });
    it('serializes combined filters', () => {
        expect(
            filtersToParams({
                ...DEFAULT_FILTERS,
                search: ' ring ',
                statuses: ['IN_PROGRESS', 'COMPLETED'],
                tagIds: ['a', 'b'],
                playtime: 'over10',
            }),
        ).toEqual({
            sort: 'title',
            order: 'asc',
            search: 'ring',
            status: 'IN_PROGRESS,COMPLETED',
            tags: 'a,b',
            playtime: 'over10',
        });
    });
});
