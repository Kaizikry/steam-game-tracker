# REST API

Base path `/api`. Every response uses the envelope from the PRD:

```json
{ "success": true, "data": { }, "error": null, "timestamp": "2026-09-02T10:30:00Z" }
{ "success": false, "data": null, "error": { "code": "INVALID_REQUEST", "message": "..." } }
```

All endpoints except `POST /auth/anonymous` and `GET /health` need
`Authorization: Bearer <token>`. Statuses are `NOT_STARTED | IN_PROGRESS | COMPLETED | ABANDONED`.

## Session

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/anonymous` | Creates an anonymous user, returns `{ token, user }`. Rate limited to 20/hour per IP |
| GET | `/auth/user` | Current user + `gameCount`; records today's visit for streaks |
| DELETE | `/auth/user` | Deletes the user and all their data |
| POST | `/auth/logout` | No-op (the client discards its token) |

## Games

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/games` | Query: `search`, `status` (comma list), `tags` (comma list of tag ids, all must match), `playtime` (`under1`, `1to10`, `over10`), `sort` (`title`, `hoursPlayed`, `createdAt`, `updatedAt`, `lastPlayedAt`), `order`, `page`, `pageSize` (≤ 5000). Returns `{ items, total, page, pageSize }` |
| GET | `/games/:id` | Includes tags and achievements |
| PUT | `/games/:id` | Body: any of `status`, `notes` (≤ 500 chars, null clears), `tagIds` (replaces tags) |
| PATCH | `/games/:id/status` | Body: `{ status }` |
| DELETE | `/games/:id` | Removes the game from the tracker |
| POST | `/games/:id/refresh` | Fetches description, release date, Steam review score, DLC flag and achievements from Steam |
| POST | `/games/bulk-update` | Body: `{ ids, status?, addTagIds?, removeTagIds? }` |
| DELETE | `/games` | Clears the whole library (games, tags, import history) |
| POST | `/games/:gameId/tags` | Body: `{ tagId }` |
| DELETE | `/games/:gameId/tags/:tagId` | |

## Tags

`GET /tags` (with `gameCount`), `POST /tags` `{ name, color? }`, `PUT /tags/:id`, `DELETE /tags/:id`.

## Import & export

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/import/steam` | Body: `{ profile, includeFreeToPlay = true, autoCategorize = true }`. `profile` is a SteamID64, `steamcommunity.com/profiles/…` or `/id/…` URL, or custom URL name. Synchronous; returns `{ importId, totalGamesImported, newGamesAdded, updatedGames }`. Rate limited to 5/min |
| GET | `/import/history` | Last 20 imports |
| GET | `/import/status/:importId` | One import record |
| POST | `/import` | Body: `{ format: "json" \| "csv", content, overwrite = false }`. Returns `{ created, updated, skipped, errors: [{ row, message }] }` |
| POST | `/export` | Body: `{ format: "json" \| "csv" }`. Returns a file download named `steam-tracker-export-<timestamp>.<ext>` |

CSV columns: `Steam App ID, Title, Status, Hours Played, Date Added, Date Updated, Notes, Tags`
(tags separated by `|`). Import also accepts the PRD's CSV without the `Steam App ID` column;
rows are then matched to library games by title. The JSON format is the PRD's.

## Stats & settings

- `GET /stats`: `totalGames`, `gamesByStatus`, `totalHoursPlayed`, `averageHoursPerGame`,
  `completionRate`, `averageHoursToComplete`, `mostPlayedGames`, `playtimeBuckets`,
  `monthly` (last 12 months added/completed), `goal`, `streakDays`, `recentActivity`.
- `GET /settings`, `PUT /settings`: `theme`, `defaultViewType`, `language`, `privacyOptIn`,
  `emailNotifications`, `includeFreeToPlay`, `monthlyCompletionGoal`, `statusLabels`.

## Limits

Global 300 requests/min per IP, 10 MB JSON bodies. Outgoing Steam calls are serialized at
1 request/second.
