import React from 'react';
import {
  FiArchive,
  FiBold,
  FiEye,
  FiEyeOff,
  FiEdit2,
  FiInbox,
  FiFolder,
  FiItalic,
  FiLink,
  FiList,
  FiMail,
  FiPlus,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiSettings,
  FiStar,
  FiTrash2,
  FiAlertTriangle,
  FiUnderline,
} from 'react-icons/fi';

const labels = [
  { label: 'Priority', tone: 'rose' },
  { label: 'Clients', tone: 'blue' },
  { label: 'Ops', tone: 'slate' },
  { label: 'Legal', tone: 'amber' },
];

const quickReplies = ['Send proposal outline', 'Ask for budget range', 'Schedule a call'];

const composeTags = ['Proposal', 'UI/UX', 'Priority'];

const MAIL_API_BASE = '/api/email';
const DEFAULT_COMPOSE_HTML = `<p>Hi team,</p>
<p>Thanks for reaching out. I reviewed the brief and I think we can move forward with a focused first sprint.</p>
<p>Here is the structure I suggest:</p>
<ul>
  <li>Discovery and scope</li>
  <li>Visual direction and handoff</li>
  <li>Final polish for launch</li>
</ul>
<p>Let me know if the budget window works and I will send a formal proposal.</p>
<p>Regards,<br />Johnny</p>`;

const EMPTY_FOLDERS = [
  { name: 'Inbox', label: 'Inbox', count: 0, unread_count: 0 },
  { name: 'Starred', label: 'Starred', count: 0, unread_count: 0 },
  { name: 'Sent', label: 'Sent', count: 0, unread_count: 0 },
  { name: 'Drafts', label: 'Drafts', count: 0, unread_count: 0 },
  { name: 'Archive', label: 'Archive', count: 0, unread_count: 0 },
  { name: 'Spam', label: 'Spam', count: 0, unread_count: 0 },
  { name: 'Trash', label: 'Trash', count: 0, unread_count: 0 },
];

const folderDecorations = {
  Inbox: {
    icon: FiInbox,
    badge: 'rounded-2xl bg-[#1f3d2e] text-white shadow-[0_12px_24px_rgba(31,61,46,0.18)]',
  },
  Sent: {
    icon: FiSend,
    badge: 'rounded-xl bg-[#cfe8d5] text-[#1f3d2e]',
  },
  Drafts: {
    icon: FiEdit2,
    badge: 'rounded-[0.85rem] bg-[#f3e8d5] text-[#8b6a3d]',
  },
  Archive: {
    icon: FiArchive,
    badge: 'rounded-[1rem] bg-slate-100 text-slate-600',
  },
  Spam: {
    icon: FiAlertTriangle,
    badge: 'rounded-full bg-amber-100 text-amber-700',
  },
  Trash: {
    icon: FiTrash2,
    badge: 'rounded-[0.9rem] bg-rose-100 text-rose-600',
  },
  Starred: {
    icon: FiStar,
    badge: 'rounded-[1.1rem] bg-amber-100 text-amber-700',
  },
  default: {
    icon: FiFolder,
    badge: 'rounded-2xl bg-slate-100 text-slate-600',
  },
};

