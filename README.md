# LinkedIn Scraper Dashboard

React SPA for monitoring and analysing LinkedIn connection scraping jobs. Connects to the Express backend for REST data and streams live logs over WebSocket.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages](#pages)
- [Architecture & Data Flow](#architecture--data-flow)
- [API Reference](#api-reference)
- [WebSocket](#websocket)
- [Authentication](#authentication)
- [Hooks](#hooks)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Running with Docker](#running-with-docker)

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| React Router DOM | 7.13.2 | Client-side routing |
| Vite | 5.3.4 | Build tool and dev server |
| Recharts | 3.8.0 | Line, bar, and donut charts |
| react-simple-maps | 3.0.0 | World map visualisation |
| react-virtuoso | 4.18.3 | Virtual-scroll for large log lists |
| date-fns | 3.6.0 | Date formatting |

No CSS framework — all styling is inline.

---

## Project Structure

```
src/
├── api.js                  # API base URL constant
├── App.jsx                 # Root component, routing, auth guard
├── constants.js            # Shared constants (buffer sizes, colour maps)
├── index.css               # Global reset
├── main.jsx                # React entry point
├── pages/
│   ├── LoginPage.jsx       # Auth form
│   ├── AppDashboard.jsx    # Jobs overview + stats
│   ├── GeoDashboard.jsx    # Geographic traffic map
│   ├── ProxyDashboard.jsx  # SOAX proxy match coverage
│   ├── ErrorsDashboard.jsx # Failure patterns and error types
│   ├── ScrapeDashboard.jsx # Connection volume and rate-limit stats
│   └── ArchivesDashboard.jsx # S3 log archive browser
├── components/
│   ├── DashboardHeader.jsx # Page title + range picker
│   ├── FetchErrorBanner.jsx# Red error banner for failed fetches
│   ├── JobsSidebar.jsx     # Active jobs sidebar / mobile drawer
│   ├── LogFilters.jsx      # Live log filter bar
│   ├── LogRow.jsx          # Single log entry renderer
│   ├── LogStream.jsx       # Virtual-scroll log viewer
│   ├── Panel.jsx           # Chart container
│   ├── PaginationBar.jsx   # Prev/next pagination footer
│   └── StatCard.jsx        # Metric card with tooltip
├── context/
│   └── AuthContext.jsx     # Auth state provider
├── hooks/
│   ├── useAuth.js          # Consume auth context
│   ├── useAppStats.js      # Polled /api/stats
│   ├── useDataFetch.js     # Generic single GET hook
│   ├── useIsMobile.js      # Responsive breakpoint (768px)
│   ├── useJobsList.js      # Sidebar jobs list with infinite scroll
│   └── useLogs.js          # WebSocket live logs + REST fallback
└── utils/
    └── apiFetch.js         # Fetch wrapper (injects auth, handles 401)
```

---

## Pages

All pages are lazy-loaded for code splitting.

### Login (`/login`)
Username / password form. Posts to `/api/auth/login`, stores the returned token in `localStorage`, then redirects to the dashboard.

### App Dashboard (`/app`)
Aggregated job stats and a searchable, sortable jobs table (15 per page).

**Stats cards:** Total Requests · Running · Completed · Failed · Avg Connections

**Jobs table columns:** Job ID · User · Started At · Status · Progress

Stats poll every 15 seconds. Click any Job ID to jump directly to its logs.

### Geo Intelligence (`/geo`)
World map with pulsing dots sized by request volume, plus breakdowns by country, region, city, and carrier.

### Proxy Performance (`/proxy`)
SOAX geo-matching coverage metrics: Full Match · City Match · Region Match · Country Only · No Match. Includes a stacked bar chart and a top-20 fallback-country table.

### Errors & Reliability (`/errors`)
Failure rate over time, error type donut chart, hourly failure bar chart (converted to local timezone), and a top-failing-users table.

### Scrape Performance (`/scrape`)
Connections scraped per job, 429 rate, auth failure rate, connection distribution histogram, and a daily trend line chart.

### Log Archives (`/archives`)
Browse and search S3-archived logs by job ID, user, and date range.

**Actions per archive:** Download (presigned S3 URL) · View (in-page modal with level filter and text search)

---

## Architecture & Data Flow

```
Browser (React SPA — Nginx port 5173)
        │
        │  REST  /api/*
        │  WS    /ws/*
        ▼
Express Backend (port 3002)
        │
        ├── PostgreSQL  (job data, logs, geo, archives)
        └── Redis       (live log pub/sub channel)
```

### Live Logs Flow

```
1. User opens dashboard
2. useLogs connects WebSocket /ws/logs?range=7d&token=...
3. Backend sends  { type: "initial", logs: [...] }   (last 200 logs)
4. New logs arrive as  { type: "log", log: {...} }
5. Buffer capped at 2 000 entries (LOG_BUFFER_MAX)
6. On WS close → auto-reconnect after 3 s
7. User switches to historical mode → REST GET /api/logs (paginated)
8. If no DB logs and a job ID is set → falls back to /api/archives/{id}/view
```

### Time Ranges

All data endpoints accept a `range` query parameter:

| Value | Interval |
|---|---|
| `7d` | Last 7 days (default) |
| `14d` | Last 14 days |
| `30d` | Last 30 days |
| `all` | No date filter |

---

## API Reference

All requests require `Authorization: Bearer <token>` (injected automatically by `apiFetch`).

### Auth

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/auth/login` | `{ username, password }` | `{ token }` |

### Jobs & Stats

| Method | Endpoint | Query params | Response |
|---|---|---|---|
| `GET` | `/api/stats` | `range` | `{ total_requests, running, completed, failed, avg_connections }` |
| `GET` | `/api/jobs` | `range, page, limit, sort, order, search` | `{ jobs, page, pages, total }` |

`sort` accepts: `started_at` · `status` · `progress`. `order`: `asc` or `desc`.

### Logs

| Method | Endpoint | Query params | Response |
|---|---|---|---|
| `GET` | `/api/logs` | `range, job_id, page, limit` | `{ logs, page, pages }` |

### Analytics

| Method | Endpoint | Query params | Response |
|---|---|---|---|
| `GET` | `/api/geo` | `range` | `{ map_points, countries, regions, cities, carriers, total }` |
| `GET` | `/api/proxy` | `range` | `{ levels, fallback_by_country, verification_rate, verified_count, verify_total }` |
| `GET` | `/api/errors` | `range` | `{ total_failures, total_jobs, failure_rate, most_common_error, daily, hourly_utc, error_types, top_users }` |
| `GET` | `/api/scrape` | `range` | `{ avg_connections, total_connections, total_done, total_failed, rate_429, rate_auth, distribution, error_types, daily }` |

### Archives

| Method | Endpoint | Query params | Response |
|---|---|---|---|
| `GET` | `/api/archives` | `search, from, to, page, limit` | `{ archives, page, pages, total }` |
| `GET` | `/api/archives/:jobId/view` | — | `{ logs }` |
| `GET` | `/api/archives/:jobId/download` | — | `{ url }` (S3 presigned, 15 min expiry) |

---

## WebSocket

```
ws://localhost:3002/ws/logs?range=7d&job_id=<id>&token=<token>
```

Token is passed as a query parameter because WebSocket connections cannot set custom headers from the browser.

### Message types

| `type` | Payload | When |
|---|---|---|
| `initial` | `{ logs: [...] }` | First batch on connect (last 200 entries) |
| `log` | `{ log: {...} }` | Every new log event in real time |

### Reconnect behaviour

`useLogs` implements generation-based reconnect:

1. Each new connection gets a `generation` number from `generationRef`.
2. `onclose` schedules a reconnect after **3 seconds** — only if the generation hasn't changed.
3. Changing filters (range, job ID) or toggling live mode increments the generation, which cancels all pending reconnect timers and prevents stale messages from applying.
4. Pending timers are tracked in `retryTimersRef` and cleared on unmount.

---

## Authentication

- Token stored in `localStorage` under key `auth_token`.
- `apiFetch` injects `Authorization: Bearer <token>` on every request.
- Any **401** response removes the token and dispatches an `auth:logout` event.
- `AuthContext` listens for `auth:logout` and sets `authed = false`, showing the login page.

---

## Hooks

| Hook | Purpose |
|---|---|
| `useAuth` | Consume auth context — returns `{ authed, login, logout }` |
| `useAppStats(range)` | Poll `/api/stats` every 15 s |
| `useDataFetch(url)` | Single GET request, cancels on unmount |
| `useIsMobile()` | Returns `true` below 768 px (uses `matchMedia`) |
| `useJobsList()` | Sidebar jobs list — 15 per page, infinite scroll, 15 s polling (disabled during search) |
| `useLogs()` | Live WebSocket stream with 3 s auto-reconnect + REST historical fallback + S3 archive fallback |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes (production) | Backend base URL, e.g. `http://localhost:3002`. Set at **build time** — baked into the JS bundle. |

In development, Vite proxies `/api` and `/ws` requests to `VITE_API_URL` (default `http://localhost:3002`) so no CORS issues arise.

---

## Running Locally

```bash
cd regardsapp-linkedin-dashboard
npm install

# Point at your running backend
VITE_API_URL=http://localhost:3002 npm run dev
```

Dev server starts on **http://localhost:5173**.

---

## Running with Docker

```bash
# Build and start
VITE_API_URL=http://your-backend-host:3002 docker compose up --build -d

# Dashboard available at
http://localhost:5173
```

The `VITE_API_URL` build arg is passed through `docker-compose.yml` to Vite at build time and baked into the static bundle. Nginx serves the built files on port 80 (mapped to 5173).

### Nginx highlights

- gzip compression for JS / JSON / images
- 1-year immutable cache for hashed Vite assets
- Security headers: `X-Frame-Options: DENY` · `X-Content-Type-Options: nosniff` · `X-XSS-Protection`
- SPA fallback: all routes → `index.html` (React Router handles client-side routing)

### Rebuild after code changes

```bash
docker compose up --build -d dashboard
```
