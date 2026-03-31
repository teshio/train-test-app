# Train Times (UK National Rail)

React app that asks for **departure** + **arrival** stations (with autocomplete) and shows a mobile-friendly grid of upcoming departures.

It uses the **National Rail Darwin OpenLDBWS** API via a small Express backend proxy so your token stays server-side.

## Azure Split Deploy

- Frontend: Azure Static Web Apps
- Backend: Azure App Service

Set these environment variables:

- Static Web App: `VITE_API_BASE_URL=https://YOUR-APP-SERVICE.azurewebsites.net`
- App Service: `NATIONAL_RAIL_DARWIN_TOKEN=...`
- App Service: `ALLOWED_ORIGINS=https://YOUR-STATIC-WEB-APP.azurestaticapps.net`

### GitHub Actions Secrets And Variables

Add these in your GitHub repo settings before running the workflows:

- Secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- Secret: `AZUREAPPSERVICE_PUBLISHPROFILE`
- Variable: `VITE_API_BASE_URL`
- Variable: `AZURE_APP_SERVICE_NAME`

The workflows live in:

- [azure-static-web-apps.yml](/c:/git/train-test-app/.github/workflows/azure-static-web-apps.yml)
- [azure-app-service.yml](/c:/git/train-test-app/.github/workflows/azure-app-service.yml)

## Setup

### 1) Get a Darwin token

Sign up for access to National Rail’s Darwin Web Service (OpenLDBWS) and obtain a token.

### 2) Configure the server env

Copy the example env file and fill in your token:

```bash
copy server\.env.example server\.env
```

Edit `server/.env`:

```text
NATIONAL_RAIL_DARWIN_TOKEN=...
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

Create `client/.env` from `client/.env.example` if you want the frontend to call a non-default API URL:

```bash
copy client\.env.example client\.env
```

### 3) Install deps

```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 4) Run dev

```bash
npm run dev
```

- Client: `http://localhost:5173`
- Server: `http://localhost:3001`

## Notes

- **Autocomplete station list** lives in `client/src/data/stations.ts` (starter list; expand as needed).
- Client calls `GET /api/departures?from=XXX&to=YYY` (proxied to the server in `client/vite.config.ts`).
- In split deploy mode, the client can call a hosted API via `VITE_API_BASE_URL`.

