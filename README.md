# ChargeShare

ChargeShare is an electric-vehicle charging marketplace project. It contains a mobile-responsive browser prototype for drivers requesting emergency charging and providers offering charging, plus a separate Node.js API intended to manage users, vehicles, chargers, charging requests, and provider matching.

**The browser prototype and backend are currently separate:** the frontend simulates marketplace interactions locally and does not call the API. The map uses demo provider locations; authentication, payments, notifications, identity verification, and hardware integration are not end-to-end product workflows.

> **Working-copy note:** The checkout used to prepare this README contains other modified and untracked application files. This commit includes only `README.md`; those local changes are not pushed with it. Backend details below describe the code reviewed in this working copy and may not all be present on GitHub until those changes are committed separately.

## Repository layout

| Path | Purpose |
| --- | --- |
| `ChargeShare_Full_Website/` | Static HTML, CSS, and vanilla JavaScript prototype |
| `ChargeShare_Full_Website/index.html` | Sign-up, onboarding, login, reset-password, and marketplace screens |
| `ChargeShare_Full_Website/script.js` | Form validation and the client-side onboarding/demo flows |
| `ChargeShare_Full_Website/marketplace.js` | Role selection, demo map, price estimate, request timeline, and provider-offer simulation |
| `ChargeShare_Full_Website/style.css` | Responsive visual styles |
| `backend/server.js` | Backend entry point and port selection |
| `backend/src/app.js` | Express app, middleware, API mounts, and error responses |
| `backend/src/routes/` | User, vehicle, charger, request, and matching route definitions |
| `backend/src/controllers/` | Request handling and database operations |
| `backend/src/db/database.js` | SQLite database connection and schema initialization |
| `backend/src/services/` | Matching-service client and pricing calculation |
| `backend/chargeshare.db` | SQLite database file in the current repository layout |
| `CONTRIBUTING.md` | Branch, commit, and contribution guidance |

## Components and current behavior

### Browser prototype

Serve `ChargeShare_Full_Website/` from a local HTTP server (for example, VS Code Live Server) and open `index.html`. The page uses local assets and vanilla JavaScript; there is no frontend build step or package manifest.

The prototype includes:

- Sign-up form validation and a multi-step onboarding flow for licence, identity, vehicle registration, VIN/chassis, and charging connector/power information.
- Demo login and password-reset screens. These validate or simulate interactions in the browser rather than authenticating users or sending reset email through the API.
- A receiver/provider role selection flow.
- A receiver experience with a charge estimate, rescue-mode selection, simulated request timeline, and Google Maps view with generated demo provider markers.
- A provider experience with availability and profile controls and simulated incoming offers with accept/decline and countdown behavior.
- A browser-side price estimate that is separate from the backend pricing utility.

Only the selected role is persisted in browser `localStorage`; other prototype state is temporary. Onboarding uploads do not upload documents to a server. The map can use browser geolocation, and requires a Google Maps JavaScript API key if that integration is enabled. Configure the key in the local frontend configuration referenced by the page; do not commit a real key.

### Backend API

The backend is a CommonJS Node.js application using Express, SQLite through `better-sqlite3`, and `bcryptjs` for password hashing. It configures CORS, parses JSON request bodies (up to 32 KB), exposes a health response, and returns JSON for not-found and server errors.

The API currently provides:

| Prefix | Operations | Access |
| --- | --- | --- |
| `/api/users` | Register, log in, inspect the current user, and log out | Registration and login are public; current-user and logout operations require authentication |
| `/api/vehicles` | List available vehicles, get one by ID, create, change availability, and delete | Reads are public; changes require authentication |
| `/api/chargers` | List available chargers, get one by ID, create, change availability, and delete | Reads are public; changes require authentication |
| `/api/requests` | Create a charging request, list the caller's requests, get one of the caller's requests, and change its status | Authentication required |
| `/api/match` | Submit matching inputs to the matching service | Authentication required |

Successful registration and login create a seven-day server-side session and return an authentication token. Charging-request status handling includes requester cancellation and provider acceptance, rejection, and completion. Refer to the route and controller files for exact request fields and response structures.

The current working copy has authentication middleware under `backend/src/middleware/`; that directory is untracked, so it is not included in a clean clone unless committed separately.

SQLite is initialized when the backend starts. The schema includes users, vehicles, chargers, charging requests, driving-licence verification records, and authentication sessions, with foreign keys, indexes, and basic constraints. A local database path can be set with `CHARGESHARE_DB_PATH`.

The matching controller delegates to a separate HTTP service. Its URL is configurable with `PYTHON_API_URL` (default `http://127.0.0.1:8000`); the backend calls that service's `/match` endpoint. The matching service itself is not included as a runnable service in the tracked application files. A backend pricing utility is present, but it is distinct from the browser estimate.

## Run the backend

Install Node.js and npm, then run:

```bash
cd backend
npm install
npm run dev
```

For a normal start, use `npm start`. The API listens on port `5000` by default; set `PORT` to use another port. `CORS_ORIGINS` can be used to configure allowed origins; localhost origins are also allowed. `CHARGESHARE_DB_PATH` changes the SQLite file location.

The matching client uses `PYTHON_API_URL`, which defaults to `http://127.0.0.1:8000`. Start a compatible matching service separately if you need the `/api/match` workflow. The SQLite database is created/initialized by the backend; keep local database files and configuration out of commits when appropriate.

## Development status and limitations

- The frontend is a demonstrator, not an API-connected production client.
- Frontend login, password reset, onboarding documents, map discovery, and marketplace requests are simulated or local-only.
- Backend matching depends on a separately hosted matching service.
- The database has a driving-licence verification table, but the repository does not provide a complete verification API workflow.
- Payment processing, real notifications, production identity verification, and charger hardware integration are not implemented end to end.
- The `backend` package's test script is a placeholder; no automated test suite is configured.

## Contributing

Follow [`CONTRIBUTING.md`](CONTRIBUTING.md): coordinate changes, keep commits focused, stage only files related to your change, and never commit passwords, tokens, private keys, or local environment files. The project guidance uses the shared `main` branch and prohibits force-pushing.
