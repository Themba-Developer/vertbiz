# VertBiz — Appflow / Web build notes

- Build command (Appflow): `npm ci && npm run build`
- Web output directory (artifact): `dist`

Notes:
- This project contains optional server/SSR entry points (src/server.ts, src/start.ts). Appflow's static web deploy will publish the Vite static build from `dist/`. If you need SSR deployment, use a server host.
- Do NOT commit secrets; set environment variables (e.g. SUPABASE_URL, SUPABASE_ANON_KEY) in Appflow build settings.