const tw = {
  page:
    'relative min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(169,200,138,0.12),rgba(243,232,213,0.22)_45%,rgba(255,255,255,0.7)_100%)] px-4 py-4 text-slate-900',
  shell:
    'flex min-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.10)]',
  card: 'rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]',
  panel: 'min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]',
  topbar:
    'grid gap-3 border-b border-slate-200 bg-white px-4 py-4 lg:grid-cols-[auto,minmax(0,1fr),auto] lg:items-center',
  brand: 'flex min-w-0 items-center gap-3',
  mark: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1f3d2e] text-white shadow-[0_16px_30px_rgba(31,61,46,0.18)]',
  kicker:
    'inline-flex items-center rounded-full bg-[#cfe8d5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1f3d2e]',
  brandTitle: 'min-w-0 text-sm font-semibold text-slate-950',
  brandSub: 'text-sm text-slate-500',
  search:
    'flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.04)]',
  searchInput: 'w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400',
  topActions: 'flex items-center justify-end gap-2',
  pillBtn:
    'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:bg-slate-50',
  primaryBtn:
    'inline-flex items-center gap-2 rounded-2xl bg-[#1f3d2e] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,61,46,0.28)] transition hover:bg-[#2f5d50]',
  layout: 'grid min-h-0 gap-4 p-4 xl:grid-cols-[240px_minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:grid-cols-[240px_minmax(0,1fr)]',
  sidebar: 'flex min-h-0 flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)]',
  profile: 'flex items-center gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-3 py-3',
  avatarRing: 'flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[#1f3d2e] text-white shadow-[0_16px_30px_rgba(31,61,46,0.18)]',
  sidebarStack: 'grid gap-1.5',
  sideHeading: 'text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400',
  folderList: 'grid gap-1',
  folderItem:
    'flex min-h-10 items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50',
  folderItemActive: 'border border-[#cfe8d5] bg-[#f7fbf8] text-[#1f3d2e] shadow-[0_12px_32px_rgba(31,61,46,0.08)]',
  folderLeft: 'flex items-center gap-2',
  folderIcon: 'grid h-8 w-8 shrink-0 place-items-center',
  folderCount: 'inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs text-slate-600',
  labelRow: 'flex flex-wrap gap-1.5',
  labelChip: 'inline-flex rounded-full px-2 py-1 text-xs',
  storage: 'grid gap-2 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-3',
  storageBar: 'h-2 overflow-hidden rounded-full bg-slate-200',
  storageFill: 'h-full w-[72%] rounded-full bg-gradient-to-r from-[#1f3d2e] via-[#4f8f6c] to-[#a9c88a]',
  storageAction: 'inline-flex items-center gap-2 text-sm font-medium text-slate-800',
  list: 'flex min-h-0 flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)]',
  listHeader: 'flex flex-wrap items-center justify-between gap-3 pb-1',
  listTitle: 'text-2xl font-semibold tracking-[-0.04em] text-slate-900',
  listDesc: 'text-sm text-slate-500',
  toolbarGroup: 'flex flex-wrap items-center gap-1.5',
  chip: 'inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:bg-slate-50',
  chipActive: 'border-[#cfe8d5] bg-[#f7fbf8] !text-[#1f3d2e] font-semibold hover:bg-[#edf7f0]',
  chipStrong: 'border-[#1f3d2e] bg-[#1f3d2e] text-white hover:bg-[#2f5d50]',
  iconBtn: 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.04)]',
  strip: 'flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500',
  stripDivider: 'h-3 w-px bg-slate-200',
  threadList: 'flex-1 min-h-0 overflow-auto rounded-[1.4rem] border border-slate-200 bg-white',
  threadCard: 'grid grid-cols-[34px_minmax(0,1fr)_auto] gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50',
  avatar: 'flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f3d2e] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,61,46,0.18)]',
  threadName: 'text-xs font-semibold text-slate-900',
  threadTime: 'text-[11px] text-slate-500',
  threadSubject: 'my-1 text-[12px] font-medium text-slate-900',
  threadPreview: 'text-[11px] leading-5 text-slate-500',
  threadMeta: 'flex items-center gap-1.5 self-center',
  threadPill: 'inline-flex min-h-5 items-center rounded-full bg-[#cfe8d5] px-2 text-[10px] text-[#1f3d2e]',
  starBtn: 'inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.04)]',
  reader: 'flex min-h-0 flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)]',
  readerHero: 'flex items-start justify-between gap-3 border-b border-slate-200 pb-2',
  readerTitle: 'text-lg font-semibold tracking-[-0.03em] text-slate-900',
  readerSub: 'text-sm text-slate-500',
  summaryGrid: 'grid grid-cols-2 gap-2',
  cardBodyWrap: 'grid gap-1',
  cardLabel: 'text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400',
  cardValue: 'text-lg font-semibold text-slate-900',
  cardText: 'text-xs leading-5 text-slate-500',
  stack: 'grid gap-2',
  messageCard: 'rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]',
  messageMeta: 'mb-2 flex items-center justify-between gap-2 text-xs text-slate-500',
  messageTitle: 'font-semibold text-slate-900',
  attachmentGrid: 'grid grid-cols-1 gap-2 sm:grid-cols-2',
  attachmentCard: 'rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]',
  attachmentKind: 'text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400',
  replyBar: 'flex flex-wrap gap-1.5',
  empty: 'grid min-h-[280px] place-content-center rounded-[1.75rem] border border-slate-200 bg-white p-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.05)]',
  emptyTitle: 'text-lg font-semibold text-slate-900',
  emptyText: 'text-sm text-slate-500',
  composeOverlay: 'fixed inset-0 z-50 flex items-start justify-center bg-slate-950/35 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-4',
  composeShell: 'relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-[1660px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.18)]',
  composeStage: 'min-w-0 grid gap-3',
  composeHeader: 'flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.05)]',
  composeHeroCopy: 'grid gap-1.5',
  composeMetaRow: 'flex flex-wrap items-center gap-2',
  composeTitle: 'text-[1.75rem] font-semibold tracking-[-0.05em] text-slate-950',
  composeBody: 'max-w-2xl text-sm leading-6 text-slate-500',
  composeGrid: 'grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]',
  composeForm: 'grid gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)]',
  composeAside: 'grid gap-3',
  composeAsideCard: 'rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)]',
  composeAsideTitle: 'text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400',
  composeAsideValue: 'text-base font-semibold text-slate-900',
  composeAsideText: 'text-sm leading-6 text-slate-500',
  composeAsideList: 'grid gap-2 text-sm text-slate-600',
  composeAsideItem: 'flex items-start gap-2 rounded-2xl bg-white px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.04)]',
  composeBullet: 'mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1f3d2e]',
  field: 'grid gap-1.5',
  fieldLabel: 'text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400',
  input: 'h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1f3d2e] focus:ring-4 focus:ring-[#cfe8d5]',
  row: 'grid gap-2 md:grid-cols-2',
  tags: 'flex flex-wrap gap-1.5',
  editorWrap: 'grid gap-1.5',
  editorTop: 'flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2',
  editor: 'min-h-[260px] rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-900 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus:border-[#1f3d2e] focus:ring-4 focus:ring-[#cfe8d5]',
  footerTools: 'flex flex-wrap gap-1.5',
  loginCard: 'w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]',
  loginBrand: 'flex items-center gap-3',
  loginLogo: 'flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1f3d2e] text-white shadow-[0_16px_30px_rgba(31,61,46,0.18)]',
  loginText: 'grid gap-0.5',
  loginTitle: 'text-lg font-semibold text-slate-900',
  loginSub: 'text-sm text-slate-500',
  loginForm: 'mt-4 grid gap-3',
  loginRow: 'flex items-center justify-between gap-2',
  loginRemember: 'inline-flex items-center gap-2 text-sm text-slate-600',
  loginSubmit: 'inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[#1f3d2e] text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,61,46,0.28)] transition hover:bg-[#2f5d50]',
  passwordWrap: 'relative',
  passwordToggle: 'absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100',
  note: 'text-sm text-slate-500',
  error: 'text-sm text-rose-600',
};

const toneClasses = {
  rose: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
  blue: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  slate: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  amber: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  indigo: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200',
  emerald: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  cyan: 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200',
  violet: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
};

