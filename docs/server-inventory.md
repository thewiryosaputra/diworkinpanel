# Server Inventory

Ringkasan isi server `141.94.121.242` yang relevan untuk Diworkin.

## Public roots

- Panel static assets: `/var/www/diworkin-panel`
- Marketing site: `/var/www/diworkin-marketing`
- Ebook site: `/var/www/diworkin-ebook`
- Legacy / site tree: `/var/www/diworkin-sites/diworkin.com`

## Service

- `diworkin-metrics.service` -> `/opt/diworkin-metrics/bin/diworkin-metrics`

## Nginx vhosts

- `/etc/nginx/sites-available/panel.diworkin.com`
- `/etc/nginx/sites-available/diworkin.com`
- `/etc/nginx/sites-available/ebook.diworkin.com`
- `/etc/nginx/sites-available/ci.diworkin.com.conf`
- `/etc/nginx/sites-available/laravel.diworkin.com.conf`
- `/etc/nginx/sites-available/studycase.diworkin.com.conf`
- `/etc/nginx/sites-available/webmail.diworkin.com`

## Secrets not copied

- `/etc/diworkin-panel/panel.env`
- any private key, password, token, or mailbox credential

