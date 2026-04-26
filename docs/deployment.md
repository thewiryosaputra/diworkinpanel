# Deployment Guide

Panduan singkat untuk menjalankan stack Diworkin dari repo ini.

## 1. Repository layout

- `apps/dashboard` - panel dashboard Vite
- `apps/ebook` - builder ebook Vite
- `apps/marketing` - marketing site Next.js
- `backend/metrics` - service backend Go
- `installer` - installer bundle untuk server baru
- `deploy/nginx` - contoh konfigurasi nginx
- `deploy/systemd` - unit service systemd

## 2. Runtime environment

### Marketing site

Copy `apps/marketing/.env.example` to `.env.local` if you want to override the default panel endpoints.

### Backend service

Copy `backend/metrics/.env.example` to a protected env file on the server and load it from systemd.

The production service on the server currently reads:

- `/etc/diworkin-panel/panel.env`

## 3. Build flow

### Dashboard

```bash
cd apps/dashboard
npm install
npm run build
```

### Ebook builder

```bash
cd apps/ebook
npm install
npm run build
```

### Marketing site

```bash
cd apps/marketing
npm install
npm run build
```

### Go backend

```bash
cd backend/metrics
go build ./...
```

## 4. Server deploy mapping

Nginx examples in `deploy/nginx` match these paths on the target server:

- Panel assets: `/var/www/diworkin-panel`
- Marketing site: `/var/www/diworkin-marketing`
- Ebook site: `/var/www/diworkin-ebook`
- Legacy site tree: `/var/www/diworkin-sites/diworkin.com`
- Metrics binary: `/opt/diworkin-metrics/bin/diworkin-metrics`

## 5. Secrets policy

Do not commit:

- `panel.env`
- private keys
- SMTP passwords
- database passwords
- API tokens

Use example files and server-side secret storage instead.

