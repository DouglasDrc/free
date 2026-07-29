# AGENTS.md

## Cursor Cloud specific instructions

MindConnect is a single product: an online therapy platform (FastAPI + React + MongoDB) where clients connect with therapists over Twilio video/audio and a coin-based wallet. It is not a monorepo.

### Services and how to run them

Three services must run for full local end-to-end use. The update script only refreshes dependencies; you must start the services yourself (MongoDB is preinstalled in the VM snapshot, not by the update script).

- MongoDB (required): `mongod --dbpath /data/db --bind_ip 127.0.0.1`. Data persists in `/data/db`. The backend connects using `backend/.env` (`MONGO_URL`, `DB_NAME=mindconnect_db`).
- Backend (required): from `backend/`, run `uvicorn server:app --host 0.0.0.0 --port 8001 --reload`. All routes are under `/api` in the single file `server.py`. Interactive docs at `http://localhost:8001/docs`. Note `/api/` (root) returns 404 by design; there is no root route.
- Frontend (required): from `frontend/`, run `yarn start` (CRACO dev server, port 3000). Standard scripts are in `frontend/package.json`.

### Non-obvious gotchas

- `frontend/.env` `REACT_APP_BACKEND_URL` must point at the local backend (`http://localhost:8001`) for local E2E; the repo originally shipped a remote Emergent preview URL. The frontend appends `/api` itself and there is no CRACO proxy.
- Python packages install to the user site with `pip install --break-system-packages ...`; console scripts (uvicorn, flake8, black, pytest) live in `~/.local/bin`, which may not be on PATH.
- The DB starts empty — there are no migrations or seed data; collections are created on the fly. Roles (`client`, `therapist`, `admin`) are chosen at registration via `POST /api/auth/register`. Therapists are created by an admin via `POST /api/admin/therapists/create`.
- Login uses query params, not a JSON body: `POST /api/auth/login?email=...&password=...`.

### Lint / test / build

- Backend lint: `flake8 server.py` (config in `backend`, tools already installed). No unit tests exist in `tests/` (empty).
- Frontend lint: ESLint runs through `react-scripts`/CRACO during `yarn start`/`yarn build`; there is no standalone ESLint flat config, so `npx eslint` fails by design.
- Frontend build: `yarn build`.
- Integration tests: root scripts `backend_test.py`, `critical_balance_test.py`, `end_call_test.py` are `requests`-based runners that hit a live backend. They default to the remote URL (`MindConnectAPITester(base_url=...)`); point them at `http://localhost:8001/api` to run locally. They expect a seeded admin `admin@mindconnect.com` / `admin123` (register it first). A few billing/duration assertions depend on real elapsed session time and precise coin math, so they can fail even when the environment is healthy.
