# Product Requirements Document: Steam Game Tracker

**Document Version:** 2.0  
**Last Updated:** September 2, 2026  
**Status:** Draft  
**Platform:** Web Application (React Frontend + Node.js/Express Backend)

---

## 1. Executive Summary

Steam Game Tracker is a web application designed to help gamers organize and monitor their Steam library. With thousands of games in a typical Steam library, many go unplayed or are forgotten mid-playthrough. This app provides a simple, intuitive interface to categorize games by play status, track progress, and maintain awareness of their backlog. Accessible from any browser with internet connection.

**Key Value Proposition:**
- Eliminate confusion about which games are completed, in-progress, or untouched
- Quick visual overview of gaming library status
- Access from any device (desktop, tablet, phone) via web browser
- Integrates with Steam data to reduce manual data entry
- Cloud-based storage with future offline capability

---

## 2. Problem Statement

### Current Pain Points

1. **Library Overwhelm:** Steam users accumulate 100+ games but lack visibility into which ones they've actually completed
2. **Forgotten Games:** Games fall through the cracks during long gaming sessions or after breaks
3. **Progress Loss:** No centralized way to track where they left off in partially-played games
4. **Time Investment Unknown:** Users can't easily see how many hours they've invested across all games
5. **Backlog Anxiety:** Massive unplayed backlog creates decision paralysis about what to play next
6. **Manual Tracking:** Existing solutions require manual Steam profile checks or third-party services with privacy concerns

### Target User Problems

- Mid-core to hardcore gamers with 50+ games in library
- Players who take breaks and return to games months later
- Completionists who want to track achievements/progress
- Casual gamers overwhelmed by their own collection

---

## 3. Goals & Objectives

### Primary Goals

1. **Organization** - Enable users to categorize their entire Steam library efficiently
2. **Tracking** - Provide a comprehensive view of game status at a glance
3. **Accessibility** - Create a lightweight, offline-capable tool that doesn't require authentication
4. **Usability** - Design an intuitive interface that requires minimal learning curve

### Secondary Goals

1. **Data Insights** - Show statistics (total hours, completion rate, etc.)
2. **Portability** - Allow data export/import for backup and cross-device sync
3. **Extensibility** - Build foundation for future features (achievements, ratings, reviews)

### Success Criteria

- User can import their Steam library and categorize 50+ games in < 5 minutes
- App performs smoothly with 1,000+ games in library
- Data persistence across app sessions without internet connection
- User retention: 60% of users launch app monthly after first month

---

## 4. User Personas

### Persona 1: The Backlog Warrior
**Name:** Marcus  
**Age:** 28  
**Profile:** Mid-core gamer with 200+ games, plays regularly but struggles with decision-making  
**Goals:** Know exactly which games to play next; track progress on current playthrough  
**Pain Points:** Forgets which games he's abandoned; wastes time deciding what to play  

### Persona 2: The Completionist
**Name:** Sarah  
**Age:** 34  
**Profile:** Hardcore gamer, wants to track every game completion and achievement  
**Goals:** Maintain a detailed history of completed games; see completion statistics  
**Pain Points:** Can't see overall completion rate; misses achievements in new games  

### Persona 3: The Casual Returner
**Name:** Alex  
**Age:** 45  
**Profile:** Plays games sporadically, takes months-long breaks  
**Goals:** Quickly remember which games they were playing; avoid starting fresh unnecessarily  
**Pain Points:** Can't remember where they left off; confused about game status  

---

## 5. User Stories & Use Cases

### Epic 1: Library Import & Setup

**US1.1:** As a new user, I want to import my Steam game library so that I don't have to manually enter all my games

- **Acceptance Criteria:**
  - User can connect app to Steam profile (via user ID or Steam username)
  - App imports all games from user's library
  - Import completes in < 1 minute for typical library
  - User sees success confirmation with game count
  - Duplicate imports don't create duplicates in app

**US1.2:** As a user, I want to configure import settings so I can control what gets imported

- **Acceptance Criteria:**
  - Option to include/exclude free-to-play games
  - Option to include/exclude DLC
  - Option to include/exclude hidden games
  - Ability to re-import and update existing library

### Epic 2: Game Categorization

**US2.1:** As a user, I want to categorize my games into status buckets so I can organize my backlog

- **Acceptance Criteria:**
  - Four default status categories: "Not Started", "In Progress", "Completed", "Abandoned"
  - Ability to drag-and-drop games between categories
  - Ability to customize category names
  - Bulk categorization tools (select multiple games, apply status)
  - Each game shows in only one category at a time

