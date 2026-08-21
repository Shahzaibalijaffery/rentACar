# RentACar

Peer-to-peer car rental monorepo — React Native CLI mobile app, NestJS API, MongoDB via Prisma.

## Repository layout

```
rentACar/
├── apps/
│   ├── api/          # NestJS backend (@rentacar/api)
│   └── mobile/       # React Native CLI app (@rentacar/mobile)
├── packages/
│   └── shared/       # Shared API contract types (@rentacar/shared)
├── docs/
│   └── ARCHITECTURE.md
└── .cursor/rules/    # Permanent AI engineering rules
```

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB Atlas cluster (or local MongoDB for development)
- Xcode (iOS) / Android Studio (Android) for mobile builds

## Quick start

```bash
# Install dependencies (all workspaces)
npm install

# Build shared types package
npm run shared:build

# API — copy env and start
cp apps/api/.env.example apps/api/.env
# Edit DATABASE_URL in apps/api/.env
npm run api:dev

# Mobile — start Metro (in a separate terminal)
npm run mobile:start
npm run mobile:ios      # or mobile:android
```

## Scripts

| Script                   | Description                |
| ------------------------ | -------------------------- |
| `npm run api:dev`        | Start NestJS in watch mode |
| `npm run api:build`      | Build API                  |
| `npm run api:test`       | Run API unit tests         |
| `npm run mobile:start`   | Start Metro bundler        |
| `npm run mobile:ios`     | Run iOS app                |
| `npm run mobile:android` | Run Android app            |
| `npm run shared:build`   | Build shared package       |
| `npm run lint`           | ESLint (root)              |
| `npm run format`         | Prettier write             |
| `npm run typecheck`      | Typecheck all workspaces   |

## Environment variables

| App    | File                       | Required keys                                                   |
| ------ | -------------------------- | --------------------------------------------------------------- |
| API    | `apps/api/.env`            | `DATABASE_URL`, optional `PORT`, `NODE_ENV`                     |
| Mobile | `apps/mobile/.env.example` | `API_BASE_URL` (documented; wired when RN env tooling is added) |

See `docs/ARCHITECTURE.md` for design decisions and extension points.

## What is intentionally not implemented yet

Authentication, vehicles, rentals, handovers, ratings, notifications, payments, and other product features are **out of scope** for this foundation pass.
