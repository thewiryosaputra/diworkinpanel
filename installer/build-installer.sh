#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE_DIR="$(mktemp -d /tmp/diworkin-installer-stage.XXXXXX)"
OUT_DIR="${OUT_DIR:-${ROOT_DIR}/dist}"
OUT_FILE="${OUT_FILE:-${OUT_DIR}/diworkin-installer.zip}"

cleanup() {
  rm -rf "${STAGE_DIR}"
}
trap cleanup EXIT

mkdir -p "${OUT_DIR}"

rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude 'out' \
  --exclude '*.zip' \
  "${ROOT_DIR}/" "${STAGE_DIR}/"

chmod +x "${STAGE_DIR}/installer/install.sh"
chmod +x "${STAGE_DIR}/installer/build-installer.sh"
chmod +x "${STAGE_DIR}/deploy-dashboard.sh"
chmod +x "${STAGE_DIR}/deploy-marketing.sh"
chmod +x "${STAGE_DIR}/deploy-metrics.sh"
chmod +x "${STAGE_DIR}/point1-ssl-dkim.sh"
chmod +x "${STAGE_DIR}/server-setup.sh"

cd "${STAGE_DIR}"
zip -qr "${OUT_FILE}" .

printf 'Installer zip created: %s\n' "${OUT_FILE}"
