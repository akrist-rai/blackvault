# BLACKVAULT

Self-directed security training range: Reverse Engineering, Malware Analysis, and Digital
Forensics — 12 phases, browser-based labs, real hands-on artifacts. Personal local project.

```
blackvault-svelte/   the app — Svelte + Vite. `cd blackvault-svelte && npm run dev`
range/                real, runnable artifacts (disk image, pcap, crackmes, hashes, …) —
                       see range/README.md for the matching real-tool commands
web security/         standalone Web Security labs (SQLi / XSS / path traversal / OS command
                       injection sandbox) — linked from the app's top bar
```

Everything else has been removed — earlier iterations of this project were plain HTML/CSS/JS;
the Svelte app under `blackvault-svelte/` is the only one still maintained.
