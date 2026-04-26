# Diworkin Panel Monorepo

Monorepo untuk aset dan source Diworkin yang bisa dipindah ke GitHub tanpa membawa secret mentah.

## Struktur

- `apps/dashboard` - panel dashboard berbasis Vite
- `apps/ebook` - ebook builder berbasis Vite
- `apps/marketing` - marketing site berbasis Next.js
- `backend/metrics` - service backend Go untuk panel
- `installer` - bundle installer server
- `deploy/nginx` - konfigurasi nginx yang di-export dari server
- `deploy/systemd` - unit systemd yang di-export dari server
- `docs` - inventaris server dan catatan deployment

## Catatan penting

- File secret seperti `/etc/diworkin-panel/panel.env` tidak disalin ke repo.
- Gunakan `installer/config.env.example` sebagai template, lalu buat `installer/config.env` lokal saat deploy.
- Aset build seperti `dist/`, `out/`, `.next/`, dan `node_modules/` tidak ikut versi source.

## Quick start

Masing-masing app tetap bisa dijalankan sendiri di foldernya:

- `apps/dashboard`
- `apps/ebook`
- `apps/marketing`

Contoh:

```bash
cd apps/dashboard
npm install
npm run dev
```

