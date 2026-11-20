# FD Manager

FD Manager is a fixed-deposit tracker with an Angular frontend, FastAPI API,
PostgreSQL storage, and Firebase Phone Authentication.

## Run locally

1. Follow [Backend/README.md](./Backend/README.md) to create the PostgreSQL
   database, configure Firebase, run migrations, and start the API.
2. In a separate terminal, run the Angular frontend:

   ```powershell
   Set-Location Frontend
   npm install
   npm start
   ```

3. Open `http://localhost:4200`.

The API verifies Firebase ID tokens and scopes deposit data to the signed-in
Firebase user. Keep the Firebase service-account JSON and `Backend/.env` local;
never commit them.