function fetchEmailJson(path, options = {}) {
  return fetch(`${MAIL_API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || payload?.message || 'Request failed');
    }
    return payload;
  });
}

function formatMailTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function decodeHtmlEntities(value) {
  if (!value) return '';
  const text = String(value);
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function normalizeWhitespacePreservingLines(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripHtml(value) {
  if (!value) return '';
  const text = htmlToReadableText(value);
  if (text) return text;
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function htmlToReadableText(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  if (looksLikeMailSource(raw)) {
    return cleanMailSourceText(raw);
  }

  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(raw, 'text/html');
      const bodyText = doc?.body?.innerText || doc?.body?.textContent || '';
      const normalized = normalizeWhitespacePreservingLines(decodeHtmlEntities(bodyText));
      if (normalized) {
        return normalized;
      }
    } catch (error) {
      // Fall through to string-based cleanup.
    }
  }

  let text = raw;
  text = text.replace(/<\s*style[\s\S]*?<\/\s*style\s*>/gi, '\n');
  text = text.replace(/<\s*script[\s\S]*?<\/\s*script\s*>/gi, '\n');
  text = text.replace(/<\s*br\s*\/?\s*>/gi, '\n');
  text = text.replace(/<\/\s*(p|div|li|tr|h[1-6]|section|article|header|footer|table|ul|ol)\s*>/gi, '\n');
  text = text.replace(/<\s*(li|tr|p|div|blockquote|section|article|header|footer)[^>]*>/gi, '\n');
  text = text.replace(/<\s*td[^>]*>/gi, ' ');
  text = text.replace(/<\s*th[^>]*>/gi, ' ');
  text = text.replace(/<[^>]*>/g, ' ');
  text = decodeHtmlEntities(text);
  return normalizeWhitespacePreservingLines(text);
}

function looksLikeMailSource(value) {
  const text = String(value || '').toLowerCase().trim();
  if (!text) return false;

  const checks = [
    '@font-face',
    'externalclass',
    'mso-',
    'content-type: text/html',
    '<!doctype',
    '<html',
    'blockquote, body, li, p, table, td',
    '#outlook a',
    '.readmsgbody',
  ];
  let score = 0;
  checks.forEach((needle) => {
    if (text.includes(needle)) {
      score += 1;
    }
  });

  if (text.includes('=20')) score += 1;
  if (text.includes('font-family:') && text.includes('url(')) score += 1;
  return score >= 2;
}

function scoreMailBodyCandidate(value) {
  const text = normalizeWhitespacePreservingLines(value || '');
  if (!text) return Number.NEGATIVE_INFINITY;
  if (looksLikeMailSource(text)) return -1000;

  const newlineCount = (text.match(/\n/g) || []).length;
  const paragraphCount = (text.match(/\n\n/g) || []).length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return paragraphCount * 12 + newlineCount * 4 + Math.min(wordCount, 300) * 0.15 + Math.min(text.length / 80, 20);
}

function normalizeMailBody(textValue, htmlValue, previewValue) {
  const text = normalizeWhitespacePreservingLines(textValue || '');
  const htmlText = htmlToReadableText(htmlValue || '');
  const preview = normalizeWhitespacePreservingLines(previewValue || '');

  const candidates = [text, htmlText, preview].filter(Boolean);
  if (!candidates.length) return '';

  const ranked = candidates
    .map((candidate) => ({ candidate, score: scoreMailBodyCandidate(candidate) }))
    .sort((left, right) => right.score - left.score);

  const bestCandidate = ranked[0]?.candidate || '';
  if (!bestCandidate) return '';

  if (looksLikeMailSource(bestCandidate)) {
    return cleanMailSourceText(bestCandidate);
  }

  return bestCandidate;
}

function formatMailBodyForDisplay(textValue, htmlValue, previewValue) {
  const normalized = normalizeMailBody(textValue, htmlValue, previewValue);
  if (!normalized) return 'No message body available.';

  return normalized
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanMailSourceText(value) {
  let text = String(value || '').trim();
  if (!text) return '';

  text = text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/@font-face\s*\{[\s\S]*?\}/gi, ' ')
    .replace(/@media\s+screen\s*\{[\s\S]*?\}/gi, ' ')
    .replace(/\.ExternalClass[\s\S]*?\}/gi, ' ')
    .replace(/#outlook a\s*\{[\s\S]*?\}/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/content-type:\s*text\/html/gi, ' ')
    .replace(/=([0-9a-f]{2})/gi, ' ');

  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const lower = line.toLowerCase();
      if (lower.startsWith('@')) return false;
      if (lower.startsWith('.externalclass')) return false;
      if (lower.startsWith('body {') || lower.startsWith('table {') || lower.startsWith('img {')) return false;
      if (lower.startsWith('#outlook')) return false;
      if (lower.includes('{') && lower.includes('}')) return false;
      return true;
    });

  return lines.length ? lines.join(' ') : text.replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pickThreadTone(index) {
  const tones = ['rose', 'indigo', 'emerald', 'cyan', 'amber', 'violet'];
  return tones[index % tones.length];
}

function Avatar({ label, tone }) {
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${toneClasses[tone] || toneClasses.slate}`}>
      {label}
    </div>
  );
}

function buildQuotedReplyHtml(message, prefix) {
  const sender = message?.from || 'Unknown sender';
  const subject = message?.subject || '(No subject)';
  const sourceText = normalizeMailBody(message?.text || '', message?.html || '', message?.preview || '');
  return `
    <p>Hi ${escapeHtml(sender)},</p>
    <p></p>
    <p>${escapeHtml(prefix)}: ${escapeHtml(subject)}</p>
    <blockquote style="margin:0;padding-left:12px;border-left:2px solid #dbe4ea;white-space:pre-wrap;">${escapeHtml(sourceText)}</blockquote>
  `;
}

