# Train Times (UK National Rail)

React app that asks for **departure** + **arrival** stations (with autocomplete) and shows a mobile-friendly grid of upcoming departures.

It uses the **National Rail Darwin OpenLDBWS** API via a small Express backend proxy so your token stays server-side.

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

