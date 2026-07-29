# MindConnect

Online therapy platform: browse therapists, wallet/coins, and Twilio-based video calls.

- `backend/` — FastAPI + Motor (MongoDB). All routes are mounted under the `/api` prefix.
- `frontend/` — React (Create React App via CRACO), Tailwind + shadcn/ui. Package manager is `yarn` (see `frontend/package.json`).
- MongoDB is the datastore (`MONGO_URL`, `DB_NAME` in `backend/.env`).

## Cursor Cloud specific instructions

Services (run each in its own long-lived shell/tmux session):

- MongoDB: `mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017`. Must be running before the backend; the backend reads `MONGO_URL=mongodb://localhost:27017` from `backend/.env`. Create `/data/db` (owned by the current user) if missing. There is no systemd in this environment, so start `mongod` manually rather than via `systemctl`.
- Backend: from `backend/`, run `../.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --reload`. Python deps live in the repo-root virtualenv `/.venv` created by the update script. There is no `__main__` block in `server.py`; always launch it with uvicorn. `GET /api/` returns 404 (no root route) — that is expected; use a real route like `POST /api/auth/register` to smoke-test.
- Frontend: from `frontend/`, run `yarn start` (port 3000). The committed `frontend/.env` sets `REACT_APP_BACKEND_URL` to a remote preview URL, which won't work locally. Override it at runtime instead of editing the tracked file: `REACT_APP_BACKEND_URL=http://localhost:8001 WDS_SOCKET_PORT=3000 yarn start`. The frontend builds the API base as `${REACT_APP_BACKEND_URL}/api`.

Lint/test notes:

- Frontend lint runs automatically via CRA's built-in ESLint during `yarn start`/`yarn build`; there is no standalone lint script and no eslint config file.
- Backend lint tools (`flake8`, `black`, `mypy`, `isort`) are installed via `requirements.txt` but there is no configured ruleset; use them ad hoc (e.g. `../.venv/bin/python -m flake8 server.py`).
- `backend_test.py` (and the other `*_test.py` scripts) default their base URL to the remote preview host. To run against the local backend, point them at `http://localhost:8001/api` (e.g. copy to a temp file and substitute the URL) rather than editing the tracked test file.
- The backend test suite assumes seed data (e.g. a pre-existing admin account); several tests fail on a fresh empty database. This is a data assumption, not an environment problem.

Auth quirk: `POST /api/auth/login` takes `email` and `password` as query parameters (not a JSON body); `POST /api/auth/register` takes a JSON body.
