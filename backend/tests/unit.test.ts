import { parseCsv, toCsv } from '../src/utils/csv';
import { parseStatus, statusChangeFields } from '../src/utils/status';
import { createThrottle } from '../src/utils/throttle';
import { minutesToHours, parseProfileInput } from '../src/services/steamService';
import { planLibrarySync } from '../src/services/importService';
import { computeStats, computeStreak, recentMonths } from '../src/services/statsService';
import { parseImportFile } from '../src/services/dataService';
import { buildGameWhere, gameQuerySchema } from '../src/services/gameService';

describe('csv', () => {
  it('round-trips quotes, commas and newlines', () => {
    const rows = [
      ['Title', 'Notes'],
      ['Elden Ring', 'Stuck at "Malenia", again'],
      ['Witcher 3', 'line one\nline two'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });

  it('ignores BOM and blank lines', () => {
    expect(parseCsv('\uFEFFa,b\r\n\r\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('rejects unterminated quotes', () => {
    expect(() => parseCsv('a,"b')).toThrow('Unterminated');
  });
});

describe('status', () => {
  it.each([
    ['in_progress', 'IN_PROGRESS'],
    ['In Progress', 'IN_PROGRESS'],
    ['not-started', 'NOT_STARTED'],
    ['COMPLETED', 'COMPLETED'],
    ['nope', null],
    [42, null],
  ])('parses %p', (input, expected) => {
    expect(parseStatus(input)).toBe(expected);
  });

  it('sets completedAt only for completed games', () => {
    const now = new Date('2026-01-01');
    expect(statusChangeFields('COMPLETED', now).completedAt).toBe(now);
    expect(statusChangeFields('ABANDONED', now).completedAt).toBeNull();
  });
});

describe('parseProfileInput', () => {
  it.each([
    ['76561197960287930', { kind: 'steamId', value: '76561197960287930' }],
    [
      'https://steamcommunity.com/profiles/76561197960287930/',
      { kind: 'steamId', value: '76561197960287930' },
    ],
    ['https://steamcommunity.com/id/gabelogannewell', { kind: 'vanity', value: 'gabelogannewell' }],
    ['gabelogannewell', { kind: 'vanity', value: 'gabelogannewell' }],
  ])('parses %s', (input, expected) => {
    expect(parseProfileInput(input)).toEqual(expected);
  });

  it('rejects junk', () => {
    expect(() => parseProfileInput('not a profile!')).toThrow();
    expect(() => parseProfileInput('   ')).toThrow();
  });

  it('converts minutes to hours with one decimal', () => {
    expect(minutesToHours(2730)).toBe(45.5);
    expect(minutesToHours(0)).toBe(0);
  });
});

describe('planLibrarySync', () => {
  const lib = [
    {
      appid: 1,
      name: 'Played',
      playtime_forever: 120,
      isFreeToPlay: false,
      rtime_last_played: 1_700_000_000,
    },
    { appid: 2, name: 'Unplayed', playtime_forever: 0, isFreeToPlay: true },
    { appid: 3, name: 'Existing', playtime_forever: 600, isFreeToPlay: false },
    { appid: 4, name: 'Unchanged', playtime_forever: 60, isFreeToPlay: false },
    { appid: 1, name: 'Played', playtime_forever: 120, isFreeToPlay: false },
  ];
  const existing = [
    { steamId: 3, hoursPlayed: 5, title: 'Existing' },
    { steamId: 4, hoursPlayed: 1, title: 'Unchanged' },
  ];

  it('creates new games, updates changed ones and skips duplicates', () => {
    const plan = planLibrarySync(lib, existing, {
      includeFreeToPlay: true,
      autoCategorize: true,
    });
    expect(plan.total).toBe(4);
    expect(plan.toCreate.map((g) => [g.steamId, g.status, g.hoursPlayed, g.isFreeToPlay])).toEqual([
      [1, 'IN_PROGRESS', 2, false],
      [2, 'NOT_STARTED', 0, true],
    ]);
    expect(plan.toUpdate).toEqual([
      { steamId: 3, data: { hoursPlayed: 10, lastPlayedAt: null, title: 'Existing' } },
    ]);
  });

  it('puts everything in Not Started without auto-categorize', () => {
    const plan = planLibrarySync(lib, [], { includeFreeToPlay: true, autoCategorize: false });
    expect(new Set(plan.toCreate.map((g) => g.status))).toEqual(new Set(['NOT_STARTED']));
  });
});

describe('stats', () => {
  const now = new Date('2026-09-15T12:00:00Z');
  const g = (
    id: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED',
    hours: number,
    completedAt?: string,
  ) => ({
    id,
    title: id,
    status,
    hoursPlayed: hours,
    coverArtUrl: null,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    completedAt: completedAt ? new Date(completedAt) : null,
  });

  it('computes the overview', () => {
    const s = computeStats(
      [
        g('a', 'COMPLETED', 40, '2026-09-02T00:00:00Z'),
        g('b', 'COMPLETED', 20, '2026-07-01T00:00:00Z'),
        g('c', 'IN_PROGRESS', 0.5),
        g('d', 'NOT_STARTED', 0),
      ],
      now,
      5,
    );
    expect(s.totalGames).toBe(4);
    expect(s.gamesByStatus).toEqual({
      NOT_STARTED: 1,
      IN_PROGRESS: 1,
      COMPLETED: 2,
      ABANDONED: 0,
    });
    expect(s.totalHoursPlayed).toBe(60.5);
    expect(s.averageHoursPerGame).toBe(15.1);
    expect(s.completionRate).toBe(50);
    expect(s.averageHoursToComplete).toBe(30);
    expect(s.goal).toEqual({ monthlyTarget: 5, completedThisMonth: 1 });
    expect(s.mostPlayedGames.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(s.playtimeBuckets).toEqual({
      unplayed: 1,
      under1: 1,
      '1to10': 0,
      '10to50': 2,
      over50: 0,
    });
    expect(s.monthly.at(-1)).toEqual({ month: '2026-09', added: 0, completed: 1 });
    expect(s.monthly.find((m) => m.month === '2026-08')?.added).toBe(4);
  });

  it('handles an empty library', () => {
    const s = computeStats([], now);
    expect(s.completionRate).toBe(0);
    expect(s.averageHoursPerGame).toBe(0);
  });

  it('lists months across a year boundary', () => {
    expect(recentMonths(new Date('2026-02-10T00:00:00Z'), 3)).toEqual([
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
  });

  it('counts streaks ending today or yesterday', () => {
    const d = (s: string) => new Date(`${s}T00:00:00Z`);
    expect(computeStreak([d('2026-09-15'), d('2026-09-14'), d('2026-09-12')], now)).toBe(2);
    expect(computeStreak([d('2026-09-14'), d('2026-09-13')], now)).toBe(2);
    expect(computeStreak([d('2026-09-10')], now)).toBe(0);
  });
});

describe('parseImportFile', () => {
  it('parses the PRD CSV format and reports bad rows', () => {
    const csv = [
      'Title,Status,Hours Played,Date Added,Date Updated,Notes,Tags',
      'Elden Ring,In Progress,45.5,2024-01-15,2024-09-01,Stuck at Malenia,Souls-like|Action',
      'Bad Game,Sleeping,1,,,,',
      ',,,,,,',
    ].join('\n');
    const { rows, errors } = parseImportFile('csv', csv);
    expect(rows).toEqual([
      {
        row: 2,
        steamId: undefined,
        title: 'Elden Ring',
        status: 'IN_PROGRESS',
        hoursPlayed: 45.5,
        notes: 'Stuck at Malenia',
        tags: ['Souls-like', 'Action'],
      },
    ]);
    expect(errors.map((e) => e.row)).toEqual([3, 4]);
  });

  it('parses the PRD JSON format', () => {
    const json = JSON.stringify({
      version: '1.0',
      games: [
        {
          steamId: 570940,
          title: 'Elden Ring',
          status: 'in_progress',
          hoursPlayed: 45.5,
          notes: 'x',
          tags: ['Action'],
        },
        { steamId: 'abc' },
      ],
    });
    const { rows, errors } = parseImportFile('json', json);
    expect(rows[0]).toMatchObject({ steamId: 570940, status: 'IN_PROGRESS', tags: ['Action'] });
    expect(errors).toEqual([{ row: 2, message: 'Invalid Steam App ID "abc"' }]);
  });

  it('rejects malformed files', () => {
    expect(() => parseImportFile('json', '{')).toThrow('not valid JSON');
    expect(() => parseImportFile('json', '{"foo":1}')).toThrow('"games" array');
    expect(() => parseImportFile('csv', 'Foo,Bar\n1,2')).toThrow('header');
  });
});

describe('game filters', () => {
  it('combines search, status, tags and playtime', () => {
    const q = gameQuerySchema.parse({
      search: 'ring',
      status: 'IN_PROGRESS,COMPLETED',
      tags: 't1,t2',
      playtime: '1to10',
    });
    expect(buildGameWhere('u1', q)).toEqual({
      userId: 'u1',
      title: { contains: 'ring', mode: 'insensitive' },
      status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      AND: [{ tags: { some: { id: 't1' } } }, { tags: { some: { id: 't2' } } }],
      hoursPlayed: { gte: 1, lte: 10 },
    });
  });

  it('rejects unknown statuses', () => {
    expect(() => gameQuerySchema.parse({ status: 'PLAYING' })).toThrow();
  });
});

describe('throttle', () => {
  it('spaces tasks apart', async () => {
    const throttle = createThrottle(50);
    const starts: number[] = [];
    await Promise.all([1, 2, 3].map(() => throttle(async () => starts.push(Date.now()))));
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(45);
    expect(starts[2] - starts[1]).toBeGreaterThanOrEqual(45);
  });

  it('keeps going after a failed task', async () => {
    const throttle = createThrottle(1);
    await expect(
      throttle(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    await expect(throttle(async () => 'ok')).resolves.toBe('ok');
  });
});
