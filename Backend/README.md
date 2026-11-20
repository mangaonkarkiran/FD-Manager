# FD Manager API

FastAPI REST API for fixed deposits. PostgreSQL stores the records, and Firebase
Phone Authentication provides the user identity used to protect every deposit
endpoint.

## Prerequisites

- Python 3.12 or newer
- PostgreSQL 18 and pgAdmin 4
- A Firebase project with Phone sign-in enabled
- Node.js and npm for the Angular frontend

pgAdmin is a database administration tool. The API connects directly to the
PostgreSQL server.

## Create the database

In pgAdmin, connect to your local PostgreSQL server. Under **Login/Group Roles**,
create a login role named `fd_manager_app` and set a password. Under
**Databases**, create `fd_manager` and set `fd_manager_app` as its owner. Use
that role and password in the database URL rather than using the `postgres`
superuser for the application.

## Configure Firebase

1. In Firebase Console, create a project and add a Web app.
2. Enable **Authentication → Phone** and add `localhost` to the authorized
   domains.
3. Configure the Web app's public Firebase settings in:
   - `Frontend/src/environments/environment.development.ts`
   - `Frontend/src/environments/environment.ts`
4. In Firebase Console, create a service-account key for the backend. Save it
   as `Backend/secrets/firebase-admin.json`; do not commit or share this file.
5. Use Firebase test phone numbers while developing to avoid sending real SMS.
   Actual SMS availability, quotas, and pricing depend on Firebase's current
   plan and region.

The Firebase Web app settings are public client configuration. The service
account key is private and must only be available to the backend.

## Configure and run the backend (PowerShell)

From the repository root:

```powershell
Set-Location Backend
Copy-Item .env.example .env
```

Edit `Backend/.env` with the local PostgreSQL URL, Firebase project ID, and
absolute path to the service-account JSON. URL-encode special characters in the
database password. Never put real credentials in `.env.example` or source code.

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\uvicorn.exe app.main:app --reload
```

The API listens at `http://localhost:8000`. Interactive API documentation is
available at `http://localhost:8000/docs`; liveness check: `http://localhost:8000/health`.
The development CORS origin defaults to `http://localhost:4200`.

## Run the frontend

In a second PowerShell window:

```powershell
Set-Location Frontend
npm install
npm start
```

Open `http://localhost:4200`. The Angular app requests Firebase Phone OTP,
obtains a Firebase ID token after verification, and sends that token to the API
as a bearer token. The API verifies the token and filters all reads and writes
by Firebase UID.

## Deposit API

All routes below require a valid Firebase ID token in the `Authorization:
Bearer <token>` header:

- `GET /api/v1/deposits`
- `POST /api/v1/deposits`
- `POST /api/v1/deposits/import` (only when the account has no existing deposits)
- `GET /api/v1/deposits/{id}`
- `PUT /api/v1/deposits/{id}`
- `DELETE /api/v1/deposits/{id}`

Deposits saved by earlier versions remain in browser storage. When the API
account is empty, the app offers an explicit import for locally saved
non-demo deposits. The local browser copy is not deleted. If the account
already has server deposits, import is blocked to prevent overwriting or
duplicating account data.

Only masked account numbers should be stored. Do not enter full bank account
numbers into the tracker.

## Tests

From `Backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest
```

The backend tests use an isolated in-memory SQLite database and stub Firebase
identity at the dependency boundary; they do not require a live PostgreSQL or
Firebase project.