**US2.2:** As a user, I want to add notes to individual games so I can track where I left off

- **Acceptance Criteria:**
  - Text field for notes (up to 500 characters)
  - Notes persist when changing categories
  - Last updated timestamp shown with notes
  - Rich text support for basic formatting (bold, italics, bullet points)

**US2.3:** As a user, I want to tag/label games with custom tags so I can filter by genre, platform, or custom criteria

- **Acceptance Criteria:**
  - Create custom tags (e.g., "Story-Heavy", "Co-op", "Requires Multiplayer")
  - Assign multiple tags to each game
  - Auto-suggest tags based on Steam tags and existing tags
  - Filter games by tags

### Epic 3: Viewing & Browsing

**US3.1:** As a user, I want to see my library in a clear, organized view so I can quickly find games

- **Acceptance Criteria:**
  - Column/category view showing games in each status
  - Grid/card view for visual browsing
  - List view with sortable columns
  - Ability to switch between view types
  - View persists user's preference

**US3.2:** As a user, I want to search and filter my games so I can quickly locate specific titles

- **Acceptance Criteria:**
  - Real-time search across game titles
  - Filter by status category
  - Filter by tags
  - Filter by play time (< 1 hour, 1-10 hours, 10+ hours)
  - Combine multiple filters
  - Sort by title, hours played, date added, date updated

**US3.3:** As a user, I want to see game information and statistics so I can make informed decisions

- **Acceptance Criteria:**
  - Display for each game: title, hours played, release date, Steam store link
  - User's achievement progress (if available)
  - Last categorization update timestamp
  - Cover art/game thumbnail
  - Steam rating (pull from Steam API)

### Epic 4: Statistics & Insights

**US4.1:** As a user, I want to see library statistics so I understand my gaming habits

- **Acceptance Criteria:**
  - Total games in library
  - Games by category (count and percentage)
  - Total hours played across library
  - Average hours per game
  - Completion rate (%)
  - Most-played games ranking
  - Games added over time (chart)
  - Category breakdown visualization (pie/bar chart)

**US4.2:** As a user, I want to see progress metrics that motivate me to finish games

- **Acceptance Criteria:**
  - "Games Completed This Month" counter
  - "Average Completion Time" metric
  - Streak tracking (consecutive days/weeks using app)
  - Completion goal setting (e.g., "Complete 5 games this month")
  - Progress toward goals

### Epic 5: Data Management

**US5.1:** As a user, I want to export my data so I can back it up and use it elsewhere

- **Acceptance Criteria:**
  - Export to CSV format
  - Export to JSON format
  - Include all game data and categorization
  - Export includes notes and tags
  - Timestamped export files

**US5.2:** As a user, I want to import previously exported data so I can restore or migrate my library

- **Acceptance Criteria:**
  - Import CSV and JSON formats
  - Merge import with existing data (no overwrites by default)
  - Option to overwrite existing categories on import
  - Validation feedback for malformed import files

**US5.3:** As a user, I want to manage my data privacy so I'm comfortable with what's stored locally

- **Acceptance Criteria:**
  - All data stored locally in user's machine (no cloud sync default)
  - Clear explanation of what data is collected
  - No tracking or telemetry without explicit opt-in
  - Option to clear all data with one click
  - Privacy policy accessible in app

---

## 6. Key Features

### Core Features (MVP)

| Feature | Priority | Description |
|---------|----------|-------------|
| Steam Library Import | P0 | Import games from Steam public profile |
| Status Categories | P0 | Not Started / In Progress / Completed / Abandoned |
| Game List View | P0 | Display all games with status categories |
| Drag-and-Drop Categorization | P0 | Move games between categories |
| Local Data Persistence | P0 | Save all data to local storage (SQLite/JSON) |
| Search & Filter | P1 | Find games by title, status, hours |
| Game Notes | P1 | Add personal notes to each game |
| Basic Statistics | P1 | Library overview metrics |
| Data Export | P1 | Export data to CSV/JSON |

### Extended Features (Phase 2)

| Feature | Priority | Description |
|---------|----------|-------------|
| Custom Tags | P2 | Create and organize games with custom labels |
| Grid/Card View | P2 | Visual browsing with game thumbnails |
| Achievement Tracking | P2 | Track achievements unlocked |
| Custom Categories | P2 | Create custom status categories |
| Data Sync | P2 | Optional cloud backup to personal cloud services |
| Gaming Statistics | P2 | Advanced analytics and insights |
| Wishlist Management | P2 | Track and manage Steam wishlist |
| Ratings & Reviews | P3 | Personal 1-5 star ratings, short reviews |
| Recommendations Engine | P3 | Suggest next game to play based on mood |

