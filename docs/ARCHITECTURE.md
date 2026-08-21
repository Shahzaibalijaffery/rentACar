# Architecture

## Overview

RentACar is an npm workspaces monorepo with three packages:

| Package            | Role                                                |
| ------------------ | --------------------------------------------------- |
| `@rentacar/api`    | NestJS REST API, Prisma data access, domain modules |
| `@rentacar/mobile` | React Native CLI client                             |
| `@rentacar/shared` | Shared TypeScript types for API contracts           |

## Backend (`apps/api`)

### Layers

```
HTTP request
  → Controller (routing, DTO binding)
  → Service (business rules, authorization)
  → PrismaService (data access)
  → MongoDB
```

### Cross-cutting concerns

| Concern         | Location                                        |
| --------------- | ----------------------------------------------- |
| Env validation  | `src/config/` (Joi schema, fail-fast at boot)   |
| Global errors   | `src/common/filters/global-exception.filter.ts` |
| Domain errors   | `src/common/errors/domain.error.ts`             |
| Database        | `src/common/database/prisma.service.ts`         |
| Feature modules | `src/modules/<feature>/`                        |

### API conventions

- Base path: `/api/v1`
- Success envelope: `{ data: T }`
- Error envelope: `{ statusCode, message, errorCode?, details? }`
- Request validation: global `ValidationPipe` with whitelist

### Adding a feature module

1. Create `src/modules/<feature>/` with module, controller, service, DTOs.
2. Add Prisma models in `prisma/schema.prisma` with the feature.
3. Register module in `app.module.ts`.
4. Add unit tests for service business logic; e2e tests for HTTP contracts.

## Database (`apps/api/prisma`)

- Provider: MongoDB Atlas via Prisma
- Schema starts with datasource + generator only; domain models are added incrementally with features.
- Images stored as object-storage URLs — never binary in MongoDB.

### Geospatial discovery (MongoDB-specific)

Vehicle discovery uses MongoDB `$geoNear` against a GeoJSON `location` field on `Vehicle`:

```json
{ "type": "Point", "coordinates": [longitude, latitude] }
```

Prisma does not expose first-class geospatial query APIs for MongoDB, so discovery data access lives in `DiscoveryRepository` using `vehicle.aggregateRaw()`. A `2dsphere` index on `Vehicle.location` is ensured at API startup via `DiscoveryBootstrapService`.

Internal owner views still use precise `latitude`/`longitude` fields. Public discovery responses expose only `areaLabel` and server-calculated distance — never exact coordinates or owner private data.

## Mobile (`apps/mobile`)

### Structure

```
src/
├── api/           # HTTP client, query keys, TanStack Query hooks
├── components/    # Shared UI primitives
├── config/        # Environment access
├── features/      # Feature screens, hooks, local components
├── theme/         # Design tokens (colors, spacing, typography, radii)
└── stores/        # Reserved for Zustand (client-only state) when needed
```

### State management

| State type               | Tool                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Server/API data          | TanStack Query (`src/api/`)                                                                                    |
| Client-only global state | Zustand in `src/stores/` — **not installed yet**; add when a genuine need arises (e.g., auth session UI state) |

### API client

- `apiRequest<T>()` in `src/api/client.ts` — typed fetch wrapper
- Errors parsed to `ApiError` with consistent shape
- Query key factories per feature under `src/api/keys/`

### Theme

All visual tokens live in `src/theme/`. Screens and components consume tokens — no scattered magic numbers or hex values.

## Shared package (`packages/shared`)

Exports API contract types used by both backend responses and mobile parsing. Build before API/mobile if types change:

```bash
npm run shared:build
```

## Testing

| Layer       | Approach                                             |
| ----------- | ---------------------------------------------------- |
| API unit    | Jest, colocated `*.spec.ts` on services/filters      |
| API e2e     | Jest + supertest, Prisma mocked where DB unavailable |
| Mobile unit | Jest, pure utilities and hooks                       |

## Decisions deferred

These require a choice before the related feature work:

1. **Object storage provider** (S3, R2, GCS, etc.) and presigned URL flow
2. **Mobile env injection** — `react-native-config` vs build-time replacement for `API_BASE_URL`
3. **Navigation library** — React Navigation (likely) when auth/onboarding flows begin
4. **Secure token storage** — react-native-keychain when auth is implemented
5. **CI pipeline** — GitHub Actions or other

## Out of scope (MVP)

See `.cursor/rules/00-project-context.mdc` for the full excluded feature list (payments, maps, chat, etc.).
