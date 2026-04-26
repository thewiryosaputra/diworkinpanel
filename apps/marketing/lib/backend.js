export function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://panel.diworkin.com/api';
}

export function backendUrl(path = '') {
  const base = getBackendBaseUrl().replace(/\/$/, '');
  const suffix = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${base}${suffix}`;
}