### Future Features (Roadmap)

- Mobile companion app (React Native)
- Browser extension for quick notes on Steam store pages
- Multi-account support (multiple Steam profiles)
- Community statistics and leaderboards
- Integration with other platforms (Epic, GOG, Xbox Game Pass)
- Automated playtime sync from Steam

---

## 7. User Interface & Design

### Layout Overview (Desktop)

```
┌──────────────────────────────────────────────────────────────┐
│  🎮 Steam Tracker    [Search] [User▼]                        │
├──────────────────────────────────────────────────────────────┤
│ [Home] [Games] [Stats] [Settings]                            │
├──────────────────────────────────────────────────────────────┤
│ Search: [___________] Filter: [By Status▼] | [≡] [◻] [◻]    │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │Not Started  │ │In Progress  │ │  Completed  │ │Abandoned│ │
│ │ 47 games    │ │ 8 games     │ │ 32 games    │ │15 games │ │
│ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────┤ │
│ │ [Game Card] │ │ [Game Card] │ │ [Game Card] │ │ [Game]  │ │
│ │ [Game Card] │ │ [Game Card] │ │ [Game Card] │ │ [Game]  │ │
│ │ [Game Card] │ │ [Game Card] │ │ [Game Card] │ │ [Game]  │ │
│ │   [+ Add]   │ │             │ │             │ │         │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Layout Overview (Mobile - Responsive)

```
┌────────────────────────┐
│🎮 Steam Tracker [User▼]│
├────────────────────────┤
│ [Search...]            │
│ [Status▼] [View▼]      │
├────────────────────────┤
│ Not Started (47)       │
│ ┌────────────────────┐ │
│ │ [Game Card]        │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │ [Game Card]        │ │
│ └────────────────────┘ │
│                        │
│ In Progress (8)        │
│ ┌────────────────────┐ │
│ │ [Game Card]        │ │
│ └────────────────────┘ │
│                        │
│ [≡ Home] [Games] [📊]  │
└────────────────────────┘
```

### Main Views

#### 1. Dashboard / Home View
- Quick statistics overview
- Recent activity (games categorized recently)
- Shortcuts to quick actions
- Motivational messages/achievements

#### 2. Games View (Kanban/Column Layout)
- Four columns: Not Started, In Progress, Completed, Abandoned
- Games displayed as cards in each column
- Drag-and-drop between columns
- Right-click context menu for quick actions
- Show game cover art, title, hours played

#### 3. Game Detail Modal
- Game title, cover art, Steam link
- Current status with ability to change
- Hours played (from Steam)
- Personal notes editor
- Tags/labels
- Timestamps for when categorized/updated
- "Open in Steam" button
- Achievement progress (if available)

#### 4. Statistics View
- Charts: completion rate, hours distribution, games by status
- Metrics: total games, total hours, average playtime
- Trends: games added over time, completion rate over time
- Monthly/yearly breakdown

#### 5. Settings View
- Steam profile configuration
- Import/Export options
- Data management (clear all, reset)
- Theme (light/dark mode)
- View preferences (default view type)
- Privacy settings
- About & Help

### Design Principles

- **Minimal & Clean:** Reduce visual clutter; focus on content
- **Dark Mode Default:** Gaming audience preference; reduce eye strain
- **Drag-and-Drop First:** Primary interaction should be intuitive
- **Responsive Cards:** Game cards should be scannable with key info at a glance
- **Keyboard Shortcuts:** Power users can navigate without mouse
- **Accessibility:** WCAG 2.1 AA compliance (color contrast, keyboard nav, screen reader support)

---

## 8. Technical Requirements

### Technology Stack

```
Frontend:
├── React.js (v18+)
├── TypeScript
├── Vite (build tool)
├── TailwindCSS (styling)
├── React Query / TanStack Query (data fetching/caching)
├── Zustand (state management)
├── react-beautiful-dnd (drag-and-drop)
└── Axios (HTTP client)

Backend:
├── Node.js (v18+)
├── Express.js (v4+)
├── TypeScript
├── dotenv (environment variables)
├── Axios (HTTP requests to Steam API)
├── CORS middleware
├── JWT/Auth middleware (for future auth)
└── Helmet (security headers)

