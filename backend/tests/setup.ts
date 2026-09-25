process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??=
  'postgresql://steamtracker:steamtracker@localhost:5432/steamtracker_test';
process.env.JWT_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';
process.env.STEAM_API_KEY ??= 'test-key';
process.env.DIRECT_URL ??= process.env.DATABASE_URL;
