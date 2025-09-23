# workspace
colab
workspace/
├─ README.md                       <-- keep existing workspace readme (update with project summary)
├─ .github/
│  ├─ workflows/
│  │  ├─ ci.yml                     <-- CI for lint/test/build
│  │  └─ deploy.yml                 <-- optional deploy pipeline
│  └─ ISSUE_TEMPLATE.md
├─ infra/
│  ├─ docker/                       <-- docker-compose and dockerfiles for local dev (optional)
│  ├─ terraform/                    <-- infra-as-code (optional)
│  └─ README.md
├─ services/
│  ├─ frontend/                     <-- main frontend app (React + Vite + TS + Tailwind)
│  │  ├─ public/
│  │  ├─ src/
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  │  ├─ HomePage/
│  │  │  │  ├─ AboutPage/
│  │  │  │  ├─ PrivacyPage/
│  │  │  │  ├─ FAQPage/
│  │  │  │  └─ ContactPage/
│  │  │  ├─ routes/
│  │  │  ├─ hooks/
│  │  │  ├─ styles/                  <-- tailwind config + design tokens
│  │  │  ├─ utils/                   <-- text splitting, localstorage helpers
│  │  │  └─ app.tsx
│  │  ├─ tests/
│  │  ├─ package.json
│  │  ├─ vite.config.ts
│  │  └─ README.md
│  └─ backend/                      <-- lightweight Node/Express or Fastify API
│     ├─ src/
│     │  ├─ controllers/
│     │  ├─ services/                <-- text analyze service, tts queue (if any)
│     │  ├─ routes/
│     │  ├─ jobs/                    <-- background worker logic (tts, ocr)
│     │  ├─ db/                      <-- migrations / models
│     │  └─ index.ts
│     ├─ tests/
│     ├─ package.json
│     └─ README.md
├─ libs/
│  ├─ shared-types/                  <-- shared TS types between front & back (project payload schema)
│  └─ ui-kit/                        <-- shared components/styles (if mono-repo)
├─ docs/
│  ├─ specs/
│  │  ├─ api-spec.md                 <-- endpoints, request/response examples
│  │  ├─ analyze-schema.md           <-- POST /api/analyze response spec
│  │  └─ dictation-flow.md
│  ├─ UX/
│  │  └─ wireframes.md
│  └─ onboarding.md
├─ scripts/
│  ├─ dev-setup.sh
│  └─ deploy.sh
└─ .env.example