Database:
├── PostgreSQL (production) or MongoDB (alternative)
├── Prisma ORM (database abstraction)
├── Redis (optional - caching/sessions)

APIs:
├── Steam Web API (public library access)
├── REST API endpoints for frontend
└── WebSocket support (optional - real-time updates)

Hosting:
├── Frontend: Vercel / Netlify / AWS S3 + CloudFront
├── Backend: Heroku / Railway / DigitalOcean / AWS EC2
├── Database: AWS RDS / MongoDB Atlas / Heroku Postgres

Development:
├── npm or yarn
├── Jest (backend testing)
├── Vitest (frontend testing)
├── ESLint & Prettier (code quality)
├── GitHub Actions (CI/CD)
├── Docker (containerization)
└── Postman (API testing)
```

### Performance Requirements

| Requirement | Target | Notes |
|-------------|--------|-------|
| Page Load Time (First Paint) | < 2 seconds | Initial web load |
| Time to Interactive | < 3.5 seconds | Full page interactive |
| Library Import (500 games) | < 60 seconds | API calls to Steam + backend processing |
| Search Response | < 200ms | Database query + network latency |
| Drag-and-Drop Feedback | < 16ms | 60fps animations |
| API Response Time | < 500ms | 95th percentile |
| Bundle Size (Frontend) | < 300KB | Gzipped |
| Backend Memory | < 512MB | Idle state per server |
| Database Query Time | < 50ms | 95th percentile for typical queries |
| Concurrent Users | 1000+ | Per backend server instance |

### Browser Support

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome/Chromium | 90+ | Primary support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support (iOS & macOS) |
| Edge | 90+ | Full support |
| Mobile Safari | 14+ | Responsive design support |
| Chrome Mobile | 90+ | Responsive design support |

**Target:** Works on any device with modern browser (mobile-responsive)

### Security Requirements

- HTTPS only for all connections
- No storing user credentials or sensitive Steam account data
- Steam API calls use public endpoints only (no account access tokens stored)
- User authentication via Steam OAuth 2.0 (optional - users can be anonymous)
- All user data encrypted at rest in database
- Environment variables for API keys (no hardcoded secrets)
- Rate limiting on API endpoints to prevent abuse
- CORS properly configured for frontend domain only
- Dependency scanning (Snyk/Dependabot) on every commit
- SQL injection prevention via ORM (Prisma)
- XSS protection via React's built-in escaping
- CSRF tokens for state-changing operations
- Regular security audits and penetration testing
- Privacy policy and data handling documentation
- GDPR compliance (right to deletion, data export)

---

## 9. Data Model

### Database Schema (PostgreSQL with Prisma ORM)

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String      @id @default(cuid())
  steamId       String      @unique
  steamUsername String?
  displayName   String?
  profileUrl    String?
  profileImage  String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  lastImport    DateTime?
  
  games         Game[]
  tags          Tag[]
  settings      UserSettings?
  importHistory ImportHistory[]
  
  @@index([steamId])
}

model Game {
  id              String      @id @default(cuid())
  steamId         Int         @unique
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title           String      @db.VarChar(255)
  description     String?
  coverArtUrl     String?
  status          GameStatus  @default(NOT_STARTED)
  hoursPlayed     Float       @default(0)
  releaseDate     DateTime?
  steamRating     Float?
  isFreeToPlay    Boolean     @default(false)
  isDLC           Boolean     @default(false)
  
  notes           String?     @db.Text
  customNote      String?     @db.Text
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  statusUpdatedAt DateTime    @default(now())
  
  tags            Tag[]
  achievements    Achievement[]
  
  @@unique([userId, steamId])
  @@index([userId])
  @@index([status])
}

model Tag {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name      String    @db.VarChar(50)
  color     String    @default("#3B82F6") // Tailwind default blue
  
  games     Game[]
  createdAt DateTime  @default(now())
  
  @@unique([userId, name])
  @@index([userId])
}

model Achievement {
  id              String    @id @default(cuid())
  gameId          String
  game            Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  steamAchievementId String
  name            String
  description     String?
  icon            String?
  unlockedAt      DateTime?
  rarity          Float?
  
  createdAt       DateTime  @default(now())
  
  @@unique([gameId, steamAchievementId])
  @@index([gameId])
}

model ImportHistory {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  totalGamesImported Int
  newGamesAdded     Int
  importedAt        DateTime  @default(now())
  status            String    @default("completed") // completed, failed, in_progress
  errorMessage      String?
  
  @@index([userId])
  @@index([importedAt])
}

model UserSettings {
  id                    String    @id @default(cuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  theme                 String    @default("dark") // light, dark, auto
  defaultViewType       String    @default("kanban") // kanban, grid, list
  language              String    @default("en")
  privacyOptIn          Boolean   @default(false)
  emailNotifications    Boolean   @default(false)
  
  updatedAt             DateTime  @updatedAt
}

enum GameStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  ABANDONED
}
```

