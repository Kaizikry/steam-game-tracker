import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/db';
import { steamService } from '../src/services/steamService';

const describeDb = process.env.SKIP_DB_TESTS ? describe.skip : describe;

describeDb('API', () => {
  const app = createApp({ rateLimits: false });
  let token: string;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/anonymous').expect(201);
    token = res.body.data.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { steamId: { in: ['76561197960287930', '76561190000000001'] } },
    });
    await prisma.$disconnect();
  });

  afterEach(() => jest.restoreAllMocks());

  it('rejects requests without a session', async () => {
    const res = await request(app).get('/api/games').expect(401);
    expect(res.body).toMatchObject({ success: false, error: { code: 'UNAUTHORIZED' } });
    await request(app).get('/api/games').set('Authorization', 'Bearer nope').expect(401);
  });

  it('imports a Steam library and re-imports without duplicates', async () => {
    jest.spyOn(steamService, 'resolveSteamId').mockResolvedValue('76561197960287930');
    jest.spyOn(steamService, 'getProfile').mockResolvedValue({
      steamId: '76561197960287930',
      personaName: 'Gabe',
    });
    const lib = jest.spyOn(steamService, 'getLibrary').mockResolvedValue([
      { appid: 570940, name: 'Elden Ring', playtime_forever: 2730, isFreeToPlay: false },
      { appid: 292030, name: 'The Witcher 3', playtime_forever: 0, isFreeToPlay: false },
      { appid: 570, name: 'Dota 2', playtime_forever: 30, isFreeToPlay: true },
    ]);

    const first = await request(app)
      .post('/api/import/steam')
      .set(auth())
      .send({ profile: 'gaben' })
      .expect(200);
    expect(first.body.data).toMatchObject({
      totalGamesImported: 3,
      newGamesAdded: 3,
      updatedGames: 0,
    });

    lib.mockResolvedValueOnce([
      { appid: 570940, name: 'Elden Ring', playtime_forever: 3000, isFreeToPlay: false },
    ]);
    const second = await request(app)
      .post('/api/import/steam')
      .set(auth())
      .send({ profile: 'gaben' })
      .expect(200);
    expect(second.body.data).toMatchObject({ newGamesAdded: 0, updatedGames: 1 });

    const me = await request(app).get('/api/auth/user').set(auth()).expect(200);
    expect(me.body.data).toMatchObject({
      steamId: '76561197960287930',
      displayName: 'Gabe',
      gameCount: 3,
    });

    const history = await request(app).get('/api/import/history').set(auth()).expect(200);
    expect(history.body.data).toHaveLength(2);
  });

  it('records failed imports', async () => {
    const res = await request(app)
      .post('/api/import/steam')
      .set(auth())
      .send({ profile: 'bad profile!' })
      .expect(400);
    expect(res.body.error.code).toBe('INVALID_STEAM_ID');
    const history = await request(app).get('/api/import/history').set(auth()).expect(200);
    expect(history.body.data[0]).toMatchObject({ status: 'failed' });
  });

  it('lists, filters and sorts games', async () => {
    const all = await request(app)
      .get('/api/games?sort=hoursPlayed&order=desc')
      .set(auth())
      .expect(200);
    expect(all.body.data.items.map((g: { title: string }) => g.title)).toEqual([
      'Elden Ring',
      'Dota 2',
      'The Witcher 3',
    ]);
    expect(all.body.data.items[0].status).toBe('IN_PROGRESS');
    expect(all.body.data.items[2].status).toBe('NOT_STARTED');

    const search = await request(app).get('/api/games?search=witch').set(auth()).expect(200);
    expect(search.body.data.total).toBe(1);

    const played = await request(app)
      .get('/api/games?playtime=over10&status=IN_PROGRESS')
      .set(auth())
      .expect(200);
    expect(played.body.data.items.map((g: { title: string }) => g.title)).toEqual(['Elden Ring']);

    await request(app).get('/api/games?status=PLAYING').set(auth()).expect(400);
  });

  it('updates status, notes and tags', async () => {
    const { body } = await request(app).get('/api/games?search=witcher').set(auth());
    const id = body.data.items[0].id;

    const tag = await request(app)
      .post('/api/tags')
      .set(auth())
      .send({ name: 'RPG', color: '#10B981' })
      .expect(201);
    await request(app).post('/api/tags').set(auth()).send({ name: 'RPG' }).expect(409);

    const updated = await request(app)
      .put(`/api/games/${id}`)
      .set(auth())
      .send({ status: 'COMPLETED', notes: '**Great** story', tagIds: [tag.body.data.id] })
      .expect(200);
    expect(updated.body.data).toMatchObject({
      status: 'COMPLETED',
      notes: '**Great** story',
      tags: [{ name: 'RPG' }],
    });
    expect(updated.body.data.completedAt).not.toBeNull();
    expect(updated.body.data.notesUpdatedAt).not.toBeNull();

    await request(app)
      .put(`/api/games/${id}`)
      .set(auth())
      .send({ notes: 'x'.repeat(501) })
      .expect(400);

    const patched = await request(app)
      .patch(`/api/games/${id}/status`)
      .set(auth())
      .send({ status: 'ABANDONED' })
      .expect(200);
    expect(patched.body.data).toMatchObject({
      status: 'ABANDONED',
      completedAt: null,
      notes: '**Great** story',
    });

    const byTag = await request(app)
      .get(`/api/games?tags=${tag.body.data.id}`)
      .set(auth())
      .expect(200);
    expect(byTag.body.data.total).toBe(1);

    await request(app).delete(`/api/games/${id}/tags/${tag.body.data.id}`).set(auth()).expect(200);
    const tags = await request(app).get('/api/tags').set(auth()).expect(200);
    expect(tags.body.data[0]).toMatchObject({ name: 'RPG', gameCount: 0 });
  });

  it('bulk updates games', async () => {
    const { body } = await request(app).get('/api/games').set(auth());
    const ids = body.data.items.map((g: { id: string }) => g.id);
    const res = await request(app)
      .post('/api/games/bulk-update')
      .set(auth())
      .send({ ids, status: 'COMPLETED' })
      .expect(200);
    expect(res.body.data.matched).toBe(3);
    await request(app).post('/api/games/bulk-update').set(auth()).send({ ids }).expect(400);
  });

  it('computes stats', async () => {
    const res = await request(app).get('/api/stats').set(auth()).expect(200);
    expect(res.body.data).toMatchObject({
      totalGames: 3,
      completionRate: 100,
      streakDays: 1,
      goal: { completedThisMonth: 3 },
    });
  });

  it('exports and re-imports data', async () => {
    const json = await request(app)
      .post('/api/export')
      .set(auth())
      .send({ format: 'json' })
      .expect(200);
    expect(json.headers['content-disposition']).toMatch(/steam-tracker-export-.*\.json/);
    const exported = JSON.parse(json.text);
    expect(exported.games).toHaveLength(3);
    expect(exported.games[0]).toMatchObject({ status: 'completed' });

    const csv = await request(app)
      .post('/api/export')
      .set(auth())
      .send({ format: 'csv' })
      .expect(200);
    expect(csv.text.split('\r\n')[0]).toBe(
      'Steam App ID,Title,Status,Hours Played,Date Added,Date Updated,Notes,Tags',
    );

    // A fresh account restores from the JSON export.
    const other = (await request(app).post('/api/auth/anonymous').expect(201)).body.data.token;
    const restored = await request(app)
      .post('/api/import')
      .set('Authorization', `Bearer ${other}`)
      .send({ format: 'json', content: json.text })
      .expect(200);
    expect(restored.body.data).toMatchObject({ created: 3, updated: 0, errors: [] });

    // Merging never overwrites set values unless asked.
    const merge = await request(app)
      .post('/api/import')
      .set('Authorization', `Bearer ${other}`)
      .send({
        format: 'csv',
        content: 'Title,Status,Tags\nElden Ring,Abandoned,Souls-like\nUnknown Game,Completed,',
      })
      .expect(200);
    expect(merge.body.data).toMatchObject({ created: 0, updated: 1, skipped: 1 });
    expect(merge.body.data.errors[0].message).toMatch(/not in your library/);
    const games = await request(app)
      .get('/api/games?search=elden')
      .set('Authorization', `Bearer ${other}`);
    expect(games.body.data.items[0]).toMatchObject({
      status: 'COMPLETED',
      tags: [{ name: 'Souls-like' }],
    });

    await request(app)
      .post('/api/import')
      .set('Authorization', `Bearer ${other}`)
      .send({ format: 'csv', content: 'Title,Status\nElden Ring,Abandoned', overwrite: true })
      .expect(200);
    const after = await request(app)
      .get('/api/games?search=elden')
      .set('Authorization', `Bearer ${other}`);
    expect(after.body.data.items[0].status).toBe('ABANDONED');

    await request(app)
      .post('/api/import')
      .set(auth())
      .send({ format: 'json', content: '{oops' })
      .expect(400);
    await request(app).delete('/api/auth/user').set('Authorization', `Bearer ${other}`).expect(200);
  });

  it("keeps users' data isolated", async () => {
    const other = (await request(app).post('/api/auth/anonymous').expect(201)).body.data.token;
    const { body } = await request(app).get('/api/games').set(auth());
    const id = body.data.items[0].id;
    await request(app).get(`/api/games/${id}`).set('Authorization', `Bearer ${other}`).expect(404);
    await request(app)
      .delete(`/api/games/${id}`)
      .set('Authorization', `Bearer ${other}`)
      .expect(404);
    const bulk = await request(app)
      .post('/api/games/bulk-update')
      .set('Authorization', `Bearer ${other}`)
      .send({ ids: [id], status: 'ABANDONED' })
      .expect(200);
    expect(bulk.body.data.matched).toBe(0);
    await request(app).delete('/api/auth/user').set('Authorization', `Bearer ${other}`).expect(200);
  });

  it('updates settings', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set(auth())
      .send({
        theme: 'light',
        monthlyCompletionGoal: 4,
        statusLabels: { NOT_STARTED: 'Backlog' },
      })
      .expect(200);
    expect(res.body.data).toMatchObject({
      theme: 'light',
      monthlyCompletionGoal: 4,
      statusLabels: { NOT_STARTED: 'Backlog' },
    });
    await request(app).put('/api/settings').set(auth()).send({ theme: 'neon' }).expect(400);
  });

  it('clears the library and deletes the account', async () => {
    await request(app).delete('/api/games').set(auth()).expect(200);
    const res = await request(app).get('/api/games').set(auth()).expect(200);
    expect(res.body.data.total).toBe(0);
    await request(app).delete('/api/auth/user').set(auth()).expect(200);
    await request(app).get('/api/auth/user').set(auth()).expect(401);
  });
});
