import type { AxiosInstance } from 'axios';
import { SteamService } from '../src/services/steamService';

function fakeHttp(responses: Record<string, (params: Record<string, unknown>) => unknown>) {
  const get = jest.fn(async (url: string, opts: { params: Record<string, unknown> }) => {
    const key = Object.keys(responses).find((k) => url.includes(k));
    if (!key) throw new Error(`unexpected ${url}`);
    return { data: responses[key](opts.params) };
  });
  return { http: { get } as unknown as AxiosInstance, get };
}

describe('SteamService', () => {
  it('resolves vanity names', async () => {
    const { http } = fakeHttp({
      ResolveVanityURL: () => ({ response: { success: 1, steamid: '76561197960287930' } }),
    });
    await expect(new SteamService(http, 'k').resolveSteamId('gaben')).resolves.toBe(
      '76561197960287930',
    );
  });

  it('reports unknown vanity names', async () => {
    const { http } = fakeHttp({ ResolveVanityURL: () => ({ response: { success: 42 } }) });
    await expect(new SteamService(http, 'k').resolveSteamId('nobody')).rejects.toMatchObject({
      code: 'STEAM_PROFILE_NOT_FOUND',
    });
  });

  it('flags free-to-play games by diffing two library calls', async () => {
    const paid = [{ appid: 10, name: 'Paid', playtime_forever: 5 }];
    const free = [{ appid: 20, name: 'Free', playtime_forever: 1 }];
    const { http, get } = fakeHttp({
      GetOwnedGames: (p) => ({
        response: { games: p.include_played_free_games ? [...paid, ...free] : paid },
      }),
    });
    const lib = await new SteamService(http, 'k').getLibrary('76561197960287930', true);
    expect(lib.map((g) => [g.appid, g.isFreeToPlay])).toEqual([
      [10, false],
      [20, true],
    ]);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('explains private profiles', async () => {
    const { http } = fakeHttp({ GetOwnedGames: () => ({ response: {} }) });
    await expect(
      new SteamService(http, 'k').getLibrary('76561197960287930', false),
    ).rejects.toMatchObject({
      code: 'STEAM_PROFILE_PRIVATE',
    });
  });

  it('requires an API key for library calls', async () => {
    const { http } = fakeHttp({});
    await expect(new SteamService(http, '').getOwnedGames('1', false)).rejects.toMatchObject({
      code: 'STEAM_NOT_CONFIGURED',
    });
  });

  it('reads store details and review score', async () => {
    const { http } = fakeHttp({
      appdetails: () => ({
        '570940': {
          success: true,
          data: {
            type: 'game',
            short_description: 'Hard',
            release_date: { date: 'Feb 25, 2022' },
          },
        },
      }),
      appreviews: () => ({ query_summary: { total_positive: 90, total_reviews: 100 } }),
    });
    const d = await new SteamService(http, 'k').getStoreDetails(570940);
    expect(d.description).toBe('Hard');
    expect(d.isDLC).toBe(false);
    expect(d.steamRating).toBe(90);
    expect(d.releaseDate?.getFullYear()).toBe(2022);
  });
});