### Data Structures (TypeScript Interfaces)

```typescript
interface Game {
  id: string; // UUID
  steamId: number;
  title: string;
  coverArtUrl?: string;
  status: GameStatus; // 'not_started' | 'in_progress' | 'completed' | 'abandoned'
  hoursPlayed: number;
  dateAdded: Date;
  dateUpdated: Date;
  releaseDate?: Date;
  steamRating?: number;
  isFreeToPay: boolean;
  isDLC: boolean;
  notes?: string;
  tags?: Tag[];
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface GameStatistics {
  totalGames: number;
  gamesByStatus: Record<GameStatus, number>;
  totalHoursPlayed: number;
  averageHoursPerGame: number;
  completionRate: number; // percentage
  mostPlayedGames: Game[];
}

interface ImportSettings {
  includeFreeToPlay: boolean;
  includeDLC: boolean;
  includeHiddenGames: boolean;
}

interface UserSettings {
  steamProfileId?: string;
  defaultViewType: 'kanban' | 'grid' | 'list';
  theme: 'light' | 'dark' | 'auto';
  language: string;
  privacyOptIn: boolean;
}
```

---

## 10. API & Integration Specifications

### Steam Web API Integration

**Endpoint Used:**
```
GET https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/
Parameters:
  - steamid: [user_steam_id]
  - include_appinfo: true
  - include_played_free_games: true
```

**Data Extracted:**
- Game title, App ID, Hours played
- If free to play, if DLC
- Achievement progress (separate call)

**Rate Limiting:** Respect Steam API rate limits (1 request per second)

### Data Import/Export Format

#### CSV Export Format
```
Title,Status,Hours Played,Date Added,Date Updated,Notes,Tags
Elden Ring,In Progress,45.5,2024-01-15,2024-09-01,Stuck at Malenia,Souls-like|Action
The Witcher 3,Completed,127.2,2023-06-20,2024-03-10,Amazing story,RPG|Story-Heavy
```

#### JSON Export Format
```json
{
  "version": "1.0",
  "exportDate": "2024-09-02T10:30:00Z",
  "games": [
    {
      "id": "uuid-xxx",
      "steamId": 570940,
      "title": "Elden Ring",
      "status": "in_progress",
      "hoursPlayed": 45.5,
      "dateAdded": "2024-01-15",
      "dateUpdated": "2024-09-01",
      "notes": "Stuck at Malenia",
      "tags": ["Souls-like", "Action"]
    }
  ]
}
```

### REST API Endpoints

**Authentication:**
- POST `/api/auth/steam` - Authenticate with Steam OAuth
- POST `/api/auth/logout` - Logout (clear session)
- GET `/api/auth/user` - Get current user info

**Games:**
- GET `/api/games` - Fetch all games for user (with filters/pagination)
- GET `/api/games/:id` - Get single game details
- PUT `/api/games/:id` - Update game status/notes
- DELETE `/api/games/:id` - Remove game from library
- PATCH `/api/games/:id/status` - Update only game status
- POST `/api/games/bulk-update` - Bulk update multiple games

**Import:**
- POST `/api/import/steam` - Initiate Steam library import
- GET `/api/import/history` - Get import history
- GET `/api/import/status/:importId` - Get import progress

**Tags:**
- GET `/api/tags` - Fetch all user tags
- POST `/api/tags` - Create new tag
- PUT `/api/tags/:id` - Update tag
- DELETE `/api/tags/:id` - Delete tag
- POST `/api/games/:gameId/tags` - Add tag to game
- DELETE `/api/games/:gameId/tags/:tagId` - Remove tag from game

**Statistics:**
- GET `/api/stats` - Get overview statistics
- GET `/api/stats/by-status` - Games breakdown by status
- GET `/api/stats/playtime` - Playtime statistics
- GET `/api/stats/monthly` - Monthly completion data

**Settings:**
- GET `/api/settings` - Get user settings
- PUT `/api/settings` - Update user settings

