# Mahasabha Backend

Node.js + Express backend using CQRS style architecture and MongoDB (Mongoose).

## Features

- CQRS style folders for commands and queries
- Admin authentication APIs
- Default admin bootstrap on first startup
- Environment based secure configuration
- Constants-first design (no hardcoded status/messages)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and update values.

3. Run development server:

```bash
npm run dev
```

4. Production start:

```bash
npm start
```

If the backend runs behind Nginx, keep `TRUST_PROXY=1` so Express and the rate limiter use the real client IP from forwarded headers.

## Gallery Upload Metadata

Gallery items are stored in a JSON file used by the media routes.

- If the frontend workspace exists beside the backend, the backend uses `Veerashiva_Mahasabha/data/gallery.json`.
- Otherwise it falls back to `mahasabha-backend/data/gallery.json`.
- You can override the location explicitly with `GALLERY_DATA_FILE=/absolute/path/to/gallery.json`.

## API Base URL

`/api/v1`

## Nginx Reverse Proxy

For production, prefer serving the Angular frontend and backend through the same Nginx domain.

- Frontend: static Angular build
- API: proxy `/api/` to `http://localhost:5000`
- Uploads: proxy `/uploads/` to `http://localhost:5000`

That keeps API calls and uploaded images same-origin, so browsers do not require cross-origin access for normal site usage.

## Auth Endpoints

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
