# Access → MariaDB + Go API + React (Vite + Tailwind + daisyUI)

This is a ready-to-run Docker dev stack. Replace the sample schema with your own and import your CSVs.

## Quick start
```bash
cp .env.example .env
docker compose up -d --build
# Web:     http://localhost:5173
# API:     http://localhost:8081/api/health
# Adminer: http://localhost:8080
```

## Import your data
1. Put your CSV files into `db/import/`.
2. Adjust/create tables in `db/init/001_schema.sql` so columns match your CSV headers/order.
3. Use Adminer or the provided sample `LOAD DATA` commands from the main guide to import.

## Structure
- `db/` — MariaDB init scripts and (optional) CSVs
- `api/` — Go API
- `web/` — React + Vite + Tailwind + daisyUI

## Notes
- Dev only: Vite dev server. For prod, build static and serve via Nginx/Caddy.
- Database uses utf8mb4.
- Minimal sample tables: `customers`, `orders`.