**Data Management:**
- POST `/api/export` - Generate export file (CSV/JSON)
- POST `/api/import` - Import from file

**Response Format:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null,
  "timestamp": "2024-09-02T10:30:00Z"
}
```

**Error Responses:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Steam ID is required"
  }
}
```

---

## 11. Success Metrics & KPIs

### Adoption Metrics
- **New User Installs:** Target 5,000+ first year
- **DAU (Daily Active Users):** Target 20% of installs within 3 months
- **MAU (Monthly Active Users):** Target 35% of installs within 6 months

### Engagement Metrics
- **Library Categorization Rate:** % of users who categorize 50%+ of their library
- **Avg. Session Duration:** Target 5-10 minutes
- **Categorization Frequency:** Avg. games categorized per week per user
- **Notes Usage:** % of users adding notes to games

### Retention Metrics
- **Day 7 Retention:** Target 40%
- **Day 30 Retention:** Target 25%
- **Churn Rate:** < 5% monthly after first 30 days

### Quality Metrics
- **Crash Rate:** < 0.1% (1 crash per 1,000 sessions)
- **Bug Report Rate:** < 50 bugs per 1,000 active users monthly
- **User Satisfaction:** Target 4.2/5.0 average rating

---

## 12. Project Timeline & Roadmap

### Phase 1: MVP (8-10 weeks)
**Weeks 1-2:** Project setup, design system, database design
**Weeks 3-4:** Steam import functionality, basic UI framework
**Weeks 5-6:** Kanban board view, drag-and-drop
**Weeks 7-8:** Statistics, search/filter, data persistence
**Weeks 9-10:** Testing, bug fixes, documentation

**MVP Release Features:**
- ✅ Steam library import
- ✅ Kanban view with 4 status categories
- ✅ Drag-and-drop categorization
- ✅ Search and filter
- ✅ Basic statistics
- ✅ Local data storage

### Phase 2: V1.1 (6-8 weeks, Post-launch)
- Custom tags system
- Game notes with rich text
- Grid/List view options
- Enhanced statistics with charts
- Data import/export (CSV, JSON)
- Custom category creation
- Settings & preferences UI

### Phase 3: V1.2+ (Future iterations)
- Achievement tracking
- Cloud sync option
- Mobile companion app
- Advanced analytics
- Community features
- Platform integrations (Epic, GOG, etc.)

---

## 13. Deployment & Infrastructure

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Users (Browser)                        │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare / CDN                         │
│              (Frontend Assets, Caching)                     │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        ↓                                         ↓
┌──────────────────┐                     ┌──────────────────┐
│ Vercel / Netlify │                     │ Express Backend  │
│ (React Frontend) │                     │ (Node.js)        │
│  Static Hosting  │                     │                  │
└──────────────────┘                     │ Docker Container │
                                         └────────┬─────────┘
                                                  │
                                                  ↓
                                          ┌──────────────────┐
                                          │  PostgreSQL DB   │
                                          │  (AWS RDS or     │
                                          │   Managed)       │
                                          └──────────────────┘
                                                  │
                                                  ↓
                                          ┌──────────────────┐
                                          │  Redis Cache     │
                                          │  (Optional)      │
                                          └──────────────────┘
```

### Deployment Stack

**Option A: Simple (Recommended for MVP)**
- Frontend: Vercel or Netlify (automatic deployments from GitHub)
- Backend: Railway, Render, or Heroku
- Database: Managed PostgreSQL (included in hosting platform)
- Cost: ~$50-100/month

**Option B: Scalable**
- Frontend: AWS S3 + CloudFront
- Backend: AWS EC2 or Docker containers (ECS)
- Database: AWS RDS PostgreSQL
- Cache: AWS ElastiCache
- Cost: ~$200-500/month

**Option C: Self-Hosted**
- VPS: DigitalOcean, Linode, or similar
- Docker for both frontend and backend
- PostgreSQL on same or separate server
- Cost: ~$30-100/month + maintenance

### CI/CD Pipeline

```
GitHub Push
    ↓
GitHub Actions
    ├─ Run Tests (Jest, Vitest)
    ├─ Lint Code (ESLint, Prettier)
    ├─ Build Frontend (Vite)
    ├─ Build Backend (TypeScript)
    └─ Security Scan (Snyk/Dependabot)
         ↓
    ✅ All Pass?
         ├─ Yes → Deploy to Staging
         │         (Test environment)
         └─ No → Fail & Notify
