# workspace

This repository contains a small web app (frontend + backend) to extract text from PDFs and generate dictation audio.

Quick start (backend):

1. Install dependencies

```powershell
cd back-end; npm install
```

2. Provide Google Cloud credentials. You can either set environment variable `GOOGLE_APPLICATION_CREDENTIALS` pointing to a JSON key file, or set `GOOGLE_CREDENTIALS_JSON` with the JSON content of the key.

3. Start server

```powershell
npm run dev
```

Frontend: open `front-end/public/index.html` in a browser or serve it with any static server. The frontend expects the backend at `http://localhost:3001` by default.

Environment variables used by the backend:

- PORT (optional)
- GOOGLE_APPLICATION_CREDENTIALS (optional) or GOOGLE_CREDENTIALS_JSON

Notes:
- The backend enforces a 20MB PDF upload limit and basic PDF mime-type checking.
- TTS output is generated as MP3 and saved to `back-end/uploads`.

