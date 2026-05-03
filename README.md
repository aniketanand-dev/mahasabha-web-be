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

## API Base URL

`/api/v1`

## Auth Endpoints

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

## Default Admin Seed

On startup, backend ensures a default admin exists:

- username: `admin`
- password: `Mahasabha@123`
