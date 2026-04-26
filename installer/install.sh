#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${CONFIG_FILE:-${SCRIPT_DIR}/config.env}"
MODE="${MODE:-fresh}"

load_config_file() {
  local file="$1"
  [ -f "${file}" ] || return 0

  while IFS='=' read -r raw_key raw_value; do
    raw_key="${raw_key%%[[:space:]]*}"
    raw_value="${raw_value%%#*}"
    raw_value="${raw_value%$'\r'}"
    raw_value="$(printf '%s' "${raw_value}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    case "${raw_key}" in
      ''|\#*) continue ;;
    esac
    if [ -z "${!raw_key:-}" ]; then
      export "${raw_key}=${raw_value}"
    fi
  done < "${file}"
}

load_config_file "${CONFIG_FILE}"

DOMAIN="${DOMAIN:-diworkin.com}"
PANEL_HOST="${PANEL_HOST:-panel.${DOMAIN}}"
WWW_HOST="${WWW_HOST:-www.${DOMAIN}}"
MAIL_HOST="${MAIL_HOST:-mail.${DOMAIN}}"
WEBMAIL_HOST="${WEBMAIL_HOST:-webmail.${DOMAIN}}"
PUBLIC_IP="${PUBLIC_IP:-$(hostname -I | awk '{print $1}')}"
INSTALL_USER="${INSTALL_USER:-$(id -un)}"
LICENSE_API_URL="${LICENSE_API_URL:-}"
LICENSE_KEY="${LICENSE_KEY:-}"
LICENSE_DOMAIN="${LICENSE_DOMAIN:-}"
LICENSE_PRODUCT="${LICENSE_PRODUCT:-}"
LICENSE_TYPE="${LICENSE_TYPE:-hosting}"

case "${MODE}" in
  fresh|update) ;;
  *)
    echo "MODE harus fresh atau update (saat ini: ${MODE})." >&2
    exit 1
    ;;
esac

TMP_DASHBOARD="/tmp/diworkin-dashboard"
TMP_MARKETING="/tmp/diworkin-marketing"
TMP_METRICS="/tmp/diworkin-metrics"

log() {
  printf '\n==> %s\n' "$*"
}

require_root() {
  if [ "${EUID:-$(id -u)}" -ne 0 ]; then
    echo "Jalankan installer ini dengan sudo/root." >&2
    exit 1
  fi
}

preflight_checks() {
  log "Cek prasyarat server"

  if [ -r /etc/os-release ]; then
    . /etc/os-release
    case "${ID:-}" in
      ubuntu) ;;
      *)
        echo "Installer ini dirancang untuk Ubuntu. Detected: ${ID:-unknown}" >&2
        ;;
    esac
  fi

  if command -v lsb_release >/dev/null 2>&1; then
    local release
    release="$(lsb_release -rs 2>/dev/null || true)"
    case "${release}" in
      22.*|24.*) ;;
      *)
        echo "Warning: Ubuntu ${release:-unknown}. Rekomendasi 22.04 atau 24.04." >&2
        ;;
    esac
  fi

  local free_mb
  free_mb="$(df -Pm / | awk 'NR==2 {print $4}')"
  if [ -n "${free_mb:-}" ] && [ "${free_mb}" -lt 8192 ]; then
    echo "Warning: free disk space di / kurang dari 8GB (${free_mb}MB)." >&2
  fi

  for bin in apt-get systemctl curl rsync openssl; do
    if ! command -v "${bin}" >/dev/null 2>&1; then
      echo "Prasyarat hilang: ${bin}" >&2
      exit 1
    fi
  done
}

verify_license() {
  if [ -z "${LICENSE_KEY}" ]; then
    log "Lisensi tidak diisi, skip verifikasi license"
    return 0
  fi

  if [ -z "${LICENSE_API_URL}" ]; then
    echo "LICENSE_KEY diisi tetapi LICENSE_API_URL kosong." >&2
    echo "Isi LICENSE_API_URL, contoh: https://panel.diworkin.com/api/licenses/verify" >&2
    exit 1
  fi

  local verify_payload verify_body verify_code
  local verify_tmp
  verify_tmp="$(mktemp)"
  verify_payload="$(python3 - <<'PY'
import json, os
payload = {
    "license_key": os.environ.get("LICENSE_KEY", "").strip(),
    "domain": os.environ.get("LICENSE_DOMAIN", "").strip() or os.environ.get("DOMAIN", "").strip(),
    "product_name": os.environ.get("LICENSE_PRODUCT", "").strip(),
    "license_type": os.environ.get("LICENSE_TYPE", "hosting").strip(),
}
print(json.dumps(payload))
PY
)"

  log "Verifikasi license ke panel"
  verify_code="$(curl -sS -o "${verify_tmp}" -w '%{http_code}' \
    -X POST "${LICENSE_API_URL}" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json' \
    --data "${verify_payload}" || true)"

  if [ "${verify_code}" != "200" ]; then
    cat "${verify_tmp}" >&2
    rm -f "${verify_tmp}"
    echo "Verifikasi license gagal (HTTP ${verify_code})." >&2
    exit 1
  fi

  if ! grep -q '"valid"[[:space:]]*:[[:space:]]*true' "${verify_tmp}"; then
    cat "${verify_tmp}" >&2
    rm -f "${verify_tmp}"
    echo "License tidak valid." >&2
    exit 1
  fi

  rm -f "${verify_tmp}"
  log "License valid"
}

