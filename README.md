# IndieVents

A single place to browse concerts, workshops, comedy shows and festivals across India — aggregated from five different event platforms so you don't have to check them all separately.

**Live site:** [indievents-in.vercel.app](https://indievents-in.vercel.app)

## What it does

IndieVents scrapes events from **AllEvents, Townscript, District, Meetup, and Eventbrite** across five cities (Delhi, Mumbai, Bangalore, Hyderabad, Pune) and shows them in one searchable, filterable feed. Users can sign in with Google to save events to a personal "My Events" list.

## Features

- Browse events by city and category, with search
- Paginated results (50 events per page)
- Save/favorite events (requires Google sign-in)
- Admin dashboard for monitoring scrape health and reviewing scraped data
- Automatic scraping every 6 hours via GitHub Actions

## Tech stack

**Frontend:** React, React Router, deployed on Vercel
**Backend:** Node.js, Express, Passport (Google OAuth), deployed on Render
**Database:** MongoDB Atlas
**Scraping:** Playwright (for JS-rendered sites) and Axios (for sites with directly embedded JSON data)
**Scheduling:** GitHub Actions (scheduled workflow, every 6 hours)

## Project structure

```
├── backend/
│   ├── config/          # Passport/Google OAuth config
│   ├── middleware/       # Auth guards, rate limiting
│   ├── models/           # Mongoose schemas (Event, User, Favorite, EmailCapture)
│   ├── routes/           # API routes (events, auth, dashboard, favorites)
│   ├── scrapers/
│   │   ├── sources/      # One scraper module per platform
│   │   ├── utils/        # Shared browser/scroll helpers
│   │   └── eventScraper.js   # Orchestrates all sources
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/   # EventCard, EmailCaptureModal
│       ├── pages/        # EventsPage, MyEventsPage, Dashboard, Login
│       ├── context/       # AuthContext
│       └── services/      # API client
└── .github/workflows/
    └── scrape.yml        # Scheduled scraping workflow
```

## Running locally

**Backend:**
```bash
cd backend
npm install
npm run dev        # starts the API server with nodemon
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

**Run a scrape manually:**
```bash
cd backend
npm run scrape
```

## Environment variables

**Backend (`.env`):**
```
MONGODB_URI=
SESSION_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
FRONTEND_URL=
NODE_ENV=
```

**Frontend (Vercel Environment Variables):**
```
REACT_APP_API_URL=
```

**GitHub Actions secret:**
```
MONGODB_URI
```

## Scraping notes

Each source in `backend/scrapers/sources/` has its own quirks, documented as comments at the top of each file:

- **AllEvents, Townscript** — client-rendered pages, scraped via Playwright
- **District** — direct API call to their internal `get_discovery_results` endpoint (no browser needed)
- **Meetup** — parses the Apollo GraphQL cache embedded in the page's `__NEXT_DATA__`
- **Eventbrite** — parses embedded Schema.org JSON-LD data via Playwright; occasionally blocked by bot detection when run from cloud/datacenter IPs (GitHub Actions), but works reliably from a residential IP. Data persists between scrapes, so intermittent failures don't remove existing Eventbrite listings — they just won't refresh until a successful run.

## License

Private project — not licensed for redistribution.
