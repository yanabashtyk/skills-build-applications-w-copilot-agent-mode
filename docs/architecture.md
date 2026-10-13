# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React app as a thin consumer of the API. Each route should fetch the capability payload from the shared API client, showing loading, empty, and error UI states with accessible text so tests confirm the user experience before any business logic is expanded.
- Logic tier decision: Keep all behavior in Express services beneath `/api/*` routes. Validation for malformed IDs and missing required input stays in service-layer checks with deliberate 4xx responses instead of leaking raw cast errors or Mongo exceptions.
- Data tier decision: Use Mongoose schemas to enforce the contracts for users, teams, activities, and workouts. Keep IDs, refs, and required fields in the model layer; use the seed script for stable demo records and team membership reconciliation rather than clearing production-like collections.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; verify both ids are valid existing refs; create the `Activity` with the supplied `user`, `team`, `type`, and `minutes`, then compute `points` and `occurredAt` in a consistent server-side way.
- Team management approach: Require a team `name` and `mascot`, default `members` to an empty array, and persist member references without breaking the user/team relationship model. Reject invalid team payloads with a 400 before attempting writes.
- Leaderboard approach: Aggregate team totals from activity points, sort descending, and assign a 1-based rank. The endpoint should return objects with `teamName`, `totalPoints`, and `rank` so the frontend can render rankings without extra transformation.
- Workout suggestions approach: Resolve the user by email, inspect the user’s recent activity or fitness goal, and return matching workouts with a reason field. If no user matches, return a deliberate 4xx such as 404; the first suggestion should align with the user’s current goal or recent exercise pattern.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Failure meaning: schema validation is missing or too weak. The failing tests show that `User`, `Team`, `Activity`, and `Workout` models do not enforce required fields and default values, so the data contract is not yet satisfied.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Failure meaning: the backend service layer is still stubbed. The 501 responses indicate the validation endpoints are unimplemented, while the empty leaderboard and wrong recommendation show that aggregation and workout matching logic are not complete.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Failure meaning: the UI still renders placeholder content instead of real data states. The missing `role="alert"` and loading/empty-state assertions indicate the presentation layer has not yet learned to handle fetch progress and failure states.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Purpose: verify TypeScript, Mongoose model, and service code compile cleanly once the validation and business logic are implemented.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Purpose: verify routing, fetch usage, and component rendering compile cleanly after the controlled state handling and API client work is in place.