install_packages() {
  export DEBIAN_FRONTEND=noninteractive

  log "Install paket sistem"
  apt-get update

  echo "postfix postfix/main_mailer_type select Internet Site" | debconf-set-selections
  echo "postfix postfix/mailname string ${DOMAIN}" | debconf-set-selections

  apt-get install -y \
    ca-certificates curl gnupg lsb-release unzip zip rsync openssl \
    build-essential git nginx postgresql postgresql-contrib \
    certbot python3-certbot-nginx golang-go \
    php8.3-cli php8.3-fpm php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-gd php8.3-intl php8.3-pgsql php8.3-sqlite3 \
    roundcube \
    postfix postfix-pgsql \
    dovecot-imapd dovecot-lmtpd dovecot-pgsql \
    opendkim opendkim-tools \
    pdns-server pdns-backend-pgsql

  if ! command -v node >/dev/null 2>&1 || ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 20 ? 0 : 1)' >/dev/null 2>&1; then
    log "Install Node.js 20"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
}

seed_self_signed_cert() {
  local host="$1"
  local cert_dir="/etc/letsencrypt/live/${host}"

  if [ -f "${cert_dir}/fullchain.pem" ] && [ -f "${cert_dir}/privkey.pem" ]; then
    return
  fi

  log "Buat sertifikat sementara untuk ${host}"
  install -d -m 0755 "${cert_dir}"
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -subj "/CN=${host}" \
    -keyout "${cert_dir}/privkey.pem" \
    -out "${cert_dir}/fullchain.pem" >/dev/null 2>&1
}

stage_sources() {
  log "Siapkan source temporary"
  rm -rf "${TMP_DASHBOARD}" "${TMP_MARKETING}" "${TMP_METRICS}"
  rsync -a --delete --exclude 'node_modules' --exclude '.next' --exclude 'dist' --exclude 'out' --exclude '.git' \
    "${ROOT_DIR}/dashboard/" "${TMP_DASHBOARD}/"
  rsync -a --delete --exclude 'node_modules' --exclude '.next' --exclude 'dist' --exclude 'out' --exclude '.git' \
    "${ROOT_DIR}/marketing/" "${TMP_MARKETING}/"
  rsync -a --delete --exclude 'node_modules' --exclude '.git' \
    "${ROOT_DIR}/backend/metrics/" "${TMP_METRICS}/"
}

run_stack_setup() {
  if [ "${MODE}" = "fresh" ]; then
    log "Provision base stack"
    DOMAIN="${DOMAIN}" MAIL_HOST="${MAIL_HOST}" PUBIP="${PUBLIC_IP}" \
      bash "${ROOT_DIR}/server-setup.sh"

    log "Configure mail SSL and DKIM"
    DOMAIN="${DOMAIN}" MAIL_HOST="${MAIL_HOST}" WEBMAIL_HOST="${WEBMAIL_HOST}" \
      bash "${ROOT_DIR}/point1-ssl-dkim.sh"
  else
    log "Mode update: skip provisioning base stack and mail SSL"
  fi

  log "Deploy marketing site"
  DOMAIN="${DOMAIN}" WWW_HOST="${WWW_HOST}" IP="${PUBLIC_IP}" \
  NEXT_PUBLIC_PANEL_URL="${NEXT_PUBLIC_PANEL_URL:-https://${PANEL_HOST}}" \
  NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-https://${PANEL_HOST}/api}" \
    bash "${ROOT_DIR}/deploy-marketing.sh"

  log "Deploy dashboard"
  DOMAIN="${DOMAIN}" PANEL_HOST="${PANEL_HOST}" IP="${PUBLIC_IP}" \
    bash "${ROOT_DIR}/deploy-dashboard.sh"

  log "Deploy panel API"
  DOMAIN="${DOMAIN}" PANEL_HOST="${PANEL_HOST}" PUBLIC_IP="${PUBLIC_IP}" \
    bash "${ROOT_DIR}/deploy-metrics.sh"
}

print_summary() {
  cat <<EOF

Install selesai.

Domain utama:
  ${DOMAIN}

Panel:
  https://${PANEL_HOST}

Marketing site:
  https://${DOMAIN}

Webmail:
  https://${WEBMAIL_HOST}

Catatan:
  - Jika DNS belum mengarah ke server baru, sertifikat TLS sementara sudah dibuat agar layanan bisa start.
  - Setelah DNS aktif, jalankan certbot lagi untuk mengganti sertifikat sementara dengan sertifikat Let's Encrypt.
  - Source sementara disalin ke /tmp/diworkin-dashboard, /tmp/diworkin-marketing, dan /tmp/diworkin-metrics.
EOF
}

main() {
  require_root
  preflight_checks
  verify_license
  install_packages
  seed_self_signed_cert "${DOMAIN}"
  seed_self_signed_cert "${PANEL_HOST}"
  seed_self_signed_cert "${MAIL_HOST}"
  stage_sources
  run_stack_setup
  print_summary
}

main "$@"