```

### Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Frontend build succeeds (< 500KB total)
- [ ] Backend healthcheck responds
- [ ] API endpoints tested
- [ ] No console errors in browser
- [ ] SSL certificate valid
- [ ] Rate limiting active
- [ ] Error tracking (Sentry) configured
- [ ] Analytics (optional) enabled
- [ ] Backup strategy in place

---

## 14. Constraints & Assumptions

### Constraints (Updated for Web)

**Technical:**
- Requires internet connection (no offline mode in MVP)
- Steam API rate limits: 1 request per second per user
- Frontend bundle size target < 300KB gzipped
- Backend should handle 1000+ concurrent users per instance
- Database connection limits on shared hosting

**Resource:**
- Estimated 2-3 developer team (full-stack)
- Initial funding sufficient for 6 months development + hosting
- Hosting costs: ~$50-200/month initially (database, backend, frontend CDN)

**Legal:**
- Must respect Steam's ToS and API usage policies
- No storing Steam API tokens or user credentials
- GDPR and privacy law compliance required (data deletion, export rights)
- Terms of Service and Privacy Policy required before launch

### Assumptions

**User Assumptions:**
- User has a public Steam profile (can adjust for friends-only option later)
- User has consistent internet connection
- User accesses from multiple devices (web advantage)
- User will manually update game status (no auto-tracking of playtime initially)
- User is willing to create account for cloud storage

**Technical Assumptions:**
- Steam Web API will remain available and relatively stable
- Users have modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- Backend infrastructure scales with load (auto-scaling support)
- Database handles user data with proper indexing
- CDN available for frontend asset delivery

**Market Assumptions:**
- Market demand exists for cloud-based game tracking solution
- Users prefer accessibility (any device) over offline-first
- Gamers will benefit from simple, visual organization tool
- Social features (future) could increase engagement

---

## 15. Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Steam API changes | Medium | High | Regular API monitoring, version-aware requests, fallback to cached data |
| Database performance at scale (1000+ users × 1000 games) | Medium | High | Proper indexing, query optimization, database monitoring, consider read replicas |
| Server downtime | Low | High | Uptime monitoring (StatusPage), automated alerts, backup servers |
| User confusion about how to set up | Medium | Medium | In-app tutorial, help docs, example screenshots, onboarding flow |
| Low user retention | Medium | High | Implement engagement features, gather feedback, iterate on UX |
| Security vulnerabilities | Low | Critical | Regular security audits, dependency scanning, penetration testing |
| Data loss from bugs | Low | Critical | Regular backups, transaction management, data validation, staging environment |
| Hosting costs exceed budget | Low | Medium | Monitor usage, implement rate limits, optimize queries |
| Rate limiting by Steam API | Medium | Medium | Implement client-side caching, queue import requests, distribute load |

---

## 16. Out of Scope (MVP)

The following features are explicitly NOT included in MVP but may be added later:

- ❌ Offline mode (requires internet)
- ❌ Mobile native app (web app is responsive but not native)
- ❌ Achievement auto-tracking
- ❌ Multiplayer/social features & leaderboards
- ❌ Integration with other storefronts (Epic, GOG, Xbox Game Pass)
- ❌ Steam OAuth integration (using public profiles initially)
- ❌ Browser extension for Steam pages
- ❌ Automated playtime sync from Steam
- ❌ Game recommendations algorithm
- ❌ Voice commands
- ❌ Steam screenshot/video integration
- ❌ Real-time multiplayer tracking
- ❌ Discord bot integration

---

## 16. Project Structure & Development Setup

### Repository Structure

```
steam-game-tracker/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components (Home, Games, Stats)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client services
│   │   ├── store/           # Zustand state management
│   │   ├── types/           # TypeScript interfaces
│   │   ├── styles/          # TailwindCSS utilities
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Main app component
│   ├── public/              # Static assets
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.ts   # TailwindCSS config
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                 # Node.js/Express application
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Prisma schema (in root)
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API route definitions
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript interfaces
│   │   └── index.ts         # Server entry point
│   ├── tests/               # Jest tests
│   ├── .env.example         # Environment variables template
│   ├── Dockerfile           # Docker configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── nodemon.json         # Dev server config
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migration files
│
├── docker-compose.yml       # Local development services
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD workflow
├── docs/                    # Documentation
│   ├── API.md              # API documentation
│   ├── SETUP.md            # Development setup guide
│   └── ARCHITECTURE.md     # System architecture docs
├── .gitignore
├── README.md
└── package.json             # Root workspace config
```

### Local Development Setup

**Prerequisites:**
- Node.js v18+
- PostgreSQL 13+ (or Docker)
- Git

**Installation Steps:**

```bash
# Clone repository
git clone https://github.com/yourname/steam-game-tracker.git
cd steam-game-tracker

