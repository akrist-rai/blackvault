# BLACKVAULT

Security study console — Svelte + Vite, no backend, progress saved to `localStorage`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```

## Layout

- `src/views/` — the six top-level screens (Map, Study, Arsenal, Threads, Case, Range)
- `src/data/curriculum.js` — all phase/lab/case/thread content
- `src/data/labs.js` — Range lab simulation logic
- `src/stores/progress.js` — nav state + persisted progress
- `public/web-security/` — standalone Web Security labs page, linked from the top bar