export function EmailWorkspace() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const mailSSOToken = React.useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('mail_sso') || '';
  }, []);
  const [authState, setAuthState] = React.useState('loading');
  const [mailbox, setMailbox] = React.useState(null);
  const [folders, setFolders] = React.useState(EMPTY_FOLDERS);
  const [messages, setMessages] = React.useState([]);
  const [selectedMessage, setSelectedMessage] = React.useState(null);
  const [currentFolder, setCurrentFolder] = React.useState('Inbox');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeListFilter, setActiveListFilter] = React.useState('all');
  const [starredIds, setStarredIds] = React.useState(() => new Set());
  const [loginValues, setLoginValues] = React.useState({
    email: '',
    password: '',
  });
  const [loginError, setLoginError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isMailboxLoading, setIsMailboxLoading] = React.useState(true);
  const [mailError, setMailError] = React.useState('');
  const [mailNotice, setMailNotice] = React.useState('');
  const [lastArchivedMessageId, setLastArchivedMessageId] = React.useState('');
  const [composeState, setComposeState] = React.useState(null);

  React.useEffect(() => {
    let alive = true;

    async function bootstrap() {
      try {
        if (mailSSOToken) {
          if (typeof window !== 'undefined') {
            window.location.replace(`/api/email/sso?token=${encodeURIComponent(mailSSOToken)}`);
          }
          return;
        }

        if (pathname.startsWith('/compose') && typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/');
          setComposeState({
            mode: 'new',
            to: '',
            subject: '',
            html: DEFAULT_COMPOSE_HTML,
          });
        }

        const payload = await fetchEmailJson('/me', { method: 'GET' });
        if (!alive) return;
        setMailbox(payload.account || null);
        setFolders(payload.folders?.length ? payload.folders : EMPTY_FOLDERS);
        setAuthState('authenticated');
        setCurrentFolder('Inbox');
        setActiveListFilter('all');
        await loadFolder('Inbox', { silent: true, account: payload.account, aliveRef: { current: alive } });
      } catch (error) {
        if (!alive) return;
        setAuthState('unauthenticated');
        setMailbox(null);
        setFolders(EMPTY_FOLDERS);
        setMessages([]);
        setSelectedMessage(null);
        setIsMailboxLoading(false);
      }
    }

    bootstrap();

    return () => {
      alive = false;
    };
  }, [mailSSOToken]);

  async function loadFolder(folderName, options = {}) {
    const { silent = false } = options;
    if (!silent) {
      setIsMailboxLoading(true);
      setMailError('');
    }

    try {
      const payload = await fetchEmailJson(`/inbox?folder=${encodeURIComponent(folderName)}`, {
        method: 'GET',
      });
      setMailbox(payload.account || null);
      setFolders(payload.folders?.length ? payload.folders : EMPTY_FOLDERS);
      setMessages(payload.messages || []);
      setSelectedMessage(payload.selected || payload.messages?.[0] || null);
      setCurrentFolder(folderName);
      setActiveListFilter('all');
      setAuthState('authenticated');
    } catch (error) {
      if (!silent) {
        setMailError(error.message || 'Failed to load mailbox');
      }
    } finally {
      setIsMailboxLoading(false);
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setLoginError('');
    setMailError('');

    try {
      const payload = await fetchEmailJson('/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginValues.email,
          password: loginValues.password,
        }),
      });
      setMailbox(payload.account || null);
      setFolders(payload.folders?.length ? payload.folders : EMPTY_FOLDERS);
      setAuthState('authenticated');
      setCurrentFolder('Inbox');
      setActiveListFilter('all');
      await loadFolder('Inbox');
    } catch (error) {
      setLoginError(error.message || 'Email atau password salah.');
    }
  }

  async function handleLogout() {
    try {
      await fetchEmailJson('/logout', { method: 'POST' });
    } catch (error) {
      // ignore logout errors; the session should be treated as gone locally
    }
    setAuthState('unauthenticated');
    setMailbox(null);
    setFolders(EMPTY_FOLDERS);
    setMessages([]);
    setSelectedMessage(null);
    setActiveListFilter('all');
    setStarredIds(new Set());
    setIsMailboxLoading(false);
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
  }

  async function handleSelectThread(threadId) {
    if (!threadId || !mailbox) return;
    try {
      const detail = await fetchEmailJson(`/message?id=${encodeURIComponent(threadId)}`, {
        method: 'GET',
      });
      setSelectedMessage(detail);
    } catch (error) {
      setMailError(error.message || 'Failed to load message');
    }
  }

  async function handleFolderChange(folderName) {
    await loadFolder(folderName);
  }

  function toggleStar(messageId) {
    setStarredIds((current) => {
      const next = new Set(current);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }

  async function handleArchiveSelectedThread() {
    if (!activeMessage?.id) return;

    setMailError('');
    setMailNotice('');
    try {
      const result = await fetchEmailJson('/archive', {
        method: 'POST',
        body: JSON.stringify({
          id: activeMessage.id,
          action: 'archive',
        }),
      });
      setLastArchivedMessageId(result?.id || activeMessage.id);
      setMailNotice('Thread moved to Archive. You can undo this action.');
      await loadFolder('Archive');
    } catch (error) {
      setMailError(error.message || 'Failed to archive message');
    }
  }

  async function handleRestoreArchivedThread() {
    if (!lastArchivedMessageId) return;

    setMailError('');
    setMailNotice('');
    try {
      await fetchEmailJson('/archive', {
        method: 'POST',
        body: JSON.stringify({
          id: lastArchivedMessageId,
          action: 'restore',
        }),
      });
      setLastArchivedMessageId('');
      setMailNotice('Archive restored back to Inbox.');
      await loadFolder('Inbox');
    } catch (error) {
      setMailError(error.message || 'Failed to restore message');
    }
  }

  function openCompose(draft = {}) {
    setComposeState({
      mode: draft.mode || 'new',
      to: draft.to || '',
      subject: draft.subject || '',
      html: draft.html || DEFAULT_COMPOSE_HTML,
    });
  }

  function closeCompose() {
    setComposeState(null);
  }

  function handleReplySelectedThread() {
    if (!activeMessage) return;
    const html = buildQuotedReplyHtml(activeMessage, 'Reply');
    openCompose({
      to: activeMessage.from || '',
      subject: activeMessage.subject ? `Re: ${activeMessage.subject}` : 'Re:',
      html,
      mode: 'reply',
    });
  }

  function handleForwardSelectedThread() {
    if (!activeMessage) return;
    const html = buildQuotedReplyHtml(activeMessage, 'Forwarded message');
    openCompose({
      subject: activeMessage.subject ? `Fwd: ${activeMessage.subject}` : 'Fwd:',
      html,
      mode: 'forward',
    });
  }

  const visibleMessages = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let filtered = messages;

    if (activeListFilter === 'unread') {
      filtered = filtered.filter((message) => Boolean(message.unread));
    } else if (activeListFilter === 'starred') {
      filtered = filtered.filter((message) => starredIds.has(message.id) || message.folder === 'Starred');
    } else if (activeListFilter === 'attachments') {
      filtered = filtered.filter((message) => Array.isArray(message.attachments) && message.attachments.length > 0);
    }

    if (term) {
      filtered = filtered.filter((message) => {
        return [message.from, message.subject, message.preview, message.folder]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term));
      });
    }

    return filtered;
  }, [messages, searchTerm, activeListFilter, starredIds]);

  const activeMessage = selectedMessage || visibleMessages[0] || null;

  if (authState === 'loading') {
    return (
      <main className={tw.page}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8),transparent_18%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.55),transparent_14%)]" />
        <section className={tw.loginCard + ' relative mx-auto mt-[18vh]'}>
          <div className="flex items-center gap-3">
            <div className={tw.loginLogo} aria-hidden="true">
              D
            </div>
            <div className="grid gap-0.5">
              <strong className="text-sm font-semibold text-slate-900">Diworkin</strong>
              <span className="text-sm text-slate-500">Mail Client</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">Loading mailbox session...</p>
        </section>
      </main>
    );
  }

  if (authState !== 'authenticated') {
    return (
      <EmailLoginView
        loginValues={loginValues}
        setLoginValues={setLoginValues}
        loginError={loginError}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        onLogin={handleLoginSubmit}
      />
    );
  }

  return (
    <main className={tw.page}>
      <section className={tw.shell}>
        <header className={tw.topbar}>
          <div className={tw.brand}>
            <div className={tw.mark} aria-hidden="true">
              <FiMail />
            </div>
            <div>
              <span className={tw.kicker}>Diworkin Mail</span>
              <strong className={tw.brandTitle}>Inbox for {mailbox?.email || 'mail.diworkin.com'}</strong>
              <p className={tw.brandSub}>Native mail client connected to the mailbox service.</p>
            </div>
          </div>

          <label className={tw.search}>
            <FiSearch />
            <input
              type="search"
              placeholder="Search mail, attachments, contacts"
              className={tw.searchInput}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <div className={tw.topActions}>
            <a href="https://panel.diworkin.com" className={tw.pillBtn}>
              Open panel
            </a>
            <button type="button" className={tw.pillBtn} onClick={handleLogout}>
              <FiLogOut />
              Logout
            </button>
            <button type="button" className={tw.primaryBtn} onClick={() => openCompose()}>
              <FiPlus />
              Compose
            </button>
          </div>
        </header>

        <section className={tw.layout + ' flex-1'}>
          <aside className={tw.sidebar}>
            <div className={tw.profile}>
              <div className={tw.avatarRing}>
                <div className="text-sm font-semibold">{(mailbox?.email || 'DW').slice(0, 1).toUpperCase()}</div>
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-semibold text-slate-900">{mailbox?.email || 'johnwork@diworkin.com'}</strong>
                <p className="truncate text-xs text-slate-500">{mailbox?.domain || 'Mail workspace owner'}</p>
              </div>
            </div>

            <button type="button" className={tw.primaryBtn + ' w-full justify-center'} onClick={() => openCompose()}>
              <FiPlus />
              Compose mail
            </button>

            <div className={tw.sidebarStack}>
              <span className={tw.sideHeading}>Folders</span>
              <nav className={tw.folderList}>
                {folders.map((folder) => (
                  <button
                    key={folder.name}
                    type="button"
                    className={`${tw.folderItem} ${currentFolder === folder.name ? tw.folderItemActive : ''}`}
                    onClick={() => handleFolderChange(folder.name)}
                  >
                    <span className={tw.folderLeft}>
                      <span className={`${tw.folderIcon} ${folderDecorations[folder.name]?.badge || folderDecorations.default.badge}`}>
                        {React.createElement(folderDecorations[folder.name]?.icon || folderDecorations.default.icon, { className: 'h-4 w-4' })}
                      </span>
                      <span className="grid leading-tight">
                        <span className="font-medium">{folder.label}</span>
                        <span className="text-[11px] text-slate-400">{folder.unread_count ? `${folder.unread_count} unread` : 'No unread'}</span>
                      </span>
                    </span>
                    <span className={tw.folderCount}>{folder.count}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className={tw.sidebarStack}>
              <span className={tw.sideHeading}>Labels</span>
              <div className={tw.labelRow}>
                {labels.map((label) => (
                  <span key={label.label} className={`inline-flex rounded-full px-2 py-1 text-xs ${toneClasses[label.tone] || toneClasses.slate}`}>
                    {label.label}
                  </span>
                ))}
              </div>
            </div>

            <div className={tw.storage}>
              <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                <span>Mailbox usage</span>
                <strong className="text-slate-900">72%</strong>
              </div>
              <div className={tw.storageBar}>
                <span className={tw.storageFill} />
              </div>
              <p className="text-xs leading-5 text-slate-500">22.4 GB of 31 GB used for messages and attachments.</p>
              <button type="button" className={tw.storageAction}>
                <FiArchive />
                Upgrade plan
              </button>
            </div>
          </aside>

          <InboxView
            folders={folders}
            selectedThread={activeMessage}
            isLoading={isMailboxLoading}
            mailError={mailError}
            mailNotice={mailNotice}
            messages={visibleMessages}
            onSelectThread={handleSelectThread}
            currentFolder={currentFolder}
            activeListFilter={activeListFilter}
            setActiveListFilter={setActiveListFilter}
            starredIds={starredIds}
            toggleStar={toggleStar}
            onReplySelected={handleReplySelectedThread}
            onForwardSelected={handleForwardSelectedThread}
            onArchiveSelected={handleArchiveSelectedThread}
            onRestoreArchived={handleRestoreArchivedThread}
            canUndoArchive={Boolean(lastArchivedMessageId)}
          />
        </section>
      </section>

      {composeState ? (
        <ComposeOverlay
          account={mailbox}
          draft={composeState}
          onClose={closeCompose}
          onSend={async ({ to, cc, bcc, subject, html, text }) => {
            await fetchEmailJson('/send', {
              method: 'POST',
              body: JSON.stringify({ to, cc, bcc, subject, html, text }),
            });
            closeCompose();
          }}
          onSaveDraft={async ({ to, cc, bcc, subject, html, text }) => {
            await fetchEmailJson('/draft', {
              method: 'POST',
              body: JSON.stringify({ to, cc, bcc, subject, html, text }),
            });
          }}
        />
      ) : null}
    </main>
  );
}

function InboxView({
  folders,
  selectedThread,
  isLoading,
  mailError,
  mailNotice,
  messages,
  onSelectThread,
  currentFolder,
  activeListFilter,
  setActiveListFilter,
  starredIds,
  toggleStar,
  onReplySelected,
  onForwardSelected,
  onArchiveSelected,
  onRestoreArchived,
  canUndoArchive,
}) {
  const attachments = selectedThread?.attachments || [];
  const messageBody = formatMailBodyForDisplay(
    selectedThread?.text || '',
    selectedThread?.html || '',
    selectedThread?.preview || '',
  );
  const folderByName = React.useMemo(() => {
    return Object.fromEntries((folders || []).map((folder) => [folder.name, folder]));
  }, [folders]);
  const folderSnapshot = [
    { label: 'Inbox', value: folderByName.Inbox?.count || messages.length || 0, note: 'Active threads' },
    { label: 'Drafts', value: folderByName.Drafts?.count || 0, note: 'Saved drafts' },
    { label: 'Archive', value: folderByName.Archive?.count || 0, note: 'Stored threads' },
    { label: 'Usage', value: '72%', note: 'Mailbox capacity' },
  ];
  const summaryCards = [
    {
      label: 'Priority',
      value: selectedThread?.unread ? 'High' : 'Normal',
      body: selectedThread?.unread
        ? 'This thread is still unread and remains in the active folder.'
        : 'This thread has been read and is ready to archive.',
    },
    {
      label: 'Attachments',
      value: String(attachments.length),
      body: attachments.length
        ? 'Attachments are available directly from mailbox storage.'
        : 'No attachments are included in the selected thread.',
    },
  ];

  return (
    <>
      <section className={tw.list}>
        <header className={tw.listHeader}>
          <div>
            <span className={tw.kicker}>{currentFolder}</span>
            <h1 className={tw.listTitle}>
              {currentFolder} ({messages.length})
            </h1>
            <p className={tw.listDesc}>Native mailbox. All data is loaded directly from Maildir and the SMTP service.</p>
          </div>

          <div className={tw.toolbarGroup}>
            <button
              type="button"
              className={`${tw.chip} ${activeListFilter === 'all' ? tw.chipActive : ''}`}
              onClick={() => setActiveListFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`${tw.chip} ${activeListFilter === 'unread' ? tw.chipActive : ''}`}
              onClick={() => setActiveListFilter('unread')}
            >
              Unread
            </button>
            <button
              type="button"
              className={`${tw.chip} ${activeListFilter === 'starred' ? tw.chipActive : ''}`}
              onClick={() => setActiveListFilter('starred')}
            >
              Filter
            </button>
            <button
              type="button"
              className={`${tw.chip} ${activeListFilter === 'attachments' ? tw.chipActive : ''}`}
              onClick={() => setActiveListFilter('attachments')}
            >
              Import
            </button>
            <button type="button" className={tw.iconBtn}>
              <FiRefreshCw />
            </button>
            <button type="button" className={tw.iconBtn}>
              <FiSettings />
            </button>
          </div>
        </header>

        <div className={tw.strip} aria-label="Mailbox summary">
          {folderSnapshot.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 ? <span className={tw.stripDivider} aria-hidden="true" /> : null}
              <span className="inline-flex items-center gap-1.5">
                <strong className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</strong>
                <em className="text-xs font-semibold text-slate-900 not-italic">{item.value}</em>
                <small className="text-[11px] text-slate-400">{item.note}</small>
              </span>
            </React.Fragment>
          ))}
        </div>

        {mailError ? <p className={tw.error}>{mailError}</p> : null}
        {mailNotice ? <p className="text-sm text-emerald-700">{mailNotice}</p> : null}
        {isLoading ? <p className={tw.note}>Loading mailbox...</p> : null}
        {canUndoArchive ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <span>Thread moved to archive.</span>
            <button type="button" className={tw.chip} onClick={onRestoreArchived}>
              Undo archive
            </button>
          </div>
        ) : null}

        <div className={tw.threadList}>
          {messages.map((message, index) => (
            <article
              key={message.id}
              className={`grid cursor-pointer grid-cols-[34px_minmax(0,1fr)_auto] gap-2 border-b border-slate-100 px-3 py-2 transition hover:bg-slate-50 ${selectedThread?.id === message.id ? 'bg-slate-50' : ''}`}
              onClick={() => onSelectThread(message.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectThread(message.id);
                }
              }}
              >
              <Avatar label={(message.from || '?').slice(0, 1).toUpperCase()} tone={pickThreadTone(index)} />

              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <strong className="truncate text-xs font-semibold text-slate-900">{message.from || 'Unknown sender'}</strong>
                  <span className="shrink-0">{message.time || formatMailTime(message.timestamp)}</span>
                </div>
                <h2 className="mt-1 flex items-start gap-1.5 text-[12px] font-medium text-slate-900">
                  {message.unread ? <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden="true" /> : null}
                  {message.subject || '(No subject)'}
                </h2>
                <p className="mt-1 max-h-10 overflow-hidden text-[11px] leading-5 text-slate-500">{message.preview || 'No preview available.'}</p>
              </div>

              <div className="flex items-center gap-1.5 self-center">
                <span className={tw.threadPill}>{message.folder}</span>
                <button
                  type="button"
                  className={tw.starBtn}
                  aria-label={starredIds.has(message.id) ? 'Unmark as favorite' : 'Mark as favorite'}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleStar(message.id);
                  }}
                >
                  ☆
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <article className={tw.reader}>
        {selectedThread ? (
          <>
            <div className={tw.readerHero}>
              <div>
                <span className={tw.kicker}>Selected thread</span>
                <h2 className={tw.readerTitle}>{selectedThread.subject || '(No subject)'}</h2>
                <p className={tw.readerSub}>
                  {selectedThread.from || 'Unknown sender'} - {selectedThread.time || formatMailTime(selectedThread.timestamp)}
                </p>
              </div>

              <div className={tw.toolbarGroup}>
                <button type="button" className={tw.chip} onClick={onArchiveSelected}>
                  Archive
                </button>
                <button type="button" className={tw.chip} onClick={onReplySelected}>
                  Reply
                </button>
                <button type="button" className={tw.chip} onClick={onForwardSelected}>
                  Forward
                </button>
              </div>
            </div>

            <div className={tw.summaryGrid}>
              {summaryCards.map((item) => (
                <article key={item.label} className={tw.card}>
                  <div className={tw.cardBodyWrap}>
                    <span className={tw.cardLabel}>{item.label}</span>
                    <strong className={tw.cardValue}>{item.value}</strong>
                    <p className={tw.cardText}>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className={tw.stack}>
              <article className={tw.messageCard}>
                <div className={tw.messageMeta}>
                  <strong className={tw.messageTitle}>{selectedThread.from || 'Unknown sender'}</strong>
                  <span>
                    {selectedThread.folder || 'Inbox'} - {selectedThread.time || formatMailTime(selectedThread.timestamp)}
                  </span>
                </div>
                <div className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{messageBody}</div>
              </article>
              <article className={tw.messageCard + ' bg-slate-50'}>
                <div className={tw.messageMeta}>
                  <strong className={tw.messageTitle}>Diworkin Mail</strong>
                  <span>Native mailbox preview</span>
                </div>
                <p className="text-sm leading-6 text-slate-700">
                  This message was loaded from the live mailbox service. Reply and send now
                  use the same backend.
                </p>
              </article>
            </div>

            <div className={tw.attachmentGrid}>
              {attachments.length > 0 ? (
                attachments.map((attachment) => (
                  <article key={`${attachment.name}-${attachment.size}`} className={tw.attachmentCard}>
                    <div>
                      <span className={tw.attachmentKind}>{attachment.content_type || 'File'}</span>
                      <strong className="block text-sm font-semibold text-slate-900">{attachment.name}</strong>
                    </div>
                    <p className="text-xs text-slate-500">{attachment.size ? `${Math.round(attachment.size / 1024)} KB` : '0 KB'}</p>
                  </article>
                ))
              ) : (
                <article className={tw.attachmentCard}>
                  <div>
                    <span className={tw.attachmentKind}>NONE</span>
                    <strong className="block text-sm font-semibold text-slate-900">No attachments</strong>
                  </div>
                  <p className="text-xs text-slate-500">This mail does not include any attachments.</p>
                </article>
              )}
            </div>

            <div className={tw.replyBar}>
              {quickReplies.map((reply) => (
                <button key={reply} type="button" className={tw.chip} onClick={onReplySelected}>
                  {reply}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className={tw.empty}>
            <h2 className={tw.emptyTitle}>No message selected</h2>
            <p className={tw.emptyText}>{isLoading ? 'Loading mailbox...' : 'Select a thread to inspect the message.'}</p>
          </div>
        )}
      </article>
    </>
  );
}

function ComposeOverlay({ account, draft, onClose, onSend, onSaveDraft }) {
  const editorRef = React.useRef(null);
  const [formValues, setFormValues] = React.useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
  });
  const [isEditorEmpty, setIsEditorEmpty] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [composeStatus, setComposeStatus] = React.useState('');
  const [composeError, setComposeError] = React.useState('');

  React.useEffect(() => {
    const nextHtml = draft?.html || DEFAULT_COMPOSE_HTML;
    const nextSubject = draft?.subject || '';
    const nextTo = draft?.to || '';
    const nextMode = draft?.mode || '';

    setFormValues((current) => ({
      ...current,
      to: nextTo || current.to,
      subject: nextSubject || current.subject,
    }));
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = nextHtml;
    }
    setIsEditorEmpty(false);
    setComposeStatus(nextMode ? `${nextMode.charAt(0).toUpperCase() + nextMode.slice(1)} draft ready.` : '');
  }, [draft]);

  function runFormat(command, value = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function handleEditorInput(event) {
    setIsEditorEmpty(event.currentTarget.textContent.trim().length === 0);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setComposeError('');
    setIsSending(true);
    try {
      const html = editorRef.current?.innerHTML || '';
      const text = editorRef.current?.innerText || stripHtml(html);
      await onSend({
        ...formValues,
        html,
        text,
      });
      if (typeof window !== 'undefined') {
        window.location.assign('/');
      }
    } catch (error) {
      setComposeError(error.message || 'Failed to send mail');
    } finally {
      setIsSending(false);
    }
  }

  async function handleSaveDraft() {
    setComposeError('');
    setComposeStatus('');
    try {
      const html = editorRef.current?.innerHTML || '';
      const text = editorRef.current?.innerText || stripHtml(html);
      await onSaveDraft({
        ...formValues,
        html,
        text,
      });
      setComposeStatus('Draft saved to Drafts.');
    } catch (error) {
      setComposeError(error.message || 'Failed to save draft');
    }
  }

  return (
    <div
      className={tw.composeOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Compose mail"
      onClick={onClose}
    >
      <div className={tw.composeShell} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={tw.mark} aria-hidden="true">
              <FiMail />
            </div>
            <div className="grid gap-0.5">
              <span className={tw.kicker}>New message</span>
              <strong className="text-sm font-semibold text-slate-900">Compose mail</strong>
            </div>
          </div>
          <div className={tw.toolbarGroup}>
            <button type="button" onClick={onClose} className={tw.chip}>
              Close
            </button>
            <button type="button" className={tw.chip} onClick={handleSaveDraft}>
              Save draft
            </button>
            <button type="submit" form="compose-mail-form" className={tw.primaryBtn} disabled={isSending}>
              <FiSend />
              {isSending ? 'Sending...' : 'Send mail'}
            </button>
          </div>
        </div>

        <div className={tw.composeGrid + ' flex-1 overflow-auto p-4'}>
          <form id="compose-mail-form" className={tw.composeForm} onSubmit={handleSubmit}>
          <label className={tw.field}>
            <span className={tw.fieldLabel}>To</span>
            <input
              type="text"
              placeholder="design@startup.sg"
              className={tw.input}
              value={formValues.to}
              onChange={(event) => setFormValues((current) => ({ ...current, to: event.target.value }))}
            />
          </label>

          <div className={tw.row}>
            <label className={tw.field}>
              <span className={tw.fieldLabel}>Cc</span>
              <input
                type="text"
                placeholder="Add carbon copy"
                className={tw.input}
                value={formValues.cc}
                onChange={(event) => setFormValues((current) => ({ ...current, cc: event.target.value }))}
              />
            </label>
            <label className={tw.field}>
              <span className={tw.fieldLabel}>Bcc</span>
              <input
                type="text"
                placeholder="Hidden recipients"
                className={tw.input}
                value={formValues.bcc}
                onChange={(event) => setFormValues((current) => ({ ...current, bcc: event.target.value }))}
              />
            </label>
          </div>

          <label className={tw.field}>
            <span className={tw.fieldLabel}>Subject</span>
            <input
              type="text"
              placeholder="Proposal for UI/UX collaboration"
              className={tw.input}
              value={formValues.subject}
              onChange={(event) => setFormValues((current) => ({ ...current, subject: event.target.value }))}
            />
          </label>

          <div className={tw.tags}>
            {composeTags.map((tag) => (
              <span key={tag} className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {tag}
              </span>
            ))}
          </div>

          <div className={tw.editorWrap}>
            <div className={tw.editorTop}>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Message</span>
              <div className={tw.toolbarGroup}>
                <button type="button" className={tw.chip} onClick={() => runFormat('bold')}>
                  <FiBold />
                  Bold
                </button>
                <button type="button" className={tw.chip} onClick={() => runFormat('italic')}>
                  <FiItalic />
                  Italic
                </button>
                <button type="button" className={tw.chip} onClick={() => runFormat('underline')}>
                  <FiUnderline />
                  Underline
                </button>
                <button
                  type="button"
                  className={tw.chip}
                  onClick={() => runFormat('insertUnorderedList')}
                >
                  <FiList />
                  Bullets
                </button>
                <button
                  type="button"
                  className={tw.chip}
                  onClick={() => runFormat('insertOrderedList')}
                >
                  <FiList />
                  Numbered
                </button>
                <button type="button" className={tw.chip} onClick={() => runFormat('formatBlock', 'blockquote')}>
                  <FiMail />
                  Quote
                </button>
                <button
                  type="button"
                  className={tw.chip}
                  onClick={() => {
                    const url = window.prompt('Paste link URL');
                    if (url) {
                      runFormat('createLink', url);
                    }
                  }}
                >
                  <FiLink />
                  Link
                </button>
              </div>
            </div>

            <div
              ref={editorRef}
              className={`${tw.editor} ${isEditorEmpty ? 'text-slate-400' : ''}`}
              contentEditable
              role="textbox"
              aria-multiline="true"
              suppressContentEditableWarning
              onInput={handleEditorInput}
              data-placeholder="Write your message here..."
            />
          </div>

          <div className={tw.footerTools}>
            <button type="button" className={tw.chip}>
              <FiArchive />
              Attach files
            </button>
            <button type="button" className={tw.chip}>
              <FiSettings />
              Insert template
            </button>
            <button type="button" className={tw.chip}>
              <FiMail />
              Add signature
            </button>
            <button type="button" className={tw.chip}>
              <FiRefreshCw />
              Schedule send
            </button>
          </div>
            {composeError ? <p className={tw.error}>{composeError}</p> : null}
            {composeStatus ? <p className="text-sm text-emerald-700">{composeStatus}</p> : null}
          </form>

          <aside className={tw.composeAside}>
            <article className={tw.composeAsideCard}>
              <span className={tw.composeAsideTitle}>Mailbox</span>
              <div className="mt-2 grid gap-1.5">
                <strong className={tw.composeAsideValue}>{account?.email || 'mailbox account'}</strong>
                <p className={tw.composeAsideText}>Connected to the live mailbox backend and ready to send immediately.</p>
              </div>
            </article>

            <article className={tw.composeAsideCard}>
              <span className={tw.composeAsideTitle}>Compose tips</span>
              <div className={tw.composeAsideList + ' mt-3'}>
                <div className={tw.composeAsideItem}>
                  <span className={tw.composeBullet} />
                  <p>Keep the subject short and specific.</p>
                </div>
                <div className={tw.composeAsideItem}>
                  <span className={tw.composeBullet} />
                  <p>Save drafts from the top bar when you need to pause.</p>
                </div>
                <div className={tw.composeAsideItem}>
                  <span className={tw.composeBullet} />
                  <p>Use formatting sparingly for a cleaner first read.</p>
                </div>
              </div>
            </article>

            <article className={tw.composeAsideCard}>
              <span className={tw.composeAsideTitle}>Shortcuts</span>
              <div className="mt-3 grid gap-2 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                  <span>Ctrl + Enter</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">send</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                  <span>Ctrl + S</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">save draft</span>
                </div>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </div>
  );
}

function EmailLoginView({ loginValues, setLoginValues, loginError, showPassword, setShowPassword, onLogin }) {
  return (
    <main className={tw.page}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8),transparent_18%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.55),transparent_14%)]" />

      <section className={tw.loginCard + ' relative mx-auto mt-[16vh]'}>
        <div className="flex items-center gap-3">
          <div className={tw.loginLogo} aria-hidden="true">
            D
          </div>
          <div className="grid gap-0.5">
            <strong className="text-sm font-semibold text-slate-900">Diworkin</strong>
            <span className="text-sm text-slate-500">Mail Client</span>
          </div>
        </div>

        <form className="mt-4 grid gap-3" onSubmit={onLogin}>
          <label className={tw.field}>
            <span>Email Address</span>
            <input
              type="email"
              autoComplete="username"
              className={tw.input}
              value={loginValues.email}
              onChange={(event) =>
                setLoginValues((current) => ({ ...current, email: event.target.value }))
              }
            />
          </label>
          <label className={tw.field}>
            <span>Password</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={tw.input + ' pr-11'}
                value={loginValues.password}
                onChange={(event) =>
                  setLoginValues((current) => ({ ...current, password: event.target.value }))
                }
              />
              <button
                type="button"
                className={tw.passwordToggle}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </label>

          {loginError ? <p className={tw.error}>{loginError}</p> : null}

          <div className={tw.loginRow}>
            <label className={tw.loginRemember}>
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
          </div>

          <div>
            <button type="submit" className={tw.loginSubmit}>
              Continue →
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