# Install dependencies for both frontend and backend
npm install

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL and Steam API key

# Start PostgreSQL (using Docker)
docker-compose up -d postgres

# Run database migrations
cd backend
npm run prisma:migrate:dev
cd ..

# Start both services (from root)
npm run dev
# Or start separately:
# Terminal 1: npm run dev:frontend
# Terminal 2: npm run dev:backend

# App will be available at http://localhost:5173 (frontend)
# Backend API at http://localhost:3001
```

### Key npm Scripts

**Frontend:**
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint src --ext .ts,.tsx",
  "test": "vitest",
  "type-check": "tsc --noEmit"
}
```

**Backend:**
```json
{
  "dev": "nodemon --exec ts-node src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "jest",
  "lint": "eslint src --ext .ts",
  "prisma:migrate:dev": "prisma migrate dev",
  "prisma:generate": "prisma generate"
}
```

**Root:**
```json
{
  "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
  "dev:frontend": "cd frontend && npm run dev",
  "dev:backend": "cd backend && npm run dev",
  "test": "npm run test:frontend && npm run test:backend",
  "build": "npm run build:frontend && npm run build:backend"
}
```

---

## 17. Success Criteria for Release

The app is considered ready for public release when:

1. ✅ All P0 features implemented and tested
2. ✅ Can import and manage 1,000+ games without performance issues
3. ✅ No critical bugs (P0 severity) remaining
4. ✅ Cross-platform builds created (Windows, macOS, Linux)
5. ✅ User documentation and tutorial completed
6. ✅ Privacy policy and terms written
7. ✅ Internal UAT completed with 3+ testers
8. ✅ Code reviewed and quality standards met
9. ✅ CI/CD pipeline established and working
10. ✅ Release notes and changelog prepared

---

## 18. Glossary

| Term | Definition |
|------|-----------|
| **Backlog** | Games in a user's library that they haven't started yet |
| **Kanban** | Visual project management method using columns (used for status view) |
| **Steam ID** | Unique identifier for a Steam account or game app |
| **ToS** | Terms of Service; agreement between user and service provider |
| **REST API** | Architectural style for networked applications using HTTP requests |
| **ORM** | Object-Relational Mapping; abstraction layer for database queries (Prisma) |
| **DAU** | Daily Active Users metric |
| **MAU** | Monthly Active Users metric |
| **GDPR** | General Data Protection Regulation; EU privacy law |
| **Rich Text** | Text formatting supporting bold, italics, bullet points, etc. |
| **UAT** | User Acceptance Testing; final testing before release |
| **CDN** | Content Delivery Network; distributed servers for fast asset delivery |
| **OAuth** | Open standard for authentication without sharing passwords |
| **JWT** | JSON Web Token; secure way to transmit user information |
| **CORS** | Cross-Origin Resource Sharing; allows frontend to call backend APIs |
| **CI/CD** | Continuous Integration/Continuous Deployment; automated build and release |
| **Responsive Design** | Website adapts to different screen sizes (desktop, tablet, mobile) |
| **RDS** | Relational Database Service; managed database on cloud (AWS) |
| **SSR** | Server-Side Rendering; rendering pages on server instead of client |
| **SPA** | Single Page Application; frontend app that loads once and updates dynamically |

---

## 19. Appendix: Wireframes Reference

*(Detailed wireframes should be created separately in Figma/Adobe XD)*

### Key Screens to Wireframe

1. Import Flow
   - Enter Steam profile
   - Import progress
   - Import success/failure

2. Main Kanban View
   - Column headers
   - Game cards
   - Add game button

3. Game Detail Modal
   - Game info display
   - Status selector
   - Notes editor
   - Tags manager

4. Statistics Dashboard
   - Stat cards
   - Charts (pie, bar, line)
   - Trends view

5. Settings Panel
   - Steam profile settings
   - Import/Export buttons
   - Theme toggle
   - Data management

---

**Document Sign-Off:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | TBD | | |
| Lead Engineer | TBD | | |
| Design Lead | TBD | | |
| Project Lead | TBD | | |

---

*This PRD is a living document and will be updated as the project evolves. Last review: September 2, 2026*
