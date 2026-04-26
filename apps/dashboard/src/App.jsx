import React, { useRef, useState } from 'react';
import {
  FiActivity,
  FiBell,
  FiArchive,
  FiCopy,
  FiArrowDown,
  FiArrowUp,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiDatabase,
  FiDownload,
  FiCheckCircle,
  FiEdit2,
  FiFile,
  FiFolder,
  FiGlobe,
  FiGrid,
  FiExternalLink,
  FiLink,
  FiHash,
  FiPackage,
  FiLogOut,
  FiMail,
  FiMenu,
  FiMove,
  FiMoreHorizontal,
  FiMessageCircle,
  FiShare2,
  FiPlay,
  FiKey,
  FiSearch,
  FiSettings,
  FiShield,
  FiServer,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiTool,
  FiTerminal,
  FiUpload,
  FiTrash2,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { AiOutlineDatabase } from 'react-icons/ai';
import { TbListDetails } from 'react-icons/tb';
import { ImSwitch } from 'react-icons/im';
import { LuSwitchCamera } from 'react-icons/lu';
import { EmailWorkspace } from './EmailWorkspace';
import { SupportInbox } from './SupportInbox';

const FALLBACK_METRICS = {
  cpu: 32,
  ram: 58,
  disk: 71,
  networkRxBytes: 8840000000,
  networkTxBytes: 5620000000,
};

const EMAIL_HOSTS = new Set(['email.diworkin.com', 'mail.diworkin.com', 'webmail.diworkin.com']);

function clampPercent(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeMetrics(payload) {
  return {
    cpu: clampPercent(
      payload?.cpu ?? payload?.cpuUsage ?? payload?.cpu_percent ?? payload?.cpuPercent,
      FALLBACK_METRICS.cpu,
    ),
    ram: clampPercent(
      payload?.ram ?? payload?.ramUsage ?? payload?.memory_percent ?? payload?.memoryPercent,
      FALLBACK_METRICS.ram,
    ),
    disk: clampPercent(
      payload?.disk ?? payload?.diskUsage ?? payload?.disk_percent ?? payload?.diskPercent,
      FALLBACK_METRICS.disk,
    ),
    networkRxBytes: Number(payload?.network_rx_bytes ?? payload?.networkRxBytes ?? payload?.networkRx ?? 0) || 0,
    networkTxBytes: Number(payload?.network_tx_bytes ?? payload?.networkTxBytes ?? payload?.networkTx ?? 0) || 0,
  };
}

function createDemoTrafficHistory() {
  const now = Date.now();
  const samples = [
    { rx: 8_840_000_000, tx: 5_620_000_000 },
    { rx: 8_843_300_000, tx: 5_622_100_000 },
    { rx: 8_846_000_000, tx: 5_624_800_000 },
    { rx: 8_850_900_000, tx: 5_627_700_000 },
    { rx: 8_854_600_000, tx: 5_629_900_000 },
    { rx: 8_857_200_000, tx: 5_632_000_000 },
    { rx: 8_860_800_000, tx: 5_634_600_000 },
    { rx: 8_864_500_000, tx: 5_637_200_000 },
  ];

  return samples.map((sample, index) => ({
    at: now - (samples.length - 1 - index) * 60000,
    rx: sample.rx,
    tx: sample.tx,
    source: 'demo',
  }));
}

function formatRate(bytesPerSecond) {
  const value = Number(bytesPerSecond);
  if (!Number.isFinite(value) || value < 0) {
    return '-';
  }

  if (value < 1024) {
    return `${Math.round(value)} B/s`;
  }

  const units = ['KB/s', 'MB/s', 'GB/s'];
  let rate = value / 1024;
  let unitIndex = 0;
  while (rate >= 1024 && unitIndex < units.length - 1) {
    rate /= 1024;
    unitIndex += 1;
  }
  return `${rate.toFixed(rate >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatTrafficBytes(bytes) {
  return formatBytes(bytes);
}

function buildTrafficSeries(history) {
  if (!Array.isArray(history) || history.length < 2) {
    return [];
  }

  const points = [];
  for (let index = 1; index < history.length; index += 1) {
    const prev = history[index - 1];
    const current = history[index];
    const elapsedSeconds = Math.max((current.at - prev.at) / 1000, 1);
    points.push({
      at: current.at,
      rxRate: Math.max(0, (current.rx - prev.rx) / elapsedSeconds),
      txRate: Math.max(0, (current.tx - prev.tx) / elapsedSeconds),
    });
  }
  return points;
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) {
    return '-';
  }

  if (value < 1024) {
    return `${value} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatRupiahAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return '0';
  }

  return new Intl.NumberFormat('id-ID').format(Math.round(amount));
}

function formatPackageBillingCycle(cycle) {
  switch (String(cycle || '').toLowerCase()) {
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'yearly':
      return 'Yearly';
    case 'lifetime':
      return 'Lifetime';
    default:
      return 'Custom';
  }
}

function toDateTimeLocalValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function packageFeatureLabels(item) {
  return [
    item?.feature_ssl ? 'SSL' : null,
    item?.feature_backup ? 'Backup' : null,
    item?.feature_ssh ? 'SSH' : null,
    item?.feature_file_manager ? 'Files' : null,
    item?.feature_studio ? 'Studio' : null,
    item?.feature_auto_installer ? 'Installer' : null,
    item?.feature_dns ? 'DNS' : null,
    item?.feature_mail ? 'Mail' : null,
    item?.feature_priority_support ? 'Priority Support' : null,
  ].filter(Boolean);
}

function formatBillingStatus(status) {
  switch (String(status || '').toLowerCase()) {
    case 'draft':
      return 'Draft';
    case 'pending':
      return 'Pending';
    case 'sent':
      return 'Sent';
    case 'paid':
      return 'Paid';
    case 'overdue':
      return 'Overdue';
    case 'canceled':
      return 'Canceled';
    default:
      return status || 'Unknown';
  }
}

function billingStatusClasses(status) {
  switch (String(status || '').toLowerCase()) {
    case 'draft':
      return 'bg-slate-100 text-slate-600';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    case 'sent':
      return 'bg-sky-100 text-sky-700';
    case 'paid':
      return 'bg-emerald-100 text-emerald-700';
    case 'overdue':
      return 'bg-rose-100 text-rose-700';
    case 'canceled':
      return 'bg-stone-100 text-stone-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function formatLicenseStatus(status) {
  switch (String(status || '').toLowerCase()) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'suspended':
      return 'Suspended';
    case 'expired':
      return 'Expired';
    case 'revoked':
      return 'Revoked';
    case 'draft':
      return 'Draft';
    default:
      return status || 'Unknown';
  }
}

function licenseStatusClasses(status) {
  switch (String(status || '').toLowerCase()) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700';
    case 'inactive':
      return 'bg-slate-100 text-slate-600';
    case 'suspended':
      return 'bg-amber-100 text-amber-700';
    case 'expired':
      return 'bg-rose-100 text-rose-700';
    case 'revoked':
      return 'bg-stone-100 text-stone-600';
    case 'draft':
      return 'bg-sky-100 text-sky-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function formatAffiliateCommissionStatus(status) {
  switch (String(status || '').toLowerCase()) {
    case 'paid':
      return 'Paid';
    case 'approved':
      return 'Approved';
    case 'pending':
      return 'Pending';
    case 'draft':
      return 'Draft';
    case 'canceled':
      return 'Canceled';
    default:
      return status || 'Unknown';
  }
}

function affiliateCommissionStatusClasses(status) {
  switch (String(status || '').toLowerCase()) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-700';
    case 'approved':
      return 'bg-sky-100 text-sky-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    case 'draft':
      return 'bg-slate-100 text-slate-600';
    case 'canceled':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function formatAffiliateMonthLabel(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown month';
  }

  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function buildAffiliateMonthlyReport(commissions) {
  const groups = new Map();

  (Array.isArray(commissions) ? commissions : []).forEach((item) => {
    const createdAt = new Date(item?.created_at || item?.updated_at || Date.now());
    if (Number.isNaN(createdAt.getTime())) {
      return;
    }

    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
    const current = groups.get(key) || {
      key,
      label: formatAffiliateMonthLabel(createdAt),
      commission_rupiah: 0,
      amount_rupiah: 0,
      count: 0,
      paid_count: 0,
      pending_count: 0,
    };

    const commissionValue = Number(item?.commission_rupiah || 0);
    const amountValue = Number(item?.amount_rupiah || 0);
    current.commission_rupiah += commissionValue;
    current.amount_rupiah += amountValue;
    current.count += 1;

    const status = String(item?.status || '').toLowerCase();
    if (status === 'paid' || status === 'approved') {
      current.paid_count += 1;
    } else {
      current.pending_count += 1;
    }

    groups.set(key, current);
  });

  return [...groups.values()].sort((left, right) => right.key.localeCompare(left.key));
}

function buildAffiliateLeaderboard(affiliates) {
  return [...(Array.isArray(affiliates) ? affiliates : [])]
    .sort((left, right) => {
      const leftCommission = Number(left?.total_commission_rupiah || 0);
      const rightCommission = Number(right?.total_commission_rupiah || 0);
      if (rightCommission !== leftCommission) {
        return rightCommission - leftCommission;
      }

      const leftSignup = Number(left?.referred_signups || 0);
      const rightSignup = Number(right?.referred_signups || 0);
      if (rightSignup !== leftSignup) {
        return rightSignup - leftSignup;
      }

      return String(left?.owner_email || '').localeCompare(String(right?.owner_email || ''));
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

function buildAffiliateCampaignData(affiliate, campaignName, monthlyReport) {
  if (!affiliate) {
    return null;
  }

  const referralURL = affiliate.referral_url || '';
  if (!referralURL) {
    return null;
  }

  const latestMonth = Array.isArray(monthlyReport) ? monthlyReport[0] : null;
  const slug = String(campaignName || latestMonth?.label || 'affiliate-campaign')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'affiliate-campaign';

  let campaignLink = referralURL;
  try {
    const url = new URL(referralURL, 'https://panel.diworkin.com');
    url.searchParams.set('utm_source', 'affiliate');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', slug);
    if (affiliate.coupon_code) {
      url.searchParams.set('coupon', affiliate.coupon_code);
    }
    campaignLink = url.toString();
  } catch (error) {
    const separator = referralURL.includes('?') ? '&' : '?';
    const extra = new URLSearchParams({
      utm_source: 'affiliate',
      utm_medium: 'referral',
      utm_campaign: slug,
    });
    if (affiliate.coupon_code) {
      extra.set('coupon', affiliate.coupon_code);
    }
    campaignLink = `${referralURL}${separator}${extra.toString()}`;
  }

  const title = campaignName || `Promo ${latestMonth?.label || 'Affiliate'}`;
  const referralCode = affiliate.referral_code || '-';
  const couponCode = affiliate.coupon_code || '-';
  const ownerName = affiliate.owner_name || affiliate.owner_email || 'Affiliate partner';
  const caption = [
    `${title} by ${ownerName}`,
    `Referral: ${referralCode}`,
    `Coupon: ${couponCode}`,
    `Sign up with this link: ${campaignLink}`,
  ].join('\n');

  return {
    title,
    slug,
    link: campaignLink,
    caption,
    latestMonth,
  };
}

function downloadTextFile(filename, content, mime = 'text/plain;charset=utf-8;') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildAffiliateLedgerCsv(commissions) {
  const header = ['created_at', 'owner_email', 'owner_name', 'source_email', 'invoice_number', 'amount_rupiah', 'commission_rupiah', 'status', 'notes'];
  const rows = [header.join(',')];

  (Array.isArray(commissions) ? commissions : []).forEach((item) => {
    const columns = [
      item?.created_at || '',
      item?.owner_email || '',
      item?.owner_name || '',
      item?.source_email || '',
      item?.source_invoice_number || '',
      String(item?.amount_rupiah || 0),
      String(item?.commission_rupiah || 0),
      item?.status || '',
      item?.notes || '',
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`);
    rows.push(columns.join(','));
  });

  return rows.join('\n');
}

function formatStudioValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function detectFileLanguage(name) {
  const extension = String(name || '')
    .toLowerCase()
    .split('.')
    .pop();

  switch (extension) {
    case 'html':
    case 'htm':
    case 'xml':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'php':
      return 'php';
    default:
      return 'text';
  }
}

function highlightCodeLine(line, language) {
  const escaped = escapeHtml(line);

  if (language === 'html') {
    return escaped
      .replace(/(&lt;\/?)([a-zA-Z0-9-]+)/g, '$1<span class="text-sky-600">$2</span>')
      .replace(/(\s+[a-zA-Z-:]+)=(&quot;.*?&quot;)/g, '$1<span class="text-emerald-600">=$2</span>')
      .replace(/(&quot;.*?&quot;)/g, '<span class="text-amber-600">$1</span>');
  }

  if (language === 'javascript' || language === 'json') {
    return escaped
      .replace(/(&quot;.*?&quot;)/g, '<span class="text-emerald-600">$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|switch|case|break|true|false|null|undefined|new|class|async|await|try|catch|throw|import|from|export|default)\b/g, '<span class="text-sky-600 font-semibold">$1</span>')
      .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-amber-600">$1</span>')
      .replace(/(\/\/.*$)/g, '<span class="text-slate-400">$1</span>');
  }

  if (language === 'css') {
    return escaped
      .replace(/([.#]?[a-zA-Z0-9_-]+)\s*\{/g, '<span class="text-sky-600">$1</span> {')
      .replace(/([a-z-]+)\s*:/g, '<span class="text-emerald-600">$1</span>:')
      .replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g, '<span class="text-amber-600">$1</span>');
  }

  return escaped;
}

function CodePreview({ content, language }) {
  const lines = String(content || '').split('\n');

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        Preview
      </div>
      <div className="max-h-[420px] overflow-auto">
        <pre className="min-w-full p-4 text-sm leading-6">
          {lines.map((line, index) => (
            <div key={`${language}-${index}`} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4">
              <span className="select-none text-right text-slate-500">{index + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: highlightCodeLine(line, language) || '&nbsp;' }} />
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />;
}

function TableSkeletonRows({ columns = 4, rows = 4, widths = [] }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
      {Array.from({ length: columns }).map((__, columnIndex) => (
        <td key={`skeleton-cell-${rowIndex}-${columnIndex}`} className="px-5 py-4">
          <SkeletonBlock className={`h-4 ${widths[columnIndex] || 'w-24'}`} />
        </td>
      ))}
    </tr>
  ));
}

function CardSkeleton({ rows = 3, width = 'w-full' }) {
  return (
    <div className={`animate-pulse rounded-[1.8rem] border border-slate-200 bg-white p-5 ${width}`}>
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-7 w-52" />
        <SkeletonBlock className="h-4 w-3/4" />
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonBlock key={`card-skel-${index}`} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

function FormSkeleton({ fields = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={`form-skel-${index}`} className="space-y-2">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

function getSubdomainInstallSteps(appType) {
  const normalized = String(appType || 'plain').toLowerCase();

  switch (normalized) {
    case 'wordpress':
      return [
        'Validate domain and owner',
        'Prepare MariaDB database',
        'Download WordPress starter',
        'Write wp-config settings',
        'Create DNS and Nginx site',
        'Finalize installer',
      ];
    case 'codeigniter':
      return [
        'Validate domain and owner',
        'Prepare MariaDB database',
        'Download CodeIgniter starter',
        'Write configuration files',
        'Create DNS and Nginx site',
        'Finalize installer',
      ];
    case 'laravel':
      return [
        'Validate domain and owner',
        'Prepare MariaDB database',
        'Download Laravel starter',
        'Generate application key',
        'Create DNS and Nginx site',
        'Finalize installer',
      ];
    default:
      return [
        'Validate domain and owner',
        'Create folder public subdomain',
        'Create DNS and Nginx site',
        'Finalize installer',
      ];
  }
}

function getSiteInstallSteps(targetKind, appType) {
  const normalizedTarget = String(targetKind || 'subdomain').toLowerCase();
  if (normalizedTarget !== 'domain') {
    return getSubdomainInstallSteps(appType);
  }

  const normalizedApp = String(appType || 'plain').toLowerCase();

  switch (normalizedApp) {
    case 'wordpress':
      return [
        'Validate domain and owner',
        'Prepare MariaDB database',
        'Prepare domain public folder',
        'Download WordPress starter',
        'Issue SSL and redirect to HTTPS',
        'Finalize installer',
      ];
    case 'codeigniter':
      return [
        'Validate domain and owner',
        'Prepare MariaDB database',
        'Prepare domain public folder',
        'Download CodeIgniter starter',
        'Issue SSL and redirect to HTTPS',
        'Finalize installer',
      ];
    case 'laravel':
      return [
        'Validate domain and owner',
        'Prepare MariaDB database',
        'Prepare domain public folder',
        'Download Laravel starter',
        'Issue SSL and redirect to HTTPS',
        'Finalize installer',
      ];
    default:
      return [
        'Validate domain and owner',
        'Prepare domain public folder',
        'Issue SSL and redirect to HTTPS',
        'Finalize installer',
      ];
  }
}

function getInitials(name, fallback = 'DW') {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return fallback;
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function useAuthSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let alive = true;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const payload = await response.json();
          if (alive) {
            setSession(payload?.user ? payload.user : null);
          }
        }
      } catch (error) {
        if (alive) {
          setSession(null);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      alive = false;
    };
  }, []);

  const submitAuth = React.useCallback(async (endpoint, payload, options = {}) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || 'Request failed');
    }

    if (options.setSession !== false) {
      setSession(data?.user ?? null);
    }

    return data ?? null;
  }, []);

  const signIn = React.useCallback(
    async ({ email, password }) => submitAuth('/api/auth/login', { email, password }),
    [submitAuth],
  );

  const signUp = React.useCallback(
    async ({ name, company, email, password, referralCode, couponCode }) =>
      submitAuth(
        '/api/auth/register',
        { name, company, email, password, referralCode, couponCode },
        { setSession: false },
      ),
    [submitAuth],
  );

  const signOut = React.useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });
    } catch (error) {
      // Ignore logout network failures; clear local state either way.
    } finally {
      setSession(null);
    }
  }, []);

  return { session, loading, signIn, signUp, signOut };
}

function LogoMark({ compact = false }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'justify-center' : ''}`}>
      <div className={`overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)] ${compact ? 'h-11 w-11' : 'h-12 w-12'}`}>
        <img
          src="/diworkin-mark-dark.png"
          alt="Diworkin"
          className="h-full w-full object-contain"
        />
      </div>
      {!compact && (
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-950">Diworkin</p>
          <p className="text-sm text-slate-500">Hosting control panel</p>
        </div>
      )}
    </div>
  );
}

function Icon({ name, className = 'h-5 w-5' }) {
  const icons = {
    dashboard: FiGrid,
    domains: FiGlobe,
    email: FiMail,
    support: FiMessageCircle,
    dns: FiHash,
    database: FiDatabase,
    package: FiPackage,
    billing: FiCreditCard,
    license: FiShield,
    affiliate: FiShare2,
    studio: AiOutlineDatabase,
    backup: FiArchive,
    archive: FiArchive,
    folder: FiFolder,
    file: FiFile,
    ftp: FiServer,
    ssl: FiShield,
    accounts: FiUsers,
    users: FiUsers,
    settings: FiSettings,
    ssh: FiKey,
    shell: FiTerminal,
    search: FiSearch,
    bell: FiBell,
    menu: FiMenu,
    chevron: FiChevronRight,
    chevronLeft: FiChevronLeft,
    profile: FiUser,
    logout: FiLogOut,
    download: FiDownload,
    refresh: FiRefreshCw,
    save: FiSave,
    repair: FiTool,
    external: FiExternalLink,
    upload: FiUpload,
    plus: FiPlus,
    copy: FiCopy,
    move: FiMove,
    edit: FiEdit2,
    more: FiMoreHorizontal,
    play: FiPlay,
    trash: FiTrash2,
    details: TbListDetails,
    switch: ImSwitch,
    switchCamera: LuSwitchCamera,
  };

  const IconComponent = icons[name] || FiGrid;
  return <IconComponent className={className} />;
}

function ToolbarIconButton({ title, onClick, disabled, children, className = '', type = 'button', tone = 'dark', style }) {
  const toneClasses = {
    dark: 'border-[#1f3d2e] bg-[#1f3d2e] text-white hover:bg-[#2f5d50]',
    primary: 'border-[#1f3d2e] bg-[#1f3d2e] text-white hover:bg-[#2f5d50]',
    default: 'border-[#1f3d2e] bg-[#1f3d2e] text-white hover:bg-[#2f5d50]',
    danger: 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100',
    sky: 'border-[#a9c88a] bg-[#cfe8d5] text-[#1f3d2e] hover:bg-[#a9c88a]',
  };

  const iconToneClasses = {
    dark: 'bg-white/10 text-white',
    primary: 'bg-white/10 text-white',
    default: 'bg-white/10 text-white',
    danger: 'bg-white/70 text-rose-600',
    sky: 'bg-white/70 text-[#1f3d2e]',
  };

  const toneInlineStyles = {
    dark: { backgroundColor: '#1f3d2e', color: '#ffffff' },
    primary: { backgroundColor: '#1f3d2e', color: '#ffffff' },
    default: { backgroundColor: '#1f3d2e', color: '#ffffff' },
    danger: { backgroundColor: '#fef2f2', color: '#e11d48' },
    sky: { backgroundColor: '#cfe8d5', color: '#1f3d2e' },
  };

  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      style={{ ...toneInlineStyles[tone], ...style }}
      className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold tracking-tight transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClasses[tone] || toneClasses.dark} ${className}`}
    >
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-xl ${iconToneClasses[tone] || iconToneClasses.default}`}>
        {children}
      </span>
      <span className="whitespace-nowrap">{title}</span>
    </button>
  );
}

function SidebarItem({ icon, label, active, collapsed, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
        active
          ? 'bg-[#1f3d2e] text-white shadow-[0_14px_30px_rgba(31,61,46,0.22)]'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
      } ${collapsed ? 'justify-center px-0' : ''}`}
      title={collapsed ? label : undefined}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${active ? 'bg-white/10' : 'bg-slate-50'}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}

function StatCard({ title, value, detail, icon, iconTone = 'bg-slate-50 text-slate-700' }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      {icon ? (
        <div className={`absolute right-4 top-4 grid h-14 w-14 place-items-center rounded-[1.15rem] ${iconTone}`}>
          {icon}
        </div>
      ) : null}
      <div className="max-w-[calc(100%-5rem)]">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="mt-2 text-sm text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function GaugeCard({ label, value, detail, percent, accent }) {
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}%</p>
          <p className="mt-2 text-sm text-slate-400">{detail}</p>
        </div>

        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-slate-100"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke={accent}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="rounded-full border border-slate-100 bg-white px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <span className="text-sm font-semibold text-slate-900">{value}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertCard({ title, description, tone = 'amber', icon, actionLabel, onAction }) {
  const tones = {
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    sky: 'border-sky-100 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  };

  return (
    <div className={`rounded-[1.5rem] border p-4 ${tones[tone] || tones.amber}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] bg-white/80 text-slate-950 shadow-sm">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Icon name="chevron" className="h-3.5 w-3.5 rotate-180" />
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatRelativeDate(dateString) {
  const value = new Date(dateString);
  if (Number.isNaN(value.getTime())) {
    return '';
  }
  const diff = value.getTime() - Date.now();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`;
  const past = Math.abs(days);
  return `${past} day${past === 1 ? '' : 's'} ago`;
}

function TrafficCard({ title, rxRate, txRate, rxBytes, txBytes, points, source }) {
  const safePoints = (points && points.length > 0 ? points : [{ rxRate: 0, txRate: 0, at: Date.now() }]).slice(-16);
  const values = safePoints.flatMap((item) => [item.rxRate, item.txRate]);
  const maxValue = Math.max(...values, rxRate, txRate, 1);
  const chartHeight = 240;
  const halfHeight = Math.round(chartHeight / 2);
  const plotHeight = halfHeight - 28;
  const columns = safePoints.length;
  const labelIndices = new Set([0, Math.floor(columns / 3), Math.floor((columns * 2) / 3), columns - 1]);
  const formatAxis = (bytesPerSecond) => {
    if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
      return '0';
    }
    return formatRate(bytesPerSecond);
  };

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[1rem] bg-[#1f3d2e] text-white">
              <FiActivity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-950">Live network traffic</p>
              <p className="text-sm text-slate-500">
                {source === 'live' ? 'Sampling inbound and outbound bytes from the server.' : 'Demo traffic shown until live samples arrive.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid min-w-[220px] grid-cols-2 gap-3">
          <div className="rounded-[1.2rem] bg-[#f3e8d5] px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1f3d2e]">
              <FiArrowDown className="h-4 w-4" />
              Inbound
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-950">{formatRate(rxRate)}</p>
            <p className="text-xs text-slate-500">{formatTrafficBytes(rxBytes)} total</p>
          </div>
          <div className="rounded-[1.2rem] bg-[#cfe8d5] px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1f3d2e]">
              <FiArrowUp className="h-4 w-4" />
              Outbound
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-950">{formatRate(txRate)}</p>
            <p className="text-xs text-slate-500">{formatTrafficBytes(txBytes)} total</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FiArrowUp className="h-4 w-4 text-[#1f3d2e]" />
            <FiArrowDown className="h-4 w-4 text-[#4f8f6c]" />
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1f3d2e]" />
              Inbound
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4f8f6c]" />
              Outbound
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div
            className="grid items-end gap-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              height: `${chartHeight}px`,
            }}
          >
            {safePoints.map((point, index) => {
              const inboundHeight = Math.max(6, Math.round((point.rxRate / maxValue) * plotHeight));
              const outboundHeight = Math.max(6, Math.round((point.txRate / maxValue) * plotHeight));
              const showLabel = labelIndices.has(index);
              const label = new Date(point.at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div key={`${point.at}-${index}`} className="flex h-full flex-col items-center justify-between">
                  <div className="flex h-1/2 w-full items-end justify-center">
                    <div
                      className="w-[68%] rounded-t-[0.9rem] bg-[#1f3d2e] shadow-[0_8px_18px_rgba(31,61,46,0.18)]"
                      style={{ height: `${inboundHeight}px` }}
                      title={`Inbound ${formatRate(point.rxRate)}`}
                    />
                  </div>

                  <div className="relative h-px w-full bg-slate-200">
                    <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-slate-300" />
                  </div>

                  <div className="flex h-1/2 w-full items-start justify-center">
                    <div
                      className="w-[68%] rounded-b-[0.9rem] bg-[#4f8f6c] shadow-[0_8px_18px_rgba(79,143,108,0.16)]"
                      style={{ height: `${outboundHeight}px` }}
                      title={`Outbound ${formatRate(point.txRate)}`}
                    />
                  </div>

                  {showLabel ? (
                    <div className="mt-2 text-[11px] font-medium text-slate-500">{label}</div>
                  ) : (
                    <div className="mt-2 text-[11px] text-transparent">.</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>{formatAxis(maxValue)}</span>
            <span>0</span>
            <span>{formatAxis(maxValue / 2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileMenu({ open, onProfile, onLogout }) {
  if (!open) return null;

  return (
    <div className="absolute right-0 top-14 w-56 rounded-[1.4rem] border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <button
        type="button"
        onClick={onProfile}
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <Icon name="profile" className="h-4 w-4" />
        Profile
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
      >
        <Icon name="logout" className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}

function useAppRoute() {
  const [path, setPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );
  const [search, setSearch] = useState(
    typeof window !== 'undefined' ? window.location.search : '',
  );

  React.useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
      setSearch(window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = React.useCallback((nextPath) => {
    if (window.location.pathname !== nextPath) {
      window.location.assign(nextPath);
    }
  }, []);

  return { path, search, navigate };
}

function formatUserStatus(status) {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'pending_approval':
      return 'Pending approval';
    case 'pending_verification':
      return 'Pending verification';
    case 'already_verified':
      return 'Already verified';
    default:
      return status || 'Unknown';
  }
}

function statusClasses(status) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending_approval':
      return 'bg-sky-100 text-sky-700';
    case 'pending_verification':
      return 'bg-amber-100 text-amber-700';
    case 'already_verified':
      return 'bg-cyan-100 text-cyan-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function formatDomainStatus(status) {
  switch (status) {
    case 'ready':
      return 'Nameserver ready';
    case 'pending':
      return 'Waiting for nameserver';
    default:
      return status || 'Unknown';
  }
}

function formatSubdomainDnsStatus(status) {
  switch (status) {
    case 'ready':
      return 'DNS ready';
    case 'pending':
      return 'Waiting for DNS setup';
    default:
      return status || 'Unknown';
  }
}

function domainStatusClasses(status) {
  switch (status) {
    case 'ready':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function formatSiteStatus(status) {
  switch (status) {
    case 'live':
      return 'Live';
    case 'offline':
      return 'Offline';
    case 'waiting_dns':
      return 'Waiting DNS';
    default:
      return status || 'Unknown';
  }
}

function siteStatusClasses(status) {
  switch (status) {
    case 'live':
      return 'bg-emerald-100 text-emerald-700';
    case 'offline':
      return 'bg-rose-100 text-rose-700';
    case 'waiting_dns':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function formatAppType(appType) {
  switch (String(appType || '').toLowerCase()) {
    case 'wordpress':
      return 'WordPress';
    case 'laravel':
      return 'Laravel';
    case 'codeigniter':
      return 'CodeIgniter';
    case 'plain':
      return 'Static site';
    default:
      return appType || 'Unknown';
  }
}

function notificationToneMeta(tone) {
  switch (tone) {
    case 'success':
      return {
        icon: FiCheckCircle,
        badge: 'bg-emerald-100 text-emerald-700',
        pill: 'bg-emerald-100 text-emerald-700',
        label: 'Success',
      };
    case 'warning':
      return {
        icon: FiAlertTriangle,
        badge: 'bg-amber-100 text-amber-700',
        pill: 'bg-amber-100 text-amber-700',
        label: 'Warning',
      };
    case 'error':
      return {
        icon: FiAlertTriangle,
        badge: 'bg-rose-100 text-rose-700',
        pill: 'bg-rose-100 text-rose-700',
        label: 'Error',
      };
    default:
      return {
        icon: FiActivity,
        badge: 'bg-sky-100 text-sky-700',
        pill: 'bg-sky-100 text-sky-700',
        label: 'Info',
      };
  }
}

function formatWordPressFilesystemMode(mode) {
  switch (String(mode || '').toLowerCase()) {
    case 'direct':
      return 'Direct filesystem';
    case 'needs_repair':
      return 'Needs repair';
    case 'ftp':
      return 'FTP fallback';
    case 'missing':
      return 'Missing config';
    case 'unknown':
      return 'Unknown';
    default:
      return mode ? String(mode) : 'Unknown';
  }
}

function AuthField({
  label,
  icon,
  type = 'text',
  placeholder,
  autoComplete,
  rightHint,
  showRightHint = false,
  helperText,
  helperTone = 'neutral',
  value,
  onChange,
  onBlur,
  name,
}) {
  const isPassword = type === 'password';
  const [visible, setVisible] = React.useState(false);
  const inputType = isPassword && visible ? 'text' : type;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-50 text-slate-500">
          {icon}
        </span>
        <input
          name={name}
          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-300"
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label={visible ? 'Hide password' : 'Show password'}
            title={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
                <path d="M10 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
                <path d="M4 4l16 16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
            )}
          </button>
        ) : null}
        {rightHint && showRightHint ? (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
            {rightHint}
          </span>
        ) : null}
      </div>
      {helperText ? (
        <p
          className={`mt-2 text-xs ${
            helperTone === 'error'
              ? 'text-rose-500'
              : helperTone === 'success'
                ? 'text-emerald-600'
                : 'text-slate-400'
          }`}
        >
          {helperText}
        </p>
      ) : null}
    </label>
  );
}

function AuthButton({ children, loading = false }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group inline-flex w-full items-center justify-center rounded-2xl bg-[#1f3d2e] px-5 py-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,61,46,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2f5d50] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? 'Please wait...' : children}
      <span className="ml-2 transition group-hover:translate-x-0.5">→</span>
    </button>
  );
}

function PanelField({ label, placeholder, value, onChange, name, type = 'text', disabled = false, readOnly = false }) {
  const isPassword = type === 'password';
  const [visible, setVisible] = React.useState(false);
  const inputType = isPassword && visible ? 'text' : type;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-900 outline-none shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
        <input
          name={name}
          className="w-full bg-transparent outline-none placeholder:text-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            disabled={disabled}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={visible ? 'Hide password' : 'Show password'}
            title={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
                <path d="M10 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
                <path d="M4 4l16 16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
            )}
          </button>
        ) : null}
      </div>
    </label>
  );
}

function PanelSelect({ label, value, onChange, children, name, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      <select
        name={name}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-900 outline-none shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {children}
      </select>
    </label>
  );
}

function PanelCheckbox({ label, description, checked, onChange, name }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:border-slate-300">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1f3d2e] focus:ring-[#cfe8d5]"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
      </div>
    </label>
  );
}

function VaultIllustration() {
  return (
    <div className="relative flex h-full min-h-[420px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_25%_20%,rgba(247,250,245,0.98),rgba(228,242,229,0.95)_38%,rgba(206,227,210,0.92)_74%,rgba(176,205,184,0.9)_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-8 top-10 h-56 w-56 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute right-8 top-12 h-64 w-64 rounded-full bg-amber-100/30 blur-3xl" />
        <div className="absolute bottom-8 left-12 h-48 w-48 rounded-full bg-green-200/25 blur-3xl" />
      </div>

      <div className="relative flex h-[360px] w-[360px] items-center justify-center">
        <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/55 via-emerald-50/20 to-amber-50/20 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-sm" />
        <div className="absolute left-6 top-6 h-[300px] w-[300px] rounded-[2.5rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,248,242,0.84))] shadow-[0_24px_80px_rgba(15,23,42,0.12)]" />
        <div className="absolute left-10 top-10 h-[280px] w-[280px] rounded-[2rem] border border-emerald-900/10 bg-[linear-gradient(180deg,rgba(16,78,59,0.92),rgba(20,60,46,0.98))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
        <div className="absolute left-[80px] top-[76px] h-[180px] w-[180px] rounded-[2rem] bg-[radial-gradient(circle_at_50%_35%,rgba(78,175,92,0.34),rgba(23,107,87,0.18)_50%,rgba(8,47,73,0.12)_100%)]" />
        <div className="absolute left-[92px] top-[88px] h-[156px] w-[156px] rounded-[1.75rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" />
        <img
          src="/diworkin-logo.png"
          alt="Diworkin logo"
          className="relative z-10 h-[220px] w-[220px] object-contain drop-shadow-[0_18px_40px_rgba(15,23,42,0.28)]"
        />
        <div className="absolute left-[34px] top-[42px] h-20 w-20 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="absolute right-[26px] bottom-[34px] h-24 w-24 rounded-full bg-amber-200/25 blur-2xl" />
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(169,200,138,0.16),rgba(243,232,213,0.28)_42%,#ffffff_100%)] px-6 text-slate-900">
      <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-10 shadow-[0_30px_100px_rgba(15,23,42,0.10)]">
        <div className="flex items-center gap-4">
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
            <img src="/diworkin-mark-dark.png" alt="Diworkin" className="h-12 w-12 object-cover" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-950">Diworkin</p>
            <p className="text-sm text-slate-500">Loading workspace...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandThemeStyles() {
  return (
    <style>{`
      .brand-dashboard {
        color: #111827;
        background: radial-gradient(circle at top left, rgba(169, 200, 138, 0.16), rgba(243, 232, 213, 0.28) 42%, #ffffff 100%);
      }

      .brand-dashboard .bg-slate-950 {
        background-color: #1f3d2e !important;
        color: #ffffff !important;
      }

      .brand-dashboard .border-slate-200,
      .brand-dashboard .border-slate-100,
      .brand-dashboard .border-white\/70,
      .brand-dashboard .border-white\/10,
      .brand-dashboard .border-white\/20,
      .brand-dashboard .border-white\/35,
      .brand-dashboard .border-white\/40 {
        border-color: #e7e0d8 !important;
      }

      .brand-dashboard .text-slate-950,
      .brand-dashboard .text-slate-900,
      .brand-dashboard .text-slate-800,
      .brand-dashboard .text-slate-700 {
        color: #111827 !important;
      }

      .brand-dashboard .text-slate-600,
      .brand-dashboard .text-slate-500,
      .brand-dashboard .text-slate-400 {
        color: #6b7280 !important;
      }

      .brand-dashboard .text-slate-300 {
        color: #7a7a7a !important;
      }

      .brand-dashboard input,
      .brand-dashboard select,
      .brand-dashboard textarea {
        background-color: #ffffff !important;
        color: #111827 !important;
        border-color: #e5e7eb !important;
      }

      .brand-dashboard input::placeholder,
      .brand-dashboard textarea::placeholder {
        color: #7a7a7a !important;
      }

      .brand-dashboard .bg-sky-50,
      .brand-dashboard .bg-sky-100 {
        background-color: #cfe8d5 !important;
        color: #1f3d2e !important;
      }

      .brand-dashboard .bg-emerald-50,
      .brand-dashboard .bg-emerald-100 {
        background-color: #a9c88a !important;
        color: #1f3d2e !important;
      }

      .brand-dashboard .bg-amber-50,
      .brand-dashboard .bg-amber-100 {
        background-color: #f3e8d5 !important;
        color: #8b6a3d !important;
      }

      .brand-dashboard .text-emerald-600,
      .brand-dashboard .text-emerald-700,
      .brand-dashboard .text-emerald-800,
      .brand-dashboard .text-emerald-900 {
        color: #1f3d2e !important;
      }

      .brand-dashboard .text-sky-600,
      .brand-dashboard .text-sky-700,
      .brand-dashboard .text-sky-800,
      .brand-dashboard .text-sky-900 {
        color: #1f3d2e !important;
      }

      .brand-dashboard .text-amber-600,
      .brand-dashboard .text-amber-700,
      .brand-dashboard .text-amber-800,
      .brand-dashboard .text-amber-900 {
        color: #8b6a3d !important;
      }

      .brand-dashboard .text-rose-600,
      .brand-dashboard .text-rose-700,
      .brand-dashboard .text-rose-800,
      .brand-dashboard .text-rose-900 {
        color: #991b1b !important;
      }

      .brand-dashboard code {
        background-color: #f3e8d5 !important;
        color: #1f3d2e !important;
      }
    `}</style>
  );
}

function EmailVerifyShell({ token, navigate }) {
  const [state, setState] = useState({
    loading: true,
    tone: 'neutral',
    message: 'Verifying email...',
    title: 'Verifying Email',
  });

  React.useEffect(() => {
    let alive = true;

    const verify = async () => {
      if (!token) {
        if (alive) {
          setState({
            loading: false,
            tone: 'error',
            message: 'Verification token not found.',
            title: 'Verification failed',
          });
        }
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Email verification failed');
        }

        if (alive) {
          setState({
            loading: false,
            tone: 'success',
            message: payload?.message || 'Email verified successfully.',
            title: 'Email verified',
          });
        }
      } catch (error) {
        if (alive) {
          setState({
            loading: false,
            tone: 'error',
            message: error?.message || 'Email verification failed.',
            title: 'Verification failed',
          });
        }
      }
    };

    verify();

    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(169,200,138,0.16),rgba(243,232,213,0.28)_42%,#ffffff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1200px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.10)]">
        <section className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-[520px]">
            <LogoMark />
            <div className="mt-12 rounded-[1.85rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
              <p className="text-sm font-medium text-slate-400">Email verification</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{state.title}</h1>
              <p
                className={`mt-4 text-sm leading-7 ${
                  state.tone === 'success' ? 'text-emerald-600' : state.tone === 'error' ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                {state.message}
              </p>

              <div className="mt-6 rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,rgba(24,119,255,0.16),rgba(255,255,255,0.88)_62%)] p-5">
                <p className="text-sm font-medium text-slate-500">What happens next</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  After your email is verified, the account will stay pending until an admin approves it.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(15,23,42,0.22)]"
                >
                  Go to login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700"
                >
                  Back to register
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="hidden lg:block lg:flex-[0.95]">
          <VaultIllustration />
        </section>
      </div>
    </div>
  );
}

function AuthShell({ mode, navigate, onLogin, onRegister }) {
  const [loading, setLoading] = useState(false);
  const [messageTone, setMessageTone] = useState('neutral');
  const [loginValues, setLoginValues] = useState({
    email: '',
    password: '',
  });
  const [loginEmailTouched, setLoginEmailTouched] = useState(false);
  const [registerValues, setRegisterValues] = useState({
    name: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: true,
  });
  const [registerConfirmTouched, setRegisterConfirmTouched] = useState(false);
  const [message, setMessage] = useState('');
  const authParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const authError = authParams.get('error');
  const loginEmail = loginValues.email.trim();
  const loginEmailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail);
  const confirmPasswordLooksValid =
    registerValues.confirmPassword.trim().length > 0 &&
    registerValues.confirmPassword === registerValues.password;

  React.useEffect(() => {
    if (mode === 'login' && authError) {
      setMessageTone('error');
      setMessage(authError);
    }
  }, [authError, mode]);

  const handleLogin = (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageTone('neutral');

    onLogin(loginValues)
      .then(() => {
        navigate('/projects');
      })
      .catch((error) => {
        setMessageTone('error');
        setMessage(error?.message || 'Failed login. Coba lagi.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleRegister = (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageTone('neutral');

    if (!registerValues.name || !registerValues.email || !registerValues.password) {
      setLoading(false);
      setMessageTone('error');
      setMessage('Please fill in name, email, and password first.');
      return;
    }

    if (registerValues.password !== registerValues.confirmPassword) {
      setLoading(false);
      setMessageTone('error');
      setMessage('Password and confirm password must match.');
      return;
    }

    if (!registerValues.acceptTerms) {
      setLoading(false);
      setMessageTone('error');
      setMessage('Please agree to the terms first.');
      return;
    }

    onRegister({
      ...registerValues,
      referralCode: authParams.get('ref') || '',
      couponCode: authParams.get('coupon') || '',
    })
      .then((response) => {
        setMessageTone('success');
        setMessage(response?.message || 'Account registered successfully. Waiting for admin approval.');
      })
      .catch((error) => {
        setMessageTone('error');
        setMessage(error?.message || 'Failed register. Coba lagi.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(169,200,138,0.16),rgba(243,232,213,0.28)_42%,#ffffff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1400px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.10)]">
        <div className="grid flex-1 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-between bg-white px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            <LogoMark />

            <div className="mx-auto w-full max-w-[460px] py-8 lg:py-0">
              <div className="text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="mt-3 text-sm text-slate-400">
                  {mode === 'login'
                    ? 'Welcome back, please enter your details'
                    : 'Create your workspace to manage hosting, mail, and DNS'}
                </p>
              </div>

              <div className="mt-8 flex rounded-[1.35rem] bg-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className={`rounded-2xl px-5 py-3 text-sm font-medium transition ${
                    mode === 'login'
                      ? 'bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.08)]'
                      : 'text-slate-500 hover:text-slate-950'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className={`rounded-2xl px-5 py-3 text-sm font-medium transition ${
                    mode === 'register'
                      ? 'bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.08)]'
                      : 'text-slate-500 hover:text-slate-950'
                  }`}
                >
                  Signup
                </button>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
                <form
                  className="space-y-5"
                  action={mode === 'login' ? '/api/auth/login' : undefined}
                  method={mode === 'login' ? 'post' : undefined}
                  onSubmit={mode === 'register' ? handleRegister : undefined}
                >
                  {mode === 'login' ? (
                    <>
                    <AuthField
                      name="email"
                      label="Email Address"
                      icon={
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="3.5" y="5" width="17" height="14" rx="4" />
                          <path d="m6 8 6 5 6-5" />
                        </svg>
                      }
                      type="email"
                      placeholder="name@company.com"
                      autoComplete="email"
                      value={loginValues.email}
                      onChange={(event) => setLoginValues((current) => ({ ...current, email: event.target.value }))}
                      onBlur={() => setLoginEmailTouched(true)}
                      rightHint="✓"
                      showRightHint={loginEmailTouched && loginEmailLooksValid}
                      helperText={loginEmailTouched && !loginEmailLooksValid && loginValues.email.trim().length > 0 ? 'Enter a valid email.' : ''}
                      helperTone="error"
                    />

                    <AuthField
                      name="password"
                      label="Password"
                      icon={
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M7 10V8a5 5 0 0 1 10 0v2" />
                          <rect x="4" y="10" width="16" height="10" rx="3" />
                        </svg>
                      }
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={loginValues.password}
                      onChange={(event) => setLoginValues((current) => ({ ...current, password: event.target.value }))}
                    />

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 text-slate-500">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                        Remember me
                      </label>
                      <button type="button" className="font-medium text-sky-600 hover:text-sky-700">
                        Forgot password?
                      </button>
                    </div>

                    {message ? (
                      <p
                        className={`text-sm ${
                          messageTone === 'success' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {message}
                      </p>
                    ) : null}
                    <AuthButton loading={false}>Continue</AuthButton>
                    </>
                  ) : (
                    <>
                    <AuthField
                      name="name"
                      label="Full Name"
                      icon={
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M20 21a8 8 0 0 0-16 0" />
                          <circle cx="12" cy="8" r="4" />
                        </svg>
                      }
                      placeholder="Your full name"
                      autoComplete="name"
                      value={registerValues.name}
                      onChange={(event) => setRegisterValues((current) => ({ ...current, name: event.target.value }))}
                    />

                    <AuthField
                      name="company"
                      label="Company / Project"
                      icon={
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M4 21V8a2 2 0 0 1 2-2h5v15" />
                          <path d="M13 7h5a2 2 0 0 1 2 2v12h-7" />
                          <path d="M8 21v-4" />
                        </svg>
                      }
                      placeholder="Diworkin Studio"
                      autoComplete="organization"
                      value={registerValues.company}
                      onChange={(event) => setRegisterValues((current) => ({ ...current, company: event.target.value }))}
                    />

                    <AuthField
                      name="email"
                      label="Email Address"
                      icon={
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="3.5" y="5" width="17" height="14" rx="4" />
                          <path d="m6 8 6 5 6-5" />
                        </svg>
                      }
                      type="email"
                      placeholder="name@company.com"
                      autoComplete="email"
                      value={registerValues.email}
                      onChange={(event) => setRegisterValues((current) => ({ ...current, email: event.target.value }))}
                    />

                    <div className="space-y-5">
                      <AuthField
                        name="password"
                        label="Password"
                        icon={
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M7 10V8a5 5 0 0 1 10 0v2" />
                            <rect x="4" y="10" width="16" height="10" rx="3" />
                          </svg>
                        }
                        type="password"
                        placeholder="Create password"
                        autoComplete="new-password"
                        value={registerValues.password}
                        onChange={(event) => setRegisterValues((current) => ({ ...current, password: event.target.value }))}
                      />
                      <AuthField
                        name="confirmPassword"
                        label="Confirm Password"
                        icon={
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        }
                        type="password"
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        value={registerValues.confirmPassword}
                        onChange={(event) => setRegisterValues((current) => ({ ...current, confirmPassword: event.target.value }))}
                        onBlur={() => setRegisterConfirmTouched(true)}
                        rightHint="✓"
                        showRightHint={registerConfirmTouched && confirmPasswordLooksValid}
                        helperText={
                          registerConfirmTouched &&
                          registerValues.confirmPassword.trim().length > 0 &&
                          !confirmPasswordLooksValid
                            ? 'Confirm password does not match.'
                            : ''
                        }
                        helperTone="error"
                      />
                    </div>

                    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                        checked={registerValues.acceptTerms}
                        onChange={(event) => setRegisterValues((current) => ({ ...current, acceptTerms: event.target.checked }))}
                      />
                      <span>
                        I agree to the terms and understand this account will manage domains, DNS, and email services.
                      </span>
                    </label>

                    {message ? (
                      <p
                        className={`text-sm ${
                          messageTone === 'success' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {message}
                      </p>
                    ) : null}
                    <AuthButton loading={loading}>Create account</AuthButton>
                    </>
                  )}
                </form>
              </div>

              <div className="mx-auto mt-8 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => navigate('/login')}
                >
                  Already have an account
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => navigate('/register')}
                >
                  Create new account
                </button>
              </div>

              <p className="mx-auto mt-6 max-w-md text-center text-sm leading-6 text-slate-400">
                Join the operators managing domains, mailboxes, and DNS from one clean control room.
              </p>
            </div>

            <p className="pt-6 text-center text-xs text-slate-300">
              Diworkin hosting stack · React, Tailwind, shadcn ready
            </p>
          </section>

          <section className="hidden lg:block">
            <VaultIllustration />
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardShell({ navigate, session, onLogout }) {
  const fileUploadInputRef = useRef(null);
  const settingsLogoInputRef = useRef(null);
  const settingsLogoMarkInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const shellCommandInputRef = useRef(null);
  const toastNotificationRef = useRef(0);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [metrics, setMetrics] = useState(FALLBACK_METRICS);
  const [metricsSource, setMetricsSource] = useState('demo');
  const [metricsUpdatedAt, setMetricsUpdatedAt] = useState(null);
  const [networkHistory, setNetworkHistory] = useState(() => createDemoTrafficHistory());
  const [overviewStats, setOverviewStats] = useState({
    activeDomains: 0,
    mailboxAccounts: 0,
    queuedMail: 0,
  });
  const [overviewStatsSource, setOverviewStatsSource] = useState('demo');
  const [overviewStatsUpdatedAt, setOverviewStatsUpdatedAt] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [approvingEmail, setApprovingEmail] = useState('');
  const [domains, setDomains] = useState([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [domainsError, setDomainsError] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [deletingDomain, setDeletingDomain] = useState('');
  const [savingDomain, setSavingDomain] = useState('');
  const [checkingDomain, setCheckingDomain] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [domainDetail, setDomainDetail] = useState(null);
  const [domainDraft, setDomainDraft] = useState('');
  const [domainForm, setDomainForm] = useState({
    domain: '',
    projectName: '',
  });
  const [subdomainDomainFilter, setSubdomainDomainFilter] = useState('');
  const [subdomains, setSubdomains] = useState([]);
  const [subdomainsLoading, setSubdomainsLoading] = useState(false);
  const [subdomainsError, setSubdomainsError] = useState('');
  const [creatingSubdomain, setCreatingSubdomain] = useState(false);
  const [subdomainInstallState, setSubdomainInstallState] = useState('idle');
  const [subdomainInstallPhase, setSubdomainInstallPhase] = useState(0);
  const [subdomainInstallTotal, setSubdomainInstallTotal] = useState(0);
  const [subdomainInstallMessage, setSubdomainInstallMessage] = useState('');
  const [subdomainInstallJobId, setSubdomainInstallJobId] = useState('');
  const [subdomainInstallLogs, setSubdomainInstallLogs] = useState([]);
  const [subdomainInstallStartedAt, setSubdomainInstallStartedAt] = useState(null);
  const [panelToast, setPanelToast] = useState(null);
  const [showAllSubdomainLogs, setShowAllSubdomainLogs] = useState(false);
  const [deletingSubdomain, setDeletingSubdomain] = useState('');
  const [savingSubdomain, setSavingSubdomain] = useState('');
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [wordpressPasswordDraft, setWordPressPasswordDraft] = useState('');
  const [savingWordPressPassword, setSavingWordPressPassword] = useState('');
  const [repairingWordPress, setRepairingWordPress] = useState('');
  const [subdomainForm, setSubdomainForm] = useState({
    domain: '',
    subdomain: '',
    projectName: '',
    appType: 'wordpress',
  });
  const [siteTargetKind, setSiteTargetKind] = useState('domain');
  const [mailDomainFilter, setMailDomainFilter] = useState('');
  const [mailDomains, setMailDomains] = useState([]);
  const [mailAccounts, setMailAccounts] = useState([]);
  const [mailAccountsLoading, setMailAccountsLoading] = useState(false);
  const [mailAccountsError, setMailAccountsError] = useState('');
  const [creatingMailbox, setCreatingMailbox] = useState(false);
  const [savingMailbox, setSavingMailbox] = useState('');
  const [deletingMailbox, setDeletingMailbox] = useState('');
  const [selectedMailbox, setSelectedMailbox] = useState(null);
  const [mailboxDraftPassword, setMailboxDraftPassword] = useState('');
  const [mailboxForm, setMailboxForm] = useState({
    localPart: '',
    password: '',
    enabled: true,
  });
  const [sshStatus, setSshStatus] = useState(null);
  const [sshStatusLoading, setSshStatusLoading] = useState(false);
  const [sshStatusError, setSshStatusError] = useState('');
  const [sshKeys, setSshKeys] = useState([]);
  const [sshKeysLoading, setSshKeysLoading] = useState(false);
  const [sshKeysError, setSshKeysError] = useState('');
  const [sshSaving, setSshSaving] = useState(false);
  const [sshDeleting, setSshDeleting] = useState('');
  const [sshForm, setSshForm] = useState({
    id: 0,
    title: '',
    publicKey: '',
    enabled: true,
  });
  const [ftpAccounts, setFtpAccounts] = useState([]);
  const [ftpAccountsLoading, setFtpAccountsLoading] = useState(false);
  const [ftpAccountsError, setFtpAccountsError] = useState('');
  const [creatingFtpAccount, setCreatingFtpAccount] = useState(false);
  const [deletingFtpAccount, setDeletingFtpAccount] = useState('');
  const [selectedFtpAccount, setSelectedFtpAccount] = useState(null);
  const [ftpForm, setFtpForm] = useState({
    id: 0,
    siteTarget: '',
    username: '',
    password: '',
    active: true,
  });
  const [shellSessions, setShellSessions] = useState([]);
  const [shellSessionsLoading, setShellSessionsLoading] = useState(false);
  const [shellSessionsError, setShellSessionsError] = useState('');
  const [creatingShellSession, setCreatingShellSession] = useState(false);
  const [deletingShellSession, setDeletingShellSession] = useState('');
  const [selectedShellSession, setSelectedShellSession] = useState(null);
  const [shellForm, setShellForm] = useState({
    id: 0,
    siteTarget: '',
    name: '',
    active: true,
  });
  const [shellCommand, setShellCommand] = useState('');
  const [shellCommandRunning, setShellCommandRunning] = useState(false);
  const [shellLogs, setShellLogs] = useState([]);
  const [shellLogsLoading, setShellLogsLoading] = useState(false);
  const [shellLogsError, setShellLogsError] = useState('');
  const [shellOutput, setShellOutput] = useState('');
  const [shellExitCode, setShellExitCode] = useState(0);
  const [databaseDomainFilter, setDatabaseDomainFilter] = useState('');
  const [databaseEntries, setDatabaseEntries] = useState([]);
  const [databaseEngines, setDatabaseEngines] = useState([]);
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const [databaseError, setDatabaseError] = useState('');
  const [creatingDatabase, setCreatingDatabase] = useState(false);
  const [deletingDatabase, setDeletingDatabase] = useState('');
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [databaseForm, setDatabaseForm] = useState({
    engine: 'postgres',
    name: '',
    username: '',
    password: '',
  });
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState('');
  const [savingPackage, setSavingPackage] = useState(false);
  const [deletingPackage, setDeletingPackage] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    id: 0,
    name: '',
    description: '',
    priceRupiah: '0',
    billingCycle: 'monthly',
    diskQuotaGb: '10',
    emailQuota: '10',
    subdomainQuota: '5',
    databaseQuota: '2',
    domainQuota: '1',
    featureSsl: true,
    featureBackup: true,
    featureSsh: false,
    featureFileManager: true,
    featureStudio: false,
    featureAutoInstaller: true,
    featureDns: true,
    featureMail: true,
    featurePrioritySupport: false,
    active: true,
  });
  const [licenses, setLicenses] = useState([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [licensesError, setLicensesError] = useState('');
  const [savingLicense, setSavingLicense] = useState(false);
  const [deletingLicense, setDeletingLicense] = useState('');
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [licenseForm, setLicenseForm] = useState({
    id: 0,
    ownerEmail: '',
    productName: '',
    domain: '',
    licenseKey: '',
    licenseType: 'panel',
    status: 'active',
    expiresAt: '',
    activatedAt: '',
    notes: '',
  });
  const [billingRecords, setBillingRecords] = useState([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [savingBilling, setSavingBilling] = useState(false);
  const [deletingBilling, setDeletingBilling] = useState('');
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [billingForm, setBillingForm] = useState({
    id: 0,
    invoiceNumber: '',
    packageId: '',
    customerName: '',
    customerEmail: '',
    domain: '',
    billingCycle: 'monthly',
    amountRupiah: '0',
    status: 'pending',
    dueAt: '',
    periodStartAt: '',
    periodEndAt: '',
    paidAt: '',
    notes: '',
  });
  const [affiliateData, setAffiliateData] = useState(null);
  const [affiliateRecords, setAffiliateRecords] = useState([]);
  const [affiliateCommissions, setAffiliateCommissions] = useState([]);
  const [affiliateSummary, setAffiliateSummary] = useState({
    affiliate_count: 0,
    active_affiliates: 0,
    total_commission_rupiah: 0,
    paid_commission_rupiah: 0,
    pending_commission_rupiah: 0,
    commission_count: 0,
  });
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [affiliateError, setAffiliateError] = useState('');
  const [affiliateSaving, setAffiliateSaving] = useState(false);
  const [affiliateDeleting, setAffiliateDeleting] = useState('');
  const [affiliateSelectedId, setAffiliateSelectedId] = useState(0);
  const [affiliateForm, setAffiliateForm] = useState({
    ownerEmail: '',
    referralCode: '',
    couponCode: '',
    commissionPercent: '10',
    couponDiscountPercent: '0',
    active: true,
  });
  const [affiliateCommissionForm, setAffiliateCommissionForm] = useState({
    affiliateId: '',
    ownerEmail: '',
    sourceEmail: '',
    sourceInvoiceNumber: '',
    amountRupiah: '',
    commissionRupiah: '',
    status: 'pending',
    notes: '',
  });
  const [affiliateCommissionSaving, setAffiliateCommissionSaving] = useState(false);
  const [affiliateCampaignName, setAffiliateCampaignName] = useState('');
  const [affiliateReportFrom, setAffiliateReportFrom] = useState('');
  const [affiliateReportTo, setAffiliateReportTo] = useState('');
  const [settingsData, setSettingsData] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsUploadingAsset, setSettingsUploadingAsset] = useState('');
  const [settingsForm, setSettingsForm] = useState({
    brandName: 'Diworkin',
    logoUrl: '/diworkin-logo.png',
    logoMarkUrl: '/diworkin-mark-dark.png',
    businessHours: 'Senin - Jumat, 09:00 - 17:00',
    location: '',
    ownerName: 'Diworkin',
    ownerPhone: '',
    ownerWhatsApp: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankBranch: '',
    bankNote: '',
  });
  const [studioDatabases, setStudioDatabases] = useState([]);
  const [studioDatabasesLoading, setStudioDatabasesLoading] = useState(false);
  const [studioDatabasesError, setStudioDatabasesError] = useState('');
  const [studioDatabaseFilter, setStudioDatabaseFilter] = useState('');
  const [studioObjects, setStudioObjects] = useState([]);
  const [studioObjectsLoading, setStudioObjectsLoading] = useState(false);
  const [studioObjectsError, setStudioObjectsError] = useState('');
  const [studioObjectFilter, setStudioObjectFilter] = useState('');
  const [studioRows, setStudioRows] = useState([]);
  const [studioRowsLoading, setStudioRowsLoading] = useState(false);
  const [studioRowsError, setStudioRowsError] = useState('');
  const [studioSchema, setStudioSchema] = useState({ columns: [], primary_key: [], object_type: 'table' });
  const [studioEditorMode, setStudioEditorMode] = useState('insert');
  const [studioEditorText, setStudioEditorText] = useState('{\\n}');
  const [studioKeyColumn, setStudioKeyColumn] = useState('');
  const [studioKeyValue, setStudioKeyValue] = useState('');
  const [studioSaving, setStudioSaving] = useState(false);
  const [studioDeleting, setStudioDeleting] = useState('');
  const [fileParentDomainFilter, setFileParentDomainFilter] = useState('');
  const [fileTargetFilter, setFileTargetFilter] = useState('');
  const [fileTargets, setFileTargets] = useState([]);
  const [fileTargetsLoading, setFileTargetsLoading] = useState(false);
  const [fileTargetsError, setFileTargetsError] = useState('');
  const [fileSearch, setFileSearch] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [fileEntries, setFileEntries] = useState([]);
  const [fileCurrentPath, setFileCurrentPath] = useState('');
  const [fileParentPath, setFileParentPath] = useState('');
  const [fileBrowsePath, setFileBrowsePath] = useState('');
  const [fileSelectedPath, setFileSelectedPath] = useState('');
  const [fileSelectedContent, setFileSelectedContent] = useState('');
  const [fileSelectedBinary, setFileSelectedBinary] = useState(false);
  const [fileSelectedMeta, setFileSelectedMeta] = useState(null);
  const [fileSaving, setFileSaving] = useState(false);
  const [fileDeleting, setFileDeleting] = useState('');
  const [fileCreating, setFileCreating] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileCreateName, setFileCreateName] = useState('');
  const [fileCreateKind, setFileCreateKind] = useState('file');
  const [fileCreateContent, setFileCreateContent] = useState('');
  const [fileRenaming, setFileRenaming] = useState(false);
  const [fileRenameName, setFileRenameName] = useState('');
  const [fileUploadFile, setFileUploadFile] = useState(null);
  const [collapsedTargetGroups, setCollapsedTargetGroups] = useState([]);
  const [dnsDomainFilter, setDnsDomainFilter] = useState('');
  const [dnsDomains, setDnsDomains] = useState([]);
  const [dnsRecords, setDnsRecords] = useState([]);
  const [dnsRecordsLoading, setDnsRecordsLoading] = useState(false);
  const [dnsRecordsError, setDnsRecordsError] = useState('');
  const [dnsSaving, setDnsSaving] = useState(false);
  const [dnsDeleting, setDnsDeleting] = useState('');
  const [selectedDnsRecord, setSelectedDnsRecord] = useState(null);
  const [dnsForm, setDnsForm] = useState({
    name: '',
    type: 'A',
    ttl: '3600',
    content: '',
    priority: '10',
  });
  const [sslTargets, setSslTargets] = useState([]);
  const [sslTargetsLoading, setSslTargetsLoading] = useState(false);
  const [sslTargetsError, setSslTargetsError] = useState('');
  const [sslIssuing, setSslIssuing] = useState('');
  const [sslBulkFixing, setSslBulkFixing] = useState(false);
  const [backupDomainFilter, setBackupDomainFilter] = useState('');
  const [backupScope, setBackupScope] = useState('site');
  const [backups, setBackups] = useState([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [backupsError, setBackupsError] = useState('');
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [deletingBackup, setDeletingBackup] = useState('');
  const [backupRules, setBackupRules] = useState([]);
  const [backupRulesLoading, setBackupRulesLoading] = useState(false);
  const [backupRulesError, setBackupRulesError] = useState('');
  const [creatingBackupRule, setCreatingBackupRule] = useState(false);
  const [deletingBackupRule, setDeletingBackupRule] = useState('');
  const [backupRuleScope, setBackupRuleScope] = useState('full');
  const [backupRuleFrequency, setBackupRuleFrequency] = useState('daily');
  const [backupRuleHour, setBackupRuleHour] = useState('02');
  const [backupRuleMinute, setBackupRuleMinute] = useState('00');
  const [backupRuleRetention, setBackupRuleRetention] = useState('7');
  const [backupRuleEnabled, setBackupRuleEnabled] = useState(true);
  const selectedDatabaseEngine = databaseEngines.find((engine) => engine.key === databaseForm.engine) || null;
  const selectedStudioDatabase = studioDatabases.find((item) => `${item.engine}:${item.domain}:${item.name}` === studioDatabaseFilter) || null;
  const selectedFileTarget = fileTargets.find((item) => item.domain === fileTargetFilter) || null;
  const selectedBillingPackage = packages.find((item) => String(item.id) === String(billingForm.packageId)) || null;
  const selectedAffiliateRecord =
    affiliateRecords.find((item) => String(item.id) === String(affiliateSelectedId)) || affiliateData || affiliateRecords[0] || null;
  const affiliateFilteredCommissions = React.useMemo(() => {
    const from = affiliateReportFrom ? new Date(affiliateReportFrom) : null;
    const to = affiliateReportTo ? new Date(`${affiliateReportTo}T23:59:59`) : null;

    return affiliateCommissions.filter((item) => {
      const createdAt = new Date(item?.created_at || item?.updated_at || Date.now());
      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }
      if (from && createdAt < from) {
        return false;
      }
      if (to && createdAt > to) {
        return false;
      }
      return true;
    });
  }, [affiliateCommissions, affiliateReportFrom, affiliateReportTo]);
  const affiliateMonthlyReport = React.useMemo(
    () => buildAffiliateMonthlyReport(affiliateFilteredCommissions),
    [affiliateFilteredCommissions],
  );
  const affiliateCurrentMonthReport = affiliateMonthlyReport[0] || null;
  const affiliateLeaderboard = React.useMemo(
    () => buildAffiliateLeaderboard(affiliateRecords),
    [affiliateRecords],
  );
  const affiliateCampaignPreview = React.useMemo(
    () => buildAffiliateCampaignData(selectedAffiliateRecord, affiliateCampaignName, affiliateMonthlyReport),
    [affiliateCampaignName, affiliateMonthlyReport, selectedAffiliateRecord],
  );
  const packageFeatureOptions = [
    {
      key: 'featureSsl',
      name: 'feature_ssl',
      label: 'SSL certificate',
      description: 'Automatic certificates for domains and subdomains.',
    },
    {
      key: 'featureBackup',
      name: 'feature_backup',
      label: 'Backup manager',
      description: 'Manual and automatic backups for user projects.',
    },
    {
      key: 'featureSsh',
      name: 'feature_ssh',
      label: 'SSH access',
      description: 'Server access via SSH for specific users.',
    },
    {
      key: 'featureFileManager',
      name: 'feature_file_manager',
      label: 'File manager',
      description: 'Manage the public folder and website files from the panel.',
    },
    {
      key: 'featureStudio',
      name: 'feature_studio',
      label: 'Database studio',
      description: 'CRUD data directly from the database studio panel.',
    },
    {
      key: 'featureAutoInstaller',
      name: 'feature_auto_installer',
      label: 'Auto installer',
      description: 'Install WordPress, CodeIgniter, dan Laravel otomatis.',
    },
    {
      key: 'featureDns',
      name: 'feature_dns',
      label: 'DNS management',
      description: 'Manage DNS zones and records from the panel.',
    },
    {
      key: 'featureMail',
      name: 'feature_mail',
      label: 'Email service',
      description: 'Mailboxes, aliases, and webmail for users.',
    },
    {
      key: 'featurePrioritySupport',
      name: 'feature_priority_support',
      label: 'Priority support',
      description: 'Priority support for premium plans.',
    },
  ];
  const visibleMailDomains = React.useMemo(() => {
    if (session?.is_admin) {
      return mailDomains;
    }

    const items = [];
    domains.forEach((item) => {
      if (item?.domain) {
        items.push({
          domain: item.domain,
          display_name: item.domain,
        });
      }
    });
    subdomains.forEach((item) => {
      if (item?.full_domain) {
        items.push({
          domain: item.full_domain,
          display_name: item.full_domain,
        });
      }
    });

    const unique = [];
    const seen = new Set();
    items.forEach((item) => {
      const key = String(item.domain || '').toLowerCase();
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      unique.push(item);
    });
    return unique.sort((left, right) => left.domain.localeCompare(right.domain));
  }, [domains, mailDomains, session?.is_admin, subdomains]);
  const fileTargetGroups = domains.map((domainItem) => {
    const domainTarget = fileTargets.find((item) => item.kind === 'domain' && item.domain === domainItem.domain) || {
      kind: 'domain',
      domain: domainItem.domain,
      label: domainItem.domain,
      parent_domain: domainItem.domain,
      subdomain: '',
    };

    const subdomainTargets = fileTargets.filter(
      (item) => item.kind === 'subdomain' && item.parent_domain === domainItem.domain,
    );

    return {
      domain: domainItem.domain,
      label: domainItem.domain,
      domainTarget,
      subdomainTargets,
      allTargets: [domainTarget, ...subdomainTargets],
    };
  });
  const siteEntries = React.useMemo(() => {
    const items = [];

    domains.forEach((item) => {
      items.push({
        kind: 'domain',
        domain: item.domain,
        subdomain: '',
        fullDomain: item.domain,
        projectName: item.project_name || '',
        appType: item.app_type || 'plain',
        publicPath: item.public_path || '',
        dnsStatus: item.dns_status || 'pending',
        siteStatus: item.site_status || 'waiting_dns',
        ownerEmail: item.owner_email || '',
        wordpressAdminUser: item.wordpress_admin_user || '',
        wordpressAccessReady: Boolean(item.wordpress_access_ready),
        wordpressFilesystemMode: item.wordpress_filesystem_mode || '',
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',
        provisionedAt: item.provisioned_at || '',
      });
    });

    subdomains.forEach((item) => {
      items.push({
        kind: 'subdomain',
        domain: item.domain,
        subdomain: item.subdomain,
        fullDomain: item.full_domain,
        projectName: item.project_name || '',
        appType: item.app_type || 'plain',
        publicPath: item.public_path || '',
        dnsStatus: item.dns_status || 'pending',
        siteStatus: item.site_status || 'offline',
        ownerEmail: item.owner_email || '',
        wordpressAdminUser: item.wordpress_admin_user || '',
        wordpressAccessReady: Boolean(item.wordpress_access_ready),
        wordpressFilesystemMode: item.wordpress_filesystem_mode || '',
        createdAt: item.created_at || '',
        updatedAt: item.updated_at || '',
        provisionedAt: item.provisioned_at || '',
        databaseName: item.database_name || '',
        databaseUsername: item.database_username || '',
        connectionUri: item.connection_uri || '',
      });
    });

    return items.sort((left, right) => {
      if (left.kind === right.kind) {
        return String(left.fullDomain || '').localeCompare(String(right.fullDomain || ''));
      }
      return left.kind === 'domain' ? -1 : 1;
    });
  }, [domains, subdomains]);
  const siteAppOptions = [
    {
      value: 'wordpress',
      title: 'WordPress',
      description: 'Content site, blog, dan company profile dengan admin familiar.',
      monogram: 'WP',
      gradient: 'from-[#1f3d2e] via-[#4f8f6c] to-[#a9c88a]',
      image: '/templates/wordpress-template.png',
      imageAlt: 'WordPress template',
    },
    {
      value: 'laravel',
      title: 'Laravel',
      description: 'Aplikasi modern dengan structure rapi dan workflow yang solid.',
      monogram: 'LV',
      gradient: 'from-[#2f5d50] via-[#4f8f6c] to-[#cfe8d5]',
      image: '/templates/laravel-template.png',
      imageAlt: 'Laravel template',
    },
    {
      value: 'codeigniter',
      title: 'CodeIgniter',
      description: 'Lightweight framework for fast projects and simple deployments.',
      monogram: 'CI',
      gradient: 'from-[#8b6a3d] via-[#a9c88a] to-[#f3e8d5]',
      image: '/templates/codeigniter-template.png',
      imageAlt: 'CodeIgniter template',
    },
    {
      value: 'plain',
      title: 'Static site',
      description: 'Landing page sederhana, profile page, atau placeholder.',
      monogram: 'ST',
      gradient: 'from-slate-700 via-slate-500 to-slate-300',
      image: '/templates/static-template.png',
      imageAlt: 'Static website template',
    },
  ];
  const filteredFileEntries = fileEntries.filter((item) => {
    const query = fileSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [item.name, item.path, item.type, item.extension].some((value) =>
      String(value || '').toLowerCase().includes(query),
    );
  });
  const fileSelectedLanguage = detectFileLanguage(fileSelectedPath || fileCreateName || fileUploadFile?.name || '');
  const fileBreadcrumbs = fileCurrentPath ? fileCurrentPath.split('/').filter(Boolean) : [];
  const subdomainInstallSteps = getSiteInstallSteps(siteTargetKind, subdomainForm.appType);
  const subdomainInstallStepTotal = Math.max(subdomainInstallTotal || subdomainInstallSteps.length, 1);

  const searchResults = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    const results = [];
    const pushResult = (item) => {
      if (!item || !item.label) {
        return;
      }
      results.push(item);
    };

    const matches = (value) => String(value || '').toLowerCase().includes(query);
    const score = (value) => {
      const text = String(value || '').toLowerCase();
      if (!text || !text.includes(query)) {
        return null;
      }
      if (text.startsWith(query)) {
        return 0;
      }
      return 1;
    };

    const quickSections = [
      { key: 'overview', label: 'Overview', subtitle: 'Command center' },
      { key: 'domains', label: 'Domains', subtitle: 'Domain provisioning' },
      { key: 'subdomains', label: 'Sites', subtitle: 'Website installer' },
      { key: 'email', label: 'Email', subtitle: 'Mailbox management' },
      ...(session?.is_admin ? [{ key: 'support', label: 'Support', subtitle: 'Live chat inbox' }] : []),
      { key: 'affiliate', label: 'Affiliate', subtitle: 'Referral & commission' },
      { key: 'dns', label: 'DNS', subtitle: 'Zone records' },
      { key: 'ssl', label: 'SSL', subtitle: 'Certificates' },
      { key: 'databases', label: 'Databases', subtitle: 'DB wizard' },
      ...(session?.is_admin ? [{ key: 'packages', label: 'Packages', subtitle: 'Package catalog' }] : []),
      ...(session?.is_admin ? [{ key: 'billing', label: 'Billing', subtitle: 'Invoices & charges' }] : []),
      { key: 'studio', label: 'Studio', subtitle: 'DB CRUD' },
      { key: 'files', label: 'Files', subtitle: 'File manager' },
      { key: 'ftp', label: 'FTP', subtitle: 'Access profiles' },
      { key: 'shell', label: 'Shell', subtitle: 'Restricted commands' },
      { key: 'backup', label: 'Backup', subtitle: 'Backup manager' },
      { key: 'ssh', label: 'SSH', subtitle: 'Access keys' },
      { key: 'users', label: 'Users', subtitle: 'Approval queue' },
      ...(session?.is_admin ? [{ key: 'settings', label: 'Settings', subtitle: 'Brand & contacts' }] : []),
    ];

    quickSections.forEach((item) => {
      const matchScore = score(item.label) ?? score(item.subtitle);
      if (matchScore !== null) {
        pushResult({
          id: `section:${item.key}`,
          kind: 'section',
          label: item.label,
          subtitle: item.subtitle,
          section: item.key,
          score: matchScore,
          onSelect: () => {
            setActiveSection(item.key);
            setSearchOpen(false);
            setSearchQuery('');
          },
        });
      }
    });

    domains.forEach((item) => {
      const fields = [item.domain, item.project_name, item.owner_email, item.public_path, item.dns_status, item.site_status];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `domain:${item.domain}`,
          kind: 'domain',
          label: item.domain,
          subtitle: item.project_name || item.owner_email || item.public_path || 'Domain',
          section: 'domains',
          score: best,
          onSelect: () => {
            setActiveSection('domains');
            setSelectedDomain(item.domain);
            setDomainDetail(item);
            setDomainDraft(item.project_name || '');
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened domain', message: item.domain, tone: 'success' });
          },
        });
      }
    });

    subdomains.forEach((item) => {
      const fields = [item.full_domain, item.project_name, item.app_type, item.database_name, item.dns_status, item.site_status];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `subdomain:${item.full_domain}`,
          kind: 'subdomain',
          label: item.full_domain,
          subtitle: item.project_name || item.app_type || item.database_name || 'Subdomain',
          section: 'subdomains',
          score: best,
          onSelect: () => {
            setActiveSection('subdomains');
            setSubdomainDomainFilter(item.domain);
            setSubdomainForm({
              domain: item.domain,
              subdomain: item.subdomain,
              projectName: item.project_name || '',
              appType: item.app_type || 'plain',
            });
            setSelectedSubdomain(item);
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened subdomain', message: item.full_domain, tone: 'success' });
          },
        });
      }
    });

    mailAccounts.forEach((item) => {
      const fields = [item.email, item.mailbox_path, item.enabled ? 'enabled' : 'disabled'];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `mail:${item.email}`,
          kind: 'mailbox',
          label: item.email,
          subtitle: item.mailbox_path || (item.enabled ? 'Enabled' : 'Disabled'),
          section: 'email',
          score: best,
          onSelect: () => {
            setActiveSection('email');
            setMailDomainFilter(item.email.split('@').slice(1).join('@') || mailDomainFilter);
            setSelectedMailbox(item);
            setMailboxDraftPassword('');
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened mailbox', message: item.email, tone: 'success' });
          },
        });
      }
    });

    dnsRecords.forEach((item) => {
      const fields = [item.name, item.type, item.content, item.priority, dnsDomainFilter];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `dns:${item.name}:${item.type}:${item.content}`,
          kind: 'dns',
          label: `${item.name || '@'} · ${item.type}`,
          subtitle: item.content,
          section: 'dns',
          score: best,
          onSelect: () => {
            setActiveSection('dns');
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened DNS record', message: `${item.name || '@'} ${item.type}`, tone: 'success' });
          },
        });
      }
    });

    databaseEntries.forEach((item) => {
      const fields = [item.engine, item.name, item.username, item.domain, item.host, item.status];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `database:${item.engine}:${item.name}`,
          kind: 'database',
          label: `${item.engine.toUpperCase()} · ${item.name}`,
          subtitle: item.username,
          section: 'databases',
          score: best,
          onSelect: () => {
            setActiveSection('databases');
            setDatabaseDomainFilter(item.domain);
            setSelectedDatabase(item);
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened database', message: `${item.engine.toUpperCase()} · ${item.name}`, tone: 'success' });
          },
        });
      }
    });

    if (session?.is_admin) {
      packages.forEach((item) => {
        const fields = [item.name, item.description, item.billing_cycle, item.disk_quota_gb, item.email_quota, item.subdomain_quota, item.database_quota, item.domain_quota];
        const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
        if (Number.isFinite(best)) {
          pushResult({
            id: `package:${item.id}`,
            kind: 'package',
            label: item.name,
            subtitle: `Rp ${formatRupiahAmount(item.price_rupiah)} · ${formatPackageBillingCycle(item.billing_cycle)}`,
            section: 'packages',
            score: best,
            onSelect: () => {
              setActiveSection('packages');
              setSelectedPackage(item);
              setPackageForm({
                id: item.id || 0,
                name: item.name || '',
                description: item.description || '',
                priceRupiah: String(item.price_rupiah ?? 0),
                billingCycle: item.billing_cycle || 'monthly',
                diskQuotaGb: String(item.disk_quota_gb ?? 0),
                emailQuota: String(item.email_quota ?? 0),
                subdomainQuota: String(item.subdomain_quota ?? 0),
                databaseQuota: String(item.database_quota ?? 0),
                domainQuota: String(item.domain_quota ?? 0),
                featureSsl: Boolean(item.feature_ssl),
                featureBackup: Boolean(item.feature_backup),
                featureSsh: Boolean(item.feature_ssh),
                featureFileManager: Boolean(item.feature_file_manager),
                featureStudio: Boolean(item.feature_studio),
                featureAutoInstaller: Boolean(item.feature_auto_installer),
                featureDns: Boolean(item.feature_dns),
                featureMail: Boolean(item.feature_mail),
                featurePrioritySupport: Boolean(item.feature_priority_support),
                active: Boolean(item.active),
              });
              setSearchOpen(false);
              setSearchQuery('');
              pushNotification({ title: 'Search opened package', message: item.name, tone: 'success' });
            },
          });
        }
      });

      billingRecords.forEach((item) => {
        const fields = [item.invoice_number, item.customer_name, item.customer_email, item.domain, item.package_name, item.status, item.billing_cycle];
        const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
        if (Number.isFinite(best)) {
          pushResult({
            id: `billing:${item.id}`,
            kind: 'billing',
            label: item.invoice_number || item.customer_name || `Billing ${item.id}`,
            subtitle: `${item.customer_email || '-'} · ${item.package_name || 'Package'}`,
            section: 'billing',
            score: best,
            onSelect: () => {
              setActiveSection('billing');
              setSelectedBilling(item);
              setBillingForm({
                id: item.id || 0,
                invoiceNumber: item.invoice_number || '',
                packageId: String(item.package_id || ''),
                customerName: item.customer_name || '',
                customerEmail: item.customer_email || '',
                domain: item.domain || '',
                billingCycle: item.billing_cycle || 'monthly',
                amountRupiah: String(item.amount_rupiah ?? 0),
                status: item.status || 'pending',
                dueAt: item.due_at ? item.due_at.slice(0, 16) : '',
                periodStartAt: item.period_start_at ? item.period_start_at.slice(0, 16) : '',
                periodEndAt: item.period_end_at ? item.period_end_at.slice(0, 16) : '',
                paidAt: item.paid_at ? item.paid_at.slice(0, 16) : '',
                notes: item.notes || '',
              });
              setSearchOpen(false);
              setSearchQuery('');
              pushNotification({ title: 'Search opened billing', message: item.invoice_number || item.customer_email || `Billing ${item.id}`, tone: 'success' });
            },
          });
        }
      });
    }

    affiliateRecords.forEach((item) => {
      const fields = [
        item.owner_email,
        item.owner_name,
        item.company,
        item.referral_code,
        item.coupon_code,
        item.referral_url,
        item.active ? 'active' : 'inactive',
      ];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `affiliate:${item.id}`,
          kind: 'affiliate',
          label: item.owner_name || item.owner_email,
          subtitle: `${item.referral_code || '-'} · ${item.coupon_code || '-'}`,
          section: 'affiliate',
          score: best,
          onSelect: () => {
            setActiveSection('affiliate');
            setAffiliateSelectedId(Number(item.id) || 0);
            setAffiliateForm({
              ownerEmail: item.owner_email || '',
              referralCode: item.referral_code || '',
              couponCode: item.coupon_code || '',
              commissionPercent: String(item.commission_percent ?? 10),
              couponDiscountPercent: String(item.coupon_discount_percent ?? 0),
              active: Boolean(item.active),
            });
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened affiliate', message: item.owner_email || item.referral_code || 'Affiliate', tone: 'success' });
          },
        });
      }
    });

    affiliateCommissions.forEach((item) => {
      const fields = [
        item.owner_email,
        item.owner_name,
        item.company,
        item.source_email,
        item.source_invoice_number,
        item.status,
        item.notes,
      ];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `affiliate-commission:${item.id}`,
          kind: 'affiliate-commission',
          label: item.source_invoice_number || item.source_email || `Commission ${item.id}`,
          subtitle: `${item.owner_email || '-'} · ${item.status || 'pending'}`,
          section: 'affiliate',
          score: best,
          onSelect: () => {
            setActiveSection('affiliate');
            setAffiliateSelectedId(Number(item.affiliate_id) || 0);
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened commission', message: item.source_invoice_number || item.source_email || 'Commission', tone: 'success' });
          },
        });
      }
    });

    studioDatabases.forEach((item) => {
      const fields = [item.engine, item.name, item.domain];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `studio:${item.engine}:${item.domain}:${item.name}`,
          kind: 'studio',
          label: `${item.engine.toUpperCase()} · ${item.name}`,
          subtitle: item.domain,
          section: 'studio',
          score: best,
          onSelect: () => {
            setActiveSection('studio');
            setStudioDatabaseFilter(`${item.engine}:${item.domain}:${item.name}`);
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened studio database', message: `${item.engine.toUpperCase()} · ${item.name}`, tone: 'success' });
          },
        });
      }
    });

    fileTargets.forEach((item) => {
      const fields = [item.domain, item.label, item.parent_domain, item.subdomain, item.kind];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `file-target:${item.domain}`,
          kind: 'file-target',
          label: item.domain,
          subtitle: item.kind === 'subdomain' ? item.parent_domain : 'Domain target',
          section: 'files',
          score: best,
          onSelect: () => {
            setActiveSection('files');
            selectFileTarget(item);
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened file target', message: item.domain, tone: 'success' });
          },
        });
      }
    });

    fileEntries.forEach((item) => {
      const fields = [item.name, item.path, item.type, item.extension];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `file:${item.path}`,
          kind: 'file',
          label: item.name,
          subtitle: item.path,
          section: 'files',
          score: best,
          onSelect: () => {
            setActiveSection('files');
            openFileItem(item);
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened file', message: item.path, tone: 'success' });
          },
        });
      }
    });

    ftpAccounts.forEach((item) => {
      const fields = [item.username, item.site_target, item.target_kind, item.base_path];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `ftp:${item.id}`,
          kind: 'ftp',
          label: item.username,
          subtitle: item.site_target,
          section: 'ftp',
          score: best,
          onSelect: () => {
            setActiveSection('ftp');
            setSelectedFtpAccount(item);
            setFtpForm({
              id: item.id,
              siteTarget: item.site_target || '',
              username: item.username || '',
              password: '',
              active: item.active !== false,
            });
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened FTP account', message: item.username || item.site_target || 'FTP', tone: 'success' });
          },
        });
      }
    });

    shellSessions.forEach((item) => {
      const fields = [item.name, item.site_target, item.target_kind, item.last_command, item.last_output];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `shell:${item.id}`,
          kind: 'shell',
          label: item.name || item.site_target,
          subtitle: item.site_target,
          section: 'shell',
          score: best,
          onSelect: () => {
            setActiveSection('shell');
            setSelectedShellSession(item);
            setShellForm({
              id: item.id,
              siteTarget: item.site_target || '',
              name: item.name || '',
              active: item.active !== false,
            });
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened shell session', message: item.name || item.site_target || 'Shell', tone: 'success' });
          },
        });
      }
    });

    backups.forEach((item) => {
      const fields = [item.file_name, item.domain, item.scope, item.notes];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `backup:${item.id}`,
          kind: 'backup',
          label: item.file_name,
          subtitle: `${item.domain} · ${item.scope}`,
          section: 'backup',
          score: best,
          onSelect: () => {
            setActiveSection('backup');
            setBackupDomainFilter(item.domain);
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened backup', message: item.file_name, tone: 'success' });
          },
        });
      }
    });

    sshKeys.forEach((item) => {
      const fields = [item.title, item.public_key, item.fingerprint];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `ssh:${item.id}`,
          kind: 'ssh',
          label: item.title || 'SSH key',
          subtitle: item.fingerprint || 'Public key',
          section: 'ssh',
          score: best,
          onSelect: () => {
            setActiveSection('ssh');
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened SSH key', message: item.title || item.fingerprint || 'SSH key', tone: 'success' });
          },
        });
      }
    });

    users.forEach((item) => {
      const fields = [item.name, item.email, item.company, item.status];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `user:${item.email}`,
          kind: 'user',
          label: item.name || item.email,
          subtitle: item.email,
          section: 'users',
          score: best,
          onSelect: () => {
            setActiveSection('users');
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened user', message: item.email, tone: 'success' });
          },
        });
      }
    });

    sslTargets.forEach((item) => {
      const fields = [item.full_domain, item.kind, item.certificate_status, item.dns_status, item.site_status];
      const best = Math.min(...fields.map((field) => score(field)).filter((value) => value !== null), Infinity);
      if (Number.isFinite(best)) {
        pushResult({
          id: `ssl:${item.full_domain}`,
          kind: 'ssl',
          label: item.full_domain,
          subtitle: item.certificate_status || 'SSL target',
          section: 'ssl',
          score: best,
          onSelect: () => {
            setActiveSection('ssl');
            setSearchOpen(false);
            setSearchQuery('');
            pushNotification({ title: 'Search opened SSL target', message: item.full_domain, tone: 'success' });
          },
        });
      }
    });

    return results
      .filter((item, index, array) => array.findIndex((current) => current.id === item.id) === index)
      .sort((left, right) => left.score - right.score || left.label.localeCompare(right.label))
      .slice(0, 12);
  }, [
    activeSection,
    backups,
    billingRecords,
    databaseEntries,
    dnsRecords,
    domains,
    fileEntries,
    fileTargets,
    mailAccounts,
    ftpAccounts,
    shellSessions,
    searchQuery,
    selectedFileTarget,
    packages,
    affiliateCommissions,
    affiliateRecords,
    sshKeys,
    sslTargets,
    studioDatabases,
    subdomains,
    session?.is_admin,
    users,
  ]);

  const notificationsUnread = notifications.filter((item) => !item.read).length;
  const latestNotifications = notifications.slice(0, 6);

  const handleSearchPick = React.useCallback(
    (item) => {
      if (!item?.onSelect) {
        return;
      }
      item.onSelect();
    },
    [],
  );

  const handleSearchKeyDown = React.useCallback(
    (event) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (searchResults.length > 0) {
          handleSearchPick(searchResults[0]);
        }
      }
    },
    [handleSearchPick, searchResults],
  );

  const selectFileTarget = React.useCallback(
    (target) => {
      if (!target?.domain) {
        return;
      }

      const nextParentDomain = target.kind === 'subdomain' ? target.parent_domain || '' : target.domain;
      setFileParentDomainFilter(nextParentDomain || target.domain);
      setFileTargetFilter(target.domain);
      setFileBrowsePath('');
      setFileCurrentPath('');
      setFileParentPath('');
      setFileSelectedPath('');
      setFileSelectedContent('');
      setFileSelectedBinary(false);
      setFileSelectedMeta(null);
      setFileCreateName('');
      setFileRenameName('');
      setFileUploadFile(null);
    },
    [],
  );

  const toggleTargetGroup = React.useCallback((domain) => {
    setCollapsedTargetGroups((current) =>
      current.includes(domain) ? current.filter((item) => item !== domain) : [...current, domain],
    );
  }, []);

  React.useEffect(() => {
    if (!panelToast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setPanelToast(null);
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [panelToast]);

  React.useEffect(() => {
    if (!panelToast) {
      return;
    }

    toastNotificationRef.current += 1;
    setNotifications((current) => [
      {
        id: `toast-${Date.now()}-${toastNotificationRef.current}`,
        title: panelToast.title,
        message: panelToast.message,
        tone: panelToast.tone || 'info',
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...current,
    ].slice(0, 12));
  }, [panelToast]);

  const pushNotification = React.useCallback((notification) => {
    toastNotificationRef.current += 1;
    setNotifications((current) => [
      {
        id: `note-${Date.now()}-${toastNotificationRef.current}`,
        createdAt: new Date().toISOString(),
        read: false,
        tone: notification.tone || 'info',
        ...notification,
      },
      ...current,
    ].slice(0, 12));
  }, []);

  const navItems = [
    { icon: 'dashboard', label: 'Overview', key: 'overview' },
    { icon: 'domains', label: 'Domains', key: 'domains' },
    { icon: 'folder', label: 'Sites', key: 'subdomains' },
    { icon: 'email', label: 'Email', key: 'email' },
    ...(session?.is_admin ? [{ icon: 'support', label: 'Support', key: 'support' }] : []),
    { icon: 'affiliate', label: 'Affiliate', key: 'affiliate' },
    { icon: 'dns', label: 'DNS', key: 'dns' },
    { icon: 'ssl', label: 'SSL', key: 'ssl' },
    { icon: 'database', label: 'Databases', key: 'databases' },
    ...(session?.is_admin ? [{ icon: 'package', label: 'Packages', key: 'packages' }] : []),
    ...(session?.is_admin ? [{ icon: 'billing', label: 'Billing', key: 'billing' }] : []),
    ...(session?.is_admin ? [{ icon: 'license', label: 'Licenses', key: 'licenses' }] : []),
    { icon: 'studio', label: 'Studio', key: 'studio' },
    { icon: 'folder', label: 'Files', key: 'files' },
    { icon: 'ftp', label: 'FTP', key: 'ftp' },
    { icon: 'shell', label: 'Shell', key: 'shell' },
    { icon: 'backup', label: 'Backup', key: 'backup' },
    ...(session?.is_admin ? [{ icon: 'ssh', label: 'SSH', key: 'ssh' }] : []),
    ...(session?.is_admin ? [{ icon: 'users', label: 'Users', key: 'users' }] : []),
    ...(session?.is_admin ? [{ icon: 'settings', label: 'Settings', key: 'settings' }] : []),
  ];

  React.useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const refreshMetrics = async () => {
      try {
        const response = await fetch('/api/metrics', {
          signal: controller.signal,
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Metrics request failed: ${response.status}`);
        }

        const payload = await response.json();
        const nextMetrics = normalizeMetrics(payload);

        if (alive) {
          setMetrics(nextMetrics);
          setMetricsSource('live');
          setMetricsUpdatedAt(new Date());
        }
      } catch (error) {
        if (alive) {
          setMetrics(FALLBACK_METRICS);
          setMetricsSource('demo');
        }
      }
    };

    refreshMetrics();
    const intervalId = window.setInterval(refreshMetrics, 10000);

    return () => {
      alive = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  React.useEffect(() => {
    setNetworkHistory((current) => {
      if (metricsSource !== 'live') {
        if (current.length > 0 && current[0]?.source === 'demo') {
          return current;
        }
        return createDemoTrafficHistory();
      }

      const sample = {
        at: Date.now(),
        rx: Number(metrics.networkRxBytes) || 0,
        tx: Number(metrics.networkTxBytes) || 0,
        source: 'live',
      };

      if (current.length > 0 && current[0]?.source === 'demo') {
        return [sample];
      }

      const next = [...current, sample];
      return next.slice(-12);
    });
  }, [metrics.networkRxBytes, metrics.networkTxBytes, metricsSource]);

  React.useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const refreshOverview = async () => {
      try {
        const response = await fetch('/api/overview', {
          signal: controller.signal,
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Overview request failed: ${response.status}`);
        }

        const payload = await response.json();
        if (alive) {
          setOverviewStats({
            activeDomains: Number(payload?.active_domains) || 0,
            mailboxAccounts: Number(payload?.mailbox_accounts) || 0,
            queuedMail: Number(payload?.queued_mail) || 0,
          });
          setOverviewStatsSource('live');
          setOverviewStatsUpdatedAt(new Date());
        }
      } catch (error) {
        if (alive) {
          setOverviewStatsSource('demo');
        }
      }
    };

    refreshOverview();
    const intervalId = window.setInterval(refreshOverview, 30000);

    return () => {
      alive = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  React.useEffect(() => {
    if (!session?.is_admin && activeSection === 'users') {
      setActiveSection('overview');
    }
  }, [activeSection, session?.is_admin]);

  React.useEffect(() => {
    if (!session?.is_admin && activeSection === 'ssh') {
      setActiveSection('overview');
    }
  }, [activeSection, session?.is_admin]);

  React.useEffect(() => {
    if (!['domains', 'subdomains', 'email', 'databases', 'dns'].includes(activeSection) && domains.length > 0) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadDomains = async () => {
      setDomainsLoading(true);
      setDomainsError('');

      try {
        const response = await fetch('/api/domains', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load domains');
        }

        if (alive) {
          setDomains(Array.isArray(payload?.domains) ? payload.domains : []);
        }
      } catch (error) {
        if (alive) {
          setDomainsError(error?.message || 'Failed to load domains');
        }
      } finally {
        if (alive) {
          setDomainsLoading(false);
        }
      }
    };

    loadDomains();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, domains.length]);

  React.useEffect(() => {
    if (!selectedDomain) {
      setDomainDetail(null);
      setDomainDraft('');
      return;
    }

    const current = domains.find((item) => item.domain === selectedDomain);
    if (current) {
      setDomainDetail(current);
      setDomainDraft(current.project_name || '');
    }
  }, [selectedDomain, domains]);

  React.useEffect(() => {
    if (!['subdomains'].includes(activeSection)) {
      return;
    }

    if (!subdomainDomainFilter && domains.length > 0) {
      setSubdomainDomainFilter(domains[0].domain);
      return;
    }

    if (subdomainDomainFilter && !domains.some((item) => item.domain === subdomainDomainFilter) && domains.length > 0) {
      setSubdomainDomainFilter(domains[0].domain);
    }
  }, [activeSection, domains, subdomainDomainFilter]);

  React.useEffect(() => {
    if (activeSection !== 'subdomains') {
      return;
    }

    if (!subdomainForm.domain && domains.length > 0) {
      setSubdomainForm((current) => ({ ...current, domain: domains[0].domain }));
      return;
    }

    if (subdomainForm.domain && !domains.some((item) => item.domain === subdomainForm.domain) && domains.length > 0) {
      setSubdomainForm((current) => ({ ...current, domain: domains[0].domain }));
    }
  }, [activeSection, domains, subdomainForm.domain]);

  React.useEffect(() => {
    if (activeSection !== 'subdomains' || !subdomainDomainFilter) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadSubdomains = async () => {
      setSubdomainsLoading(true);
      setSubdomainsError('');

      try {
        const response = await fetch(`/api/subdomains?domain=${encodeURIComponent(subdomainDomainFilter)}`, {
          credentials: 'include',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load sites');
        }

        if (alive) {
          setSubdomains(Array.isArray(payload?.subdomains) ? payload.subdomains : []);
        }
      } catch (error) {
        if (alive) {
          setSubdomainsError(error?.message || 'Failed to load sites');
          setSubdomains([]);
        }
      } finally {
        if (alive) {
          setSubdomainsLoading(false);
        }
      }
    };

    loadSubdomains();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, subdomainDomainFilter]);

  React.useEffect(() => {
    if (activeSection !== 'email') {
      return;
    }

    if (visibleMailDomains.length === 0) {
      if (mailDomainFilter) {
        setMailDomainFilter('');
      }
      return;
    }

    if (!mailDomainFilter || !visibleMailDomains.some((item) => item.domain === mailDomainFilter)) {
      setMailDomainFilter(visibleMailDomains[0].domain);
    }
  }, [activeSection, mailDomainFilter, visibleMailDomains]);

  React.useEffect(() => {
    if (!['databases'].includes(activeSection)) {
      return;
    }

    if (!databaseDomainFilter && domains.length > 0) {
      setDatabaseDomainFilter(domains[0].domain);
      return;
    }

    if (databaseDomainFilter && !domains.some((item) => item.domain === databaseDomainFilter) && domains.length > 0) {
      setDatabaseDomainFilter(domains[0].domain);
    }
  }, [activeSection, domains, databaseDomainFilter]);

  React.useEffect(() => {
    if (!['dns'].includes(activeSection)) {
      return;
    }

    if (!dnsDomainFilter && domains.length > 0) {
      setDnsDomainFilter(domains[0].domain);
      return;
    }

    if (dnsDomainFilter && !domains.some((item) => item.domain === dnsDomainFilter) && domains.length > 0) {
      setDnsDomainFilter(domains[0].domain);
    }
  }, [activeSection, domains, dnsDomainFilter]);

  React.useEffect(() => {
    if (activeSection !== 'dns') {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadDnsDomains = async () => {
      try {
        const response = await fetch('/api/dns/domains', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load DNS domains');
        }

        if (alive) {
          setDnsDomains(Array.isArray(payload?.domains) ? payload.domains : []);
        }
      } catch (error) {
        if (alive) {
          setDnsDomains([]);
        }
      }
    };

    loadDnsDomains();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, session?.is_admin]);

  React.useEffect(() => {
    if (!['dns'].includes(activeSection)) {
      return;
    }

    if (!dnsDomainFilter && dnsDomains.length > 0) {
      setDnsDomainFilter(dnsDomains[0].domain);
      return;
    }

    if (dnsDomainFilter && !dnsDomains.some((item) => item.domain === dnsDomainFilter) && dnsDomains.length > 0) {
      setDnsDomainFilter(dnsDomains[0].domain);
    }
  }, [activeSection, dnsDomains, dnsDomainFilter]);

  React.useEffect(() => {
    if (activeSection !== 'ssl') {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadSslTargets = async () => {
      setSslTargetsLoading(true);
      setSslTargetsError('');

      try {
        const response = await fetch('/api/ssl/targets', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load SSL targets');
        }

        if (alive) {
          setSslTargets(Array.isArray(payload?.targets) ? payload.targets : []);
        }
      } catch (error) {
        if (alive) {
          setSslTargets([]);
          setSslTargetsError(error?.message || 'Failed to load SSL targets');
        }
      } finally {
        if (alive) {
          setSslTargetsLoading(false);
        }
      }
    };

    loadSslTargets();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, session?.is_admin]);

  React.useEffect(() => {
    if (activeSection !== 'databases') {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadDatabaseEngines = async () => {
      try {
        const response = await fetch('/api/databases/engines', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load database engines');
        }

        if (alive) {
          setDatabaseEngines(Array.isArray(payload?.engines) ? payload.engines : []);
        }
      } catch (error) {
        if (alive) {
          setDatabaseEngines([]);
        }
      }
    };

    loadDatabaseEngines();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, session?.is_admin]);

  React.useEffect(() => {
    if (activeSection !== 'databases' || !databaseDomainFilter) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadDatabases = async () => {
      setDatabaseLoading(true);
      setDatabaseError('');

      try {
        const response = await fetch(`/api/databases?domain=${encodeURIComponent(databaseDomainFilter)}`, {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load databases');
        }

        if (alive) {
          setDatabaseEntries(Array.isArray(payload?.databases) ? payload.databases : []);
        }
      } catch (error) {
        if (alive) {
          setDatabaseError(error?.message || 'Failed to load databases');
        }
      } finally {
        if (alive) {
          setDatabaseLoading(false);
        }
      }
    };

    loadDatabases();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, databaseDomainFilter]);

  React.useEffect(() => {
    if (!session?.is_admin) {
      setPackages([]);
      setPackagesError('');
      setPackagesLoading(false);
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadPackages = async () => {
      setPackagesLoading(true);
      setPackagesError('');

      try {
        const response = await fetch('/api/packages', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load packages');
        }

        if (alive) {
          setPackages(Array.isArray(payload?.packages) ? payload.packages : []);
        }
      } catch (error) {
        if (alive) {
          setPackages([]);
          setPackagesError(error?.message || 'Failed to load packages');
        }
      } finally {
        if (alive) {
          setPackagesLoading(false);
        }
      }
    };

    loadPackages();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [session?.is_admin]);

  React.useEffect(() => {
    if (!session?.is_admin) {
      setLicenses([]);
      setLicensesError('');
      setLicensesLoading(false);
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadLicenses = async () => {
      setLicensesLoading(true);
      setLicensesError('');

      try {
        const response = await fetch('/api/licenses', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load licenses');
        }

        if (alive) {
          setLicenses(Array.isArray(payload?.licenses) ? payload.licenses : []);
        }
      } catch (error) {
        if (alive) {
          setLicenses([]);
          setLicensesError(error?.message || 'Failed to load licenses');
        }
      } finally {
        if (alive) {
          setLicensesLoading(false);
        }
      }
    };

    loadLicenses();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [session?.is_admin]);

  React.useEffect(() => {
    if (!session?.is_admin) {
      setBillingRecords([]);
      setBillingError('');
      setBillingLoading(false);
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadBilling = async () => {
      setBillingLoading(true);
      setBillingError('');

      try {
        const response = await fetch('/api/billing', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load billing');
        }

        if (alive) {
          setBillingRecords(Array.isArray(payload?.billing) ? payload.billing : []);
        }
      } catch (error) {
        if (alive) {
          setBillingRecords([]);
          setBillingError(error?.message || 'Failed to load billing');
        }
      } finally {
        if (alive) {
          setBillingLoading(false);
        }
      }
    };

    loadBilling();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [session?.is_admin]);

  React.useEffect(() => {
    if (activeSection !== 'affiliate') {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadAffiliates = async () => {
      setAffiliateLoading(true);
      setAffiliateError('');

      try {
        const response = await fetch('/api/affiliates', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load affiliate');
        }

        if (!alive) {
          return;
        }

        const nextSummary = payload?.summary || {};
        setAffiliateSummary({
          affiliate_count: Number(nextSummary.affiliate_count || 0),
          active_affiliates: Number(nextSummary.active_affiliates || 0),
          total_commission_rupiah: Number(nextSummary.total_commission_rupiah || 0),
          paid_commission_rupiah: Number(nextSummary.paid_commission_rupiah || 0),
          pending_commission_rupiah: Number(nextSummary.pending_commission_rupiah || 0),
          commission_count: Number(nextSummary.commission_count || 0),
        });

        const nextAffiliate = payload?.affiliate || null;
        const nextAffiliates = Array.isArray(payload?.affiliates)
          ? payload.affiliates
          : nextAffiliate
            ? [nextAffiliate]
            : [];
        const nextCommissions = Array.isArray(payload?.commissions) ? payload.commissions : [];

        setAffiliateRecords(nextAffiliates);
        setAffiliateCommissions(nextCommissions);

        const selected = nextAffiliates.find((item) => String(item.id) === String(affiliateSelectedId))
          || nextAffiliate
          || nextAffiliates[0]
          || null;

        if (selected) {
          setAffiliateSelectedId(Number(selected.id) || 0);
          setAffiliateForm({
            ownerEmail: selected.owner_email || '',
            referralCode: selected.referral_code || '',
            couponCode: selected.coupon_code || '',
            commissionPercent: String(selected.commission_percent ?? 10),
            couponDiscountPercent: String(selected.coupon_discount_percent ?? 0),
            active: Boolean(selected.active),
          });
          setAffiliateCommissionForm((current) => ({
            ...current,
            affiliateId: String(selected.id || ''),
            ownerEmail: selected.owner_email || current.ownerEmail,
          }));
        }

        if (!session?.is_admin) {
          setAffiliateData(nextAffiliate || selected);
        } else {
          setAffiliateData(selected);
        }

        if (nextAffiliates.length > 0 && !selected) {
          setAffiliateSelectedId(Number(nextAffiliates[0].id) || 0);
        }
      } catch (error) {
        if (alive) {
          setAffiliateRecords([]);
          setAffiliateCommissions([]);
          setAffiliateData(null);
          setAffiliateError(error?.message || 'Failed to load affiliate');
        }
      } finally {
        if (alive) {
          setAffiliateLoading(false);
        }
      }
    };

    loadAffiliates();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, affiliateSelectedId, session?.is_admin]);

  React.useEffect(() => {
    if (!session?.is_admin && (activeSection === 'licenses' || activeSection === 'packages' || activeSection === 'billing' || activeSection === 'settings')) {
      setActiveSection('overview');
    }
  }, [activeSection, session?.is_admin]);

  React.useEffect(() => {
    if (activeSection !== 'settings' || !session?.is_admin) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadSettings = async () => {
      setSettingsLoading(true);
      setSettingsError('');

      try {
        const response = await fetch('/api/settings', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load settings');
        }

        if (alive) {
          const next = payload?.settings || null;
          setSettingsData(next);
          setSettingsForm({
            brandName: next?.brand_name || 'Diworkin',
            logoUrl: next?.logo_url || '/diworkin-logo.png',
            logoMarkUrl: next?.logo_mark_url || '/diworkin-mark-dark.png',
            businessHours: next?.business_hours || '',
            location: next?.location || '',
            ownerName: next?.owner_name || 'Diworkin',
            ownerPhone: next?.owner_phone || '',
            ownerWhatsApp: next?.owner_whatsapp || '',
            bankName: next?.bank_name || '',
            bankAccountName: next?.bank_account_name || '',
            bankAccountNumber: next?.bank_account_number || '',
            bankBranch: next?.bank_branch || '',
            bankNote: next?.bank_note || '',
          });
        }
      } catch (error) {
        if (alive) {
          setSettingsData(null);
          setSettingsError(error?.message || 'Failed to load settings');
        }
      } finally {
        if (alive) {
          setSettingsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection]);

  React.useEffect(() => {
    if (!session?.is_admin || packages.length === 0) {
      return;
    }

    if (billingForm.packageId && packages.some((item) => String(item.id) === String(billingForm.packageId))) {
      return;
    }

    const firstActivePackage = packages.find((item) => item.active) || packages[0];
    if (!firstActivePackage) {
      return;
    }

    setBillingForm((current) => ({
      ...current,
      packageId: String(firstActivePackage.id),
      billingCycle: firstActivePackage.billing_cycle || current.billingCycle || 'monthly',
      amountRupiah: current.amountRupiah && Number(current.amountRupiah) > 0 ? current.amountRupiah : String(firstActivePackage.price_rupiah ?? 0),
    }));
  }, [billingForm.packageId, packages, session?.is_admin]);

  React.useEffect(() => {
    if (activeSection !== 'studio') {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadStudioDatabases = async () => {
      setStudioDatabasesLoading(true);
      setStudioDatabasesError('');

      try {
        const response = await fetch('/api/studio/databases', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load studio databases');
        }

        if (alive) {
          const nextItems = Array.isArray(payload?.databases) ? payload.databases : [];
          setStudioDatabases(nextItems);
          if (nextItems.length > 0) {
            const currentKey = studioDatabaseFilter;
            const nextKey = `${nextItems[0].engine}:${nextItems[0].domain}:${nextItems[0].name}`;
            if (!currentKey || !nextItems.some((item) => `${item.engine}:${item.domain}:${item.name}` === currentKey)) {
              setStudioDatabaseFilter(nextKey);
            }
          } else {
            setStudioDatabaseFilter('');
          }
        }
      } catch (error) {
        if (alive) {
          setStudioDatabases([]);
          setStudioDatabasesError(error?.message || 'Failed to load studio databases');
        }
      } finally {
        if (alive) {
          setStudioDatabasesLoading(false);
        }
      }
    };

    loadStudioDatabases();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, studioDatabaseFilter]);

  React.useEffect(() => {
    if (activeSection !== 'studio') {
      return;
    }

    if (!studioDatabaseFilter && studioDatabases.length > 0) {
      setStudioDatabaseFilter(`${studioDatabases[0].engine}:${studioDatabases[0].domain}:${studioDatabases[0].name}`);
      return;
    }

    if (studioDatabaseFilter && !studioDatabases.some((item) => `${item.engine}:${item.domain}:${item.name}` === studioDatabaseFilter) && studioDatabases.length > 0) {
      setStudioDatabaseFilter(`${studioDatabases[0].engine}:${studioDatabases[0].domain}:${studioDatabases[0].name}`);
    }
  }, [activeSection, studioDatabases, studioDatabaseFilter]);

  React.useEffect(() => {
    if (activeSection !== 'studio' || !studioDatabaseFilter) {
      return undefined;
    }

    const selected = studioDatabases.find((item) => `${item.engine}:${item.domain}:${item.name}` === studioDatabaseFilter);
    if (!selected) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadObjects = async () => {
      setStudioObjectsLoading(true);
      setStudioObjectsError('');

      try {
        const url = `/api/studio/objects?domain=${encodeURIComponent(selected.domain)}&engine=${encodeURIComponent(selected.engine)}&name=${encodeURIComponent(selected.name)}`;
        const response = await fetch(url, {
          credentials: 'include',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load database objects');
        }

        if (alive) {
          const nextObjects = Array.isArray(payload?.objects) ? payload.objects : [];
          setStudioObjects(nextObjects);
          if (nextObjects.length > 0) {
            const currentObject = studioObjectFilter;
            if (!currentObject || !nextObjects.some((item) => item.name === currentObject)) {
              setStudioObjectFilter(nextObjects[0].name);
            }
          } else {
            setStudioObjectFilter('');
          }
        }
      } catch (error) {
        if (alive) {
          setStudioObjects([]);
          setStudioObjectsError(error?.message || 'Failed to load database objects');
        }
      } finally {
        if (alive) {
          setStudioObjectsLoading(false);
        }
      }
    };

    loadObjects();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, studioDatabaseFilter, studioDatabases, studioObjectFilter]);

  React.useEffect(() => {
    if (activeSection !== 'studio' || !studioDatabaseFilter || !studioObjectFilter) {
      return undefined;
    }

    const selected = studioDatabases.find((item) => `${item.engine}:${item.domain}:${item.name}` === studioDatabaseFilter);
    if (!selected) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadRows = async () => {
      setStudioRowsLoading(true);
      setStudioRowsError('');

      try {
        const url = `/api/studio/rows?domain=${encodeURIComponent(selected.domain)}&engine=${encodeURIComponent(selected.engine)}&name=${encodeURIComponent(selected.name)}&object=${encodeURIComponent(studioObjectFilter)}&limit=50&offset=0`;
        const response = await fetch(url, {
          credentials: 'include',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load rows');
        }

        if (alive) {
          setStudioRows(Array.isArray(payload?.rows) ? payload.rows : []);
          setStudioSchema({
            columns: Array.isArray(payload?.columns) ? payload.columns : [],
            primary_key: Array.isArray(payload?.primary_key) ? payload.primary_key : [],
            object_type: payload?.object_type || 'table',
          });
          if (Array.isArray(payload?.rows) && payload.rows.length > 0) {
            const firstRow = payload.rows[0];
            const pk = Array.isArray(payload?.primary_key) && payload.primary_key.length > 0 ? payload.primary_key[0] : '_id';
            setStudioEditorMode('update');
            setStudioEditorText(JSON.stringify(firstRow, null, 2));
            setStudioKeyColumn(pk);
            setStudioKeyValue(formatStudioValue(firstRow?.[pk]));
          } else {
            setStudioEditorMode('insert');
            setStudioEditorText('{\n}');
            setStudioKeyColumn(Array.isArray(payload?.primary_key) && payload.primary_key.length > 0 ? payload.primary_key[0] : '_id');
            setStudioKeyValue('');
          }
        }
      } catch (error) {
        if (alive) {
          setStudioRows([]);
          setStudioRowsError(error?.message || 'Failed to load rows');
        }
      } finally {
        if (alive) {
          setStudioRowsLoading(false);
        }
      }
    };

    loadRows();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, studioDatabaseFilter, studioDatabases, studioObjectFilter]);

  React.useEffect(() => {
    if (activeSection !== 'files') {
      return;
    }

    if (!fileParentDomainFilter && domains.length > 0) {
      setFileParentDomainFilter(domains[0].domain);
      return;
    }

    if (fileParentDomainFilter && !domains.some((item) => item.domain === fileParentDomainFilter) && domains.length > 0) {
      setFileParentDomainFilter(domains[0].domain);
    }
  }, [activeSection, domains, fileParentDomainFilter]);

  React.useEffect(() => {
    if (activeSection !== 'files') {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadFileTargets = async () => {
      if (domains.length === 0) {
        if (alive) {
          setFileTargets([]);
          setFileTargetsError('');
          setFileTargetsLoading(false);
        }
        return;
      }

      setFileTargetsLoading(true);
      setFileTargetsError('');

      try {
        const targetItems = domains.map((domainItem) => ({
          kind: 'domain',
          domain: domainItem.domain,
          label: domainItem.domain,
          parent_domain: domainItem.domain,
          subdomain: '',
        }));

        const subdomainCollections = await Promise.all(
          domains.map(async (domainItem) => {
            const response = await fetch(`/api/subdomains?domain=${encodeURIComponent(domainItem.domain)}`, {
              credentials: 'include',
              signal: controller.signal,
              headers: { Accept: 'application/json' },
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
              throw new Error(payload?.error || `Failed to load subdomain ${domainItem.domain}`);
            }

            return {
              domain: domainItem.domain,
              subdomains: Array.isArray(payload?.subdomains) ? payload.subdomains : [],
            };
          }),
        );

        subdomainCollections.forEach(({ domain, subdomains }) => {
          subdomains.forEach((item) => {
            targetItems.push({
              kind: 'subdomain',
              domain: item.full_domain,
              label: item.full_domain,
              parent_domain: domain,
              subdomain: item.subdomain,
            });
          });
        });

        const uniqueTargets = [];
        const seenTargets = new Set();
        targetItems.forEach((item) => {
          if (!item?.domain || seenTargets.has(item.domain)) {
            return;
          }
          seenTargets.add(item.domain);
          uniqueTargets.push(item);
        });

        if (alive) {
          setFileTargets(uniqueTargets);
        }
      } catch (error) {
        if (alive) {
          setFileTargets([]);
          setFileTargetsError(error?.message || 'Failed to load file targets');
        }
      } finally {
        if (alive) {
          setFileTargetsLoading(false);
        }
      }
    };

    loadFileTargets();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, domains]);

  React.useEffect(() => {
    if (activeSection !== 'files') {
      return;
    }

    const validTargets = fileTargets.map((item) => item.domain);

    if (!fileTargetFilter && validTargets.length > 0) {
      setFileTargetFilter(validTargets[0]);
      return;
    }

    if (fileTargetFilter && validTargets.length > 0 && !validTargets.includes(fileTargetFilter)) {
      setFileTargetFilter(validTargets[0]);
    }
  }, [activeSection, fileTargets, fileTargetFilter]);

  React.useEffect(() => {
    if (activeSection !== 'files' || !fileTargetFilter) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadFiles = async () => {
      setFileLoading(true);
      setFileError('');

      try {
        const response = await fetch(
          `/api/files?domain=${encodeURIComponent(fileTargetFilter)}&path=${encodeURIComponent(fileBrowsePath)}&mode=browse`,
          {
            credentials: 'include',
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          },
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load file manager');
        }

        if (alive) {
          setFileEntries(Array.isArray(payload?.items) ? payload.items : []);
          setFileCurrentPath(payload?.current_path || '');
          setFileParentPath(payload?.parent_path || '');
          setFileBrowsePath(payload?.current_path || '');
          setFileSelectedPath('');
          setFileSelectedContent('');
          setFileSelectedBinary(false);
          setFileSelectedMeta(null);
        }
      } catch (error) {
        if (alive) {
          setFileEntries([]);
          setFileError(error?.message || 'Failed to load file manager');
        }
      } finally {
        if (alive) {
          setFileLoading(false);
        }
      }
    };

    loadFiles();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, fileTargetFilter, fileBrowsePath]);

  React.useEffect(() => {
    if (activeSection !== 'ftp') {
      return;
    }

    if (!ftpForm.siteTarget && siteEntries.length > 0) {
      setFtpForm((current) => ({
        ...current,
        siteTarget: siteEntries[0].fullDomain,
      }));
    }

    if (ftpForm.siteTarget && siteEntries.length > 0 && !siteEntries.some((item) => item.fullDomain === ftpForm.siteTarget)) {
      setFtpForm((current) => ({
        ...current,
        siteTarget: siteEntries[0].fullDomain,
      }));
    }
  }, [activeSection, siteEntries, ftpForm.siteTarget]);

  React.useEffect(() => {
    if (activeSection !== 'ftp') {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadFtpAccounts = async () => {
      setFtpAccountsLoading(true);
      setFtpAccountsError('');

      try {
        const response = await fetch('/api/ftp/accounts', {
          credentials: 'include',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const error = new Error(payload?.error || 'Failed to load FTP accounts');
          error.status = response.status;
          throw error;
        }

        if (alive) {
          const items = Array.isArray(payload?.items) ? payload.items : [];
          setFtpAccounts(items);
          if (items.length > 0 && !items.some((item) => String(item.id) === String(selectedFtpAccount?.id || ''))) {
            setSelectedFtpAccount(items[0]);
          }
        }
      } catch (error) {
        if (alive) {
          setFtpAccounts([]);
        }
      } finally {
        if (alive) {
          setFtpAccountsLoading(false);
        }
      }
    };

    loadFtpAccounts();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, selectedFtpAccount?.id]);

  React.useEffect(() => {
    if (activeSection !== 'shell') {
      return;
    }

    if (!shellForm.siteTarget && siteEntries.length > 0) {
      setShellForm((current) => ({
        ...current,
        siteTarget: siteEntries[0].fullDomain,
      }));
    }

    if (shellForm.siteTarget && siteEntries.length > 0 && !siteEntries.some((item) => item.fullDomain === shellForm.siteTarget)) {
      setShellForm((current) => ({
        ...current,
        siteTarget: siteEntries[0].fullDomain,
      }));
    }
  }, [activeSection, siteEntries, shellForm.siteTarget]);

  React.useEffect(() => {
    if (activeSection !== 'shell') {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadShellSessions = async () => {
      setShellSessionsLoading(true);
      setShellSessionsError('');

      try {
        const response = await fetch('/api/shell/sessions', {
          credentials: 'include',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const error = new Error(payload?.error || 'Failed to load shell sessions');
          error.status = response.status;
          throw error;
        }

        if (alive) {
          const items = Array.isArray(payload?.items) ? payload.items : [];
          setShellSessions(items);
          if (items.length > 0 && !items.some((item) => String(item.id) === String(selectedShellSession?.id || ''))) {
            setSelectedShellSession(items[0]);
          }
        }
      } catch (error) {
        if (alive) {
          setShellSessions([]);
        }
      } finally {
        if (alive) {
          setShellSessionsLoading(false);
        }
      }
    };

    loadShellSessions();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection]);

  React.useEffect(() => {
    if (activeSection !== 'shell' || !selectedShellSession?.id) {
      setShellLogs([]);
      setShellLogsError('');
      setShellOutput('');
      setShellExitCode(0);
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadShellLogs = async () => {
      setShellLogsLoading(true);
      setShellLogsError('');

      try {
        const response = await fetch(`/api/shell/logs?session_id=${encodeURIComponent(selectedShellSession.id)}`, {
          credentials: 'include',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load shell log');
        }

        if (alive) {
          setShellLogs(Array.isArray(payload?.items) ? payload.items : []);
          setShellOutput(selectedShellSession.last_output || '');
          setShellExitCode(Number(selectedShellSession.last_exit_code || 0));
        }
      } catch (error) {
        if (alive) {
          setShellLogs([]);
          setShellLogsError(error?.message || 'Failed to load shell log');
        }
      } finally {
        if (alive) {
          setShellLogsLoading(false);
        }
      }
    };

    loadShellLogs();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, selectedShellSession?.id]);

  React.useEffect(() => {
    if (activeSection === 'shell' && selectedShellSession?.id) {
      shellCommandInputRef.current?.focus?.();
    }
  }, [activeSection, selectedShellSession?.id]);

  React.useEffect(() => {
    if (activeSection !== 'backup') {
      return;
    }

    if (!backupDomainFilter && domains.length > 0) {
      setBackupDomainFilter(domains[0].domain);
      return;
    }

    if (backupDomainFilter && !domains.some((item) => item.domain === backupDomainFilter) && domains.length > 0) {
      setBackupDomainFilter(domains[0].domain);
    }
  }, [activeSection, domains, backupDomainFilter]);

  React.useEffect(() => {
    if (activeSection !== 'backup' || !backupDomainFilter) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadBackups = async () => {
      setBackupsLoading(true);
      setBackupsError('');

      try {
        const response = await fetch(`/api/backups?domain=${encodeURIComponent(backupDomainFilter)}`, {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load backups');
        }

        if (alive) {
          setBackups(Array.isArray(payload?.backups) ? payload.backups : []);
        }
      } catch (error) {
        if (alive) {
          setBackups([]);
          setBackupsError(error?.message || 'Failed to load backups');
        }
      } finally {
        if (alive) {
          setBackupsLoading(false);
        }
      }
    };

    loadBackups();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, backupDomainFilter]);

  React.useEffect(() => {
    if (activeSection !== 'backup' || !backupDomainFilter) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadBackupRules = async () => {
      setBackupRulesLoading(true);
      setBackupRulesError('');

      try {
        const response = await fetch(`/api/backup-rules?domain=${encodeURIComponent(backupDomainFilter)}`, {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load backups rule');
        }

        if (alive) {
          setBackupRules(Array.isArray(payload?.rules) ? payload.rules : []);
        }
      } catch (error) {
        if (alive) {
          setBackupRules([]);
          setBackupRulesError(error?.message || 'Failed to load backups rule');
        }
      } finally {
        if (alive) {
          setBackupRulesLoading(false);
        }
      }
    };

    loadBackupRules();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, backupDomainFilter]);

  React.useEffect(() => {
    if (activeSection !== 'dns' || !dnsDomainFilter) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadDnsRecords = async () => {
      setDnsRecordsLoading(true);
      setDnsRecordsError('');

      try {
        const response = await fetch(`/api/dns/records?domain=${encodeURIComponent(dnsDomainFilter)}`, {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load DNS recordss');
        }

        if (alive) {
          setDnsRecords(Array.isArray(payload?.records) ? payload.records : []);
        }
      } catch (error) {
        if (alive) {
          setDnsRecordsError(error?.message || 'Failed to load DNS recordss');
        }
      } finally {
        if (alive) {
          setDnsRecordsLoading(false);
        }
      }
    };

    loadDnsRecords();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, dnsDomainFilter]);

  React.useEffect(() => {
    if (activeSection !== 'email') {
      return undefined;
    }

    setMailAccounts([]);
    setMailAccountsError('');
    setSelectedMailbox(null);
    setMailboxDraftPassword('');
    setMailDomains([]);
    setMailDomainFilter('');

    let alive = true;
    const controller = new AbortController();

    const loadMailDomains = async () => {
      try {
        const response = await fetch('/api/mail/domains', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load domain email');
        }

        if (alive) {
          setMailDomains(Array.isArray(payload?.domains) ? payload.domains : []);
        }
      } catch (error) {
        if (alive) {
          setMailDomains([]);
          setMailDomainFilter('');
        }
      }
    };

    loadMailDomains();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection]);

  React.useEffect(() => {
    if (activeSection !== 'ssh' || !session?.is_admin) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadSSH = async () => {
      setSshStatusLoading(true);
      setSshKeysLoading(true);
      setSshStatusError('');
      setSshKeysError('');

      try {
        const [statusResponse, keysResponse] = await Promise.all([
          fetch('/api/ssh/status', {
            credentials: 'include',
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          }),
          fetch('/api/ssh/keys', {
            credentials: 'include',
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          }),
        ]);

        const statusPayload = await statusResponse.json().catch(() => null);
        const keysPayload = await keysResponse.json().catch(() => null);

        if (!statusResponse.ok) {
          throw new Error(statusPayload?.error || 'Failed to load status SSH');
        }
        if (!keysResponse.ok) {
          throw new Error(keysPayload?.error || 'Failed to load SSH keys');
        }

        if (alive) {
          setSshStatus(statusPayload);
          setSshKeys(Array.isArray(keysPayload?.keys) ? keysPayload.keys : []);
        }
      } catch (error) {
        if (alive) {
          setSshStatusError(error?.message || 'Failed to load SSH');
          setSshKeysError(error?.message || 'Failed to load SSH keys');
          setSshStatus(null);
          setSshKeys([]);
        }
      } finally {
        if (alive) {
          setSshStatusLoading(false);
          setSshKeysLoading(false);
        }
      }
    };

    loadSSH();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, session?.is_admin]);

  React.useEffect(() => {
    if (activeSection !== 'users' || !session?.is_admin) {
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError('');

      try {
        const response = await fetch('/api/admin/users', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load users');
        }

        if (alive) {
          setUsers(Array.isArray(payload?.users) ? payload.users : []);
        }
      } catch (error) {
        if (alive) {
          setUsersError(error?.message || 'Failed to load users');
        }
      } finally {
        if (alive) {
          setUsersLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, session?.is_admin]);

  React.useEffect(() => {
    if (activeSection !== 'email' || !mailDomainFilter) {
      return undefined;
    }

    if (visibleMailDomains.length > 0 && !visibleMailDomains.some((item) => item.domain === mailDomainFilter)) {
      setMailAccounts([]);
      setMailAccountsError('');
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const loadMailAccounts = async () => {
      setMailAccountsLoading(true);
      setMailAccountsError('');

      try {
        const response = await fetch(`/api/mail/accounts?domain=${encodeURIComponent(mailDomainFilter)}`, {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load mailbox');
        }

        if (alive) {
          setMailAccounts(Array.isArray(payload?.accounts) ? payload.accounts : []);
        }
      } catch (error) {
        if (alive) {
          setMailAccountsError(error?.message || 'Failed to load mailbox');
        }
      } finally {
        if (alive) {
          setMailAccountsLoading(false);
        }
      }
    };

    loadMailAccounts();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeSection, mailDomainFilter, visibleMailDomains]);

  const approveUser = React.useCallback(async (email) => {
    setApprovingEmail(email);
    setUsersError('');

    try {
      const response = await fetch('/api/admin/users/approve', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed approve user');
      }

      const refreshResponse = await fetch('/api/admin/users', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const refreshPayload = await refreshResponse.json().catch(() => null);
      if (refreshResponse.ok && Array.isArray(refreshPayload?.users)) {
        setUsers(refreshPayload.users);
      }
    } catch (error) {
      setUsersError(error?.message || 'Failed approve user');
    } finally {
      setApprovingEmail('');
    }
  }, []);

  const refreshSSH = React.useCallback(async () => {
    const [statusResponse, keysResponse] = await Promise.all([
      fetch('/api/ssh/status', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      }),
      fetch('/api/ssh/keys', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      }),
    ]);

    const statusPayload = await statusResponse.json().catch(() => null);
    const keysPayload = await keysResponse.json().catch(() => null);
    if (!statusResponse.ok) {
      throw new Error(statusPayload?.error || 'Failed to load status SSH');
    }
    if (!keysResponse.ok) {
      throw new Error(keysPayload?.error || 'Failed to load SSH keys');
    }

    setSshStatus(statusPayload);
    setSshKeys(Array.isArray(keysPayload?.keys) ? keysPayload.keys : []);
  }, []);

  const submitSSHKey = React.useCallback(async (event) => {
    event.preventDefault();
    setSshSaving(true);
    setSshStatusError('');
    setSshKeysError('');

    try {
      const response = await fetch('/api/ssh/keys', {
        method: sshForm.id ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: sshForm.id,
          title: sshForm.title,
          public_key: sshForm.publicKey,
          enabled: sshForm.enabled,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save SSH key');
      }

      setSshForm({ id: 0, title: '', publicKey: '', enabled: true });
      await refreshSSH();
    } catch (error) {
      setSshKeysError(error?.message || 'Failed to save SSH key');
    } finally {
      setSshSaving(false);
    }
  }, [refreshSSH, sshForm.enabled, sshForm.id, sshForm.publicKey, sshForm.title]);

  const toggleSSHKey = React.useCallback(async (item, enabled) => {
    setSshSaving(true);
    setSshStatusError('');
    setSshKeysError('');

    try {
      const response = await fetch('/api/ssh/keys', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: item.id,
          title: item.title,
          public_key: item.public_key,
          enabled,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update SSH key');
      }

      await refreshSSH();
    } catch (error) {
      setSshKeysError(error?.message || 'Failed to update SSH key');
    } finally {
      setSshSaving(false);
    }
  }, [refreshSSH]);

  const deleteSSHKey = React.useCallback(async (item) => {
    const confirmed = window.confirm(`Delete SSH key ${item.title || item.id}?`);
    if (!confirmed) {
      return;
    }

    setSshDeleting(String(item.id));
    setSshStatusError('');
    setSshKeysError('');

    try {
      const response = await fetch('/api/ssh/keys/delete', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id: item.id }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete SSH key');
      }

      await refreshSSH();
    } catch (error) {
      setSshKeysError(error?.message || 'Failed to delete SSH key');
    } finally {
      setSshDeleting('');
    }
  }, [refreshSSH]);

  const editSSHKey = React.useCallback((item) => {
    setSshForm({
      id: item.id,
      title: item.title || '',
      publicKey: item.public_key || '',
      enabled: item.enabled !== false,
    });
  }, []);

  const refreshFtpAccounts = React.useCallback(async () => {
    const response = await fetch('/api/ftp/accounts', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(payload?.error || 'Failed to load FTP accounts');
      error.status = response.status;
      throw error;
    }
    setFtpAccounts(Array.isArray(payload?.items) ? payload.items : []);
  }, []);

  const refreshShellSessions = React.useCallback(async () => {
    const response = await fetch('/api/shell/sessions', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(payload?.error || 'Failed to load shell sessions');
      error.status = response.status;
      throw error;
    }
    const items = Array.isArray(payload?.items) ? payload.items : [];
    setShellSessions(items);
    if (items.length > 0 && !items.some((item) => String(item.id) === String(selectedShellSession?.id || ''))) {
      setSelectedShellSession(items[0]);
    }
  }, [selectedShellSession?.id]);

  const submitFtpAccount = React.useCallback(async (event) => {
    event.preventDefault();
    setCreatingFtpAccount(true);
    setFtpAccountsError('');

    try {
      const response = await fetch('/api/ftp/accounts', {
        method: ftpForm.id ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: ftpForm.id,
          site_target: ftpForm.siteTarget,
          username: ftpForm.username,
          password: ftpForm.password,
          active: ftpForm.active,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save FTP account');
      }

      setFtpForm({ id: 0, siteTarget: ftpForm.siteTarget, username: '', password: '', active: true });
      await refreshFtpAccounts();
      setPanelToast({
        title: ftpForm.id ? 'FTP updated' : 'FTP created',
        message: `${ftpForm.username || 'Account'} saved for ${ftpForm.siteTarget}`,
        tone: 'success',
      });
    } catch (error) {
      setFtpAccountsError(error?.message || 'Failed to save FTP account');
      setPanelToast({
        title: 'Failed simpan FTP',
        message: error?.message || 'Failed to save FTP account',
        tone: 'error',
      });
    } finally {
      setCreatingFtpAccount(false);
    }
  }, [ftpForm.active, ftpForm.id, ftpForm.password, ftpForm.siteTarget, ftpForm.username, refreshFtpAccounts]);

  const deleteFtpAccount = React.useCallback(async (item) => {
    const confirmed = window.confirm(`Delete FTP account ${item.username}?`);
    if (!confirmed) {
      return;
    }

    setDeletingFtpAccount(String(item.id));
    setFtpAccountsError('');

    try {
      const response = await fetch(`/api/ftp/accounts?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete FTP account');
      }
      await refreshFtpAccounts();
      if (String(selectedFtpAccount?.id || '') === String(item.id)) {
        setSelectedFtpAccount(null);
      }
      setPanelToast({
        title: 'FTP deleted',
        message: item.username,
        tone: 'success',
      });
    } catch (error) {
      setFtpAccountsError(error?.message || 'Failed to delete FTP account');
      setPanelToast({
        title: 'Failed to delete FTP account',
        message: error?.message || 'Failed to delete FTP account',
        tone: 'error',
      });
    } finally {
      setDeletingFtpAccount('');
    }
  }, [refreshFtpAccounts, selectedFtpAccount?.id]);

  const submitShellSession = React.useCallback(async (event) => {
    event.preventDefault();
    setCreatingShellSession(true);
    setShellSessionsError('');

    try {
      const response = await fetch('/api/shell/sessions', {
        method: shellForm.id ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: shellForm.id,
          site_target: shellForm.siteTarget,
          name: shellForm.name,
          active: shellForm.active,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save shell session');
      }

      setShellForm({ id: 0, siteTarget: shellForm.siteTarget, name: '', active: true });
      await refreshShellSessions();
      setPanelToast({
        title: shellForm.id ? 'Shell updated' : 'Shell created',
        message: `${shellForm.name || 'Session'} saved for ${shellForm.siteTarget}`,
        tone: 'success',
      });
    } catch (error) {
      setShellSessionsError(error?.message || 'Failed to save shell session');
      setPanelToast({
        title: 'Failed simpan shell',
        message: error?.message || 'Failed to save shell session',
        tone: 'error',
      });
    } finally {
      setCreatingShellSession(false);
    }
  }, [refreshShellSessions, shellForm.active, shellForm.id, shellForm.name, shellForm.siteTarget]);

  const deleteShellSession = React.useCallback(async (item) => {
    const confirmed = window.confirm(`Delete shell session ${item.name || item.site_target}?`);
    if (!confirmed) {
      return;
    }

    setDeletingShellSession(String(item.id));
    setShellSessionsError('');

    try {
      const response = await fetch(`/api/shell/sessions?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete shell session');
      }
      await refreshShellSessions();
      if (String(selectedShellSession?.id || '') === String(item.id)) {
        setSelectedShellSession(null);
        setShellLogs([]);
        setShellOutput('');
      }
      setPanelToast({
        title: 'Shell deleted',
        message: item.name || item.site_target,
        tone: 'success',
      });
    } catch (error) {
      setShellSessionsError(error?.message || 'Failed to delete shell session');
      setPanelToast({
        title: 'Failed to delete shell session',
        message: error?.message || 'Failed to delete shell session',
        tone: 'error',
      });
    } finally {
      setDeletingShellSession('');
    }
  }, [refreshShellSessions, selectedShellSession?.id]);

  const executeShellCommand = React.useCallback(async (event) => {
    event.preventDefault();
    if (!selectedShellSession?.id || !shellCommand.trim()) {
      return;
    }

    setShellCommandRunning(true);
    setShellLogsError('');

    try {
      const response = await fetch('/api/shell/execute', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          session_id: selectedShellSession.id,
          command: shellCommand,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed menjalankan shell command');
      }

      setShellCommand('');
      setShellOutput(payload?.output || '');
      setShellExitCode(Number(payload?.exit_code || 0));
      await refreshShellSessions();
      const logsResponse = await fetch(`/api/shell/logs?session_id=${encodeURIComponent(selectedShellSession.id)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const logsPayload = await logsResponse.json().catch(() => null);
      if (logsResponse.ok) {
        setShellLogs(Array.isArray(logsPayload?.items) ? logsPayload.items : []);
      }
      setPanelToast({
        title: 'Shell executed',
        message: selectedShellSession.site_target,
        tone: 'success',
      });
    } catch (error) {
      setShellLogsError(error?.message || 'Failed menjalankan shell command');
      setPanelToast({
        title: 'Failed jalankan shell',
        message: error?.message || 'Failed menjalankan shell command',
        tone: 'error',
      });
    } finally {
      setShellCommandRunning(false);
    }
  }, [refreshShellSessions, selectedShellSession?.id, selectedShellSession?.site_target, shellCommand]);

  const submitDomain = React.useCallback(async (event) => {
    event.preventDefault();
    setAddingDomain(true);
    setDomainsError('');

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: domainForm.domain,
          project_name: domainForm.projectName,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed menambah domain');
      }

      setDomainForm({ domain: '', projectName: '' });
      const refreshResponse = await fetch('/api/domains', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const refreshPayload = await refreshResponse.json().catch(() => null);
      if (refreshResponse.ok && Array.isArray(refreshPayload?.domains)) {
        setDomains(refreshPayload.domains);
      }
    } catch (error) {
      setDomainsError(error?.message || 'Failed menambah domain');
    } finally {
      setAddingDomain(false);
    }
  }, [domainForm.domain, domainForm.projectName]);

  const deleteDomain = React.useCallback(async (domain) => {
    const confirmed = window.confirm(
      `Delete domain ${domain}? This will remove the DNS zone, public folder, and server configuration.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingDomain(domain);
    setDomainsError('');

    try {
      const response = await fetch('/api/domains/delete', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete domain');
      }

      setDomains((current) => current.filter((item) => item.domain !== domain));
      if (selectedDomain === domain) {
        setSelectedDomain(null);
        setDomainDetail(null);
        setDomainDraft('');
      }
    } catch (error) {
      setDomainsError(error?.message || 'Failed to delete domain');
    } finally {
      setDeletingDomain('');
    }
  }, [selectedDomain]);

  const submitSubdomain = React.useCallback(async (event) => {
    event.preventDefault();
    setCreatingSubdomain(true);
    setSubdomainsError('');
    setSubdomainInstallState('running');
    setSubdomainInstallPhase(0);
    setSubdomainInstallTotal(subdomainInstallSteps.length);
    setSubdomainInstallJobId('');
    setSubdomainInstallLogs([]);
    setShowAllSubdomainLogs(false);
    setPanelToast(null);
    setSubdomainInstallStartedAt(Date.now());
    const targetLabel =
      siteTargetKind === 'domain'
        ? subdomainForm.domain
        : `${subdomainForm.subdomain}.${subdomainForm.domain}`;
    setSubdomainInstallMessage(`Starting installation of ${subdomainForm.appType || 'plain'} for ${targetLabel}...`);

    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          target_kind: siteTargetKind,
          domain: subdomainForm.domain,
          subdomain: siteTargetKind === 'subdomain' ? subdomainForm.subdomain : '',
          project_name: subdomainForm.projectName,
          app_type: subdomainForm.appType,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create site');
      }

      const jobId = String(payload?.job_id || '').trim();
      if (!jobId) {
        throw new Error('installation job not found');
      }

      setSubdomainInstallJobId(jobId);
      setSubdomainInstallMessage(payload?.message || 'Install job created, waiting for server updates...');

      let lastFingerprint = '';
      const pollJob = async () => {
        while (true) {
          const jobResponse = await fetch(`/api/subdomain-jobs?id=${encodeURIComponent(jobId)}`, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
          });
          const jobPayload = await jobResponse.json().catch(() => null);
          if (!jobResponse.ok) {
            throw new Error(jobPayload?.error || 'Failed to load progress instalasi');
          }

          const job = jobPayload?.job || null;
          if (job) {
            const fingerprint = [job.status, job.step_index, job.step_label, job.message, job.error_message].join('|');
            if (fingerprint !== lastFingerprint) {
              lastFingerprint = fingerprint;
              setSubdomainInstallLogs((current) => [
                ...current,
                {
                  id: `${Date.now()}-${current.length}`,
                  time: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }),
                  label: job.step_label || 'Installer',
                  message: job.message || job.error_message || 'Memproses...',
                  tone: job.status === 'error' ? 'error' : job.status === 'success' ? 'success' : 'running',
                },
              ]);
            }
            setSubdomainInstallTotal(job.step_total || subdomainInstallSteps.length);
            setSubdomainInstallPhase(Math.max(0, Math.min(job.step_index || 0, Math.max((job.step_total || subdomainInstallSteps.length) - 1, 0))));
            setSubdomainInstallMessage(job.message || job.step_label || 'Installer berjalan...');
            if (job.status === 'canceled') {
              setSubdomainInstallState('error');
              setSubdomainInstallMessage(job.message || 'The installer was canceled by the user.');
              break;
            }
            if (job.status === 'success') {
              setSubdomainInstallState('success');
              setSubdomainInstallMessage(job.message || 'Site created successfully.');
              setSubdomainInstallStartedAt(null);
              setPanelToast({
                tone: 'success',
                title: 'Site created successfully',
                message: `${payload?.full_domain || targetLabel} is ready to use.`,
              });
              break;
            }
            if (job.status === 'error') {
              setSubdomainInstallStartedAt(null);
              throw new Error(job.error_message || job.message || 'Failed to create site');
            }
          }

          await new Promise((resolve) => window.setTimeout(resolve, 1800));
        }
      };

      await pollJob();

      setSubdomainForm((current) => ({
        ...current,
        subdomain: '',
        projectName: '',
        appType: 'wordpress',
      }));

      const refreshDomain = subdomainForm.domain;
      const [domainsResponse, subdomainsResponse] = await Promise.all([
        fetch('/api/domains', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }),
        fetch(`/api/subdomains?domain=${encodeURIComponent(refreshDomain)}`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }),
      ]);
      const domainsPayload = await domainsResponse.json().catch(() => null);
      const subdomainsPayload = await subdomainsResponse.json().catch(() => null);
      if (domainsResponse.ok && Array.isArray(domainsPayload?.domains)) {
        setDomains(domainsPayload.domains);
      }
      if (subdomainsResponse.ok && Array.isArray(subdomainsPayload?.subdomains)) {
        setSubdomains(subdomainsPayload.subdomains);
        const created = subdomainsPayload.subdomains.find((item) => item.full_domain === payload?.full_domain);
        if (created) {
          setSelectedSubdomain(created);
        }
      }
      if (siteTargetKind === 'domain') {
        const createdDomain = domainsPayload?.domains?.find((item) => item.domain === payload?.full_domain);
        if (createdDomain) {
          setSelectedDomain(createdDomain.domain);
          setDomainDetail(createdDomain);
          setDomainDraft(createdDomain.project_name || '');
        }
      }
    } catch (error) {
      setSubdomainsError(error?.message || 'Failed to create site');
      setSubdomainInstallState('error');
      setSubdomainInstallMessage(error?.message || 'Failed to create site');
      setSubdomainInstallStartedAt(null);
      setPanelToast({
        tone: 'error',
        title: 'Installation failed',
        message: error?.message || 'Failed to create site',
      });
    } finally {
      setCreatingSubdomain(false);
    }
  }, [
    siteTargetKind,
    subdomainDomainFilter,
    subdomainForm.appType,
    subdomainForm.domain,
    subdomainForm.projectName,
    subdomainForm.subdomain,
    subdomainInstallSteps.length,
  ]);

  const cancelSubdomainInstall = React.useCallback(async () => {
    if (!subdomainInstallJobId || subdomainInstallState !== 'running') {
      return;
    }

    try {
      const response = await fetch(`/api/subdomain-jobs/cancel?id=${encodeURIComponent(subdomainInstallJobId)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to cancel the installer');
      }

      setSubdomainInstallState('error');
      setSubdomainInstallMessage('The installer was canceled by the user.');
      setSubdomainInstallStartedAt(null);
      setPanelToast({
        tone: 'error',
        title: 'Installer canceled',
        message: 'The subdomain installation process was stopped.',
      });
      setSubdomainInstallLogs((current) => [
        ...current,
        {
          id: `${Date.now()}-cancel`,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          label: 'Cancel',
          message: 'The installer was canceled by the user.',
          tone: 'error',
        },
      ]);
    } catch (error) {
      setSubdomainsError(error?.message || 'Failed to cancel the installer');
    }
  }, [subdomainInstallJobId, subdomainInstallState]);

  const saveSubdomainProject = React.useCallback(async () => {
    if (!selectedSubdomain) {
      return;
    }

    setSavingSubdomain(selectedSubdomain.full_domain);
    setSubdomainsError('');

    try {
      const response = await fetch('/api/subdomains', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: selectedSubdomain.domain,
          subdomain: selectedSubdomain.subdomain,
          project_name: selectedSubdomain.project_name,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update subdomain');
      }

      const refreshResponse = await fetch(`/api/subdomains?domain=${encodeURIComponent(subdomainDomainFilter || selectedSubdomain.domain)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const refreshPayload = await refreshResponse.json().catch(() => null);
      if (refreshResponse.ok && Array.isArray(refreshPayload?.subdomains)) {
        setSubdomains(refreshPayload.subdomains);
        const updated = refreshPayload.subdomains.find((item) => item.full_domain === selectedSubdomain.full_domain);
        if (updated) {
          setSelectedSubdomain(updated);
        }
      }
    } catch (error) {
      setSubdomainsError(error?.message || 'Failed to update subdomain');
    } finally {
      setSavingSubdomain('');
    }
  }, [selectedSubdomain, subdomainDomainFilter]);

  const saveWordPressPassword = React.useCallback(async (targetKind, target) => {
    if (!target) {
      return;
    }

    const nextPassword = String(wordpressPasswordDraft || '').trim();
    if (!nextPassword) {
      setPanelToast({
        tone: 'error',
        title: 'Password kosong',
        message: 'Enter a new WordPress password first.',
      });
      return;
    }

    const domain = String(target.domain || '').trim();
    const subdomain = targetKind === 'subdomain' ? String(target.subdomain || '').trim() : '';
    const targetLabel = targetKind === 'domain' ? domain : target.full_domain || `${subdomain}.${domain}`;
    const targetKey = targetKind === 'domain' ? domain : target.full_domain || `${subdomain}.${domain}`;

    setSavingWordPressPassword(targetKey);
    setDomainsError('');
    setSubdomainsError('');

    try {
      const response = await fetch('/api/sites/wordpress-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          target_kind: targetKind,
          domain,
          subdomain,
          app_type: 'wordpress',
          password: nextPassword,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update the WordPress password');
      }

      const refreshDomain = domain || subdomainDomainFilter;
      const [domainsResponse, subdomainsResponse] = await Promise.all([
        fetch('/api/domains', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }),
        refreshDomain
          ? fetch(`/api/subdomains?domain=${encodeURIComponent(refreshDomain)}`, {
              credentials: 'include',
              headers: { Accept: 'application/json' },
            })
          : Promise.resolve(null),
      ]);

      const domainsPayload = await domainsResponse.json().catch(() => null);
      if (domainsResponse.ok && Array.isArray(domainsPayload?.domains)) {
        setDomains(domainsPayload.domains);
        if (targetKind === 'domain') {
          const updatedDomain = domainsPayload.domains.find((item) => item.domain === domain);
          if (updatedDomain) {
            setSelectedDomain(updatedDomain.domain);
            setDomainDetail(updatedDomain);
            setDomainDraft(updatedDomain.project_name || '');
          }
        }
      }

      if (subdomainsResponse && subdomainsResponse.ok) {
        const subdomainsPayload = await subdomainsResponse.json().catch(() => null);
        if (Array.isArray(subdomainsPayload?.subdomains)) {
          setSubdomains(subdomainsPayload.subdomains);
          setSubdomainDomainFilter(refreshDomain);
          if (targetKind === 'subdomain') {
            const updatedSubdomain = subdomainsPayload.subdomains.find((item) => item.full_domain === target.full_domain);
            if (updatedSubdomain) {
              setSelectedSubdomain(updatedSubdomain);
            }
          }
        }
      }

      setWordPressPasswordDraft('');
      setPanelToast({
        tone: 'success',
        title: 'WordPress password updated',
        message: `Admin password for ${targetLabel} updated successfully.`,
      });
    } catch (error) {
      const message = error?.message || 'Failed to update the WordPress password';
      setPanelToast({
        tone: 'error',
        title: 'Failed to update password',
        message,
      });
      if (targetKind === 'domain') {
        setDomainsError(message);
      } else {
        setSubdomainsError(message);
      }
    } finally {
      setSavingWordPressPassword('');
    }
  }, [subdomainDomainFilter, wordpressPasswordDraft]);

  const repairWordPressPermissions = React.useCallback(async (targetKind, target) => {
    if (!target) {
      return;
    }

    const domain = String(target.domain || '').trim();
    const subdomain = targetKind === 'subdomain' ? String(target.subdomain || '').trim() : '';
    const targetLabel = targetKind === 'domain' ? domain : target.full_domain || `${subdomain}.${domain}`;
    const targetKey = targetKind === 'domain' ? domain : target.full_domain || `${subdomain}.${domain}`;

    setRepairingWordPress(targetKey);
    setDomainsError('');
    setSubdomainsError('');

    try {
      const response = await fetch('/api/sites/wordpress-repair', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          target_kind: targetKind,
          domain,
          subdomain,
          app_type: 'wordpress',
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed memperbaiki permission WordPress');
      }

      const refreshDomain = domain || subdomainDomainFilter;
      const [domainsResponse, subdomainsResponse] = await Promise.all([
        fetch('/api/domains', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }),
        refreshDomain
          ? fetch(`/api/subdomains?domain=${encodeURIComponent(refreshDomain)}`, {
              credentials: 'include',
              headers: { Accept: 'application/json' },
            })
          : Promise.resolve(null),
      ]);

      const domainsPayload = await domainsResponse.json().catch(() => null);
      if (domainsResponse.ok && Array.isArray(domainsPayload?.domains)) {
        setDomains(domainsPayload.domains);
        if (targetKind === 'domain') {
          const updatedDomain = domainsPayload.domains.find((item) => item.domain === domain);
          if (updatedDomain) {
            setSelectedDomain(updatedDomain.domain);
            setDomainDetail(updatedDomain);
            setDomainDraft(updatedDomain.project_name || '');
          }
        }
      }

      if (subdomainsResponse && subdomainsResponse.ok) {
        const subdomainsPayload = await subdomainsResponse.json().catch(() => null);
        if (Array.isArray(subdomainsPayload?.subdomains)) {
          setSubdomains(subdomainsPayload.subdomains);
          setSubdomainDomainFilter(refreshDomain);
          if (targetKind === 'subdomain') {
            const updatedSubdomain = subdomainsPayload.subdomains.find((item) => item.full_domain === target.full_domain);
            if (updatedSubdomain) {
              setSelectedSubdomain(updatedSubdomain);
            }
          }
        }
      }

      setPanelToast({
        tone: 'success',
        title: 'Permission WordPress diperbaiki',
        message: `WordPress filesystem for ${targetLabel} has been set to direct.`,
      });
    } catch (error) {
      const message = error?.message || 'Failed memperbaiki permission WordPress';
      setPanelToast({
        tone: 'error',
        title: 'Failed repair WordPress',
        message,
      });
      if (targetKind === 'domain') {
        setDomainsError(message);
      } else {
        setSubdomainsError(message);
      }
    } finally {
      setRepairingWordPress('');
    }
  }, [subdomainDomainFilter]);

  const deleteSubdomain = React.useCallback(async (item) => {
    if (!item?.subdomain) {
      return;
    }

    const confirmed = window.confirm(`Delete subdomain ${item.full_domain}? This will remove the folder, DNS, and server configuration.`);
    if (!confirmed) {
      return;
    }

    setDeletingSubdomain(item.full_domain);
    setSubdomainsError('');

    try {
      const response = await fetch('/api/subdomains', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: item.domain,
          subdomain: item.subdomain,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete subdomain');
      }

      setSubdomains((current) => current.filter((row) => row.full_domain !== item.full_domain));
      if (selectedSubdomain?.full_domain === item.full_domain) {
        setSelectedSubdomain(null);
      }
    } catch (error) {
      setSubdomainsError(error?.message || 'Failed to delete subdomain');
    } finally {
      setDeletingSubdomain('');
    }
  }, [selectedSubdomain]);

  const submitMailbox = React.useCallback(async (event) => {
    event.preventDefault();
    setCreatingMailbox(true);
    setMailAccountsError('');

    try {
      const response = await fetch('/api/mail/accounts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: mailDomainFilter,
          local_part: mailboxForm.localPart,
          password: mailboxForm.password,
          enabled: mailboxForm.enabled,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create mailbox');
      }

      setMailboxForm({ localPart: '', password: '', enabled: true });
      const refreshResponse = await fetch(`/api/mail/accounts?domain=${encodeURIComponent(mailDomainFilter)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const refreshPayload = await refreshResponse.json().catch(() => null);
      if (refreshResponse.ok && Array.isArray(refreshPayload?.accounts)) {
        setMailAccounts(refreshPayload.accounts);
      }
    } catch (error) {
      setMailAccountsError(error?.message || 'Failed to create mailbox');
    } finally {
      setCreatingMailbox(false);
    }
  }, [mailDomainFilter, mailboxForm.enabled, mailboxForm.localPart, mailboxForm.password]);

  const saveMailbox = React.useCallback(async (email, payload) => {
    setSavingMailbox(email);
    setMailAccountsError('');

    try {
      const response = await fetch('/api/mail/accounts', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, ...payload }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || 'Failed to update mailbox');
      }

      const refreshResponse = await fetch(`/api/mail/accounts?domain=${encodeURIComponent(mailDomainFilter)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const refreshPayload = await refreshResponse.json().catch(() => null);
      if (refreshResponse.ok && Array.isArray(refreshPayload?.accounts)) {
        setMailAccounts(refreshPayload.accounts);
      }

      if (selectedMailbox?.email === email) {
        const refreshed = refreshPayload?.accounts?.find((item) => item.email === email);
        if (refreshed) {
          setSelectedMailbox(refreshed);
          setMailboxDraftPassword('');
        }
      }
    } catch (error) {
      setMailAccountsError(error?.message || 'Failed to update mailbox');
    } finally {
      setSavingMailbox('');
    }
  }, [mailDomainFilter, selectedMailbox?.email]);

  const deleteMailbox = React.useCallback(async (email) => {
    const confirmed = window.confirm(`Delete mailbox ${email}?`);
    if (!confirmed) return;

    setDeletingMailbox(email);
    setMailAccountsError('');

    try {
      const response = await fetch('/api/mail/accounts', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || 'Failed to delete mailbox');
      }

      setMailAccounts((current) => current.filter((item) => item.email !== email));
      if (selectedMailbox?.email === email) {
        setSelectedMailbox(null);
        setMailboxDraftPassword('');
      }
    } catch (error) {
      setMailAccountsError(error?.message || 'Failed to delete mailbox');
    } finally {
      setDeletingMailbox('');
    }
  }, [selectedMailbox?.email]);

  const submitBackup = React.useCallback(async (event) => {
    event.preventDefault();
    if (!backupDomainFilter) {
      return;
    }

    setCreatingBackup(true);
    setBackupsError('');

    try {
      const response = await fetch('/api/backups', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: backupDomainFilter,
          scope: backupScope,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create backup');
      }

      const refreshResponse = await fetch(`/api/backups?domain=${encodeURIComponent(backupDomainFilter)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const refreshPayload = await refreshResponse.json().catch(() => null);
      if (refreshResponse.ok && Array.isArray(refreshPayload?.backups)) {
        setBackups(refreshPayload.backups);
      }
    } catch (error) {
      setBackupsError(error?.message || 'Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  }, [backupDomainFilter, backupScope]);

  const deleteBackup = React.useCallback(async (item) => {
    if (!item?.id) {
      return;
    }

    const confirmed = window.confirm(`Delete backup ${item.file_name}?`);
    if (!confirmed) {
      return;
    }

    setDeletingBackup(item.id);
    setBackupsError('');

    try {
      const response = await fetch('/api/backups', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id: item.id }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete backup');
      }

      setBackups((current) => current.filter((row) => row.id !== item.id));
    } catch (error) {
      setBackupsError(error?.message || 'Failed to delete backup');
    } finally {
      setDeletingBackup('');
    }
  }, []);

  const submitBackupRule = React.useCallback(async (event) => {
    event.preventDefault();
    if (!backupDomainFilter) {
      return;
    }

    setCreatingBackupRule(true);
    setBackupRulesError('');

    try {
      const response = await fetch('/api/backup-rules', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: backupDomainFilter,
          scope: backupRuleScope,
          frequency: backupRuleFrequency,
          hour: Number.parseInt(backupRuleHour, 10),
          minute: Number.parseInt(backupRuleMinute, 10),
          retention_count: Number.parseInt(backupRuleRetention, 10),
          enabled: backupRuleEnabled,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create backup rule');
      }

      const refreshResponse = await fetch(`/api/backup-rules?domain=${encodeURIComponent(backupDomainFilter)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const refreshPayload = await refreshResponse.json().catch(() => null);
      if (refreshResponse.ok && Array.isArray(refreshPayload?.rules)) {
        setBackupRules(refreshPayload.rules);
      }
      showPanelToast('Automatic backup created', 'Backup rule saved successfully.');
    } catch (error) {
      setBackupRulesError(error?.message || 'Failed to create backup rule');
    } finally {
      setCreatingBackupRule(false);
    }
  }, [backupDomainFilter, backupRuleEnabled, backupRuleFrequency, backupRuleHour, backupRuleMinute, backupRuleRetention, backupRuleScope]);

  const deleteBackupRule = React.useCallback(async (item) => {
    if (!item?.id) {
      return;
    }

    const confirmed = window.confirm(`Delete backup schedule for ${item.domain}?`);
    if (!confirmed) {
      return;
    }

    setDeletingBackupRule(item.id);
    setBackupRulesError('');

    try {
      const response = await fetch('/api/backup-rules', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id: item.id }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete backup rule');
      }

      setBackupRules((current) => current.filter((row) => row.id !== item.id));
      showPanelToast('Automatic backup deleted', 'Backup rule deleted successfully.');
    } catch (error) {
      setBackupRulesError(error?.message || 'Failed to delete backup rule');
    } finally {
      setDeletingBackupRule('');
    }
  }, []);

  const submitDnsRecord = React.useCallback(async (event) => {
    event.preventDefault();
    if (!dnsDomainFilter) return;

    setDnsSaving(true);
    setDnsRecordsError('');

    try {
      const response = await fetch('/api/dns/records', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: dnsDomainFilter,
          name: dnsForm.name,
          type: dnsForm.type,
          ttl: Number(dnsForm.ttl) || 3600,
          content: dnsForm.content,
          priority: Number(dnsForm.priority) || 10,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save DNS record');
      }

      setDnsRecords(Array.isArray(payload?.records) ? payload.records : []);
      setDnsForm({ name: '', type: 'A', ttl: '3600', content: '', priority: '10' });
      setSelectedDnsRecord(null);
    } catch (error) {
      setDnsRecordsError(error?.message || 'Failed to save DNS record');
    } finally {
      setDnsSaving(false);
    }
  }, [dnsDomainFilter, dnsForm.content, dnsForm.name, dnsForm.priority, dnsForm.ttl, dnsForm.type]);

  const updateDnsRecord = React.useCallback(async () => {
    if (!dnsDomainFilter || !selectedDnsRecord) return;

    setDnsSaving(true);
    setDnsRecordsError('');

    try {
      const response = await fetch('/api/dns/records', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: dnsDomainFilter,
          name: dnsForm.name || selectedDnsRecord.name,
          type: dnsForm.type || selectedDnsRecord.type,
          ttl: Number(dnsForm.ttl) || selectedDnsRecord.ttl || 3600,
          content: dnsForm.content || selectedDnsRecord.content,
          priority: Number(dnsForm.priority) || selectedDnsRecord.priority || 10,
          original_name: selectedDnsRecord.name,
          original_type: selectedDnsRecord.type,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update DNS record');
      }

      setDnsRecords(Array.isArray(payload?.records) ? payload.records : []);
      setSelectedDnsRecord(null);
      setDnsForm({ name: '', type: 'A', ttl: '3600', content: '', priority: '10' });
    } catch (error) {
      setDnsRecordsError(error?.message || 'Failed to update DNS record');
    } finally {
      setDnsSaving(false);
    }
  }, [dnsDomainFilter, dnsForm.content, dnsForm.name, dnsForm.priority, dnsForm.ttl, dnsForm.type, selectedDnsRecord]);

  const deleteDnsRecord = React.useCallback(async (record) => {
    const confirmed = window.confirm(`Delete DNS record ${record.name} ${record.type}?`);
    if (!confirmed) return;

    setDnsDeleting(`${record.name}:${record.type}`);
    setDnsRecordsError('');

    try {
      const response = await fetch('/api/dns/records', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: dnsDomainFilter,
          name: record.name,
          type: record.type,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete DNS record');
      }

      setDnsRecords(Array.isArray(payload?.records) ? payload.records : []);
      if (selectedDnsRecord && selectedDnsRecord.name === record.name && selectedDnsRecord.type === record.type) {
        setSelectedDnsRecord(null);
        setDnsForm({ name: '', type: 'A', ttl: '3600', content: '', priority: '10' });
      }
    } catch (error) {
      setDnsRecordsError(error?.message || 'Failed to delete DNS record');
    } finally {
      setDnsDeleting('');
    }
  }, [dnsDomainFilter, selectedDnsRecord]);

  const issueSslTarget = React.useCallback(async (target) => {
    if (!target?.full_domain) {
      return;
    }

    setSslIssuing(target.full_domain);
    setSslTargetsError('');

    try {
      const response = await fetch('/api/ssl/issue', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          kind: target.kind,
          domain: target.domain,
          subdomain: target.subdomain,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed menerbitkan SSL');
      }

      setSslTargets((current) =>
        current.map((item) =>
          item.full_domain === target.full_domain
            ? {
                ...item,
                certificate_status: payload?.target?.certificate_status || item.certificate_status,
                certificate_path: payload?.target?.certificate_path || item.certificate_path,
                certificate_expires_at: payload?.target?.certificate_expires_at || item.certificate_expires_at,
              }
            : item,
        ),
      );
    } catch (error) {
      setSslTargetsError(error?.message || 'Failed menerbitkan SSL');
    } finally {
      setSslIssuing('');
    }
  }, []);

  const refreshSslTargets = React.useCallback(async () => {
    setSslTargetsLoading(true);
    setSslTargetsError('');
    try {
      const response = await fetch('/api/ssl/targets', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load SSL targets');
      }
      setSslTargets(Array.isArray(payload?.targets) ? payload.targets : []);
    } catch (error) {
      setSslTargetsError(error?.message || 'Failed to load SSL targets');
    } finally {
      setSslTargetsLoading(false);
    }
  }, []);

  const fixMissingSslTargets = React.useCallback(async () => {
    const missing = sslTargets.filter((item) => {
      const status = String(item.certificate_status || '').toLowerCase();
      return status === 'missing' || status === 'unknown' || status === 'expiring';
    });
    if (missing.length === 0) {
      return;
    }

    setSslBulkFixing(true);
    setSslTargetsError('');
    try {
      for (const item of missing) {
        // Sequential so certbot/nginx isn't hit with multiple concurrent runs.
        // eslint-disable-next-line no-await-in-loop
        await issueSslTarget(item);
      }
      await refreshSslTargets();
    } catch (error) {
      setSslTargetsError(error?.message || 'Failed memperbaiki SSL');
    } finally {
      setSslBulkFixing(false);
    }
  }, [issueSslTarget, refreshSslTargets, sslTargets]);

  const submitDatabase = React.useCallback(async (event) => {
    event.preventDefault();
    if (!databaseDomainFilter) return;

    setCreatingDatabase(true);
    setDatabaseError('');

    try {
      const response = await fetch('/api/databases', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: databaseDomainFilter,
          engine: databaseForm.engine,
          name: databaseForm.name,
          username: databaseForm.username,
          password: databaseForm.password,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create database');
      }

      setDatabaseEntries([]);
      const refreshResponse = await fetch(`/api/databases?domain=${encodeURIComponent(databaseDomainFilter)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const refreshPayload = await refreshResponse.json().catch(() => null);
      if (refreshResponse.ok && Array.isArray(refreshPayload?.databases)) {
        setDatabaseEntries(refreshPayload.databases);
      }

      setDatabaseForm((current) => ({
        ...current,
        name: '',
        username: '',
        password: '',
      }));
    } catch (error) {
      setDatabaseError(error?.message || 'Failed to create database');
    } finally {
      setCreatingDatabase(false);
    }
  }, [databaseDomainFilter, databaseForm.engine, databaseForm.name, databaseForm.password, databaseForm.username]);

  const deleteDatabase = React.useCallback(async (item) => {
    const confirmed = window.confirm(`Delete database ${item.engine}:${item.name}?`);
    if (!confirmed) return;

    setDeletingDatabase(`${item.engine}:${item.name}`);
    setDatabaseError('');

    try {
      const response = await fetch('/api/databases', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: item.domain,
          engine: item.engine,
          name: item.name,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete database');
      }

      setDatabaseEntries((current) =>
        current.filter((entry) => !(entry.engine === item.engine && entry.name === item.name)),
      );
      if (selectedDatabase && selectedDatabase.engine === item.engine && selectedDatabase.name === item.name) {
        setSelectedDatabase(null);
      }
    } catch (error) {
      setDatabaseError(error?.message || 'Failed to delete database');
    } finally {
      setDeletingDatabase('');
    }
  }, [selectedDatabase]);

  const resetPackageForm = React.useCallback(() => {
    setPackageForm({
      id: 0,
      name: '',
      description: '',
      priceRupiah: '0',
      billingCycle: 'monthly',
      diskQuotaGb: '10',
      emailQuota: '10',
      subdomainQuota: '5',
      databaseQuota: '2',
      domainQuota: '1',
      featureSsl: true,
      featureBackup: true,
      featureSsh: false,
      featureFileManager: true,
      featureStudio: false,
      featureAutoInstaller: true,
      featureDns: true,
      featureMail: true,
      featurePrioritySupport: false,
      active: true,
    });
    setSelectedPackage(null);
  }, []);

  const submitPackage = React.useCallback(async (event) => {
    event.preventDefault();

    setSavingPackage(true);
    setPackagesError('');

    const payload = {
      id: packageForm.id,
      name: packageForm.name,
      description: packageForm.description,
      price_rupiah: Number(packageForm.priceRupiah) || 0,
      billing_cycle: packageForm.billingCycle,
      disk_quota_gb: Number(packageForm.diskQuotaGb) || 0,
      email_quota: Number(packageForm.emailQuota) || 0,
      subdomain_quota: Number(packageForm.subdomainQuota) || 0,
      database_quota: Number(packageForm.databaseQuota) || 0,
      domain_quota: Number(packageForm.domainQuota) || 0,
      feature_ssl: Boolean(packageForm.featureSsl),
      feature_backup: Boolean(packageForm.featureBackup),
      feature_ssh: Boolean(packageForm.featureSsh),
      feature_file_manager: Boolean(packageForm.featureFileManager),
      feature_studio: Boolean(packageForm.featureStudio),
      feature_auto_installer: Boolean(packageForm.featureAutoInstaller),
      feature_dns: Boolean(packageForm.featureDns),
      feature_mail: Boolean(packageForm.featureMail),
      feature_priority_support: Boolean(packageForm.featurePrioritySupport),
      active: Boolean(packageForm.active),
    };

    try {
      const response = await fetch('/api/packages', {
        method: packageForm.id ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responsePayload?.error || 'Failed to save package');
      }

      const nextPackage = responsePayload?.package || null;
      setPackages((current) => {
        const filtered = current.filter((item) => item.id !== nextPackage?.id);
        return nextPackage ? [nextPackage, ...filtered].sort((left, right) => {
          if (left.active !== right.active) {
            return Number(right.active) - Number(left.active);
          }
          return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
        }) : filtered;
      });
      if (nextPackage) {
        setSelectedPackage(nextPackage);
        setPackageForm({
          id: nextPackage.id || 0,
          name: nextPackage.name || '',
          description: nextPackage.description || '',
          priceRupiah: String(nextPackage.price_rupiah ?? 0),
          billingCycle: nextPackage.billing_cycle || 'monthly',
          diskQuotaGb: String(nextPackage.disk_quota_gb ?? 0),
          emailQuota: String(nextPackage.email_quota ?? 0),
          subdomainQuota: String(nextPackage.subdomain_quota ?? 0),
          databaseQuota: String(nextPackage.database_quota ?? 0),
          domainQuota: String(nextPackage.domain_quota ?? 0),
          featureSsl: Boolean(nextPackage.feature_ssl),
          featureBackup: Boolean(nextPackage.feature_backup),
          featureSsh: Boolean(nextPackage.feature_ssh),
          featureFileManager: Boolean(nextPackage.feature_file_manager),
          featureStudio: Boolean(nextPackage.feature_studio),
          featureAutoInstaller: Boolean(nextPackage.feature_auto_installer),
          featureDns: Boolean(nextPackage.feature_dns),
          featureMail: Boolean(nextPackage.feature_mail),
          featurePrioritySupport: Boolean(nextPackage.feature_priority_support),
          active: Boolean(nextPackage.active),
        });
      }
      pushNotification({
        title: packageForm.id ? 'Package updated' : 'Package created',
        message: nextPackage?.name || packageForm.name,
        tone: 'success',
      });
    } catch (error) {
      setPackagesError(error?.message || 'Failed to save package');
    } finally {
      setSavingPackage(false);
    }
  }, [packageForm, pushNotification]);

  const deletePackage = React.useCallback(async (item) => {
    const confirmed = window.confirm(`Delete plan ${item.name}?`);
    if (!confirmed) {
      return;
    }

    setDeletingPackage(String(item.id));
    setPackagesError('');

    try {
      const response = await fetch('/api/packages', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id: item.id }),
      });

      const responsePayload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responsePayload?.error || 'Failed to delete plan');
      }

      setPackages((current) => current.filter((entry) => entry.id !== item.id));
      if (selectedPackage?.id === item.id) {
        resetPackageForm();
      }
      pushNotification({ title: 'Package deleted', message: item.name, tone: 'success' });
    } catch (error) {
      setPackagesError(error?.message || 'Failed to delete plan');
    } finally {
      setDeletingPackage('');
    }
  }, [pushNotification, resetPackageForm, selectedPackage?.id]);

  const resetBillingForm = React.useCallback(() => {
    const defaultPackage = packages.find((item) => item.active) || packages[0] || null;
    setBillingForm({
      id: 0,
      invoiceNumber: '',
      packageId: defaultPackage ? String(defaultPackage.id) : '',
      customerName: '',
      customerEmail: '',
      domain: '',
      billingCycle: defaultPackage?.billing_cycle || 'monthly',
      amountRupiah: defaultPackage ? String(defaultPackage.price_rupiah ?? 0) : '0',
      status: 'pending',
      dueAt: '',
      periodStartAt: '',
      periodEndAt: '',
      paidAt: '',
      notes: '',
    });
    setSelectedBilling(null);
  }, [packages]);

  const submitBilling = React.useCallback(
    async (event) => {
      event.preventDefault();

      setSavingBilling(true);
      setBillingError('');

      const payload = {
        id: billingForm.id,
        invoice_number: billingForm.invoiceNumber,
        package_id: Number(billingForm.packageId) || 0,
        customer_name: billingForm.customerName,
        customer_email: billingForm.customerEmail,
        domain: billingForm.domain,
        billing_cycle: billingForm.billingCycle,
        amount_rupiah: Number(billingForm.amountRupiah) || 0,
        status: billingForm.status,
        due_at: billingForm.dueAt ? new Date(billingForm.dueAt).toISOString() : '',
        period_start_at: billingForm.periodStartAt ? new Date(billingForm.periodStartAt).toISOString() : '',
        period_end_at: billingForm.periodEndAt ? new Date(billingForm.periodEndAt).toISOString() : '',
        paid_at: billingForm.paidAt ? new Date(billingForm.paidAt).toISOString() : '',
        notes: billingForm.notes,
      };

      try {
        const response = await fetch('/api/billing', {
          method: billingForm.id ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const responsePayload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(responsePayload?.error || 'Failed to save billing');
        }

        const nextBilling = responsePayload?.billing || null;
        setBillingRecords((current) => {
          const filtered = current.filter((item) => item.id !== nextBilling?.id);
          return nextBilling ? [nextBilling, ...filtered].sort((left, right) => {
            const leftDate = new Date(left.created_at).getTime();
            const rightDate = new Date(right.created_at).getTime();
            return rightDate - leftDate;
          }) : filtered;
        });
        if (nextBilling) {
          setSelectedBilling(nextBilling);
          setBillingForm({
            id: nextBilling.id || 0,
            invoiceNumber: nextBilling.invoice_number || '',
            packageId: String(nextBilling.package_id || ''),
            customerName: nextBilling.customer_name || '',
            customerEmail: nextBilling.customer_email || '',
            domain: nextBilling.domain || '',
            billingCycle: nextBilling.billing_cycle || 'monthly',
            amountRupiah: String(nextBilling.amount_rupiah ?? 0),
            status: nextBilling.status || 'pending',
            dueAt: nextBilling.due_at ? nextBilling.due_at.slice(0, 16) : '',
            periodStartAt: nextBilling.period_start_at ? nextBilling.period_start_at.slice(0, 16) : '',
            periodEndAt: nextBilling.period_end_at ? nextBilling.period_end_at.slice(0, 16) : '',
            paidAt: nextBilling.paid_at ? nextBilling.paid_at.slice(0, 16) : '',
            notes: nextBilling.notes || '',
          });
        }
        pushNotification({
          title: billingForm.id ? 'Billing updated' : 'Billing created',
          message: nextBilling?.invoice_number || billingForm.customerEmail,
          tone: 'success',
        });
      } catch (error) {
        setBillingError(error?.message || 'Failed to save billing');
      } finally {
        setSavingBilling(false);
      }
    },
    [billingForm, pushNotification],
  );

  const deleteBilling = React.useCallback(
    async (item) => {
      const confirmed = window.confirm(`Delete billing ${item.invoice_number || item.customer_email}?`);
      if (!confirmed) {
        return;
      }

      setDeletingBilling(String(item.id));
      setBillingError('');

      try {
        const response = await fetch('/api/billing', {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ id: item.id }),
        });

        const responsePayload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(responsePayload?.error || 'Failed to delete billing record');
        }

        setBillingRecords((current) => current.filter((entry) => entry.id !== item.id));
        if (selectedBilling?.id === item.id) {
          resetBillingForm();
        }
        pushNotification({ title: 'Billing deleted', message: item.invoice_number || item.customer_email, tone: 'success' });
      } catch (error) {
        setBillingError(error?.message || 'Failed to delete billing record');
      } finally {
        setDeletingBilling('');
      }
    },
    [pushNotification, resetBillingForm, selectedBilling?.id],
  );

  const resetLicenseForm = React.useCallback(() => {
    setLicenseForm({
      id: 0,
      ownerEmail: '',
      productName: '',
      domain: '',
      licenseKey: '',
      licenseType: 'panel',
      status: 'active',
      expiresAt: '',
      activatedAt: '',
      notes: '',
    });
    setSelectedLicense(null);
  }, []);

  const submitLicense = React.useCallback(
    async (event) => {
      event.preventDefault();

      setSavingLicense(true);
      setLicensesError('');

      const payload = {
        id: licenseForm.id,
        owner_email: licenseForm.ownerEmail,
        product_name: licenseForm.productName,
        domain: licenseForm.domain,
        license_key: licenseForm.licenseKey,
        license_type: licenseForm.licenseType,
        status: licenseForm.status,
        expires_at: licenseForm.expiresAt ? new Date(licenseForm.expiresAt).toISOString() : '',
        activated_at: licenseForm.activatedAt ? new Date(licenseForm.activatedAt).toISOString() : '',
        notes: licenseForm.notes,
      };

      try {
        const response = await fetch('/api/licenses', {
          method: licenseForm.id ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const responsePayload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(responsePayload?.error || 'Failed to save license');
        }

        const nextLicense = responsePayload?.license || null;
        setLicenses((current) => {
          const filtered = current.filter((item) => item.id !== nextLicense?.id);
          return nextLicense ? [nextLicense, ...filtered].sort((left, right) => {
            const leftDate = new Date(left.created_at).getTime();
            const rightDate = new Date(right.created_at).getTime();
            return rightDate - leftDate;
          }) : filtered;
        });
        if (nextLicense) {
          setSelectedLicense(nextLicense);
          setLicenseForm({
            id: nextLicense.id || 0,
            ownerEmail: nextLicense.owner_email || '',
            productName: nextLicense.product_name || '',
            domain: nextLicense.domain || '',
            licenseKey: nextLicense.license_key || '',
            licenseType: nextLicense.license_type || 'panel',
            status: nextLicense.status || 'active',
            expiresAt: toDateTimeLocalValue(nextLicense.expires_at),
            activatedAt: toDateTimeLocalValue(nextLicense.activated_at),
            notes: nextLicense.notes || '',
          });
        }
        pushNotification({
          title: licenseForm.id ? 'License updated' : 'License created',
          message: nextLicense?.license_key || licenseForm.productName,
          tone: 'success',
        });
      } catch (error) {
        setLicensesError(error?.message || 'Failed to save license');
      } finally {
        setSavingLicense(false);
      }
    },
    [licenseForm, pushNotification],
  );

  const deleteLicense = React.useCallback(async (item) => {
    const confirmed = window.confirm(`Delete license ${item.license_key || item.product_name}?`);
    if (!confirmed) {
      return;
    }

    setDeletingLicense(String(item.id));
    setLicensesError('');

    try {
      const response = await fetch('/api/licenses', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id: item.id }),
      });

      const responsePayload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responsePayload?.error || 'Failed to delete license');
      }

      setLicenses((current) => current.filter((entry) => entry.id !== item.id));
      if (selectedLicense?.id === item.id) {
        resetLicenseForm();
      }
      pushNotification({ title: 'License deleted', message: item.license_key || item.product_name, tone: 'success' });
    } catch (error) {
      setLicensesError(error?.message || 'Failed to delete license');
    } finally {
      setDeletingLicense('');
    }
  }, [pushNotification, resetLicenseForm, selectedLicense?.id]);

  const resetAffiliateForm = React.useCallback(() => {
    const currentAffiliate = affiliateRecords.find((item) => String(item.id) === String(affiliateSelectedId)) || affiliateData || affiliateRecords[0] || null;
    const defaultCampaignName = `Promo ${formatAffiliateMonthLabel(new Date())}`;
    setAffiliateForm({
      ownerEmail: currentAffiliate?.owner_email || session?.email || '',
      referralCode: currentAffiliate?.referral_code || '',
      couponCode: currentAffiliate?.coupon_code || '',
      commissionPercent: String(currentAffiliate?.commission_percent ?? 10),
      couponDiscountPercent: String(currentAffiliate?.coupon_discount_percent ?? 0),
      active: currentAffiliate ? Boolean(currentAffiliate.active) : true,
    });
    setAffiliateCommissionForm({
      affiliateId: currentAffiliate?.id ? String(currentAffiliate.id) : '',
      ownerEmail: currentAffiliate?.owner_email || session?.email || '',
      sourceEmail: '',
      sourceInvoiceNumber: '',
      amountRupiah: '',
      commissionRupiah: '',
      status: 'pending',
      notes: '',
    });
    setAffiliateCampaignName(defaultCampaignName);
  }, [affiliateData, affiliateRecords, affiliateSelectedId, session?.email]);

  const submitAffiliate = React.useCallback(async (event) => {
    event.preventDefault();
    if (!session?.is_admin) {
      setAffiliateError('Only admins can edit affiliate data.');
      return;
    }

    setAffiliateSaving(true);
    setAffiliateError('');

    const payload = {
      owner_email: affiliateForm.ownerEmail,
      referral_code: affiliateForm.referralCode,
      coupon_code: affiliateForm.couponCode,
      commission_percent: Number(affiliateForm.commissionPercent) || 10,
      coupon_discount_percent: Number(affiliateForm.couponDiscountPercent) || 0,
      active: Boolean(affiliateForm.active),
    };

    try {
      const response = await fetch('/api/affiliates', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responsePayload?.error || 'Failed to save affiliate');
      }

      const nextAffiliate = responsePayload?.affiliate || null;
      if (nextAffiliate) {
        setAffiliateRecords((current) => {
          const filtered = current.filter((item) => String(item.id) !== String(nextAffiliate.id));
          return [nextAffiliate, ...filtered].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
        });
        setAffiliateSelectedId(Number(nextAffiliate.id) || 0);
        setAffiliateData(nextAffiliate);
        setAffiliateForm({
          ownerEmail: nextAffiliate.owner_email || '',
          referralCode: nextAffiliate.referral_code || '',
          couponCode: nextAffiliate.coupon_code || '',
          commissionPercent: String(nextAffiliate.commission_percent ?? 10),
          couponDiscountPercent: String(nextAffiliate.coupon_discount_percent ?? 0),
          active: Boolean(nextAffiliate.active),
        });
      }

      pushNotification({
        title: 'Affiliate saved',
        message: nextAffiliate?.owner_email || affiliateForm.ownerEmail,
        tone: 'success',
      });
    } catch (error) {
      setAffiliateError(error?.message || 'Failed to save affiliate');
    } finally {
      setAffiliateSaving(false);
    }
  }, [affiliateForm, pushNotification, session?.is_admin]);

  const deleteAffiliate = React.useCallback(async () => {
    if (!session?.is_admin) {
      setAffiliateError('Only admins can delete affiliates.');
      return;
    }

    const currentAffiliate = affiliateRecords.find((item) => String(item.id) === String(affiliateSelectedId)) || affiliateData;
    if (!currentAffiliate) {
      return;
    }

    const confirmed = window.confirm(`Delete affiliate ${currentAffiliate.owner_email}?`);
    if (!confirmed) {
      return;
    }

    setAffiliateDeleting(String(currentAffiliate.id));
    setAffiliateError('');

    try {
      const response = await fetch('/api/affiliates', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id: currentAffiliate.id }),
      });

      const responsePayload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responsePayload?.error || 'Failed to delete affiliate');
      }

      setAffiliateRecords((current) => current.filter((item) => String(item.id) !== String(currentAffiliate.id)));
      setAffiliateCommissions((current) => current.filter((item) => String(item.affiliate_id) !== String(currentAffiliate.id)));
      setAffiliateData(null);
      setAffiliateSelectedId(0);
      resetAffiliateForm();
      pushNotification({ title: 'Affiliate deleted', message: currentAffiliate.owner_email, tone: 'success' });
    } catch (error) {
      setAffiliateError(error?.message || 'Failed to delete affiliate');
    } finally {
      setAffiliateDeleting('');
    }
  }, [affiliateData, affiliateRecords, affiliateSelectedId, pushNotification, resetAffiliateForm, session?.is_admin]);

  const submitAffiliateCommission = React.useCallback(async (event) => {
    event.preventDefault();
    if (!session?.is_admin) {
      setAffiliateError('Only admins can create commissions.');
      return;
    }

    setAffiliateCommissionSaving(true);
    setAffiliateError('');

    const payload = {
      affiliate_id: Number(affiliateCommissionForm.affiliateId) || 0,
      owner_email: affiliateCommissionForm.ownerEmail,
      source_email: affiliateCommissionForm.sourceEmail,
      source_invoice_number: affiliateCommissionForm.sourceInvoiceNumber,
      amount_rupiah: Number(affiliateCommissionForm.amountRupiah) || 0,
      commission_rupiah: Number(affiliateCommissionForm.commissionRupiah) || 0,
      status: affiliateCommissionForm.status,
      notes: affiliateCommissionForm.notes,
    };

    try {
      const response = await fetch('/api/affiliates/commissions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responsePayload?.error || 'Failed to save commission');
      }

      const nextCommission = responsePayload?.commission || null;
      if (nextCommission) {
        setAffiliateCommissions((current) => [nextCommission, ...current].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()));
        setAffiliateSummary((current) => ({
          ...current,
          commission_count: current.commission_count + 1,
          total_commission_rupiah: current.total_commission_rupiah + Number(nextCommission.commission_rupiah || 0),
          pending_commission_rupiah:
            String(nextCommission.status || '').toLowerCase() === 'paid' || String(nextCommission.status || '').toLowerCase() === 'approved'
              ? current.pending_commission_rupiah
              : current.pending_commission_rupiah + Number(nextCommission.commission_rupiah || 0),
          paid_commission_rupiah:
            String(nextCommission.status || '').toLowerCase() === 'paid' || String(nextCommission.status || '').toLowerCase() === 'approved'
              ? current.paid_commission_rupiah + Number(nextCommission.commission_rupiah || 0)
              : current.paid_commission_rupiah,
        }));
      }

      pushNotification({
        title: 'Commission created',
        message: nextCommission?.source_invoice_number || affiliateCommissionForm.sourceEmail || 'Commission',
        tone: 'success',
      });
    } catch (error) {
      setAffiliateError(error?.message || 'Failed to save commission');
    } finally {
      setAffiliateCommissionSaving(false);
    }
  }, [affiliateCommissionForm, pushNotification, session?.is_admin]);

  const exportAffiliateLedger = React.useCallback(() => {
    if (!affiliateFilteredCommissions.length) {
      pushNotification({
        title: 'Ledger kosong',
        message: 'No commission data available to export.',
        tone: 'warning',
      });
      return;
    }

    const safeEmail = String(selectedAffiliateRecord?.owner_email || 'affiliate').replace(/[^a-z0-9@._-]+/gi, '-');
    const csv = buildAffiliateLedgerCsv(affiliateFilteredCommissions);
    downloadTextFile(`affiliate-ledger-${safeEmail}.csv`, csv, 'text/csv;charset=utf-8;');
    pushNotification({
      title: 'Ledger exported',
      message: `CSV commission for ${selectedAffiliateRecord?.owner_email || 'affiliate'} downloaded successfully.`,
      tone: 'success',
    });
  }, [affiliateFilteredCommissions, pushNotification, selectedAffiliateRecord?.owner_email]);

  const generateAffiliateCampaign = React.useCallback(async () => {
    if (!affiliateCampaignPreview) {
      pushNotification({
        title: 'Campaign not ready yet',
        message: 'Select an affiliate first to create a campaign.',
        tone: 'warning',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(`${affiliateCampaignPreview.title}\n\n${affiliateCampaignPreview.caption}`);
      pushNotification({
        title: 'Campaign generated',
        message: affiliateCampaignPreview.title,
        tone: 'success',
      });
    } catch (error) {
      pushNotification({
        title: 'Campaign ready',
        message: affiliateCampaignPreview.title,
        tone: 'success',
      });
    }
  }, [affiliateCampaignPreview, pushNotification]);

  const resetSettingsForm = React.useCallback(() => {
    setSettingsForm({
      brandName: settingsData?.brand_name || 'Diworkin',
      logoUrl: settingsData?.logo_url || '/diworkin-logo.png',
      logoMarkUrl: settingsData?.logo_mark_url || '/diworkin-mark-dark.png',
      businessHours: settingsData?.business_hours || 'Senin - Jumat, 09:00 - 17:00',
      location: settingsData?.location || '',
      ownerName: settingsData?.owner_name || 'Diworkin',
      ownerPhone: settingsData?.owner_phone || '',
      ownerWhatsApp: settingsData?.owner_whatsapp || '',
      bankName: settingsData?.bank_name || '',
      bankAccountName: settingsData?.bank_account_name || '',
      bankAccountNumber: settingsData?.bank_account_number || '',
      bankBranch: settingsData?.bank_branch || '',
      bankNote: settingsData?.bank_note || '',
    });
  }, [settingsData]);

  const submitSettings = React.useCallback(async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    setSettingsError('');

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          brand_name: settingsForm.brandName,
          logo_url: settingsForm.logoUrl,
          logo_mark_url: settingsForm.logoMarkUrl,
          business_hours: settingsForm.businessHours,
          location: settingsForm.location,
          owner_name: settingsForm.ownerName,
          owner_phone: settingsForm.ownerPhone,
          owner_whatsapp: settingsForm.ownerWhatsApp,
          bank_name: settingsForm.bankName,
          bank_account_name: settingsForm.bankAccountName,
          bank_account_number: settingsForm.bankAccountNumber,
          bank_branch: settingsForm.bankBranch,
          bank_note: settingsForm.bankNote,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save settings');
      }

      const nextSettings = payload?.settings || null;
      setSettingsData(nextSettings);
      setSettingsForm({
        brandName: nextSettings?.brand_name || 'Diworkin',
        logoUrl: nextSettings?.logo_url || '/diworkin-logo.png',
        logoMarkUrl: nextSettings?.logo_mark_url || '/diworkin-mark-dark.png',
        businessHours: nextSettings?.business_hours || '',
        location: nextSettings?.location || '',
        ownerName: nextSettings?.owner_name || 'Diworkin',
        ownerPhone: nextSettings?.owner_phone || '',
        ownerWhatsApp: nextSettings?.owner_whatsapp || '',
        bankName: nextSettings?.bank_name || '',
        bankAccountName: nextSettings?.bank_account_name || '',
        bankAccountNumber: nextSettings?.bank_account_number || '',
        bankBranch: nextSettings?.bank_branch || '',
        bankNote: nextSettings?.bank_note || '',
      });
      pushNotification({
        title: 'Settings updated',
        message: nextSettings?.brand_name || settingsForm.brandName,
        tone: 'success',
      });
    } catch (error) {
      setSettingsError(error?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  }, [pushNotification, settingsForm]);

  const uploadSettingsAsset = React.useCallback(async (slot, file) => {
    if (!session?.is_admin || !file) {
      return;
    }

    const normalizedSlot = slot === 'logo_mark' ? 'logo_mark' : 'logo';
    setSettingsUploadingAsset(normalizedSlot);
    setSettingsError('');

    try {
      const formData = new FormData();
      formData.append('slot', normalizedSlot);
      formData.append('file', file, file.name);

      const response = await fetch('/api/settings/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed upload logo');
      }

      const nextUrl = payload?.url || '';
      if (normalizedSlot === 'logo_mark') {
        setSettingsForm((current) => ({ ...current, logoMarkUrl: nextUrl || current.logoMarkUrl }));
        setSettingsData((current) => (current ? { ...current, logo_mark_url: nextUrl || current.logo_mark_url } : current));
      } else {
        setSettingsForm((current) => ({ ...current, logoUrl: nextUrl || current.logoUrl }));
        setSettingsData((current) => (current ? { ...current, logo_url: nextUrl || current.logo_url } : current));
      }

      pushNotification({
        title: 'Logo uploaded',
        message: normalizedSlot === 'logo_mark' ? 'Logo mark updated' : 'Logo updated',
        tone: 'success',
      });
    } catch (error) {
      setSettingsError(error?.message || 'Failed upload logo');
    } finally {
      setSettingsUploadingAsset('');
    }
  }, [pushNotification, session?.is_admin]);

  const reloadStudioRows = React.useCallback(async () => {
    const selected = studioDatabases.find((item) => `${item.engine}:${item.domain}:${item.name}` === studioDatabaseFilter);
    if (!selected || !studioObjectFilter) {
      return;
    }

    const response = await fetch(
      `/api/studio/rows?domain=${encodeURIComponent(selected.domain)}&engine=${encodeURIComponent(selected.engine)}&name=${encodeURIComponent(selected.name)}&object=${encodeURIComponent(studioObjectFilter)}&limit=50&offset=0`,
      {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      },
    );
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to load rows');
    }

    setStudioRows(Array.isArray(payload?.rows) ? payload.rows : []);
    setStudioSchema({
      columns: Array.isArray(payload?.columns) ? payload.columns : [],
      primary_key: Array.isArray(payload?.primary_key) ? payload.primary_key : [],
      object_type: payload?.object_type || 'table',
    });
  }, [studioDatabaseFilter, studioDatabases, studioObjectFilter]);

  const saveStudioRecord = React.useCallback(async () => {
    const selected = studioDatabases.find((item) => `${item.engine}:${item.domain}:${item.name}` === studioDatabaseFilter);
    if (!selected || !studioObjectFilter) {
      setStudioRowsError('Select a database and object first');
      return;
    }

    let data;
    try {
      data = JSON.parse(studioEditorText || '{}');
    } catch (error) {
      setStudioRowsError('Invalid JSON');
      return;
    }

    setStudioSaving(true);
    setStudioRowsError('');

    try {
      const response = await fetch('/api/studio/rows', {
        method: studioEditorMode === 'update' ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: selected.domain,
          engine: selected.engine,
          name: selected.name,
          object: studioObjectFilter,
          key_column: studioKeyColumn || (selected.engine === 'mongodb' ? '_id' : studioSchema.primary_key[0] || ''),
          key_value: studioKeyValue,
          data,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save data');
      }

      const rowsPayload = payload?.rows;
      if (rowsPayload) {
        setStudioRows(Array.isArray(rowsPayload.rows) ? rowsPayload.rows : []);
        setStudioSchema({
          columns: Array.isArray(rowsPayload.columns) ? rowsPayload.columns : [],
          primary_key: Array.isArray(rowsPayload.primary_key) ? rowsPayload.primary_key : [],
          object_type: rowsPayload?.object_type || studioSchema.object_type,
        });
      } else {
        await reloadStudioRows();
      }

      setStudioEditorMode('insert');
      setStudioEditorText('{\n}');
      setStudioKeyValue('');
    } catch (error) {
      setStudioRowsError(error?.message || 'Failed to save data');
    } finally {
      setStudioSaving(false);
    }
  }, [reloadStudioRows, studioDatabaseFilter, studioDatabases, studioEditorMode, studioEditorText, studioKeyColumn, studioKeyValue, studioObjectFilter, studioSchema.object_type, studioSchema.primary_key]);

  const deleteStudioRecord = React.useCallback(async (row) => {
    const selected = studioDatabases.find((item) => `${item.engine}:${item.domain}:${item.name}` === studioDatabaseFilter);
    if (!selected || !studioObjectFilter) {
      return;
    }

    const keyColumn = studioKeyColumn || (selected.engine === 'mongodb' ? '_id' : studioSchema.primary_key[0] || '');
    const keyValue = keyColumn ? row?.[keyColumn] : null;
    if (!keyColumn || keyValue === undefined || keyValue === null || keyValue === '') {
      setStudioRowsError('Primary key not found for this row');
      return;
    }

    const confirmed = window.confirm(`Delete record from ${studioObjectFilter}?`);
    if (!confirmed) return;

    setStudioDeleting(String(keyValue));
    setStudioRowsError('');

    try {
      const response = await fetch('/api/studio/rows', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: selected.domain,
          engine: selected.engine,
          name: selected.name,
          object: studioObjectFilter,
          key_column: keyColumn,
          key_value: keyValue,
          data: {},
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete data');
      }

      const rowsPayload = payload?.rows;
      if (rowsPayload) {
        setStudioRows(Array.isArray(rowsPayload.rows) ? rowsPayload.rows : []);
        setStudioSchema({
          columns: Array.isArray(rowsPayload.columns) ? rowsPayload.columns : [],
          primary_key: Array.isArray(rowsPayload.primary_key) ? rowsPayload.primary_key : [],
          object_type: rowsPayload?.object_type || studioSchema.object_type,
        });
      } else {
        await reloadStudioRows();
      }
    } catch (error) {
      setStudioRowsError(error?.message || 'Failed to delete data');
    } finally {
      setStudioDeleting('');
    }
  }, [reloadStudioRows, studioDatabaseFilter, studioDatabases, studioKeyColumn, studioObjectFilter, studioSchema.object_type, studioSchema.primary_key]);

  const openStudioRow = React.useCallback((row) => {
    const keyColumn = studioKeyColumn || (studioSchema.primary_key[0] || (studioSchema.object_type === 'collection' ? '_id' : ''));
    setStudioEditorMode('update');
    setStudioEditorText(JSON.stringify(row, null, 2));
    setStudioKeyColumn(keyColumn);
    setStudioKeyValue(keyColumn ? formatStudioValue(row?.[keyColumn]) : '');
  }, [studioKeyColumn, studioSchema.object_type, studioSchema.primary_key]);

  const refreshFiles = React.useCallback(async (path = fileBrowsePath) => {
    if (!fileTargetFilter) {
      return;
    }

    setFileLoading(true);
    setFileError('');

    try {
      const response = await fetch(
        `/api/files?domain=${encodeURIComponent(fileTargetFilter)}&path=${encodeURIComponent(path || '')}&mode=browse`,
        {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load file manager');
      }

      setFileEntries(Array.isArray(payload?.items) ? payload.items : []);
      setFileCurrentPath(payload?.current_path || '');
      setFileParentPath(payload?.parent_path || '');
      setFileBrowsePath(payload?.current_path || '');
      setFileSelectedPath('');
      setFileSelectedContent('');
      setFileSelectedBinary(false);
      setFileSelectedMeta(null);
      setFileRenameName('');
    } catch (error) {
      setFileError(error?.message || 'Failed to load file manager');
    } finally {
      setFileLoading(false);
    }
  }, [fileBrowsePath, fileTargetFilter]);

  const openFileItem = React.useCallback(async (item) => {
    if (!fileTargetFilter) return;
    if (item.type === 'dir') {
      setFileBrowsePath(item.path);
      return;
    }

    setFileLoading(true);
    setFileError('');
    try {
      const response = await fetch(
        `/api/files?domain=${encodeURIComponent(fileTargetFilter)}&path=${encodeURIComponent(item.path)}&mode=content`,
        {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load file');
      }

      setFileSelectedPath(item.path);
      setFileSelectedContent(payload?.content || '');
      setFileSelectedBinary(Boolean(payload?.is_binary));
      setFileSelectedMeta(payload || item);
      setFileRenameName(item.name);
    } catch (error) {
      setFileError(error?.message || 'Failed to load file');
    } finally {
      setFileLoading(false);
    }
  }, [fileTargetFilter]);

  const createFileItem = React.useCallback(async () => {
    if (!fileTargetFilter || !fileCreateName) {
      return;
    }

    setFileCreating(true);
    setFileError('');

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: fileTargetFilter,
          path: fileBrowsePath,
          name: fileCreateName,
          kind: fileCreateKind,
          content: fileCreateContent,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create item');
      }

      await refreshFiles(fileBrowsePath);
      setFileCreateName('');
      setFileCreateContent('');
      setFileCreateKind('file');
    } catch (error) {
      setFileError(error?.message || 'Failed to create item');
    } finally {
      setFileCreating(false);
    }
  }, [fileBrowsePath, fileCreateContent, fileCreateKind, fileCreateName, fileTargetFilter, refreshFiles]);

  const uploadFileItem = React.useCallback(async () => {
    if (!fileTargetFilter || !fileUploadFile) {
      return;
    }

    setFileUploading(true);
    setFileError('');

    try {
      const formData = new FormData();
      formData.append('domain', fileTargetFilter);
      formData.append('path', fileBrowsePath);
      formData.append('file', fileUploadFile, fileUploadFile.name);

      const response = await fetch('/api/files', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed upload file');
      }

      await refreshFiles(fileBrowsePath);
      setFileUploadFile(null);
      if (fileUploadInputRef.current) {
        fileUploadInputRef.current.value = '';
      }
    } catch (error) {
      setFileError(error?.message || 'Failed upload file');
    } finally {
      setFileUploading(false);
    }
  }, [fileBrowsePath, fileTargetFilter, fileUploadFile, refreshFiles]);

  const saveFileItem = React.useCallback(async () => {
    if (!fileTargetFilter || !fileSelectedPath) {
      return;
    }

    setFileSaving(true);
    setFileError('');

    try {
      const response = await fetch('/api/files', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: fileTargetFilter,
          path: fileSelectedPath,
          kind: 'file',
          content: fileSelectedContent,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save file');
      }

      await refreshFiles(fileBrowsePath);
      setFileSelectedPath(payload?.file?.path || fileSelectedPath);
      setFileSelectedContent(payload?.file?.content || fileSelectedContent);
      setFileSelectedBinary(Boolean(payload?.file?.is_binary));
      setFileSelectedMeta(payload?.file || fileSelectedMeta);
    } catch (error) {
      setFileError(error?.message || 'Failed to save file');
    } finally {
      setFileSaving(false);
    }
  }, [fileBrowsePath, fileTargetFilter, fileSelectedContent, fileSelectedMeta, fileSelectedPath, refreshFiles]);

  const renameFileItem = React.useCallback(async () => {
    if (!fileTargetFilter || !fileSelectedPath || !fileRenameName) {
      return;
    }

    setFileRenaming(true);
    setFileError('');

    try {
      const response = await fetch('/api/files', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: fileTargetFilter,
          path: fileSelectedPath,
          kind: 'rename',
          new_name: fileRenameName,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed rename item');
      }

      const nextPath = payload?.current_path || fileBrowsePath;
      await refreshFiles(nextPath);
    } catch (error) {
      setFileError(error?.message || 'Failed rename item');
    } finally {
      setFileRenaming(false);
    }
  }, [fileBrowsePath, fileTargetFilter, fileRenameName, fileSelectedPath, refreshFiles]);

  const deleteFileItem = React.useCallback(async (item) => {
    if (!fileTargetFilter || !item?.path) {
      return;
    }

    const confirmed = window.confirm(`Delete ${item.type === 'dir' ? 'folder' : 'file'} ${item.name}?`);
    if (!confirmed) return;

    setFileDeleting(item.path);
    setFileError('');

    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: fileTargetFilter,
          path: item.path,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete item');
      }

      await refreshFiles(payload?.current_path || fileBrowsePath);
      if (fileSelectedPath === item.path) {
        setFileSelectedPath('');
        setFileSelectedContent('');
        setFileSelectedBinary(false);
        setFileSelectedMeta(null);
      }
    } catch (error) {
      setFileError(error?.message || 'Failed to delete item');
    } finally {
      setFileDeleting('');
    }
  }, [fileBrowsePath, fileTargetFilter, fileSelectedPath, refreshFiles]);

  const refreshDomainCheck = React.useCallback(async (domain) => {
    setCheckingDomain(domain);
    setDomainsError('');

    try {
      const response = await fetch(`/api/domains/check?domain=${encodeURIComponent(domain)}`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed cek status domain');
      }

      setDomainDetail((current) => (current ? { ...current, ...payload } : payload));
      setSelectedDomain(domain);
      setDomains((current) =>
        current.map((item) => (item.domain === domain ? { ...item, ...payload } : item)),
      );
    } catch (error) {
      setDomainsError(error?.message || 'Failed cek status domain');
    } finally {
      setCheckingDomain('');
    }
  }, []);

  const saveDomainProject = React.useCallback(async () => {
    if (!selectedDomain) return;

    setSavingDomain(selectedDomain);
    setDomainsError('');

    try {
      const response = await fetch('/api/domains/update', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          domain: selectedDomain,
          project_name: domainDraft,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update domain');
      }

      const nextDomain = payload?.domain || null;
      if (nextDomain) {
        setDomainDetail(nextDomain);
        setDomainDraft(nextDomain.project_name || '');
        setDomains((current) =>
          current.map((item) => (item.domain === selectedDomain ? nextDomain : item)),
        );
      }
    } catch (error) {
      setDomainsError(error?.message || 'Failed to update domain');
    } finally {
      setSavingDomain('');
    }
  }, [domainDraft, selectedDomain]);

  const metricsStamp = metricsUpdatedAt
    ? metricsUpdatedAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;
  const trafficSeries = buildTrafficSeries(networkHistory).slice(-8);
  const latestTraffic = trafficSeries[trafficSeries.length - 1] || null;
  const latestTrafficSample = networkHistory[networkHistory.length - 1] || null;
  const trafficInboundRate = latestTraffic?.rxRate || 0;
  const trafficOutboundRate = latestTraffic?.txRate || 0;
  const trafficInboundBytes = latestTrafficSample?.rx || metrics.networkRxBytes || 0;
  const trafficOutboundBytes = latestTrafficSample?.tx || metrics.networkTxBytes || 0;
  const nowMs = Date.now();
  const domainSummary = {
    total: domains.length,
    ready: domains.filter((item) => item.dns_status === 'ready').length,
    live: domains.filter((item) => item.site_status === 'live').length,
    attention: domains.filter((item) => item.dns_status !== 'ready' || item.site_status !== 'live').length,
  };
  const billingSummary = {
    total: billingRecords.length,
    pending: billingRecords.filter((item) => item.status === 'pending' || item.status === 'sent' || item.status === 'draft').length,
    paid: billingRecords.filter((item) => item.status === 'paid').length,
    overdue: billingRecords.filter((item) => item.status === 'overdue').length,
  };
  const licenseSummary = {
    total: licenses.length,
    active: licenses.filter((item) => String(item.status || '').toLowerCase() === 'active').length,
    expired: licenses.filter((item) => String(item.status || '').toLowerCase() === 'expired').length,
    expiringSoon: licenses.filter((item) => {
      if (!item?.expires_at) {
        return false;
      }
      const expiryDate = new Date(item.expires_at);
      if (Number.isNaN(expiryDate.getTime())) {
        return false;
      }
      return expiryDate.getTime() - nowMs <= 1000 * 60 * 60 * 24 * 30 && expiryDate.getTime() >= nowMs;
    }).length,
  };
  const licenseInstallerSnippet = React.useMemo(() => {
    const fallbackLicenseKey = licenseForm.licenseKey || 'LIC-XXXX-XXXX-XXXX-XXXX';
    const fallbackDomain = licenseForm.domain || selectedLicense?.domain || 'example.com';
    const fallbackProductName = licenseForm.productName || selectedLicense?.product_name || 'Diworkin Hosting';
    const fallbackLicenseType = licenseForm.licenseType || selectedLicense?.license_type || 'hosting';
    return [
      'LICENSE_API_URL=/api/licenses/verify',
      `LICENSE_KEY=${fallbackLicenseKey}`,
      `LICENSE_DOMAIN=${fallbackDomain}`,
      `LICENSE_PRODUCT=${fallbackProductName}`,
      `LICENSE_TYPE=${fallbackLicenseType}`,
    ].join('\n');
  }, [licenseForm.domain, licenseForm.licenseKey, licenseForm.licenseType, licenseForm.productName, selectedLicense?.domain, selectedLicense?.license_type, selectedLicense?.product_name]);
  const domainHealthRows = [
    {
      key: 'total',
      label: 'Provisioned domains',
      detail: 'All domains available in the panel.',
      value: domainSummary.total,
      tone: 'slate',
      icon: <Icon name="domains" className="h-5 w-5" />,
    },
    {
      key: 'ready',
      label: 'Nameserver ready',
      detail: 'DNS delegated to ns1/ns2 and authoritative records are in place.',
      value: domainSummary.ready,
      tone: 'emerald',
      icon: <FiShield className="h-5 w-5" />,
    },
    {
      key: 'live',
      label: 'Live sites',
      detail: 'HTTP or HTTPS is already responding from the server.',
      value: domainSummary.live,
      tone: 'sky',
      icon: <FiServer className="h-5 w-5" />,
    },
    {
      key: 'attention',
      label: 'Needs attention',
      detail: 'Pending DNS, offline site, or a target that should be rechecked.',
      value: domainSummary.attention,
      tone: 'rose',
      icon: <FiAlertTriangle className="h-5 w-5" />,
    },
  ];
  const sslExpiringAlerts = sslTargets
    .filter((item) => {
      const status = String(item.certificate_status || '').toLowerCase();
      if (status === 'missing' || status === 'unknown') {
        return true;
      }
      if (status === 'expiring') {
        return true;
      }
      if (!item.certificate_expires_at) {
        return false;
      }
      const expiresAt = new Date(item.certificate_expires_at).getTime();
      if (!Number.isFinite(expiresAt)) {
        return false;
      }
      return expiresAt - nowMs <= 14 * 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => {
      const left = new Date(a.certificate_expires_at || 0).getTime() || Infinity;
      const right = new Date(b.certificate_expires_at || 0).getTime() || Infinity;
      return left - right;
    });
  const backupOverdueAlerts = backupRules.filter((item) => {
    if (!item.enabled || !item.next_run_at) {
      return false;
    }
    const nextRunAt = new Date(item.next_run_at).getTime();
    if (!Number.isFinite(nextRunAt)) {
      return false;
    }
    return nextRunAt < nowMs - 5 * 60 * 1000;
  });
  const installerStuck =
    subdomainInstallState === 'running' &&
    subdomainInstallStartedAt &&
    nowMs - subdomainInstallStartedAt > 12 * 60 * 1000;
  const resourceAlerts = [];
  if (metrics.cpu >= 85) {
    resourceAlerts.push({
      title: 'CPU tinggi',
      description: `CPU usage is currently ${metrics.cpu}%. This usually needs attention.`,
      tone: 'amber',
    });
  }
  if (metrics.ram >= 90) {
    resourceAlerts.push({
      title: 'RAM kritis',
      description: `RAM usage is ${metrics.ram}%. Process load may need to be reduced.`,
      tone: 'rose',
    });
  }
  if (metrics.disk >= 90) {
    resourceAlerts.push({
      title: 'Disk hampir penuh',
      description: `Disk usage is ${metrics.disk}%. Cleanup or backing up old files is recommended.`,
      tone: 'rose',
    });
  }
  const alerts = [
    ...sslExpiringAlerts.slice(0, 2).map((item) => ({
      key: `ssl:${item.full_domain}`,
      title: item.certificate_status === 'missing' ? 'SSL missing' : 'SSL expiring soon',
      description:
        item.certificate_status === 'missing'
          ? `${item.full_domain} does not have an active certificate yet.`
          : `${item.full_domain} will expire ${formatRelativeDate(item.certificate_expires_at)}.`,
      tone: item.certificate_status === 'missing' ? 'rose' : 'amber',
      icon: <Icon name="ssl" className="h-5 w-5" />,
      actionLabel: 'Open SSL',
      onAction: () => setActiveSection('ssl'),
    })),
    ...backupOverdueAlerts.slice(0, 1).map((item) => ({
      key: `backup:${item.id}`,
      title: 'Backup overdue',
      description: `${item.domain} backup schedule ${item.frequency} at ${String(item.hour).padStart(2, '0')}:${String(item.minute).padStart(2, '0')} has not run as expected for the next run.`,
      tone: 'amber',
      icon: <Icon name="backup" className="h-5 w-5" />,
      actionLabel: 'Open Backup',
      onAction: () => setActiveSection('backup'),
    })),
    ...(installerStuck
      ? [
          {
            key: 'subdomain:stuck',
            title: 'Site installer stuck',
            description: `${subdomainInstallMessage || 'Installer sedang berjalan terlalu lama.'}`,
            tone: 'amber',
            icon: <Icon name="folder" className="h-5 w-5" />,
            actionLabel: 'Open Sites',
            onAction: () => setActiveSection('subdomains'),
          },
        ]
      : []),
    ...resourceAlerts.map((item, index) => ({
      key: `resource:${item.title}:${index}`,
      ...item,
      icon: <FiAlertTriangle className="h-5 w-5" />,
      actionLabel: 'Open Overview',
      onAction: () => setActiveSection('overview'),
    })),
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(169,200,138,0.16),rgba(243,232,213,0.28)_42%,#ffffff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      {panelToast ? (
        <div className="fixed right-4 top-4 z-[70] w-[min(420px,calc(100vw-2rem))] rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
                panelToast.tone === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {panelToast.tone === 'success' ? '✓' : '!'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">{panelToast.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{panelToast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setPanelToast(null)}
              className="text-slate-400 transition hover:text-slate-700"
              aria-label="Close notification"
            >
              <Icon name="menu" className="h-4 w-4 rotate-45" />
            </button>
          </div>
        </div>
      ) : null}
      <div className="flex min-h-[calc(100vh-3rem)] w-full gap-5">
        <aside
          className={`flex shrink-0 flex-col rounded-[2rem] border border-white/70 bg-white p-4 shadow-[0_30px_100px_rgba(15,23,42,0.12)] transition-all duration-300 ${
            collapsed ? 'w-[92px]' : 'w-[292px]'
          }`}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3`}>
            <LogoMark compact={collapsed} />
            {!collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100"
                title="Collapse sidebar"
              >
                <Icon name="menu" className="h-5 w-5" />
              </button>
            )}
          </div>

          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="mt-4 grid h-10 w-10 place-items-center self-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100"
              title="Expand sidebar"
            >
              <Icon name="chevron" className="h-5 w-5 rotate-180" />
            </button>
          ) : (
            <div className="mt-4 flex items-center justify-between rounded-[1.4rem] bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <span>Workspace</span>
              <span className="font-medium text-slate-900">Diworkin</span>
            </div>
          )}

          <nav className="mt-5 space-y-2">
            {navItems.map((item, index) => (
              <SidebarItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                active={activeSection === item.key}
                collapsed={collapsed}
                onClick={() => setActiveSection(item.key)}
              />
            ))}
          </nav>

          <div className={`mt-auto rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4 ${collapsed ? 'text-center' : ''}`}>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">System</p>
            <div className={`mt-4 space-y-3 ${collapsed ? 'hidden' : 'block'}`}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Postfix</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">OK</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Dovecot</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">OK</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">PowerDNS</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">OK</span>
              </div>
            </div>
            {collapsed && <span className="mx-auto mt-3 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="flex items-center gap-4 rounded-[2rem] border border-white/70 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100"
              title="Toggle sidebar"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>

            <div className="relative min-w-0 flex-1">
              <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Icon name="search" className="h-5 w-5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchOpen(Boolean(event.target.value.trim()));
                  }}
                  onFocus={() => setSearchOpen(Boolean(searchQuery.trim()))}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Search domains, mailboxes, DNS records..."
                />
              </label>

              {searchOpen && searchQuery.trim() ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.15)]">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Search results</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {searchResults.length > 0 ? `${searchResults.length} matches` : 'No matches found'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                        searchInputRef.current?.focus?.();
                      }}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-[420px] overflow-auto p-2">
                    {searchResults.length === 0 ? (
                      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        Try a different keyword, domain, email, or database name.
                      </div>
                    ) : (
                      searchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSearchPick(item)}
                          className="flex w-full items-start justify-between gap-4 rounded-[1.25rem] px-4 py-3 text-left transition hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {item.kind}
                            </span>
                            <Icon name="chevron" className="h-4 w-4 text-slate-400" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationOpen((current) => {
                    const next = !current;
                    if (next) {
                      setSearchOpen(false);
                      setProfileOpen(false);
                      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
                    }
                    return next;
                  });
                }}
                className="relative grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100"
              >
                <Icon name="bell" className="h-5 w-5" />
                {notificationsUnread > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {notificationsUnread > 9 ? '9+' : notificationsUnread}
                  </span>
                ) : null}
              </button>

              {notificationOpen ? (
                <div className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.15)]">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Notifications</p>
                      <p className="mt-1 text-sm text-slate-500">{notifications.length} recent events</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifications([]);
                        setNotificationOpen(false);
                      }}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-[420px] overflow-auto p-2">
                    {latestNotifications.length === 0 ? (
                      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      latestNotifications.map((item) => {
                        const meta = notificationToneMeta(item.tone);
                        const IconComponent = meta.icon;
                        return (
                          <div
                            key={item.id}
                            className={`rounded-[1.4rem] border px-4 py-4 shadow-sm ${
                              item.tone === 'error'
                                ? 'border-rose-100 bg-rose-50/90'
                                : item.tone === 'success'
                                  ? 'border-emerald-100 bg-emerald-50/90'
                                  : item.tone === 'warning'
                                    ? 'border-amber-100 bg-amber-50/90'
                                    : 'border-slate-200 bg-slate-50/90'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${meta.badge}`}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold leading-5 text-slate-950">{item.title}</p>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                                  </div>
                                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${meta.pill}`}>
                                    {meta.label}
                                  </span>
                                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Recent event
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left hover:bg-slate-50"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-sm font-semibold text-white">
                  {session?.initials || 'DW'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-none text-slate-950">
                    {session?.name || 'Diworkin'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{session?.email || 'Admin'}</p>
                </div>
                <Icon name="chevron" className="hidden h-4 w-4 text-slate-400 sm:block" />
              </button>
              <ProfileMenu
                open={profileOpen}
                onProfile={() => {
                  setProfileOpen(false);
                }}
                onLogout={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
              />
            </div>
          </header>

          {activeSection === 'overview' ? (
            <section className="space-y-5">
              <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Overview</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                      Hosting operations dashboard
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 font-medium text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Metrics {metricsSource === 'live' ? 'live' : 'demo fallback'}
                      </span>
                      {metricsStamp ? <span>Last update {metricsStamp}</span> : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ToolbarIconButton
                      title="Add domain"
                      onClick={() => setActiveSection('domains')}
                    >
                      <Icon name="domains" className="h-4 w-4" />
                    </ToolbarIconButton>
                    <ToolbarIconButton title="New mailbox" onClick={() => setActiveSection('email')}>
                      <Icon name="email" className="h-4 w-4" />
                    </ToolbarIconButton>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                  <StatCard
                    title="Active domains"
                    value={String(overviewStats.activeDomains).padStart(2, '0')}
                    detail={session?.is_admin ? 'Multi-domain ready' : 'Your managed domains'}
                    icon={<Icon name="domains" className="h-7 w-7" />}
                    iconTone="bg-sky-50 text-sky-600"
                  />
                  <StatCard
                    title="Mailbox accounts"
                    value={String(overviewStats.mailboxAccounts).padStart(2, '0')}
                    detail={session?.is_admin ? 'Across all tenants' : 'Across your domains'}
                    icon={<Icon name="email" className="h-7 w-7" />}
                    iconTone="bg-emerald-50 text-emerald-600"
                  />
                  <StatCard
                    title="Queued mail"
                    value={String(overviewStats.queuedMail).padStart(2, '0')}
                    detail={session?.is_admin ? 'Waiting to deliver' : 'Waiting in your queue'}
                    icon={<Icon name="archive" className="h-7 w-7" />}
                    iconTone="bg-amber-50 text-amber-600"
                  />
                  {session?.is_admin ? (
                    <StatCard
                      title="Support chats"
                      value={String(overviewStats.openSupportChats || 0).padStart(2, '0')}
                      detail="Waiting for reply"
                      icon={<Icon name="support" className="h-7 w-7" />}
                      iconTone="bg-rose-50 text-rose-600"
                    />
                  ) : null}
                </div>

                <div className="mt-4">
                  <TrafficCard
                    title="Network traffic"
                    rxRate={trafficInboundRate}
                    txRate={trafficOutboundRate}
                    rxBytes={trafficInboundBytes}
                    txBytes={trafficOutboundBytes}
                    points={trafficSeries}
                    source={metricsSource}
                  />
                </div>

                <div className="mt-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-[1rem] bg-amber-50 text-amber-600">
                        <FiAlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Alerts</p>
                        <h3 className="text-lg font-semibold text-slate-950">Things that need attention now</h3>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {alerts.length} open
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {alerts.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] bg-white text-emerald-600 shadow-sm">
                            <FiShield className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-900">No critical alerts</p>
                            <p className="mt-1 text-sm leading-6 text-emerald-800">
                              SSL, backup, installer, and resource checks look healthy right now.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      alerts.slice(0, 4).map((item) => (
                        <AlertCard
                          key={item.key}
                          title={item.title}
                          description={item.description}
                          tone={item.tone}
                          icon={item.icon}
                          actionLabel={item.actionLabel}
                          onAction={item.onAction}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <GaugeCard
                    label="CPU Usage"
                    value={metrics.cpu}
                    detail={metricsSource === 'live' ? 'Live server load' : 'Demo server load'}
                    percent={metrics.cpu}
                    accent="#1877ff"
                  />
                  <GaugeCard
                    label="RAM Usage"
                    value={metrics.ram}
                    detail={metricsSource === 'live' ? 'Live memory allocation' : 'Demo memory allocation'}
                    percent={metrics.ram}
                    accent="#14b8a6"
                  />
                  <GaugeCard
                    label="Disk Usage"
                    value={metrics.disk}
                    detail={metricsSource === 'live' ? 'Live storage consumption' : 'Demo storage consumption'}
                    percent={metrics.disk}
                    accent="#f59e0b"
                  />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-[1rem] bg-slate-950 text-white">
                    <FiServer className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">System status</p>
                    <h3 className="text-lg font-semibold text-slate-950">Service health at a glance</h3>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ['Postfix', 'Running'],
                    ['Dovecot', 'Running'],
                    ['PowerDNS', 'Healthy'],
                    ['Panel API', 'Design mode'],
                  ].map(([label, status]) => (
                    <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
          </section>
        ) : null}

        {activeSection === 'domains' ? (
          <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Domains</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Domain provisioning</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Add a domain only after its nameservers point to <span className="font-medium text-slate-900">ns1.diworkin.com</span> and <span className="font-medium text-slate-900">ns2.diworkin.com</span>. Once valid, the panel will automatically create the DNS zone and public folder for the project.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {domains.length} domains
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Auto DNS
                  </span>
              </div>
            </div>

            <div className="mt-5 rounded-[1.8rem] border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Domain health</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">Readiness at a glance</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    This summary helps you see whether a domain is ready, live, or still needs DNS checks.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                  Live audit
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {domainHealthRows.map((row) => {
                  const toneClasses = {
                    slate: 'border-slate-200 bg-slate-50 text-slate-700',
                    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
                    sky: 'border-sky-100 bg-sky-50 text-sky-700',
                    rose: 'border-rose-100 bg-rose-50 text-rose-700',
                  };

                  return (
                    <div
                      key={row.key}
                      className={`flex items-start justify-between gap-4 rounded-[1.35rem] border p-4 ${toneClasses[row.tone] || toneClasses.slate}`}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] bg-white/80 text-slate-950 shadow-sm">
                          {row.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-950">{row.label}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{row.detail}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-950 shadow-sm">
                        <span className="text-lg leading-none">{String(row.value).padStart(2, '0')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {domainsError ? (
              <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{domainsError}</p>
            ) : null}

            <div className="mt-5 space-y-5">
                <form onSubmit={submitDomain} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4">
                    <PanelField
                      label="Domain"
                      placeholder="example.com"
                      value={domainForm.domain}
                      onChange={(event) =>
                        setDomainForm((current) => ({ ...current, domain: event.target.value }))
                      }
                      name="domain"
                    />
                    <PanelField
                      label="Project Name"
                      placeholder="My Website"
                      value={domainForm.projectName}
                      onChange={(event) =>
                        setDomainForm((current) => ({ ...current, projectName: event.target.value }))
                      }
                      name="project_name"
                    />

                    <div className="rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                      The panel will first check the public nameservers, then create
                      the DNS record, the <span className="font-semibold">public</span> folder, and
                      the web server configuration for that domain.
                    </div>

                    <ToolbarIconButton
                      title={addingDomain ? 'Provisioning...' : 'Verify & Add Domain'}
                      type="submit"
                      disabled={addingDomain}
                      tone="dark"
                    >
                      <Icon name="plus" className="h-4 w-4" />
                    </ToolbarIconButton>
                  </div>
                </form>

                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Provisioned domains</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">Project folders</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {domainsLoading ? 'Loading...' : `${domains.length} total`}
                    </span>
                  </div>

                  <div className="max-h-[520px] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-white">
                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-5 py-3">Domain</th>
                          <th className="px-5 py-3">Project</th>
                          <th className="px-5 py-3">DNS</th>
                          <th className="px-5 py-3">Site</th>
                          <th className="px-5 py-3">Folder</th>
                          <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {domainsLoading ? (
                          <TableSkeletonRows columns={6} rows={4} widths={['w-40', 'w-24', 'w-20', 'w-20', 'w-52', 'w-24']} />
                        ) : domains.length === 0 ? (
                          <tr>
                            <td className="px-5 py-6 text-sm text-slate-500" colSpan="6">
                              No provisioned domains.
                            </td>
                          </tr>
                        ) : (
                          domains.map((domain) => (
                            <tr key={domain.domain}>
                              <td className="px-5 py-4">
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">{domain.domain}</p>
                                  <p className="mt-1 text-xs text-slate-400">{domain.owner_email}</p>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-600">
                                {domain.project_name || '-'}
                              </td>
                              <td className="px-5 py-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${domainStatusClasses(domain.dns_status)}`}>
                                  {formatDomainStatus(domain.dns_status)}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${siteStatusClasses(domain.site_status)}`}>
                                  {formatSiteStatus(domain.site_status)}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="space-y-2">
                                  <code className="block rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                    {domain.public_path}
                                  </code>
                                  <a
                                    href={`http://${domain.domain}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Open site"
                                    aria-label="Open site"
                                    className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
                                  >
                                    <Icon name="external" className="h-4 w-4" />
                                    <span>Open site</span>
                                  </a>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <ToolbarIconButton
                                    title="Details"
                                    onClick={() => {
                                      setSelectedDomain(domain.domain);
                                      setDomainDetail(domain);
                                      setDomainDraft(domain.project_name || '');
                                    }}
                                  >
                                    <Icon name="details" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                  <ToolbarIconButton
                                    title={deletingDomain === domain.domain ? 'Deleting...' : 'Delete'}
                                    onClick={() => deleteDomain(domain.domain)}
                                    disabled={deletingDomain === domain.domain}
                                    className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                  >
                                    <Icon name="trash" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Selected domain</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">
                        {domainDetail?.domain || 'Select a domain from the table'}
                      </h3>
                    </div>
                    {domainDetail ? (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${domainStatusClasses(domainDetail.dns_status)}`}>
                        {formatDomainStatus(domainDetail.dns_status)}
                      </span>
                    ) : null}
                  </div>

                  {domainDetail ? (
                    <div className="mt-5 space-y-4">
                      <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Owner</span>
                          <span className="font-medium text-slate-900">{domainDetail.owner_email}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Public folder</span>
                          <span className="font-medium text-slate-900">{domainDetail.public_path}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Site status</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${siteStatusClasses(domainDetail.site_status)}`}>
                            {formatSiteStatus(domainDetail.site_status)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Server IP</span>
                          <span className="font-medium text-slate-900">{domainDetail.server_ip || '-'}</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-600">Project name</span>
                          <input
                            value={domainDraft}
                            onChange={(event) => setDomainDraft(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                            placeholder="Project name"
                          />
                        </label>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <ToolbarIconButton
                            title={checkingDomain === domainDetail.domain ? 'Checking...' : 'Refresh live check'}
                            onClick={() => refreshDomainCheck(domainDetail.domain)}
                            disabled={checkingDomain === domainDetail.domain}
                            tone="sky"
                          >
                            <Icon name="refresh" className="h-4 w-4" />
                          </ToolbarIconButton>
                          <ToolbarIconButton
                            title={savingDomain === domainDetail.domain ? 'Saving...' : 'Save project'}
                            onClick={saveDomainProject}
                            disabled={savingDomain === domainDetail.domain}
                            tone="primary"
                          >
                            <Icon name="save" className="h-4 w-4" />
                          </ToolbarIconButton>
                        </div>
                      </div>

                      {String(domainDetail.app_type || '').toLowerCase() === 'wordpress' ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-emerald-800">WordPress access</p>
                              <h4 className="mt-1 text-base font-semibold text-slate-950">Password & filesystem</h4>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                domainDetail.wordpress_access_ready
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {domainDetail.wordpress_access_ready ? 'Access ready' : 'Set password'}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 rounded-2xl bg-white/80 p-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-500">Admin user</span>
                              <span className="font-medium text-slate-900">
                                {domainDetail.wordpress_admin_user || 'wp'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-500">Filesystem</span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  domainDetail.wordpress_filesystem_mode === 'direct'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {formatWordPressFilesystemMode(domainDetail.wordpress_filesystem_mode)}
                              </span>
                            </div>
                            <PanelField
                              label="New password"
                              placeholder="Strong WordPress password"
                              type="password"
                              value={wordpressPasswordDraft}
                              onChange={(event) => setWordPressPasswordDraft(event.target.value)}
                              name={`wordpress_password_${domainDetail.domain}`}
                            />
                            <div className="flex flex-wrap gap-2">
                              <ToolbarIconButton
                                title={savingWordPressPassword === domainDetail.domain ? 'Saving...' : 'Update WordPress password'}
                                onClick={() => saveWordPressPassword('domain', domainDetail)}
                                disabled={savingWordPressPassword === domainDetail.domain}
                                tone="primary"
                              >
                                <Icon name="switchCamera" className="h-4 w-4" />
                              </ToolbarIconButton>
                              <ToolbarIconButton
                                title={repairingWordPress === domainDetail.domain ? 'Repairing...' : 'Repair permissions'}
                                onClick={() => repairWordPressPermissions('domain', domainDetail)}
                                disabled={repairingWordPress === domainDetail.domain}
                                tone="sky"
                              >
                                <Icon name="repair" className="h-4 w-4" />
                              </ToolbarIconButton>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-500">Nameservers</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(domainDetail.nameservers || []).map((ns) => (
                            <span
                              key={ns}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                            >
                              {ns}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      Select a domain to see details, check live status, and edit the project name without deleting the domain.
                    </p>
                  )}
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-400">How it works</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">1. The user points nameservers to `ns1.diworkin.com` and `ns2.diworkin.com`.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">2. The panel checks the public nameservers and validates the nameserver IPs.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">3. The DNS zone, public folder, and Nginx site are created automatically.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">4. The `Refresh live check` button checks DNS and site status from the server.</li>
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'subdomains' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Sites</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Website CRUD dan auto installer</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Create a website for a domain or subdomain. WordPress, CodeIgniter, and Laravel will be created automatically in the selected target public folder.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {siteEntries.length} sites
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Auto Installer
                  </span>
                </div>
              </div>

              {subdomainsError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{subdomainsError}</p>
              ) : null}

              <div className="mt-5 space-y-5">
                <form onSubmit={submitSubdomain} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-5">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Step 1</p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-950">Choose target</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          Target first
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setSiteTargetKind('domain')}
                          className={`rounded-2xl border px-4 py-3 text-left transition ${
                            siteTargetKind === 'domain'
                              ? 'border-[#1f3d2e] bg-[#1f3d2e] text-white shadow-lg shadow-[#1f3d2e]/20'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#a9c88a]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`grid h-10 w-10 place-items-center rounded-2xl ${siteTargetKind === 'domain' ? 'bg-white/15' : 'bg-white'} text-sm font-bold`}>
                              <Icon name="domains" className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold">Domain</p>
                              <p className={`text-xs ${siteTargetKind === 'domain' ? 'text-white/80' : 'text-slate-500'}`}>
                                Install to a provisioned root domain.
                              </p>
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSiteTargetKind('subdomain')}
                          className={`rounded-2xl border px-4 py-3 text-left transition ${
                            siteTargetKind === 'subdomain'
                              ? 'border-[#1f3d2e] bg-[#1f3d2e] text-white shadow-lg shadow-[#1f3d2e]/20'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#a9c88a]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`grid h-10 w-10 place-items-center rounded-2xl ${siteTargetKind === 'subdomain' ? 'bg-white/15' : 'bg-white'} text-sm font-bold`}>
                              <Icon name="folder" className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold">Subdomain</p>
                              <p className={`text-xs ${siteTargetKind === 'subdomain' ? 'text-white/80' : 'text-slate-500'}`}>
                                Install to a new or existing subdomain.
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {siteTargetKind === 'domain' ? (
                      <PanelSelect
                        label="Target domain"
                        value={subdomainForm.domain}
                        onChange={(event) => {
                          const nextDomain = event.target.value;
                          setSubdomainForm((current) => ({ ...current, domain: nextDomain, subdomain: '' }));
                          setSubdomainDomainFilter(nextDomain);
                        }}
                        name="site_domain"
                      >
                        {domains.length === 0 ? <option value="">No domains available</option> : null}
                        {domains.map((domain) => (
                          <option key={domain.domain} value={domain.domain}>
                            {domain.domain}
                          </option>
                        ))}
                      </PanelSelect>
                    ) : (
                      <>
                        <PanelSelect
                          label="Parent domain"
                          value={subdomainForm.domain}
                          onChange={(event) => {
                            const nextDomain = event.target.value;
                            setSubdomainForm((current) => ({ ...current, domain: nextDomain }));
                            setSubdomainDomainFilter(nextDomain);
                          }}
                          name="subdomain_domain"
                        >
                          {domains.length === 0 ? <option value="">No domains available</option> : null}
                          {domains.map((domain) => (
                            <option key={domain.domain} value={domain.domain}>
                              {domain.domain}
                            </option>
                          ))}
                        </PanelSelect>

                        <PanelField
                          label="Subdomain"
                          placeholder="app"
                          value={subdomainForm.subdomain}
                          onChange={(event) =>
                            setSubdomainForm((current) => ({ ...current, subdomain: event.target.value }))
                          }
                          name="subdomain"
                        />
                      </>
                    )}

                    <PanelField
                      label="Project Name"
                      placeholder="My App"
                      value={subdomainForm.projectName}
                      onChange={(event) =>
                        setSubdomainForm((current) => ({ ...current, projectName: event.target.value }))
                      }
                      name="subdomain_project_name"
                    />

                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Step 2</p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-950">Pick app template</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          Visual templates
                        </span>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {siteAppOptions.map((option) => {
                          const selected = subdomainForm.appType === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setSubdomainForm((current) => ({ ...current, appType: option.value }))
                              }
                              className={`group overflow-hidden rounded-[1.5rem] border p-3 text-left transition ${
                                selected
                                  ? 'border-[#1f3d2e] bg-[#1f3d2e]/5 shadow-[0_12px_32px_rgba(31,61,46,0.12)]'
                                  : 'border-slate-200 bg-white hover:border-[#a9c88a]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 px-1 pt-1">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-950">{option.title}</p>
                                  <p className="mt-1 text-xs leading-5 text-slate-500">{option.description}</p>
                                </div>
                                <span
                                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                                    selected
                                      ? 'bg-[#1f3d2e] text-white'
                                      : 'bg-[#cfe8d5] text-[#1f3d2e]'
                                  }`}
                                >
                                  {selected ? 'Selected' : 'Choose'}
                                </span>
                              </div>
                              <div className="mt-3 overflow-hidden rounded-[1.35rem] bg-slate-50 shadow-inner">
                                <div className={`flex h-52 items-center justify-center bg-gradient-to-br ${option.gradient}`}>
                                  <img
                                    src={option.image}
                                    alt={option.imageAlt}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                      The installer will create a dedicated public folder, DNS A record, and Nginx configuration for this target.
                    </div>

                    {subdomainInstallState !== 'idle' ? (
                      <div
                        className={`rounded-[1.6rem] border px-4 py-4 shadow-sm ${
                          subdomainInstallState === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            : subdomainInstallState === 'error'
                              ? 'border-rose-200 bg-rose-50 text-rose-900'
                              : 'border-blue-200 bg-blue-50 text-blue-900'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
                              subdomainInstallState === 'success'
                                ? 'bg-emerald-600 text-white'
                                : subdomainInstallState === 'error'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-blue-600 text-white'
                            }`}
                          >
                            {subdomainInstallState === 'success' ? '✓' : subdomainInstallState === 'error' ? '!' : '…'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {subdomainInstallState === 'success'
                                ? 'Instalasi selesai'
                                : subdomainInstallState === 'error'
                                  ? 'Installation failed'
                                  : 'Instalasi sedang berjalan'}
                            </p>
                            <p className="mt-1 text-sm leading-6 opacity-80">{subdomainInstallMessage}</p>
                          </div>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                          <div
                            className={`h-full rounded-full transition-all ${
                              subdomainInstallState === 'success'
                                ? 'bg-emerald-600'
                                : subdomainInstallState === 'error'
                                  ? 'bg-rose-500'
                                  : 'bg-blue-600'
                            }`}
                            style={{
                              width:
                                subdomainInstallState === 'success'
                                  ? '100%'
                                  : subdomainInstallState === 'error'
                                    ? `${Math.max(15, Math.min(90, Math.round(((subdomainInstallPhase + 1) / subdomainInstallStepTotal) * 100)))}%`
                                    : `${Math.max(10, Math.min(92, Math.round(((subdomainInstallPhase + 1) / subdomainInstallStepTotal) * 100)))}%`,
                            }}
                          />
                        </div>

                        <div className="mt-4 grid gap-2">
                          {subdomainInstallSteps.map((step, index) => {
                            const isDone = subdomainInstallState === 'success' || index < subdomainInstallPhase;
                            const isCurrent = subdomainInstallState === 'running' && index === subdomainInstallPhase;
                            const isError = subdomainInstallState === 'error' && index === subdomainInstallPhase;

                            return (
                              <div
                                key={`${step}-${index}`}
                                className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm ${
                                  isDone
                                    ? 'bg-white/80 text-emerald-900'
                                  : isCurrent
                                      ? 'bg-white text-blue-900'
                                      : isError
                                        ? 'bg-white text-rose-900'
                                        : 'bg-white/60 text-slate-500'
                                }`}
                              >
                                <span>{step}</span>
                                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                                  {isDone ? 'Done' : isCurrent ? 'Current' : 'Pending'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {subdomainInstallJobId ? (
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                              Job ID: {subdomainInstallJobId}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {subdomainInstallState === 'running' ? (
                                <ToolbarIconButton
                                  title="Cancel installer"
                                  onClick={cancelSubdomainInstall}
                                  className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                >
                                  <Icon name="trash" className="h-4 w-4" />
                                </ToolbarIconButton>
                              ) : null}
                              {subdomainInstallState === 'error' ? (
                                <ToolbarIconButton
                                  title="Retry installer"
                                  onClick={() => document.getElementById('subdomain-submit')?.click()}
                                  className="border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100"
                                >
                                  <Icon name="refresh" className="h-4 w-4" />
                                </ToolbarIconButton>
                              ) : null}
                            </div>
                          </div>
                        ) : null}

                        {subdomainInstallLogs.length > 0 ? (
                          <div className="mt-4 rounded-[1.4rem] border border-white/80 bg-white/70 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Installer log
                            </p>
                            <div className={`mt-3 space-y-2 ${showAllSubdomainLogs ? 'max-h-[360px] overflow-auto pr-1' : ''}`}>
                              {(showAllSubdomainLogs ? subdomainInstallLogs : subdomainInstallLogs.slice(-6)).map((entry) => (
                                <div
                                  key={entry.id}
                                  className={`rounded-2xl px-3 py-2 text-sm ${
                                    entry.tone === 'success'
                                      ? 'bg-emerald-50 text-emerald-900'
                                      : entry.tone === 'error'
                                        ? 'bg-rose-50 text-rose-900'
                                        : 'bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold">{entry.label}</span>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] opacity-60">
                                      {entry.time}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm leading-6 opacity-90">{entry.message}</p>
                                </div>
                              ))}
                            </div>
                            {subdomainInstallLogs.length > 6 ? (
                              <ToolbarIconButton
                                title={showAllSubdomainLogs ? 'Show latest logs' : 'Show all logs'}
                                onClick={() => setShowAllSubdomainLogs((current) => !current)}
                                className="mt-3"
                              >
                                <Icon name="more" className="h-4 w-4" />
                              </ToolbarIconButton>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <ToolbarIconButton
                      title={creatingSubdomain ? 'Installing...' : 'Start installation'}
                      type="submit"
                      disabled={
                        creatingSubdomain ||
                        !subdomainForm.domain ||
                        (siteTargetKind === 'subdomain' && !subdomainForm.subdomain) ||
                        !subdomainForm.appType
                      }
                      tone="primary"
                    >
                      <Icon name="plus" className="h-4 w-4" />
                    </ToolbarIconButton>
                  </div>
                </form>

                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Installed websites</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">Sites list</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {domainsLoading || subdomainsLoading ? 'Loading...' : `${siteEntries.length} total`}
                    </span>
                  </div>

                  <div className="max-h-[520px] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-white">
                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-5 py-3">Target</th>
                          <th className="px-5 py-3">Type</th>
                          <th className="px-5 py-3">App</th>
                          <th className="px-5 py-3">DNS</th>
                          <th className="px-5 py-3">Site</th>
                          <th className="px-5 py-3">Folder</th>
                          <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {domainsLoading || subdomainsLoading ? (
                          <TableSkeletonRows columns={7} rows={4} widths={['w-44', 'w-24', 'w-20', 'w-16', 'w-16', 'w-52', 'w-28']} />
                        ) : siteEntries.length === 0 ? (
                          <tr>
                            <td className="px-5 py-6 text-sm text-slate-500" colSpan="7">
                              No websites created.
                            </td>
                          </tr>
                        ) : (
                          siteEntries.map((item) => (
                            <tr key={`${item.kind}:${item.fullDomain}`}>
                              <td className="px-5 py-4">
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">{item.fullDomain}</p>
                                  <p className="mt-1 text-xs text-slate-400">{item.projectName || '-'}</p>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {item.kind === 'domain' ? 'Domain' : 'Subdomain'}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {item.kind === 'domain'
                                    ? formatAppType(item.appType) === 'Static site'
                                      ? 'Root site'
                                      : formatAppType(item.appType)
                                    : formatAppType(item.appType)}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${domainStatusClasses(item.dnsStatus)}`}>
                                  {item.kind === 'domain'
                                    ? formatDomainStatus(item.dnsStatus)
                                    : formatSubdomainDnsStatus(item.dnsStatus)}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${siteStatusClasses(item.siteStatus)}`}>
                                  {formatSiteStatus(item.siteStatus)}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <code className="block rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                  {item.publicPath}
                                </code>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <ToolbarIconButton
                                    title="Details"
                                    onClick={() => {
                                      if (item.kind === 'domain') {
                                        setActiveSection('domains');
                                        setSelectedDomain(item.domain);
                                        setSelectedSubdomain(null);
                                        setDomainDetail(domains.find((domain) => domain.domain === item.domain) || null);
                                        setDomainDraft(item.projectName || '');
                                        setSiteTargetKind('domain');
                                        setSubdomainForm((current) => ({
                                          ...current,
                                          domain: item.domain,
                                          subdomain: '',
                                          projectName: item.projectName || '',
                                          appType: item.appType || 'wordpress',
                                        }));
                                        setSubdomainDomainFilter(item.domain);
                                      } else {
                                        setSelectedDomain(null);
                                        setSelectedSubdomain({
                                          ...item,
                                          full_domain: item.fullDomain,
                                          project_name: item.projectName,
                                          app_type: item.appType,
                                          public_path: item.publicPath,
                                          dns_status: item.dnsStatus,
                                          site_status: item.siteStatus,
                                          wordpress_admin_user: item.wordpressAdminUser || '',
                                          wordpress_access_ready: item.wordpressAccessReady || false,
                                          wordpress_filesystem_mode: item.wordpressFilesystemMode || '',
                                          database_name: item.databaseName || '',
                                          database_username: item.databaseUsername || '',
                                          connection_uri: item.connectionUri || '',
                                        });
                                        setSiteTargetKind('subdomain');
                                        setSubdomainForm((current) => ({
                                          ...current,
                                          domain: item.domain,
                                          subdomain: item.subdomain,
                                          projectName: item.projectName || '',
                                          appType: item.appType || 'plain',
                                        }));
                                        setSubdomainDomainFilter(item.domain);
                                      }
                                    }}
                                  >
                                    <Icon name="details" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                  <ToolbarIconButton
                                    title={item.kind === 'domain' ? 'Delete domain' : deletingSubdomain === item.fullDomain ? 'Deleting...' : 'Delete'}
                                    onClick={() => (item.kind === 'domain' ? deleteDomain(item.domain) : deleteSubdomain(item))}
                                    disabled={item.kind === 'domain' ? deletingDomain === item.domain : deletingSubdomain === item.fullDomain}
                                    className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                  >
                                    <Icon name="trash" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Selected site</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">
                        {selectedSubdomain?.full_domain || 'Select a website from the table'}
                      </h3>
                    </div>
                    {selectedSubdomain ? (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${siteStatusClasses(selectedSubdomain.site_status)}`}>
                        {formatSiteStatus(selectedSubdomain.site_status)}
                      </span>
                    ) : null}
                  </div>

                  {selectedSubdomain ? (
                    <div className="mt-5 space-y-4">
                      <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Installer</span>
                          <span className="font-medium text-slate-900">{formatAppType(selectedSubdomain.app_type)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Database</span>
                          <span className="font-medium text-slate-900">{selectedSubdomain.database_name || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">DNS</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${domainStatusClasses(selectedSubdomain.dns_status)}`}>
                            {formatSubdomainDnsStatus(selectedSubdomain.dns_status)}
                          </span>
                        </div>
                        {String(selectedSubdomain.app_type || '').toLowerCase() === 'wordpress' ? (
                          <>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-500">Admin user</span>
                              <span className="font-medium text-slate-900">
                                {selectedSubdomain.wordpress_admin_user || 'wp'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-500">Filesystem</span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  selectedSubdomain.wordpress_filesystem_mode === 'direct'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {formatWordPressFilesystemMode(selectedSubdomain.wordpress_filesystem_mode)}
                              </span>
                            </div>
                          </>
                        ) : null}
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-600">Project name</span>
                          <input
                            value={selectedSubdomain.project_name || ''}
                            onChange={(event) =>
                              setSelectedSubdomain((current) => (current ? { ...current, project_name: event.target.value } : current))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                            placeholder="Project name"
                          />
                        </label>
                        <div className="mt-4 flex flex-wrap gap-2">
                    <ToolbarIconButton
                      title={savingSubdomain === selectedSubdomain.full_domain ? 'Saving...' : 'Save project'}
                      onClick={saveSubdomainProject}
                      disabled={savingSubdomain === selectedSubdomain.full_domain}
                      tone="dark"
                    >
                      <Icon name="save" className="h-4 w-4" />
                    </ToolbarIconButton>
                        </div>
                      </div>

                      {String(selectedSubdomain.app_type || '').toLowerCase() === 'wordpress' ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-emerald-800">WordPress access</p>
                              <h4 className="mt-1 text-base font-semibold text-slate-950">Password & filesystem</h4>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                selectedSubdomain.wordpress_access_ready
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {selectedSubdomain.wordpress_access_ready ? 'Access ready' : 'Set password'}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 rounded-2xl bg-white/80 p-4 text-sm">
                            <PanelField
                              label="New password"
                              placeholder="Strong WordPress password"
                              type="password"
                              value={wordpressPasswordDraft}
                              onChange={(event) => setWordPressPasswordDraft(event.target.value)}
                              name={`wordpress_password_${selectedSubdomain.full_domain}`}
                            />
                            <div className="flex flex-wrap gap-2">
                              <ToolbarIconButton
                                title={savingWordPressPassword === selectedSubdomain.full_domain ? 'Saving...' : 'Update WordPress password'}
                                onClick={() => saveWordPressPassword('subdomain', selectedSubdomain)}
                                disabled={savingWordPressPassword === selectedSubdomain.full_domain}
                                tone="primary"
                              >
                                <Icon name="switchCamera" className="h-4 w-4" />
                              </ToolbarIconButton>
                              <ToolbarIconButton
                                title={repairingWordPress === selectedSubdomain.full_domain ? 'Repairing...' : 'Repair permissions'}
                                onClick={() => repairWordPressPermissions('subdomain', selectedSubdomain)}
                                disabled={repairingWordPress === selectedSubdomain.full_domain}
                                tone="sky"
                              >
                                <Icon name="repair" className="h-4 w-4" />
                              </ToolbarIconButton>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-500">Folder</p>
                        <code className="mt-3 block rounded-xl bg-white px-3 py-2 text-xs text-slate-600">
                          {selectedSubdomain.public_path}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      Select a website to see installer details, folder, and project name.
                    </p>
                  )}
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-400">How it works</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">1. First select a root domain or subdomain target from the same account.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">2. The panel prepares the public folder, DNS A record, and Nginx config automatically for the selected target.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">3. WordPress, CodeIgniter, and Laravel are installed to the selected target with live job progress.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">4. The installed website appears in the list below, with DNS, site, and folder status.</li>
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'email' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Email</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Mailbox management</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Select a domain first, then manage mailbox users for that domain. The panel will create the Maildir folder and password hash automatically when an account is created.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {mailAccounts.length} mailbox
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Dovecot ready
                  </span>
                </div>
              </div>

              {mailAccountsError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{mailAccountsError}</p>
              ) : null}

              {visibleMailDomains.length === 0 ? (
                <div className="mt-4 rounded-[1.4rem] border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  You do not have any email domains to manage from this account yet. Add your own domain first, or ask an admin to assign a domain to this account.
                </div>
              ) : null}

              <div className="mt-5 space-y-5">
                <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4">
                    <PanelSelect
                      label="Domain"
                      value={mailDomainFilter}
                      onChange={(event) => {
                        setMailDomainFilter(event.target.value);
                        setSelectedMailbox(null);
                        setMailboxDraftPassword('');
                      }}
                      name="mail_domain"
                    >
                      {visibleMailDomains.length === 0 ? (
                        <option value="">No domains available</option>
                      ) : null}
                      {visibleMailDomains.map((domain) => (
                        <option key={domain.domain} value={domain.domain}>
                          {domain.display_name || domain.domain}
                        </option>
                      ))}
                    </PanelSelect>

                    <PanelField
                      label="Mailbox name"
                      placeholder="john"
                      value={mailboxForm.localPart}
                      onChange={(event) =>
                        setMailboxForm((current) => ({ ...current, localPart: event.target.value }))
                      }
                      name="mailbox_local_part"
                    />

                    <PanelField
                      label="Password"
                      placeholder="Strong password"
                      type="password"
                      value={mailboxForm.password}
                      onChange={(event) =>
                        setMailboxForm((current) => ({ ...current, password: event.target.value }))
                      }
                      name="mailbox_password"
                    />

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                      <input
                        type="checkbox"
                        checked={mailboxForm.enabled}
                        onChange={(event) =>
                          setMailboxForm((current) => ({ ...current, enabled: event.target.checked }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-[#1877ff] focus:ring-[#1877ff]"
                      />
                      Enable mailbox
                    </label>

                    <div className="rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                      Email address will become <span className="font-semibold">{mailboxForm.localPart || 'localpart'}@{mailDomainFilter || 'domain'}</span>.
                    </div>

                    <ToolbarIconButton
                      title={creatingMailbox ? 'Creating...' : 'Create mailbox'}
                      type="submit"
                      onClick={submitMailbox}
                      disabled={creatingMailbox || !mailDomainFilter}
                      tone="dark"
                    >
                      <Icon name="email" className="h-4 w-4" />
                    </ToolbarIconButton>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Mailbox users</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">{mailDomainFilter || 'Select domain'}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {mailAccountsLoading ? 'Loading...' : `${mailAccounts.length} total`}
                    </span>
                  </div>

                  <div className="max-h-[420px] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-white">
                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-5 py-3">Email</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Path</th>
                          <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {mailAccountsLoading ? (
                          <TableSkeletonRows columns={4} rows={4} widths={['w-48', 'w-24', 'w-56', 'w-24']} />
                        ) : mailAccounts.length === 0 ? (
                          <tr>
                            <td className="px-5 py-6 text-sm text-slate-500" colSpan="4">
                              No mailbox on this domain.
                            </td>
                          </tr>
                        ) : (
                          mailAccounts.map((item) => (
                            <tr key={item.email}>
                              <td className="px-5 py-4">
                                <p className="text-sm font-semibold text-slate-950">{item.email}</p>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {item.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-500">
                                {item.mailbox_path}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <a
                                    href={`/api/mail/open?email=${encodeURIComponent(item.email)}`}
                                    title={item.access_ready ? 'Open mailbox' : 'Mailbox disabled'}
                                    aria-label="Open mailbox"
                                    className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold tracking-tight transition ${
                                      item.access_ready
                                        ? 'border-[#1f3d2e] bg-[#1f3d2e] text-white hover:bg-[#2f5d50]'
                                        : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                    }`}
                                    onClick={(event) => {
                                      if (!item.access_ready) {
                                        event.preventDefault();
                                      }
                                    }}
                                  >
                                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-xl ${item.access_ready ? 'bg-white/10 text-white' : 'bg-white text-slate-400'}`}>
                                      <Icon name="external" className="h-4 w-4" />
                                    </span>
                                    <span className="whitespace-nowrap">Open mailbox</span>
                                  </a>
                                  <ToolbarIconButton
                                    title="Details"
                                    onClick={() => {
                                      setSelectedMailbox(item);
                                      setMailboxDraftPassword('');
                                    }}
                                  >
                                    <Icon name="details" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                  <ToolbarIconButton
                                    title={savingMailbox === item.email ? 'Saving...' : item.enabled ? 'Disable' : 'Enable'}
                                    onClick={() => saveMailbox(item.email, { enabled: !item.enabled })}
                                    disabled={savingMailbox === item.email}
                                    className="border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100"
                                  >
                                    <Icon name="switch" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                  <ToolbarIconButton
                                    title={deletingMailbox === item.email ? 'Deleting...' : 'Delete'}
                                    onClick={() => deleteMailbox(item.email)}
                                    disabled={deletingMailbox === item.email}
                                    className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                  >
                                    <Icon name="trash" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-400">Selected mailbox</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    {selectedMailbox?.email || 'Select a mailbox from the table'}
                  </h3>

                  {selectedMailbox ? (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Path</span>
                          <span className="font-medium text-slate-900">{selectedMailbox.mailbox_path}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-slate-500">Status</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedMailbox.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {selectedMailbox.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      <PanelField
                        label="Reset password"
                        placeholder="New mailbox password"
                        type="password"
                        value={mailboxDraftPassword}
                        onChange={(event) => setMailboxDraftPassword(event.target.value)}
                        name="mailbox_reset_password"
                      />

                      <div className="flex flex-wrap gap-2">
                        <ToolbarIconButton
                          title={savingMailbox === selectedMailbox.email ? 'Saving...' : 'Update password'}
                          onClick={() => saveMailbox(selectedMailbox.email, { password: mailboxDraftPassword })}
                          disabled={savingMailbox === selectedMailbox.email || !mailboxDraftPassword}
                          className="bg-slate-950 text-white hover:bg-slate-800"
                        >
                          <Icon name="save" className="h-4 w-4" />
                        </ToolbarIconButton>
                        <ToolbarIconButton
                          title={selectedMailbox.enabled ? 'Disable mailbox' : 'Enable mailbox'}
                          onClick={() => saveMailbox(selectedMailbox.email, { enabled: !selectedMailbox.enabled })}
                          disabled={savingMailbox === selectedMailbox.email}
                        >
                          <Icon name="switch" className="h-4 w-4" />
                        </ToolbarIconButton>
                        <ToolbarIconButton
                          title={deletingMailbox === selectedMailbox.email ? 'Deleting...' : 'Delete mailbox'}
                          onClick={() => deleteMailbox(selectedMailbox.email)}
                          disabled={deletingMailbox === selectedMailbox.email}
                          className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </ToolbarIconButton>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      Click a mailbox to see the Maildir path and change the password or status.
                    </p>
                  )}
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-400">Notes</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">Mailboxes are created on the domain selected in the dropdown.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">The password is stored as a hash recognized by Dovecot.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">The Maildir folder is created automatically on the server and used by Postfix/Dovecot.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">The domains in the dropdown come from provisioned mail domains.</li>
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {session?.is_admin && activeSection === 'support' ? <SupportInbox /> : null}

          {activeSection === 'affiliate' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Affiliate</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                    {session?.is_admin ? 'Affiliate programs and commissions' : 'Referral rewards & coupon codes'}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Manage referral codes, user-specific coupons, and affiliate commissions in one panel.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {affiliateSummary.affiliate_count} affiliates
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    {affiliateSummary.commission_count} commissions
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700">
                    {affiliateSummary.pending_commission_rupiah ? `${formatRupiahAmount(affiliateSummary.pending_commission_rupiah)} pending` : 'No pending'}
                  </span>
                </div>
              </div>

              {affiliateError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{affiliateError}</p>
              ) : null}

              {affiliateLoading ? (
                <div className="mt-5 space-y-5">
                  <CardSkeleton rows={3} />
                  <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                    <CardSkeleton rows={4} />
                    <CardSkeleton rows={3} />
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  <div className="grid gap-4 md:grid-cols-4">
                    <StatCard
                      title="Referral code"
                      value={selectedAffiliateRecord?.referral_code || '-'}
                      detail="Referral link used to register new users."
                      icon={<Icon name="affiliate" className="h-6 w-6" />}
                      iconTone="bg-[#cfe8d5] text-[#1f3d2e]"
                    />
                    <StatCard
                      title="Coupon code"
                      value={selectedAffiliateRecord?.coupon_code || '-'}
                      detail="A private coupon for each user for promos or discounts."
                      icon={<Icon name="copy" className="h-6 w-6" />}
                      iconTone="bg-amber-50 text-amber-600"
                    />
                    <StatCard
                      title="Commission"
                      value={`${Number(selectedAffiliateRecord?.commission_percent ?? 10)}%`}
                      detail="Commission percentage used for each transaction."
                      icon={<FiCreditCard className="h-6 w-6" />}
                      iconTone="bg-sky-50 text-sky-600"
                    />
                    <StatCard
                      title="Referred signups"
                      value={String(selectedAffiliateRecord?.referred_signups ?? 0).padStart(2, '0')}
                      detail={selectedAffiliateRecord?.active ? 'Active affiliates' : 'Inactive affiliates'}
                      icon={<FiUsers className="h-6 w-6" />}
                      iconTone="bg-emerald-50 text-emerald-600"
                    />
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Monthly report</p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-950">
                            {affiliateCurrentMonthReport?.label || formatAffiliateMonthLabel(new Date())}
                          </h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          {affiliateMonthlyReport.length} month(s)
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Commission</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            Rp {formatRupiahAmount(affiliateCurrentMonthReport?.commission_rupiah || 0)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Transactions</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {String(affiliateCurrentMonthReport?.count || 0).padStart(2, '0')}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Status mix</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {String(affiliateCurrentMonthReport?.paid_count || 0)} paid / {String(affiliateCurrentMonthReport?.pending_count || 0)} pending
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 max-h-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white">
                              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                <th className="whitespace-nowrap px-4 py-3">Month</th>
                                <th className="whitespace-nowrap px-4 py-3">Commission</th>
                                <th className="whitespace-nowrap px-4 py-3">Tx</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {affiliateMonthlyReport.length === 0 ? (
                                <tr>
                                  <td className="px-4 py-6 text-sm text-slate-500" colSpan="3">
                                    No monthly commission data.
                                  </td>
                                </tr>
                              ) : (
                                affiliateMonthlyReport.slice(0, 6).map((item) => (
                                  <tr key={item.key}>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">{item.label}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">Rp {formatRupiahAmount(item.commission_rupiah)}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{item.count}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                        <PanelField
                          label="Report from"
                          type="date"
                          value={affiliateReportFrom}
                          onChange={(event) => setAffiliateReportFrom(event.target.value)}
                          name="affiliate_report_from"
                        />
                        <PanelField
                          label="Report to"
                          type="date"
                          value={affiliateReportTo}
                          onChange={(event) => setAffiliateReportTo(event.target.value)}
                          name="affiliate_report_to"
                        />
                        <div className="flex items-end">
                          <ToolbarIconButton
                            title="Clear filter"
                            type="button"
                            onClick={() => {
                              setAffiliateReportFrom('');
                              setAffiliateReportTo('');
                            }}
                            tone="sky"
                          >
                            <Icon name="refresh" className="h-4 w-4" />
                          </ToolbarIconButton>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(31,61,46,0.08),rgba(207,232,213,0.7)_42%,rgba(243,232,213,0.85))] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-[#1f3d2e]">Referral campaign</p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-950">Generate share-ready promo</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Create campaign links, captions, and export ledgers to share with potential customers.
                          </p>
                        </div>
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#1f3d2e] shadow-sm">
                          Auto UTM
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4">
                        <PanelField
                          label="Campaign name"
                          placeholder={`Promo ${formatAffiliateMonthLabel(new Date())}`}
                          value={affiliateCampaignName}
                          onChange={(event) => setAffiliateCampaignName(event.target.value)}
                          name="affiliate_campaign_name"
                        />

                        <div className="rounded-2xl bg-white/80 p-4 text-sm">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Preview link</p>
                          <p className="mt-2 break-all text-sm font-medium text-slate-950">
                            {affiliateCampaignPreview?.link || selectedAffiliateRecord?.referral_url || '-'}
                          </p>
                          <p className="mt-3 whitespace-pre-line rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                            {affiliateCampaignPreview?.caption || 'Select an affiliate first to create a campaign.'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <ToolbarIconButton
                            title="Generate referral campaign"
                            onClick={generateAffiliateCampaign}
                            disabled={!affiliateCampaignPreview}
                            tone="dark"
                          >
                            <Icon name="plus" className="h-4 w-4" />
                          </ToolbarIconButton>
                          <ToolbarIconButton
                            title="Copy campaign link"
                            onClick={async () => {
                              if (!affiliateCampaignPreview?.link) return;
                              await navigator.clipboard.writeText(affiliateCampaignPreview.link);
                              pushNotification({
                                title: 'Campaign link copied',
                                message: affiliateCampaignPreview.link,
                                tone: 'success',
                              });
                            }}
                            disabled={!affiliateCampaignPreview?.link}
                            tone="sky"
                          >
                            <Icon name="copy" className="h-4 w-4" />
                          </ToolbarIconButton>
                          <ToolbarIconButton
                            title="Copy campaign caption"
                            onClick={async () => {
                              if (!affiliateCampaignPreview?.caption) return;
                              await navigator.clipboard.writeText(affiliateCampaignPreview.caption);
                              pushNotification({
                                title: 'Campaign caption copied',
                                message: affiliateCampaignPreview.title,
                                tone: 'success',
                              });
                            }}
                            disabled={!affiliateCampaignPreview?.caption}
                            tone="sky"
                          >
                            <Icon name="copy" className="h-4 w-4" />
                          </ToolbarIconButton>
                          <ToolbarIconButton
                            title="Export commission ledger"
                            onClick={exportAffiliateLedger}
                            disabled={!affiliateCommissions.length}
                            tone="dark"
                          >
                            <Icon name="download" className="h-4 w-4" />
                          </ToolbarIconButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Referral leaderboard</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">Top affiliates by commission</h3>
                        <p className="mt-2 text-sm text-slate-500">
                          Rank affiliate partners by total commission and successful referrals.
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        {affiliateLeaderboard.length} partners
                      </span>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="min-w-max w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              <th className="whitespace-nowrap px-5 py-3">Rank</th>
                              <th className="whitespace-nowrap px-5 py-3">Affiliate</th>
                              <th className="whitespace-nowrap px-5 py-3">Referral</th>
                              <th className="whitespace-nowrap px-5 py-3">Signups</th>
                              <th className="whitespace-nowrap px-5 py-3">Total commission</th>
                              <th className="whitespace-nowrap px-5 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {affiliateLeaderboard.length === 0 ? (
                              <tr>
                                <td className="px-5 py-6 text-sm text-slate-500" colSpan="6">
                                  No affiliates for the leaderboard.
                                </td>
                              </tr>
                            ) : (
                              affiliateLeaderboard.slice(0, 8).map((item) => (
                                <tr key={item.id}>
                                  <td className="whitespace-nowrap px-5 py-4">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1f3d2e] text-sm font-semibold text-white">
                                      {item.rank}
                                    </span>
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4">
                                    <p className="text-sm font-semibold text-slate-950">{item.owner_name || item.owner_email}</p>
                                    <p className="text-xs text-slate-400">{item.company || item.owner_email}</p>
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.referral_code || '-'}</td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{String(item.referred_signups || 0).padStart(2, '0')}</td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">Rp {formatRupiahAmount(item.total_commission_rupiah || 0)}</td>
                                  <td className="whitespace-nowrap px-5 py-4">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                      {item.active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-5">
                      <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-slate-400">Affiliate profile</p>
                            <h3 className="mt-1 text-lg font-semibold text-slate-950">
                              {selectedAffiliateRecord?.owner_name || selectedAffiliateRecord?.owner_email || 'No affiliate selected'}
                            </h3>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedAffiliateRecord?.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {selectedAffiliateRecord?.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Owner email</span>
                            <span className="font-medium text-slate-900">{selectedAffiliateRecord?.owner_email || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Referral URL</span>
                            <span className="font-medium text-slate-900 break-all">{selectedAffiliateRecord?.referral_url || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Discount coupon</span>
                            <span className="font-medium text-slate-900">{Number(selectedAffiliateRecord?.coupon_discount_percent ?? 0)}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Total commission</span>
                            <span className="font-medium text-slate-900">Rp {formatRupiahAmount(selectedAffiliateRecord?.total_commission_rupiah || 0)}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <ToolbarIconButton
                            title="Copy referral URL"
                            onClick={async () => {
                              if (!selectedAffiliateRecord?.referral_url) return;
                              await navigator.clipboard.writeText(selectedAffiliateRecord.referral_url);
                              pushNotification({ title: 'Referral copied', message: selectedAffiliateRecord.referral_url, tone: 'success' });
                            }}
                            disabled={!selectedAffiliateRecord?.referral_url}
                            tone="sky"
                          >
                            <Icon name="copy" className="h-4 w-4" />
                          </ToolbarIconButton>
                          <ToolbarIconButton
                            title="Copy coupon code"
                            onClick={async () => {
                              if (!selectedAffiliateRecord?.coupon_code) return;
                              await navigator.clipboard.writeText(selectedAffiliateRecord.coupon_code);
                              pushNotification({ title: 'Coupon copied', message: selectedAffiliateRecord.coupon_code, tone: 'success' });
                            }}
                            disabled={!selectedAffiliateRecord?.coupon_code}
                            tone="sky"
                          >
                            <Icon name="copy" className="h-4 w-4" />
                          </ToolbarIconButton>
                          <a
                            href={selectedAffiliateRecord?.referral_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            title="Open referral URL"
                            aria-label="Open referral URL"
                            className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold tracking-tight transition ${
                              selectedAffiliateRecord?.referral_url
                                ? 'border-[#1f3d2e] bg-[#1f3d2e] text-white hover:bg-[#2f5d50]'
                                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            }`}
                            onClick={(event) => {
                              if (!selectedAffiliateRecord?.referral_url) {
                                event.preventDefault();
                              }
                            }}
                          >
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
                              <Icon name="external" className="h-4 w-4" />
                            </span>
                            <span className="whitespace-nowrap">Open referral</span>
                          </a>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-400">Commission ledger</p>
                            <h3 className="mt-1 text-lg font-semibold text-slate-950">
                              {selectedAffiliateRecord?.owner_email || 'Select affiliate'}
                            </h3>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                            {affiliateCommissions.length} total
                          </span>
                        </div>

                        <div className="max-h-[420px] overflow-auto">
                          <div className="overflow-x-auto">
                            <table className="min-w-max w-full divide-y divide-slate-200">
                              <thead className="bg-white">
                                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  <th className="whitespace-nowrap px-5 py-3">Invoice</th>
                                  <th className="whitespace-nowrap px-5 py-3">Source</th>
                                  <th className="whitespace-nowrap px-5 py-3">Amount</th>
                                  <th className="whitespace-nowrap px-5 py-3">Commission</th>
                                  <th className="whitespace-nowrap px-5 py-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {affiliateCommissions.length === 0 ? (
                                  <tr>
                                    <td className="px-5 py-6 text-sm text-slate-500" colSpan="5">
                                      No commissions for this affiliate yet.
                                    </td>
                                  </tr>
                                ) : (
                                  affiliateCommissions.map((item) => (
                                    <tr key={item.id}>
                                      <td className="whitespace-nowrap px-5 py-4">
                                        <p className="text-sm font-semibold text-slate-950">{item.source_invoice_number || '-'}</p>
                                        <p className="text-xs text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</p>
                                      </td>
                                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.source_email || '-'}</td>
                                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">Rp {formatRupiahAmount(item.amount_rupiah)}</td>
                                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">Rp {formatRupiahAmount(item.commission_rupiah)}</td>
                                      <td className="whitespace-nowrap px-5 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${affiliateCommissionStatusClasses(item.status)}`}>
                                          {formatAffiliateCommissionStatus(item.status)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {session?.is_admin ? (
                        <>
                          <form onSubmit={submitAffiliate} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                            <div className="grid gap-4">
                              <div>
                                <p className="text-sm font-medium text-slate-400">Admin editor</p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-950">Affiliate profile</h3>
                                <p className="mt-2 text-sm text-slate-500">
                                  Admins can change each user’s referral code, coupon code, and commission percentage.
                                </p>
                              </div>

                              <PanelField
                                label="Owner email"
                                placeholder="user@domain.com"
                                value={affiliateForm.ownerEmail}
                                onChange={(event) => setAffiliateForm((current) => ({ ...current, ownerEmail: event.target.value }))}
                                name="affiliate_owner_email"
                              />

                              <PanelField
                                label="Referral code"
                                placeholder="AFF-USER-123"
                                value={affiliateForm.referralCode}
                                onChange={(event) => setAffiliateForm((current) => ({ ...current, referralCode: event.target.value }))}
                                name="affiliate_referral_code"
                              />

                              <PanelField
                                label="Coupon code"
                                placeholder="CPN-USER-123"
                                value={affiliateForm.couponCode}
                                onChange={(event) => setAffiliateForm((current) => ({ ...current, couponCode: event.target.value }))}
                                name="affiliate_coupon_code"
                              />

                              <div className="grid gap-4 md:grid-cols-2">
                                <PanelField
                                  label="Commission %"
                                  placeholder="10"
                                  value={affiliateForm.commissionPercent}
                                  onChange={(event) => setAffiliateForm((current) => ({ ...current, commissionPercent: event.target.value }))}
                                  name="affiliate_commission_percent"
                                />
                                <PanelField
                                  label="Coupon discount %"
                                  placeholder="0"
                                  value={affiliateForm.couponDiscountPercent}
                                  onChange={(event) => setAffiliateForm((current) => ({ ...current, couponDiscountPercent: event.target.value }))}
                                  name="affiliate_coupon_discount_percent"
                                />
                              </div>

                              <label className="flex items-center gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={affiliateForm.active}
                                  onChange={(event) => setAffiliateForm((current) => ({ ...current, active: event.target.checked }))}
                                  className="h-4 w-4 rounded border-slate-300 text-[#1f3d2e] focus:ring-[#1f3d2e]"
                                />
                                Active affiliate
                              </label>

                              <div className="flex flex-wrap gap-2">
                                <ToolbarIconButton
                                  title={affiliateSaving ? 'Saving...' : 'Save affiliate'}
                                  type="submit"
                                  disabled={affiliateSaving || !affiliateForm.ownerEmail}
                                  tone="dark"
                                >
                                  <Icon name="save" className="h-4 w-4" />
                                </ToolbarIconButton>
                                <ToolbarIconButton
                                  title="Reset form"
                                  type="button"
                                  onClick={resetAffiliateForm}
                                  tone="sky"
                                >
                                  <Icon name="refresh" className="h-4 w-4" />
                                </ToolbarIconButton>
                                <ToolbarIconButton
                                  title={affiliateDeleting ? 'Deleting...' : 'Delete affiliate'}
                                  type="button"
                                  onClick={deleteAffiliate}
                                  disabled={!selectedAffiliateRecord || affiliateDeleting === String(selectedAffiliateRecord?.id || '')}
                                  className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                >
                                  <Icon name="trash" className="h-4 w-4" />
                                </ToolbarIconButton>
                              </div>
                            </div>
                          </form>

                          <form onSubmit={submitAffiliateCommission} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                            <div className="grid gap-4">
                              <div>
                                <p className="text-sm font-medium text-slate-400">Commission entry</p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-950">Create ledger entry</h3>
                              </div>

                              <PanelSelect
                                label="Affiliate"
                                value={affiliateCommissionForm.affiliateId}
                                onChange={(event) => {
                                  const nextId = event.target.value;
                                  const nextAffiliate = affiliateRecords.find((item) => String(item.id) === String(nextId)) || null;
                                  setAffiliateCommissionForm((current) => ({
                                    ...current,
                                    affiliateId: nextId,
                                    ownerEmail: nextAffiliate?.owner_email || current.ownerEmail,
                                  }));
                                  if (nextAffiliate) {
                                    setAffiliateSelectedId(Number(nextAffiliate.id) || 0);
                                  }
                                }}
                                name="affiliate_commission_affiliate"
                              >
                                <option value="">Select affiliate</option>
                                {affiliateRecords.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.owner_name || item.owner_email}
                                  </option>
                                ))}
                              </PanelSelect>

                              <PanelField
                                label="Source email"
                                placeholder="customer@domain.com"
                                value={affiliateCommissionForm.sourceEmail}
                                onChange={(event) => setAffiliateCommissionForm((current) => ({ ...current, sourceEmail: event.target.value }))}
                                name="affiliate_source_email"
                              />

                              <div className="grid gap-4 md:grid-cols-2">
                                <PanelField
                                  label="Invoice number"
                                  placeholder="INV-001"
                                  value={affiliateCommissionForm.sourceInvoiceNumber}
                                  onChange={(event) => setAffiliateCommissionForm((current) => ({ ...current, sourceInvoiceNumber: event.target.value }))}
                                  name="affiliate_invoice_number"
                                />
                                <PanelField
                                  label="Amount (Rp)"
                                  placeholder="150000"
                                  value={affiliateCommissionForm.amountRupiah}
                                  onChange={(event) => setAffiliateCommissionForm((current) => ({ ...current, amountRupiah: event.target.value }))}
                                  name="affiliate_amount_rupiah"
                                />
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <PanelField
                                  label="Commission (Rp)"
                                  placeholder="Auto if empty"
                                  value={affiliateCommissionForm.commissionRupiah}
                                  onChange={(event) => setAffiliateCommissionForm((current) => ({ ...current, commissionRupiah: event.target.value }))}
                                  name="affiliate_commission_rupiah"
                                />
                                <div>
                                  <label className="mb-2 block text-sm font-medium text-slate-600">Status</label>
                                  <select
                                    value={affiliateCommissionForm.status}
                                    onChange={(event) => setAffiliateCommissionForm((current) => ({ ...current, status: event.target.value }))}
                                    className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1f3d2e] focus:bg-white"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="paid">Paid</option>
                                    <option value="canceled">Canceled</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-600">Notes</label>
                                <textarea
                                  value={affiliateCommissionForm.notes}
                                  onChange={(event) => setAffiliateCommissionForm((current) => ({ ...current, notes: event.target.value }))}
                                  rows={4}
                                  className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1f3d2e] focus:bg-white"
                                  placeholder="Catatan commission"
                                />
                              </div>

                              <ToolbarIconButton
                                title={affiliateCommissionSaving ? 'Saving...' : 'Create commission'}
                                type="submit"
                                disabled={affiliateCommissionSaving || !affiliateCommissionForm.affiliateId}
                                tone="dark"
                              >
                                <Icon name="plus" className="h-4 w-4" />
                              </ToolbarIconButton>
                            </div>
                          </form>

                          <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <div>
                                <p className="text-sm font-medium text-slate-400">All affiliates</p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-950">Referral inventory</h3>
                              </div>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                {affiliateRecords.length} total
                              </span>
                            </div>

                            <div className="max-h-[420px] overflow-auto">
                              <div className="overflow-x-auto">
                                <table className="min-w-max w-full divide-y divide-slate-200">
                                  <thead className="bg-white">
                                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                      <th className="whitespace-nowrap px-5 py-3">Owner</th>
                                      <th className="whitespace-nowrap px-5 py-3">Referral</th>
                                      <th className="whitespace-nowrap px-5 py-3">Coupon</th>
                                      <th className="whitespace-nowrap px-5 py-3">Commission</th>
                                      <th className="whitespace-nowrap px-5 py-3">Status</th>
                                      <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {affiliateRecords.length === 0 ? (
                                      <tr>
                                        <td className="px-5 py-6 text-sm text-slate-500" colSpan="6">
                                          No affiliate records created.
                                        </td>
                                      </tr>
                                    ) : (
                                      affiliateRecords.map((item) => (
                                        <tr
                                          key={item.id}
                                          className={String(item.id) === String(affiliateSelectedId) ? 'bg-emerald-50/60' : ''}
                                        >
                                          <td className="whitespace-nowrap px-5 py-4">
                                            <p className="text-sm font-semibold text-slate-950">{item.owner_name || item.owner_email}</p>
                                            <p className="text-xs text-slate-400">{item.owner_email}</p>
                                          </td>
                                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.referral_code || '-'}</td>
                                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.coupon_code || '-'}</td>
                                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{Number(item.commission_percent || 0)}%</td>
                                          <td className="whitespace-nowrap px-5 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                              {item.active ? 'Active' : 'Inactive'}
                                            </span>
                                          </td>
                                          <td className="whitespace-nowrap px-5 py-4 text-right">
                                            <ToolbarIconButton
                                              title="Details"
                                              onClick={() => {
                                                setAffiliateSelectedId(Number(item.id) || 0);
                                                setAffiliateForm({
                                                  ownerEmail: item.owner_email || '',
                                                  referralCode: item.referral_code || '',
                                                  couponCode: item.coupon_code || '',
                                                  commissionPercent: String(item.commission_percent ?? 10),
                                                  couponDiscountPercent: String(item.coupon_discount_percent ?? 0),
                                                  active: Boolean(item.active),
                                                });
                                                setAffiliateCommissionForm((current) => ({
                                                  ...current,
                                                  affiliateId: String(item.id),
                                                  ownerEmail: item.owner_email || current.ownerEmail,
                                                }));
                                              }}
                                            >
                                              <Icon name="details" className="h-4 w-4" />
                                            </ToolbarIconButton>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                          <div className="grid gap-4">
                            <div>
                              <p className="text-sm font-medium text-slate-400">Your affiliate</p>
                              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                                {selectedAffiliateRecord?.owner_name || selectedAffiliateRecord?.owner_email || 'No affiliate data'}
                              </h3>
                            </div>

                            <div className="rounded-[1.75rem] border border-[#1f3d2e]/10 bg-[linear-gradient(135deg,rgba(31,61,46,0.08),rgba(207,232,213,0.72)_55%,rgba(243,232,213,0.9))] p-5">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <p className="text-sm font-medium text-[#1f3d2e]">Referral kit</p>
                                  <h4 className="mt-1 text-xl font-semibold text-slate-950">Share link, coupon, and earn from paid billing</h4>
                                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                    Every paid invoice is counted automatically as affiliate commission. Share your referral link or coupon code with potential customers.
                                  </p>
                                </div>
                                <span className="rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-[#1f3d2e] shadow-sm">
                                  {affiliateSummary.commission_count} commission items
                                </span>
                              </div>
                              <div className="mt-4 grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl bg-white/80 px-4 py-3">
                                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Referral</p>
                                  <p className="mt-1 break-all text-sm font-semibold text-slate-950">{selectedAffiliateRecord?.referral_code || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 px-4 py-3">
                                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Coupon</p>
                                  <p className="mt-1 break-all text-sm font-semibold text-slate-950">{selectedAffiliateRecord?.coupon_code || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 px-4 py-3">
                                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Commission</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-950">
                                    {Number(selectedAffiliateRecord?.commission_percent ?? 10)}% / {Number(selectedAffiliateRecord?.coupon_discount_percent ?? 0)}%
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-3 rounded-2xl bg-white p-4 text-sm">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Referral URL</span>
                                <span className="font-medium text-slate-900 break-all">{selectedAffiliateRecord?.referral_url || '-'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Referral code</span>
                                <span className="font-medium text-slate-900">{selectedAffiliateRecord?.referral_code || '-'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Coupon code</span>
                                <span className="font-medium text-slate-900">{selectedAffiliateRecord?.coupon_code || '-'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Commission / discount</span>
                                <span className="font-medium text-slate-900">
                                  {Number(selectedAffiliateRecord?.commission_percent ?? 10)}% / {Number(selectedAffiliateRecord?.coupon_discount_percent ?? 0)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Total commission</span>
                                <span className="font-medium text-slate-900">Rp {formatRupiahAmount(selectedAffiliateRecord?.total_commission_rupiah || 0)}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <ToolbarIconButton
                                title="Copy referral URL"
                                onClick={async () => {
                                  if (!selectedAffiliateRecord?.referral_url) return;
                                  await navigator.clipboard.writeText(selectedAffiliateRecord.referral_url);
                                  pushNotification({ title: 'Referral copied', message: selectedAffiliateRecord.referral_url, tone: 'success' });
                                }}
                                disabled={!selectedAffiliateRecord?.referral_url}
                                tone="sky"
                              >
                                <Icon name="copy" className="h-4 w-4" />
                              </ToolbarIconButton>
                              <ToolbarIconButton
                                title="Copy coupon code"
                                onClick={async () => {
                                  if (!selectedAffiliateRecord?.coupon_code) return;
                                  await navigator.clipboard.writeText(selectedAffiliateRecord.coupon_code);
                                  pushNotification({ title: 'Coupon copied', message: selectedAffiliateRecord.coupon_code, tone: 'success' });
                                }}
                                disabled={!selectedAffiliateRecord?.coupon_code}
                                tone="sky"
                              >
                                <Icon name="copy" className="h-4 w-4" />
                              </ToolbarIconButton>
                              <a
                                href={selectedAffiliateRecord?.referral_url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                title="Open referral URL"
                                aria-label="Open referral URL"
                                className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold tracking-tight transition ${
                                  selectedAffiliateRecord?.referral_url
                                    ? 'border-[#1f3d2e] bg-[#1f3d2e] text-white hover:bg-[#2f5d50]'
                                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                }`}
                                onClick={(event) => {
                                  if (!selectedAffiliateRecord?.referral_url) {
                                    event.preventDefault();
                                  }
                                }}
                              >
                                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
                                  <Icon name="external" className="h-4 w-4" />
                                </span>
                                <span className="whitespace-nowrap">Open referral</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {activeSection === 'overview' ? (
            <section className="space-y-5">
              <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Recent activity</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">Operator feed</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    Live
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    ['New mailbox created', 'admin@diworkin.com'],
                    ['DKIM key rotated', 'mail selector'],
                    ['DNS record added', 'panel.diworkin.com'],
                  ].map(([title, meta]) => (
                    <div key={title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{title}</p>
                        <p className="mt-1 text-sm text-slate-400">{meta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <p className="text-sm font-medium text-slate-400">Quick actions</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { title: 'Add domain', icon: 'domains' },
                    { title: 'Create mailbox', icon: 'email' },
                    { title: 'Add alias', icon: 'link' },
                    { title: 'Reset password', icon: 'save' },
                    { title: 'Suspend account', icon: 'shield' },
                  ].map((item) => (
                    <ToolbarIconButton key={item.title} title={item.title}>
                      <Icon name={item.icon} className="h-4 w-4" />
                    </ToolbarIconButton>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,rgba(24,119,255,0.16),rgba(255,255,255,0.85)_62%)] p-5">
                  <p className="text-sm font-medium text-slate-500">Design note</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The dashboard is intentionally calm and clean so the operator can focus on state,
                    tasks, and account management. We can layer the real modules on top of this shell
                    next.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'dns' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">DNS</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">DNS record management</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Select a domain that already points to the Diworkin nameservers, then manage DNS records from this panel.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {dnsRecords.length} records
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    PowerDNS
                  </span>
                </div>
              </div>

              {dnsRecordsError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{dnsRecordsError}</p>
              ) : null}

              <div className="mt-5 space-y-5">
                <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4">
                    <PanelSelect
                      label="Domain"
                      value={dnsDomainFilter}
                      onChange={(event) => {
                        setDnsDomainFilter(event.target.value);
                        setSelectedDnsRecord(null);
                        setDnsForm({ name: '', type: 'A', ttl: '3600', content: '', priority: '10' });
                      }}
                      name="dns_domain"
                    >
                      {dnsDomains.length === 0 ? (
                        <option value="">No domains available</option>
                      ) : null}
                      {dnsDomains.map((domain) => (
                        <option key={domain.domain} value={domain.domain}>
                          {domain.display_name || domain.domain}
                        </option>
                      ))}
                    </PanelSelect>

                    <PanelField
                      label="Name"
                      placeholder="@"
                      value={dnsForm.name}
                      onChange={(event) => setDnsForm((current) => ({ ...current, name: event.target.value }))}
                      name="dns_name"
                    />

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Type</label>
                      <select
                        value={dnsForm.type}
                        onChange={(event) => setDnsForm((current) => ({ ...current, type: event.target.value }))}
                        className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                      >
                        {['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'].map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4">
                      <PanelField
                        label="TTL"
                        placeholder="3600"
                        value={dnsForm.ttl}
                        onChange={(event) => setDnsForm((current) => ({ ...current, ttl: event.target.value }))}
                        name="dns_ttl"
                      />
                      <PanelField
                        label="Priority"
                        placeholder="10"
                        value={dnsForm.priority}
                        onChange={(event) => setDnsForm((current) => ({ ...current, priority: event.target.value }))}
                        name="dns_priority"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Content</label>
                      <textarea
                        value={dnsForm.content}
                        onChange={(event) => setDnsForm((current) => ({ ...current, content: event.target.value }))}
                        rows={5}
                        className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                        placeholder="Record content"
                      />
                    </div>

                    <div className="rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                      Record names use relative format, for example <span className="font-semibold">www</span>, <span className="font-semibold">@</span>, or <span className="font-semibold">mail</span>.
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={selectedDnsRecord ? updateDnsRecord : submitDnsRecord}
                        disabled={dnsSaving || !dnsDomainFilter}
                        className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {dnsSaving ? 'Saving...' : selectedDnsRecord ? 'Update record' : 'Create record'}
                      </button>
                      {selectedDnsRecord ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDnsRecord(null);
                            setDnsForm({ name: '', type: 'A', ttl: '3600', content: '', priority: '10' });
                          }}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Cancel edit
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">DNS records</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">{dnsDomainFilter || 'Select domain'}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {dnsRecordsLoading ? 'Loading...' : `${dnsRecords.length} total`}
                    </span>
                  </div>

                  <div className="max-h-[460px] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-white">
                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-5 py-3">Name</th>
                          <th className="px-5 py-3">Type</th>
                          <th className="px-5 py-3">Content</th>
                          <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {dnsRecordsLoading ? (
                          <TableSkeletonRows columns={4} rows={4} widths={['w-40', 'w-20', 'w-56', 'w-24']} />
                        ) : dnsRecords.length === 0 ? (
                          <tr>
                            <td className="px-5 py-6 text-sm text-slate-500" colSpan="4">No DNS records for this domain.</td>
                          </tr>
                        ) : (
                          dnsRecords.map((record) => (
                            <tr key={`${record.name}:${record.type}:${record.content}`}>
                              <td className="px-5 py-4">
                                <p className="text-sm font-semibold text-slate-950">{record.name}</p>
                                <p className="text-xs text-slate-400">TTL {record.ttl || 3600}</p>
                              </td>
                              <td className="px-5 py-4">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {record.type}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-500">
                                {record.type === 'MX' ? `${record.priority || 10} ${record.content}` : record.content}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDnsRecord(record);
                                      setDnsForm({
                                        name: record.name,
                                        type: record.type,
                                        ttl: String(record.ttl || 3600),
                                        content: record.content,
                                        priority: String(record.priority || 10),
                                      });
                                    }}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteDnsRecord(record)}
                                    disabled={dnsDeleting === `${record.name}:${record.type}`}
                                    className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    {dnsDeleting === `${record.name}:${record.type}` ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.8rem] border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-400">Notes</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <li className="rounded-2xl bg-slate-50 px-4 py-3">An empty record name or <span className="font-semibold">@</span> means the root domain.</li>
                  <li className="rounded-2xl bg-slate-50 px-4 py-3">A, AAAA, CNAME, MX, TXT, NS, SRV, dan CAA didukung.</li>
                  <li className="rounded-2xl bg-slate-50 px-4 py-3">Record changes immediately tidy the zone and rediscover PowerDNS.</li>
                  <li className="rounded-2xl bg-slate-50 px-4 py-3">The domain must already be provisioned and pointed to the Diworkin nameservers.</li>
                </ul>
              </div>
            </section>
          ) : null}

          {activeSection === 'ssl' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">SSL</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">SSL certificate manager</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Manage SSL certificates for provisioned domains and subdomains. The panel can
                    issue or renew Let&apos;s Encrypt certificates directly from here.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {sslTargets.length} targets
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Let&apos;s Encrypt
                  </span>
                </div>
              </div>

              {sslTargetsError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{sslTargetsError}</p>
              ) : null}

              <div className="mt-5 space-y-5">
                <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-4 text-sm leading-6 text-sky-900">
                      Select target SSL, lalu klik <span className="font-semibold">Issue / Renew</span> untuk
                      issue certificates. For WordPress, the site URL will switch to HTTPS after SSL is active.
                    </div>
                    <div className="grid gap-3 rounded-[1.4rem] border border-slate-200 bg-white p-4 text-sm text-slate-600">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Target</span>
                        <span className="font-medium text-slate-900">Domain / Subdomain</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Provider</span>
                        <span className="font-medium text-slate-900">certbot + nginx</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Renewal</span>
                        <span className="font-medium text-slate-900">Otomatis oleh Certbot</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={refreshSslTargets}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Refresh targets
                      </button>
                      <button
                        type="button"
                        onClick={fixMissingSslTargets}
                        disabled={sslBulkFixing || sslTargets.filter((item) => ['missing', 'unknown', 'expiring'].includes(String(item.certificate_status || '').toLowerCase())).length === 0}
                        className="rounded-2xl border border-[#1f3d2e] bg-[#1f3d2e] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,61,46,0.18)] transition hover:bg-[#2f5d50] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {sslBulkFixing ? 'Fixing...' : 'Fix missing SSL'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">SSL targets</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">Domains and subdomains</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {sslTargetsLoading ? 'Loading...' : `${sslTargets.length} total`}
                    </span>
                  </div>

                  <div className="max-h-[620px] overflow-auto">
                    <div className="overflow-x-auto">
                      <table className="min-w-max w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                          <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <th className="whitespace-nowrap px-5 py-3">Target</th>
                            <th className="whitespace-nowrap px-5 py-3">Type</th>
                            <th className="whitespace-nowrap px-5 py-3">DNS</th>
                            <th className="whitespace-nowrap px-5 py-3">Site</th>
                            <th className="whitespace-nowrap px-5 py-3">SSL</th>
                            <th className="whitespace-nowrap px-5 py-3">Expires</th>
                            <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sslTargetsLoading ? (
                          <TableSkeletonRows columns={7} rows={4} widths={['w-40', 'w-20', 'w-24', 'w-24', 'w-24', 'w-28', 'w-24']} />
                        ) : sslTargets.length === 0 ? (
                            <tr>
                              <td className="px-5 py-6 text-sm text-slate-500" colSpan="7">
                                No SSL targets available to manage.
                              </td>
                            </tr>
                          ) : (
                            sslTargets.map((item) => (
                              <tr key={`${item.kind}:${item.full_domain}`}>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-950">{item.full_domain}</p>
                                    <p className="mt-1 text-xs text-slate-400">{item.owner_email}</p>
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {item.kind}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.dns_status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {item.dns_status === 'ready' ? 'DNS ready' : 'DNS pending'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.site_status === 'live' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {item.site_status === 'live' ? 'Live' : 'Offline'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    item.certificate_status === 'valid'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : item.certificate_status === 'expiring'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    {item.certificate_status}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                                  {item.certificate_expires_at ? new Date(item.certificate_expires_at).toLocaleDateString() : '-'}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-right">
                                  <ToolbarIconButton
                                    title={sslIssuing === item.full_domain ? 'Issuing...' : 'Issue / Renew'}
                                    onClick={() => issueSslTarget(item)}
                                    disabled={sslIssuing === item.full_domain}
                                  >
                                    <Icon name="switchCamera" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'databases' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Databases</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Database wizard</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Select a project domain, then create PostgreSQL, MariaDB, or MongoDB from this panel.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {databaseEntries.length} database
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Wizard ready
                  </span>
                </div>
              </div>

              {databaseError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{databaseError}</p>
              ) : null}

              <div className="mt-5 space-y-5">
                <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <form className="grid gap-4" onSubmit={submitDatabase}>
                    <PanelSelect
                      label="Domain"
                      value={databaseDomainFilter}
                      onChange={(event) => {
                        setDatabaseDomainFilter(event.target.value);
                        setSelectedDatabase(null);
                        setDatabaseForm((current) => ({ ...current, name: '', username: '', password: '' }));
                      }}
                      name="db_domain"
                    >
                      {domains.length === 0 ? <option value="">No domains available</option> : null}
                      {domains.map((domain) => (
                        <option key={domain.domain} value={domain.domain}>
                          {domain.domain}
                        </option>
                      ))}
                    </PanelSelect>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Engine</label>
                      <select
                        value={databaseForm.engine}
                        onChange={(event) => setDatabaseForm((current) => ({ ...current, engine: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-900 outline-none shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      >
                        {databaseEngines.length === 0 ? (
                          <>
                            <option value="postgres">PostgreSQL</option>
                            <option value="mariadb">MariaDB</option>
                            <option value="mongodb">MongoDB</option>
                          </>
                        ) : (
                          databaseEngines.map((engine) => (
                            <option key={engine.key} value={engine.key} disabled={!engine.supported}>
                              {engine.label}{engine.supported ? '' : ' (not installed)'}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <PanelField
                      label="Database name"
                      placeholder="app_db"
                      value={databaseForm.name}
                      onChange={(event) => setDatabaseForm((current) => ({ ...current, name: event.target.value }))}
                      name="database_name"
                    />

                    <PanelField
                      label="Username"
                      placeholder="app_user"
                      value={databaseForm.username}
                      onChange={(event) => setDatabaseForm((current) => ({ ...current, username: event.target.value }))}
                      name="database_username"
                    />

                    <PanelField
                      label="Password"
                      placeholder="Strong database password"
                      type="password"
                      value={databaseForm.password}
                      onChange={(event) => setDatabaseForm((current) => ({ ...current, password: event.target.value }))}
                      name="database_password"
                    />

                    <div className="rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                      Engines not installed yet are marked in the dropdown. PostgreSQL is available now, and MariaDB and MongoDB can be enabled later.
                    </div>

                    <ToolbarIconButton
                      title={creatingDatabase
                        ? 'Creating...'
                        : selectedDatabaseEngine && !selectedDatabaseEngine.supported
                          ? 'Install engine first'
                          : 'Create database'}
                      type="submit"
                      disabled={creatingDatabase || !databaseDomainFilter || (selectedDatabaseEngine && !selectedDatabaseEngine.supported)}
                      className="bg-slate-950 text-white hover:bg-slate-800"
                    >
                      <Icon name="database" className="h-4 w-4" />
                    </ToolbarIconButton>
                  </form>
                </div>

                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Provisioned databases</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">{databaseDomainFilter || 'Select domain'}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {databaseLoading ? 'Loading...' : `${databaseEntries.length} total`}
                    </span>
                  </div>

                  <div className="max-h-[420px] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-white">
                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-5 py-3">Engine</th>
                          <th className="px-5 py-3">Name</th>
                          <th className="px-5 py-3">Username</th>
                          <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {databaseLoading ? (
                          <TableSkeletonRows columns={4} rows={4} widths={['w-20', 'w-36', 'w-32', 'w-24']} />
                        ) : databaseEntries.length === 0 ? (
                          <tr>
                            <td className="px-5 py-6 text-sm text-slate-500" colSpan="4">No databases for this domain.</td>
                          </tr>
                        ) : (
                          databaseEntries.map((item) => (
                            <tr key={`${item.engine}:${item.name}`}>
                              <td className="px-5 py-4">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {item.engine}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                                <p className="text-xs text-slate-400">{item.host}:{item.port}</p>
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-600">{item.username}</td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <ToolbarIconButton
                                    title="Details"
                                    onClick={() => setSelectedDatabase(item)}
                                  >
                                    <Icon name="details" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                  <ToolbarIconButton
                                    title={deletingDatabase === `${item.engine}:${item.name}` ? 'Deleting...' : 'Delete'}
                                    onClick={() => deleteDatabase(item)}
                                    disabled={deletingDatabase === `${item.engine}:${item.name}`}
                                    className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                  >
                                    <Icon name="trash" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-400">Selected database</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    {selectedDatabase ? `${selectedDatabase.engine}:${selectedDatabase.name}` : 'Select a database from the table'}
                  </h3>

                  {selectedDatabase ? (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Connection URI</span>
                          <span className="font-medium text-slate-900 break-all">{selectedDatabase.connection_uri}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-4">
                          <span className="text-slate-500">Status</span>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {selectedDatabase.status || 'active'}
                          </span>
                        </div>
                      </div>
                      <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Domain</span>
                          <span className="font-medium text-slate-900">{selectedDatabase.domain}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Username</span>
                          <span className="font-medium text-slate-900">{selectedDatabase.username}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Host</span>
                          <span className="font-medium text-slate-900">{selectedDatabase.host}:{selectedDatabase.port}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      Click a database to see the connection string and access details.
                    </p>
                  )}
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-400">Notes</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">PostgreSQL is available on the server right now.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">MariaDB and MongoDB will become available once the service/binary is installed.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">Database names and usernames can only use letters, numbers, and underscores.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">The panel stores the connection string for later use by the app.</li>
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {session?.is_admin && activeSection === 'settings' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Settings</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Brand, business hours, and payment details</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Manage brand identity, business hours, location, and bank details used for invoices,
                    email, and contact materials in the panel.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {settingsForm.brandName || 'Diworkin'}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    {settingsForm.logoUrl ? 'Logo ready' : 'Logo empty'}
                  </span>
                  <span className={`rounded-full px-3 py-2 text-sm font-medium ${session?.is_admin ? 'bg-[#cfe8d5] text-[#1f3d2e]' : 'bg-slate-100 text-slate-600'}`}>
                    {session?.is_admin ? 'Editable by admin' : 'Read only'}
                  </span>
                </div>
              </div>

              {settingsError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{settingsError}</p>
              ) : null}

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <StatCard
                  title="Logo"
                  value={settingsForm.logoUrl ? 'Ready' : 'Empty'}
                  detail="Logo used in auth, panel, and invoices."
                  icon={<Icon name="settings" className="h-6 w-6" />}
                  iconTone="bg-[#cfe8d5] text-[#1f3d2e]"
                />
                <StatCard
                  title="Business hours"
                  value={settingsForm.businessHours ? 'Set' : 'Unset'}
                  detail="Business hours shown to users."
                  icon={<FiActivity className="h-6 w-6" />}
                  iconTone="bg-sky-50 text-sky-600"
                />
                <StatCard
                  title="Bank details"
                  value={settingsForm.bankAccountNumber ? 'Ready' : 'Empty'}
                  detail="Bank details used for invoice payments."
                  icon={<FiCreditCard className="h-6 w-6" />}
                  iconTone="bg-amber-50 text-amber-600"
                />
              </div>

              {settingsLoading ? (
                <div className="mt-5 space-y-5">
                  <div className="rounded-[1.8rem] border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm font-medium text-emerald-900">
                    Loading settings...
                  </div>
                  <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                    <CardSkeleton rows={4} />
                    <div className="space-y-5">
                      <CardSkeleton rows={3} />
                      <CardSkeleton rows={2} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                  <form onSubmit={submitSettings} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-4">
                      <PanelField
                        label="Brand name"
                        placeholder="Diworkin"
                        value={settingsForm.brandName}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, brandName: event.target.value }))}
                        name="settings_brand_name"
                        disabled={!session?.is_admin}
                      />
                      <PanelField
                        label="Logo URL"
                        placeholder="/diworkin-logo.png"
                        value={settingsForm.logoUrl}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, logoUrl: event.target.value }))}
                        name="settings_logo_url"
                        disabled={!session?.is_admin}
                      />
                      <div className="grid gap-3 md:grid-cols-2">
                        <ToolbarIconButton
                          title={settingsUploadingAsset === 'logo' ? 'Uploading...' : 'Upload logo'}
                          type="button"
                          onClick={() => settingsLogoInputRef.current?.click()}
                          disabled={!session?.is_admin || settingsUploadingAsset === 'logo'}
                          tone="sky"
                          className="w-full justify-start"
                        >
                          <Icon name="upload" className="h-4 w-4" />
                        </ToolbarIconButton>
                        <ToolbarIconButton
                          title={settingsUploadingAsset === 'logo_mark' ? 'Uploading...' : 'Upload logo mark'}
                          type="button"
                          onClick={() => settingsLogoMarkInputRef.current?.click()}
                          disabled={!session?.is_admin || settingsUploadingAsset === 'logo_mark'}
                          tone="sky"
                          className="w-full justify-start"
                        >
                          <Icon name="upload" className="h-4 w-4" />
                        </ToolbarIconButton>
                      </div>
                      <PanelField
                        label="Logo mark URL"
                        placeholder="/diworkin-mark-dark.png"
                        value={settingsForm.logoMarkUrl}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, logoMarkUrl: event.target.value }))}
                        name="settings_logo_mark_url"
                        disabled={!session?.is_admin}
                      />
                      <input
                        ref={settingsLogoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            uploadSettingsAsset('logo', file);
                          }
                          event.target.value = '';
                        }}
                        disabled={!session?.is_admin}
                      />
                      <input
                        ref={settingsLogoMarkInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            uploadSettingsAsset('logo_mark', file);
                          }
                          event.target.value = '';
                        }}
                        disabled={!session?.is_admin}
                      />
                      <PanelField
                        label="Business hours"
                        placeholder="Senin - Jumat, 09:00 - 17:00"
                        value={settingsForm.businessHours}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, businessHours: event.target.value }))}
                        name="settings_business_hours"
                        disabled={!session?.is_admin}
                      />
                      <PanelField
                        label="Location"
                        placeholder="Jakarta, Indonesia"
                        value={settingsForm.location}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, location: event.target.value }))}
                        name="settings_location"
                        disabled={!session?.is_admin}
                      />
                      <PanelField
                        label="Owner name"
                        placeholder="Owner or company name"
                        value={settingsForm.ownerName}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, ownerName: event.target.value }))}
                        name="settings_owner_name"
                        disabled={!session?.is_admin}
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <PanelField
                          label="Phone number"
                          placeholder="+62 ..."
                          value={settingsForm.ownerPhone}
                          onChange={(event) => setSettingsForm((current) => ({ ...current, ownerPhone: event.target.value }))}
                          name="settings_owner_phone"
                          disabled={!session?.is_admin}
                        />
                        <PanelField
                          label="WhatsApp number"
                          placeholder="+62 ..."
                          value={settingsForm.ownerWhatsApp}
                          onChange={(event) => setSettingsForm((current) => ({ ...current, ownerWhatsApp: event.target.value }))}
                          name="settings_owner_whatsapp"
                          disabled={!session?.is_admin}
                        />
                      </div>
                      <PanelField
                        label="Bank name"
                        placeholder="BCA / BNI / Mandiri"
                        value={settingsForm.bankName}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, bankName: event.target.value }))}
                        name="settings_bank_name"
                        disabled={!session?.is_admin}
                      />
                      <PanelField
                        label="Account name"
                        placeholder="Bank account holder name"
                        value={settingsForm.bankAccountName}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, bankAccountName: event.target.value }))}
                        name="settings_bank_account_name"
                        disabled={!session?.is_admin}
                      />
                      <PanelField
                        label="Account number"
                        placeholder="1234567890"
                        value={settingsForm.bankAccountNumber}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, bankAccountNumber: event.target.value }))}
                        name="settings_bank_account_number"
                        disabled={!session?.is_admin}
                      />
                      <PanelField
                        label="Bank branch"
                        placeholder="Cabang / area"
                        value={settingsForm.bankBranch}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, bankBranch: event.target.value }))}
                        name="settings_bank_branch"
                        disabled={!session?.is_admin}
                      />
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-600">Bank note</label>
                        <textarea
                          value={settingsForm.bankNote}
                          onChange={(event) => setSettingsForm((current) => ({ ...current, bankNote: event.target.value }))}
                          rows={5}
                          disabled={!session?.is_admin}
                          className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1f3d2e] focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                          placeholder="Bank note, for example transfer instructions, confirmation steps, or verification hours"
                        />
                      </div>

                      <div className="rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                        This data is used for brand identity, email footers, and invoice details. The main logo should ideally be a
                        PNG/SVG files that are easy to cache.
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <ToolbarIconButton
                          title={savingSettings ? 'Saving...' : 'Save settings'}
                          type="submit"
                          disabled={savingSettings || !session?.is_admin}
                          tone="dark"
                        >
                          <Icon name="save" className="h-4 w-4" />
                        </ToolbarIconButton>
                        <ToolbarIconButton
                          title="Reset form"
                          type="button"
                          onClick={resetSettingsForm}
                          disabled={!session?.is_admin}
                          tone="sky"
                        >
                          <Icon name="refresh" className="h-4 w-4" />
                        </ToolbarIconButton>
                      </div>
                    </div>
                  </form>

                  <div className="space-y-5">
                    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                      <div className="flex items-start gap-4">
                        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                          <img
                            src={settingsForm.logoMarkUrl || settingsForm.logoUrl || '/diworkin-mark-dark.png'}
                            alt={settingsForm.brandName || 'Diworkin'}
                            className="h-20 w-20 object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-400">Brand preview</p>
                          <h3 className="mt-1 text-2xl font-semibold text-slate-950">{settingsForm.brandName || 'Diworkin'}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {settingsForm.businessHours || 'Business hours are not set yet.'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Location</span>
                          <span className="font-medium text-slate-900">{settingsForm.location || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Owner</span>
                          <span className="font-medium text-slate-900">{settingsForm.ownerName || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Phone</span>
                          <span className="font-medium text-slate-900">{settingsForm.ownerPhone || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">WhatsApp</span>
                          <span className="font-medium text-slate-900">{settingsForm.ownerWhatsApp || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                      <p className="text-sm font-medium text-slate-400">Bank details</p>
                      <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Bank</span>
                          <span className="font-medium text-slate-900">{settingsForm.bankName || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Account name</span>
                          <span className="font-medium text-slate-900">{settingsForm.bankAccountName || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Account number</span>
                          <span className="font-medium text-slate-900">{settingsForm.bankAccountNumber || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Branch</span>
                          <span className="font-medium text-slate-900">{settingsForm.bankBranch || '-'}</span>
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm">
                        <p className="text-slate-500">Bank note</p>
                        <p className="mt-2 leading-6 text-slate-700">{settingsForm.bankNote || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {activeSection === 'settings' && !session?.is_admin ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Settings</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Brand, business hours, and payment details</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    This page can only be opened by admins. You can still see the brand preview, but changes are only available to admin accounts.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">Read only</span>
              </div>
              <div className="mt-5">
                <CardSkeleton rows={2} />
              </div>
            </section>
          ) : null}

          {session?.is_admin && activeSection === 'packages' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Packages</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Package catalog</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Create hosting packages for users with disk, email, subdomain, database, and domain quotas, plus per-package features that can be enabled.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {packages.length} packages
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Admin catalog
                  </span>
                </div>
              </div>

              {packagesError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{packagesError}</p>
              ) : null}

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <StatCard
                  title="Packages total"
                  value={packages.length}
                  detail="All plans that can be sold to users."
                  icon={<Icon name="package" className="h-6 w-6" />}
                  iconTone="bg-[#cfe8d5] text-[#1f3d2e]"
                />
                <StatCard
                  title="Active plans"
                  value={packages.filter((item) => item.active).length}
                  detail="Packages that are active and available to users."
                  icon={<Icon name="shield" className="h-6 w-6" />}
                  iconTone="bg-[#a9c88a] text-[#1f3d2e]"
                />
                <StatCard
                  title="Avg price"
                  value={`Rp ${formatRupiahAmount(
                    packages.length > 0
                      ? packages.reduce((sum, item) => sum + Number(item.price_rupiah || 0), 0) / packages.length
                      : 0,
                  )}`}
                  detail="Average price of available plans."
                  icon={<Icon name="database" className="h-6 w-6" />}
                  iconTone="bg-[#f3e8d5] text-[#8b6a3d]"
                />
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_1fr]">
                <form onSubmit={submitPackage} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4">
                    <PanelField
                      label="Package name"
                      placeholder="Starter Pro"
                      value={packageForm.name}
                      onChange={(event) => setPackageForm((current) => ({ ...current, name: event.target.value }))}
                      name="package_name"
                    />

                    <PanelField
                      label="Description"
                      placeholder="Plan for basic users with light quotas"
                      value={packageForm.description}
                      onChange={(event) => setPackageForm((current) => ({ ...current, description: event.target.value }))}
                      name="package_description"
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <PanelField
                        label="Price (Rp)"
                        placeholder="150000"
                        type="number"
                        value={packageForm.priceRupiah}
                        onChange={(event) => setPackageForm((current) => ({ ...current, priceRupiah: event.target.value }))}
                        name="package_price"
                      />
                      <PanelSelect
                        label="Billing cycle"
                        value={packageForm.billingCycle}
                        onChange={(event) => setPackageForm((current) => ({ ...current, billingCycle: event.target.value }))}
                        name="package_billing_cycle"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                        <option value="lifetime">Lifetime</option>
                      </PanelSelect>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <PanelField
                        label="Disk quota (GB)"
                        placeholder="10"
                        type="number"
                        value={packageForm.diskQuotaGb}
                        onChange={(event) => setPackageForm((current) => ({ ...current, diskQuotaGb: event.target.value }))}
                        name="package_disk_quota"
                      />
                      <PanelField
                        label="Email quota"
                        placeholder="10"
                        type="number"
                        value={packageForm.emailQuota}
                        onChange={(event) => setPackageForm((current) => ({ ...current, emailQuota: event.target.value }))}
                        name="package_email_quota"
                      />
                      <PanelField
                        label="Subdomain quota"
                        placeholder="5"
                        type="number"
                        value={packageForm.subdomainQuota}
                        onChange={(event) => setPackageForm((current) => ({ ...current, subdomainQuota: event.target.value }))}
                        name="package_subdomain_quota"
                      />
                      <PanelField
                        label="Database quota"
                        placeholder="2"
                        type="number"
                        value={packageForm.databaseQuota}
                        onChange={(event) => setPackageForm((current) => ({ ...current, databaseQuota: event.target.value }))}
                        name="package_database_quota"
                      />
                      <PanelField
                        label="Domain quota"
                        placeholder="1"
                        type="number"
                        value={packageForm.domainQuota}
                        onChange={(event) => setPackageForm((current) => ({ ...current, domainQuota: event.target.value }))}
                        name="package_domain_quota"
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {packageFeatureOptions.map((feature) => (
                        <PanelCheckbox
                          key={feature.key}
                          name={feature.name}
                          label={feature.label}
                          description={feature.description}
                          checked={Boolean(packageForm[feature.key])}
                          onChange={(event) =>
                            setPackageForm((current) => ({ ...current, [feature.key]: event.target.checked }))
                          }
                        />
                      ))}
                    </div>

                    <PanelCheckbox
                      name="package_active"
                      label="Active package"
                      description="Active plans will appear to users when they choose a plan."
                      checked={Boolean(packageForm.active)}
                      onChange={(event) => setPackageForm((current) => ({ ...current, active: event.target.checked }))}
                    />

                    <div className="flex flex-wrap gap-2">
                      <ToolbarIconButton
                        title={savingPackage ? 'Saving...' : packageForm.id ? 'Update package' : 'Create package'}
                        type="submit"
                        disabled={savingPackage}
                        tone="dark"
                      >
                        <Icon name="save" className="h-4 w-4" />
                      </ToolbarIconButton>
                      <ToolbarIconButton
                        title="Reset form"
                        type="button"
                        onClick={resetPackageForm}
                        tone="sky"
                      >
                        <Icon name="refresh" className="h-4 w-4" />
                      </ToolbarIconButton>
                    </div>
                  </div>
                </form>

                <div className="space-y-5">
                  <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Available packages</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">Package list</h3>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        {packagesLoading ? 'Loading...' : `${packages.length} total`}
                      </span>
                    </div>

                    <div className="max-h-[560px] overflow-auto">
                      <div className="overflow-x-auto">
                        <table className="min-w-max w-full divide-y divide-slate-200">
                          <thead className="bg-white">
                            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              <th className="whitespace-nowrap px-5 py-3">Package</th>
                              <th className="whitespace-nowrap px-5 py-3">Quotas</th>
                              <th className="whitespace-nowrap px-5 py-3">Features</th>
                              <th className="whitespace-nowrap px-5 py-3">Status</th>
                              <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {packagesLoading ? (
                              <TableSkeletonRows columns={5} rows={4} widths={['w-40', 'w-52', 'w-60', 'w-24', 'w-24']} />
                            ) : packages.length === 0 ? (
                              <tr>
                                <td className="px-5 py-6 text-sm text-slate-500" colSpan="5">
                                  No packages created yet.
                                </td>
                              </tr>
                            ) : (
                              packages.map((item) => {
                                const featureLabels = packageFeatureLabels(item);
                                return (
                                  <tr key={item.id} className={selectedPackage?.id === item.id ? 'bg-slate-50/70' : ''}>
                                    <td className="whitespace-nowrap px-5 py-4">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                                        <p className="mt-1 text-xs text-slate-400">
                                          Rp {formatRupiahAmount(item.price_rupiah)} · {formatPackageBillingCycle(item.billing_cycle)}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                      <div className="flex flex-wrap gap-1.5 text-xs">
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                                          {item.disk_quota_gb} GB
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                                          {item.email_quota} email
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                                          {item.subdomain_quota} sub
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                                          {item.database_quota} db
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                                          {item.domain_quota} domain
                                        </span>
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                      <div className="flex max-w-[300px] flex-wrap gap-1.5">
                                        {featureLabels.slice(0, 4).map((label) => (
                                          <span key={label} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                            {label}
                                          </span>
                                        ))}
                                        {featureLabels.length > 4 ? (
                                          <span className="rounded-full bg-[#cfe8d5] px-2.5 py-1 text-xs font-semibold text-[#1f3d2e]">
                                            +{featureLabels.length - 4}
                                          </span>
                                        ) : null}
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {item.active ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                        <ToolbarIconButton
                                          title="Details"
                                          onClick={() => {
                                            setSelectedPackage(item);
                                            setPackageForm({
                                              id: item.id || 0,
                                              name: item.name || '',
                                              description: item.description || '',
                                              priceRupiah: String(item.price_rupiah ?? 0),
                                              billingCycle: item.billing_cycle || 'monthly',
                                              diskQuotaGb: String(item.disk_quota_gb ?? 0),
                                              emailQuota: String(item.email_quota ?? 0),
                                              subdomainQuota: String(item.subdomain_quota ?? 0),
                                              databaseQuota: String(item.database_quota ?? 0),
                                              domainQuota: String(item.domain_quota ?? 0),
                                              featureSsl: Boolean(item.feature_ssl),
                                              featureBackup: Boolean(item.feature_backup),
                                              featureSsh: Boolean(item.feature_ssh),
                                              featureFileManager: Boolean(item.feature_file_manager),
                                              featureStudio: Boolean(item.feature_studio),
                                              featureAutoInstaller: Boolean(item.feature_auto_installer),
                                              featureDns: Boolean(item.feature_dns),
                                              featureMail: Boolean(item.feature_mail),
                                              featurePrioritySupport: Boolean(item.feature_priority_support),
                                              active: Boolean(item.active),
                                            });
                                          }}
                                        >
                                          <Icon name="details" className="h-4 w-4" />
                                        </ToolbarIconButton>
                                        <ToolbarIconButton
                                          title={deletingPackage === String(item.id) ? 'Deleting...' : 'Delete'}
                                          onClick={() => deletePackage(item)}
                                          disabled={deletingPackage === String(item.id)}
                                          className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                        >
                                          <Icon name="trash" className="h-4 w-4" />
                                        </ToolbarIconButton>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Selected package</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                          {selectedPackage ? selectedPackage.name : 'Select a package from the table'}
                        </h3>
                      </div>
                      {selectedPackage ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedPackage.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {selectedPackage.active ? 'Active' : 'Inactive'}
                        </span>
                      ) : null}
                    </div>

                    {selectedPackage ? (
                      <div className="mt-5 space-y-4">
                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Price</span>
                            <span className="font-medium text-slate-900">
                              Rp {formatRupiahAmount(selectedPackage.price_rupiah)} / {formatPackageBillingCycle(selectedPackage.billing_cycle)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Quota summary</span>
                            <span className="font-medium text-slate-900">
                              {selectedPackage.disk_quota_gb} GB · {selectedPackage.email_quota} email · {selectedPackage.subdomain_quota} sub · {selectedPackage.database_quota} db · {selectedPackage.domain_quota} domain
                            </span>
                          </div>
                        </div>
                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Description</span>
                            <span className="font-medium text-slate-900">{selectedPackage.description || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Features</span>
                            <span className="font-medium text-slate-900">
                              {packageFeatureLabels(selectedPackage).join(' · ') || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        Click a package to see quota and feature details, or edit the form on the left to create a new plan.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {session?.is_admin && activeSection === 'billing' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Billing</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Invoice and billing manager</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Manage user billing based on available packages, including payment status, billing period, due date, and billing notes.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {billingSummary.total} invoices
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Billing ready
                  </span>
                </div>
              </div>

              {billingError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{billingError}</p>
              ) : null}

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <StatCard
                  title="Total invoices"
                  value={billingSummary.total}
                  detail="All invoices recorded in the panel."
                  icon={<Icon name="billing" className="h-6 w-6" />}
                  iconTone="bg-[#cfe8d5] text-[#1f3d2e]"
                />
                <StatCard
                  title="Pending"
                  value={billingSummary.pending}
                  detail="Invoices still waiting for payment."
                  icon={<FiAlertTriangle className="h-6 w-6" />}
                  iconTone="bg-amber-50 text-amber-600"
                />
                <StatCard
                  title="Paid"
                  value={billingSummary.paid}
                  detail="Paid invoices."
                  icon={<FiShield className="h-6 w-6" />}
                  iconTone="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                  title="Overdue"
                  value={billingSummary.overdue}
                  detail="Invoices past the due date."
                  icon={<FiAlertTriangle className="h-6 w-6" />}
                  iconTone="bg-rose-50 text-rose-600"
                />
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_1fr]">
                <form onSubmit={submitBilling} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4">
                    <PanelSelect
                      label="Package"
                      value={billingForm.packageId}
                      onChange={(event) => {
                        const nextPackageId = event.target.value;
                        const nextPackage = packages.find((item) => String(item.id) === String(nextPackageId)) || null;
                        setBillingForm((current) => ({
                          ...current,
                          packageId: nextPackageId,
                          billingCycle: nextPackage?.billing_cycle || current.billingCycle || 'monthly',
                          amountRupiah: nextPackage ? String(nextPackage.price_rupiah ?? 0) : current.amountRupiah,
                        }));
                      }}
                      name="billing_package_id"
                    >
                      {packages.length === 0 ? <option value="">No packages available</option> : null}
                      {packages.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · Rp {formatRupiahAmount(item.price_rupiah)}
                        </option>
                      ))}
                    </PanelSelect>

                    <div className="grid gap-4 md:grid-cols-2">
                      <PanelField
                        label="Customer name"
                        placeholder="Customer name"
                        value={billingForm.customerName}
                        onChange={(event) => setBillingForm((current) => ({ ...current, customerName: event.target.value }))}
                        name="billing_customer_name"
                      />
                      <PanelField
                        label="Customer email"
                        placeholder="customer@domain.com"
                        value={billingForm.customerEmail}
                        onChange={(event) => setBillingForm((current) => ({ ...current, customerEmail: event.target.value }))}
                        name="billing_customer_email"
                      />
                    </div>

                    <PanelField
                      label="Domain"
                      placeholder="diworkin.com"
                      value={billingForm.domain}
                      onChange={(event) => setBillingForm((current) => ({ ...current, domain: event.target.value }))}
                      name="billing_domain"
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <PanelSelect
                        label="Billing cycle"
                        value={billingForm.billingCycle}
                        onChange={(event) => setBillingForm((current) => ({ ...current, billingCycle: event.target.value }))}
                        name="billing_cycle"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                        <option value="lifetime">Lifetime</option>
                        <option value="custom">Custom</option>
                      </PanelSelect>
                      <PanelField
                        label="Amount (Rp)"
                        placeholder="150000"
                        type="number"
                        value={billingForm.amountRupiah}
                        onChange={(event) => setBillingForm((current) => ({ ...current, amountRupiah: event.target.value }))}
                        name="billing_amount"
                      />
                    </div>

                    <PanelSelect
                      label="Status"
                      value={billingForm.status}
                      onChange={(event) => setBillingForm((current) => ({ ...current, status: event.target.value }))}
                      name="billing_status"
                    >
                      <option value="pending">Pending</option>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                      <option value="canceled">Canceled</option>
                    </PanelSelect>

                    <div className="grid gap-4 md:grid-cols-2">
                      <PanelField
                        label="Due at"
                        placeholder="2026-04-30 09:00"
                        type="datetime-local"
                        value={billingForm.dueAt}
                        onChange={(event) => setBillingForm((current) => ({ ...current, dueAt: event.target.value }))}
                        name="billing_due_at"
                      />
                      <PanelField
                        label="Paid at"
                        placeholder="2026-04-20 09:00"
                        type="datetime-local"
                        value={billingForm.paidAt}
                        onChange={(event) => setBillingForm((current) => ({ ...current, paidAt: event.target.value }))}
                        name="billing_paid_at"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <PanelField
                        label="Period start"
                        placeholder="2026-04-01 00:00"
                        type="datetime-local"
                        value={billingForm.periodStartAt}
                        onChange={(event) => setBillingForm((current) => ({ ...current, periodStartAt: event.target.value }))}
                        name="billing_period_start_at"
                      />
                      <PanelField
                        label="Period end"
                        placeholder="2026-05-01 00:00"
                        type="datetime-local"
                        value={billingForm.periodEndAt}
                        onChange={(event) => setBillingForm((current) => ({ ...current, periodEndAt: event.target.value }))}
                        name="billing_period_end_at"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Notes</label>
                      <textarea
                        value={billingForm.notes}
                        onChange={(event) => setBillingForm((current) => ({ ...current, notes: event.target.value }))}
                        rows={5}
                        className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1f3d2e] focus:bg-white"
                        placeholder="Billing notes, payment method, or extra details"
                      />
                    </div>

                    <div className="rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                      {selectedBillingPackage ? (
                        <>
                          Package <span className="font-semibold">{selectedBillingPackage.name}</span> is selected with the base price{' '}
                          <span className="font-semibold">Rp {formatRupiahAmount(selectedBillingPackage.price_rupiah)}</span>.
                        </>
                      ) : (
                        <>Select a package first so the invoice can be linked to an available plan.</>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <ToolbarIconButton
                        title={savingBilling ? 'Saving...' : billingForm.id ? 'Update billing' : 'Create billing'}
                        type="submit"
                        disabled={savingBilling || !selectedBillingPackage}
                        tone="dark"
                      >
                        <Icon name="save" className="h-4 w-4" />
                      </ToolbarIconButton>
                      <ToolbarIconButton
                        title="Reset form"
                        type="button"
                        onClick={resetBillingForm}
                        tone="sky"
                      >
                        <Icon name="refresh" className="h-4 w-4" />
                      </ToolbarIconButton>
                    </div>
                  </div>
                </form>

                <div className="space-y-5">
                  <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Billing records</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">Invoice list</h3>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        {billingLoading ? 'Loading...' : `${billingRecords.length} total`}
                      </span>
                    </div>

                    <div className="max-h-[560px] overflow-auto">
                      <div className="overflow-x-auto">
                        <table className="min-w-max w-full divide-y divide-slate-200">
                          <thead className="bg-white">
                            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              <th className="whitespace-nowrap px-5 py-3">Invoice</th>
                              <th className="whitespace-nowrap px-5 py-3">Customer</th>
                              <th className="whitespace-nowrap px-5 py-3">Package</th>
                              <th className="whitespace-nowrap px-5 py-3">Amount</th>
                              <th className="whitespace-nowrap px-5 py-3">Status</th>
                              <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {billingLoading ? (
                              <TableSkeletonRows columns={6} rows={4} widths={['w-40', 'w-48', 'w-36', 'w-24', 'w-24', 'w-24']} />
                            ) : billingRecords.length === 0 ? (
                              <tr>
                                <td className="px-5 py-6 text-sm text-slate-500" colSpan="6">
                                  No billing records created.
                                </td>
                              </tr>
                            ) : (
                              billingRecords.map((item) => (
                                <tr key={item.id} className={selectedBilling?.id === item.id ? 'bg-slate-50/70' : ''}>
                                  <td className="whitespace-nowrap px-5 py-4">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-950">{item.invoice_number}</p>
                                      <p className="mt-1 text-xs text-slate-400">{item.domain || 'No domain'}</p>
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-950">{item.customer_name}</p>
                                      <p className="mt-1 text-xs text-slate-400">{item.customer_email}</p>
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                    {item.package_name || '-'}
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-950">
                                    Rp {formatRupiahAmount(item.amount_rupiah)}
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${billingStatusClasses(item.status)}`}>
                                      {formatBillingStatus(item.status)}
                                    </span>
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      <ToolbarIconButton
                                        title="Details"
                                        onClick={() => {
                                          setSelectedBilling(item);
                                          setBillingForm({
                                            id: item.id || 0,
                                            invoiceNumber: item.invoice_number || '',
                                            packageId: String(item.package_id || ''),
                                            customerName: item.customer_name || '',
                                            customerEmail: item.customer_email || '',
                                            domain: item.domain || '',
                                            billingCycle: item.billing_cycle || 'monthly',
                                            amountRupiah: String(item.amount_rupiah ?? 0),
                                            status: item.status || 'pending',
                                            dueAt: item.due_at ? item.due_at.slice(0, 16) : '',
                                            periodStartAt: item.period_start_at ? item.period_start_at.slice(0, 16) : '',
                                            periodEndAt: item.period_end_at ? item.period_end_at.slice(0, 16) : '',
                                            paidAt: item.paid_at ? item.paid_at.slice(0, 16) : '',
                                            notes: item.notes || '',
                                          });
                                        }}
                                      >
                                        <Icon name="details" className="h-4 w-4" />
                                      </ToolbarIconButton>
                                      <ToolbarIconButton
                                        title={deletingBilling === String(item.id) ? 'Deleting...' : 'Delete'}
                                        onClick={() => deleteBilling(item)}
                                        disabled={deletingBilling === String(item.id)}
                                        className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                      >
                                        <Icon name="trash" className="h-4 w-4" />
                                      </ToolbarIconButton>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Selected billing</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                          {selectedBilling ? selectedBilling.invoice_number : 'Select an invoice from the table'}
                        </h3>
                      </div>
                      {selectedBilling ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${billingStatusClasses(selectedBilling.status)}`}>
                          {formatBillingStatus(selectedBilling.status)}
                        </span>
                      ) : null}
                    </div>

                    {selectedBilling ? (
                      <div className="mt-5 space-y-4">
                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Customer</span>
                            <span className="font-medium text-slate-900">{selectedBilling.customer_name} · {selectedBilling.customer_email}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Package</span>
                            <span className="font-medium text-slate-900">{selectedBilling.package_name || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Amount</span>
                            <span className="font-medium text-slate-900">Rp {formatRupiahAmount(selectedBilling.amount_rupiah)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Domain</span>
                            <span className="font-medium text-slate-900">{selectedBilling.domain || '-'}</span>
                          </div>
                        </div>

                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Billing cycle</span>
                            <span className="font-medium text-slate-900">{formatPackageBillingCycle(selectedBilling.billing_cycle)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Due at</span>
                            <span className="font-medium text-slate-900">{selectedBilling.due_at ? new Date(selectedBilling.due_at).toLocaleString() : '-'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Period</span>
                            <span className="font-medium text-slate-900">
                              {selectedBilling.period_start_at ? new Date(selectedBilling.period_start_at).toLocaleDateString() : '-'} · {selectedBilling.period_end_at ? new Date(selectedBilling.period_end_at).toLocaleDateString() : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                          <p className="text-slate-500">Notes</p>
                          <p className="mt-2 leading-6 text-slate-700">{selectedBilling.notes || '-'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        Click an invoice to see billing details, status changes, and billing notes.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {session?.is_admin && activeSection === 'licenses' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Licenses</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">License key manager</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Create, save, and manage license keys for digital products, apps, or premium access.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {licenseSummary.total} licenses
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Admin only
                  </span>
                </div>
              </div>

              {licensesError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{licensesError}</p>
              ) : null}

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <StatCard
                  title="Total licenses"
                  value={licenseSummary.total}
                  detail="All licenses saved in the panel."
                  icon={<Icon name="license" className="h-6 w-6" />}
                  iconTone="bg-[#cfe8d5] text-[#1f3d2e]"
                />
                <StatCard
                  title="Active"
                  value={licenseSummary.active}
                  detail="Licenses that are active and can be used."
                  icon={<FiShield className="h-6 w-6" />}
                  iconTone="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                  title="Expiring soon"
                  value={licenseSummary.expiringSoon}
                  detail="Licenses expiring soon."
                  icon={<FiAlertTriangle className="h-6 w-6" />}
                  iconTone="bg-amber-50 text-amber-600"
                />
                <StatCard
                  title="Expired"
                  value={licenseSummary.expired}
                  detail="Expired licenses."
                  icon={<FiArchive className="h-6 w-6" />}
                  iconTone="bg-rose-50 text-rose-600"
                />
              </div>

              <div className="mt-5 rounded-[1.6rem] border border-[#cfe8d5] bg-[#f7fbf8] p-4 text-sm text-[#1f3d2e]">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Installer connection</p>
                    <p className="mt-1 font-medium">Connect the license to the installer file through the panel API.</p>
                    <p className="mt-2 max-w-3xl leading-6 text-[#2f5d50]">
                      Fill in <span className="font-semibold">LICENSE_API_URL</span>, <span className="font-semibold">LICENSE_KEY</span>, and
                      <span className="font-semibold"> LICENSE_DOMAIN</span> di <code className="rounded bg-white px-1.5 py-0.5">installer/config.env</code>.
                      When the installer runs, it verifies the key with the panel before continuing.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3 text-xs leading-6 text-slate-600 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">Example</p>
                      <ToolbarIconButton
                        title="Copy snippet"
                        tone="sky"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(licenseInstallerSnippet);
                            pushNotification({
                              title: 'Installer snippet copied',
                              message: 'License config snippet copied to clipboard.',
                              tone: 'success',
                            });
                          } catch (error) {
                            pushNotification({
                              title: 'Copy failed',
                              message: error?.message || 'Unable to copy the license snippet.',
                              tone: 'error',
                            });
                          }
                        }}
                      >
                        <FiCopy className="h-4 w-4" />
                      </ToolbarIconButton>
                    </div>
                    <p className="mt-2 font-mono text-[11px] leading-5 text-slate-700 whitespace-pre-wrap">
                      {licenseInstallerSnippet}
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-slate-500">
                      Paste this snippet into <span className="font-semibold text-slate-700">installer/config.env</span> on the target server.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_1fr]">
                <form onSubmit={submitLicense} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4">
                    <PanelField
                      label="Owner email"
                      placeholder="owner@domain.com"
                      value={licenseForm.ownerEmail}
                      onChange={(event) => setLicenseForm((current) => ({ ...current, ownerEmail: event.target.value }))}
                      name="license_owner_email"
                    />

                    <PanelField
                      label="Product name"
                      placeholder="BukuWarung Pro"
                      value={licenseForm.productName}
                      onChange={(event) => setLicenseForm((current) => ({ ...current, productName: event.target.value }))}
                      name="license_product_name"
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <PanelField
                        label="Domain"
                        placeholder="example.com"
                        value={licenseForm.domain}
                        onChange={(event) => setLicenseForm((current) => ({ ...current, domain: event.target.value }))}
                        name="license_domain"
                      />
                      <PanelSelect
                        label="License type"
                        value={licenseForm.licenseType}
                        onChange={(event) => setLicenseForm((current) => ({ ...current, licenseType: event.target.value }))}
                        name="license_type"
                      >
                        <option value="panel">Panel</option>
                        <option value="hosting">Hosting</option>
                        <option value="product">Product</option>
                        <option value="app">App</option>
                        <option value="website">Website</option>
                        <option value="custom">Custom</option>
                      </PanelSelect>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <PanelField
                        label="License key"
                        placeholder="LIC-XXXX-XXXX-XXXX"
                        value={licenseForm.licenseKey}
                        onChange={(event) => setLicenseForm((current) => ({ ...current, licenseKey: event.target.value }))}
                        name="license_key"
                      />
                      <PanelSelect
                        label="Status"
                        value={licenseForm.status}
                        onChange={(event) => setLicenseForm((current) => ({ ...current, status: event.target.value }))}
                        name="license_status"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="expired">Expired</option>
                        <option value="revoked">Revoked</option>
                        <option value="draft">Draft</option>
                      </PanelSelect>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <PanelField
                        label="Expires at"
                        placeholder="2026-12-31 23:59"
                        type="datetime-local"
                        value={licenseForm.expiresAt}
                        onChange={(event) => setLicenseForm((current) => ({ ...current, expiresAt: event.target.value }))}
                        name="license_expires_at"
                      />
                      <PanelField
                        label="Activated at"
                        placeholder="2026-04-22 10:00"
                        type="datetime-local"
                        value={licenseForm.activatedAt}
                        onChange={(event) => setLicenseForm((current) => ({ ...current, activatedAt: event.target.value }))}
                        name="license_activated_at"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Notes</label>
                      <textarea
                        value={licenseForm.notes}
                        onChange={(event) => setLicenseForm((current) => ({ ...current, notes: event.target.value }))}
                        rows={5}
                        className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1f3d2e] focus:bg-white"
                        placeholder="License notes, activation status, or extra details"
                      />
                    </div>

                    <div className="rounded-[1.4rem] border border-[#cfe8d5] bg-[#f7fbf8] px-4 py-3 text-sm leading-6 text-[#1f3d2e]">
                      A license key will be generated automatically if the field is left empty.
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <ToolbarIconButton
                        title={savingLicense ? 'Saving...' : licenseForm.id ? 'Update license' : 'Create license'}
                        type="submit"
                        disabled={savingLicense}
                        tone="dark"
                      >
                        <Icon name="save" className="h-4 w-4" />
                      </ToolbarIconButton>
                      <ToolbarIconButton
                        title="Reset form"
                        type="button"
                        onClick={resetLicenseForm}
                        tone="sky"
                      >
                        <Icon name="refresh" className="h-4 w-4" />
                      </ToolbarIconButton>
                    </div>
                  </div>
                </form>

                <div className="space-y-5">
                  <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Available licenses</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">License list</h3>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        {licensesLoading ? 'Loading...' : `${licenses.length} total`}
                      </span>
                    </div>

                    <div className="max-h-[560px] overflow-auto">
                      <div className="overflow-x-auto">
                        <table className="min-w-max w-full divide-y divide-slate-200">
                          <thead className="bg-white">
                            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              <th className="whitespace-nowrap px-5 py-3">License</th>
                              <th className="whitespace-nowrap px-5 py-3">Owner</th>
                              <th className="whitespace-nowrap px-5 py-3">Product</th>
                              <th className="whitespace-nowrap px-5 py-3">Status</th>
                              <th className="whitespace-nowrap px-5 py-3">Expiry</th>
                              <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {licensesLoading ? (
                              <TableSkeletonRows columns={6} rows={4} widths={['w-44', 'w-40', 'w-40', 'w-24', 'w-32', 'w-24']} />
                            ) : licenses.length === 0 ? (
                              <tr>
                                <td className="px-5 py-6 text-sm text-slate-500" colSpan="6">
                                  No licenses created.
                                </td>
                              </tr>
                            ) : (
                              licenses.map((item) => {
                                const isExpiringSoon =
                                  item.expires_at &&
                                  !Number.isNaN(new Date(item.expires_at).getTime()) &&
                                  new Date(item.expires_at).getTime() - nowMs <= 1000 * 60 * 60 * 24 * 30 &&
                                  new Date(item.expires_at).getTime() >= nowMs;

                                return (
                                  <tr key={item.id} className={selectedLicense?.id === item.id ? 'bg-slate-50/70' : ''}>
                                    <td className="whitespace-nowrap px-5 py-4">
                                      <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-950">{item.license_key}</p>
                                        <p className="text-xs text-slate-400">{item.license_type || 'panel'}</p>
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-950">{item.owner_name || item.owner_email}</p>
                                        <p className="mt-1 text-xs text-slate-400">{item.company || item.owner_email}</p>
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                      <div>
                                        <p className="font-semibold text-slate-950">{item.product_name}</p>
                                        <p className="mt-1 text-xs text-slate-400">{item.domain || '-'}</p>
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${licenseStatusClasses(item.status)}`}>
                                        {formatLicenseStatus(item.status)}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                      <div className="space-y-1">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isExpiringSoon ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                          {item.expires_at ? new Date(item.expires_at).toLocaleDateString() : '-'}
                                        </span>
                                        {isExpiringSoon ? (
                                          <p className="text-xs font-medium text-amber-600">Expiring soon</p>
                                        ) : null}
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                        <ToolbarIconButton
                                          title="Details"
                                          onClick={() => {
                                            setSelectedLicense(item);
                                            setLicenseForm({
                                              id: item.id || 0,
                                              ownerEmail: item.owner_email || '',
                                              productName: item.product_name || '',
                                              domain: item.domain || '',
                                              licenseKey: item.license_key || '',
                                              licenseType: item.license_type || 'panel',
                                              status: item.status || 'active',
                                              expiresAt: toDateTimeLocalValue(item.expires_at),
                                              activatedAt: toDateTimeLocalValue(item.activated_at),
                                              notes: item.notes || '',
                                            });
                                          }}
                                        >
                                          <Icon name="details" className="h-4 w-4" />
                                        </ToolbarIconButton>
                                        <ToolbarIconButton
                                          title={deletingLicense === String(item.id) ? 'Deleting...' : 'Delete'}
                                          onClick={() => deleteLicense(item)}
                                          disabled={deletingLicense === String(item.id)}
                                          className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                        >
                                          <Icon name="trash" className="h-4 w-4" />
                                        </ToolbarIconButton>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Selected license</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                          {selectedLicense ? selectedLicense.license_key : 'Select a license from the table'}
                        </h3>
                      </div>
                      {selectedLicense ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${licenseStatusClasses(selectedLicense.status)}`}>
                          {formatLicenseStatus(selectedLicense.status)}
                        </span>
                      ) : null}
                    </div>

                    {selectedLicense ? (
                      <div className="mt-5 space-y-4">
                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Owner</span>
                            <span className="font-medium text-slate-900">{selectedLicense.owner_name || selectedLicense.owner_email}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Product</span>
                            <span className="font-medium text-slate-900">{selectedLicense.product_name || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Domain</span>
                            <span className="font-medium text-slate-900">{selectedLicense.domain || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Type</span>
                            <span className="font-medium text-slate-900">{selectedLicense.license_type || '-'}</span>
                          </div>
                        </div>

                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">License key</span>
                            <span className="font-medium text-slate-900">{selectedLicense.license_key || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Expires at</span>
                            <span className="font-medium text-slate-900">
                              {selectedLicense.expires_at ? new Date(selectedLicense.expires_at).toLocaleString() : '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">Activated at</span>
                            <span className="font-medium text-slate-900">
                              {selectedLicense.activated_at ? new Date(selectedLicense.activated_at).toLocaleString() : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                          <p className="text-slate-500">Notes</p>
                          <p className="mt-2 leading-6 text-slate-700">{selectedLicense.notes || '-'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        Click a license to see the key details, owner, status, and expiry date.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'studio' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Database Studio</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">CRUD Studio for PostgreSQL, MariaDB, and MongoDB</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Select a provisioned database, then browse tables or collections. For SQL, CRUD uses the primary key.
                    Untuk MongoDB, CRUD memakai <span className="font-semibold">_id</span>.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {studioDatabases.length} database
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Studio ready
                  </span>
                </div>
              </div>

              {studioDatabasesError || studioObjectsError || studioRowsError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {studioDatabasesError || studioObjectsError || studioRowsError}
                </p>
              ) : null}

              <div className="mt-5 space-y-5">
                <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4">
                    <PanelSelect
                      label="Database"
                      value={studioDatabaseFilter}
                      onChange={(event) => {
                        setStudioDatabaseFilter(event.target.value);
                        setStudioObjectFilter('');
                        setStudioObjects([]);
                        setStudioRows([]);
                        setStudioSchema({ columns: [], primary_key: [], object_type: 'table' });
                        setStudioEditorMode('insert');
                        setStudioEditorText('{\n}');
                        setStudioKeyColumn('');
                        setStudioKeyValue('');
                      }}
                      name="studio_database"
                    >
                      {studioDatabases.length === 0 ? <option value="">No databases available.</option> : null}
                      {studioDatabases.map((item) => (
                        <option key={`${item.engine}:${item.domain}:${item.name}`} value={`${item.engine}:${item.domain}:${item.name}`}>
                          {item.engine.toUpperCase()} · {item.domain} · {item.name}
                        </option>
                      ))}
                    </PanelSelect>

                    <PanelSelect
                      label="Table / Collection"
                      value={studioObjectFilter}
                      onChange={(event) => {
                        setStudioObjectFilter(event.target.value);
                        setStudioEditorMode('insert');
                        setStudioEditorText('{\n}');
                        setStudioKeyValue('');
                      }}
                      name="studio_object"
                    >
                      {studioObjectsLoading ? <option value="">Loading objects...</option> : null}
                      {!studioObjectsLoading && studioObjects.length === 0 ? <option value="">No objects available</option> : null}
                      {studioObjects.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </PanelSelect>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setStudioEditorMode('insert');
                          setStudioEditorText('{\n}');
                          setStudioKeyValue('');
                        }}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                          studioEditorMode === 'insert'
                            ? 'bg-slate-950 text-white'
                            : 'border border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        New row
                      </button>
                      <button
                        type="button"
                        onClick={reloadStudioRows}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Refresh
                      </button>
                    </div>

                    <div className="grid gap-3 rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-4 text-sm leading-6 text-sky-900">
                      <p className="font-medium">Editor</p>
                      <p className="text-sky-800">
                        Edit data as JSON. For update/delete records, Studio uses the key column shown below.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <PanelField
                        label="Key column"
                        placeholder={studioSchema.primary_key[0] || '_id'}
                        value={studioKeyColumn}
                        onChange={(event) => setStudioKeyColumn(event.target.value)}
                        name="studio_key_column"
                      />
                      <PanelField
                        label="Key value"
                        placeholder="Primary key value"
                        value={studioKeyValue}
                        onChange={(event) => setStudioKeyValue(event.target.value)}
                        name="studio_key_value"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">JSON data</label>
                      <textarea
                        value={studioEditorText}
                        onChange={(event) => setStudioEditorText(event.target.value)}
                        rows={12}
                        className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                        placeholder={'{ "name": "value" }'}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={saveStudioRecord}
                      disabled={studioSaving || !selectedStudioDatabase || !studioObjectFilter}
                      className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {studioSaving ? 'Saving...' : studioEditorMode === 'update' ? 'Update record' : 'Create record'}
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-400">Selected database</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    {selectedStudioDatabase ? `${selectedStudioDatabase.engine.toUpperCase()} · ${selectedStudioDatabase.name}` : 'Select a database to open Studio'}
                  </h3>
                  {selectedStudioDatabase ? (
                    <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Domain</span>
                        <span className="font-medium text-slate-900">{selectedStudioDatabase.domain}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Object type</span>
                        <span className="font-medium text-slate-900">
                          {studioSchema.object_type === 'collection' ? 'Collection' : 'Table'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Objects</span>
                        <span className="font-medium text-slate-900">{studioObjects.length}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Rows loaded</span>
                        <span className="font-medium text-slate-900">{studioRows.length}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      Studio will show tables or collections after you pick a provisioned database.
                    </p>
                  )}
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Rows / Documents</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">
                        {studioObjectFilter || 'Select table or collection'}
                      </h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {studioRowsLoading ? 'Loading...' : `${studioRows.length} total`}
                    </span>
                  </div>

                  <div className="max-h-[620px] overflow-auto">
                    <div className="overflow-x-auto">
                      <table className="min-w-max w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                          <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {(studioSchema.columns.length > 0 ? studioSchema.columns : ['data']).map((column) => (
                              <th key={column} className="whitespace-nowrap px-5 py-3">{column}</th>
                            ))}
                            <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                        {studioRowsLoading ? (
                          <TableSkeletonRows
                            columns={(studioSchema.columns.length > 0 ? studioSchema.columns.length : 1) + 1}
                            rows={4}
                            widths={['w-24', 'w-28', 'w-32', 'w-24', 'w-20', 'w-24']}
                          />
                          ) : studioRows.length === 0 ? (
                            <tr>
                              <td className="px-5 py-6 text-sm text-slate-500" colSpan={(studioSchema.columns.length > 0 ? studioSchema.columns.length : 1) + 1}>
                                No data in this object.
                              </td>
                            </tr>
                          ) : (
                            studioRows.map((row, index) => (
                              <tr key={String(row._id || row.id || index)}>
                                {(studioSchema.columns.length > 0 ? studioSchema.columns : ['data']).map((column) => (
                                  <td key={column} className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">
                                    <div className="max-w-none">
                                      {formatStudioValue(row?.[column])}
                                    </div>
                                  </td>
                                ))}
                                <td className="whitespace-nowrap px-5 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openStudioRow(row)}
                                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteStudioRecord(row)}
                                      disabled={studioDeleting === String(row._id || row.id || index)}
                                      className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                      {studioDeleting === String(row._id || row.id || index) ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-400">Notes</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">Studio reads provisioned databases from the panel.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">SQL CRUD uses a primary key. If a table has no primary key, edit/delete is not safe.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">MongoDB CRUD uses <span className="font-semibold">_id</span> or the selected key column.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">The JSON editor handles rows and documents without separate forms.</li>
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'files' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">File Manager</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Manage files for project domains and subdomains</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    This file manager accesses the provisioned public folder for both root domains and subdomains.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {fileEntries.length} items
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Public target only
                  </span>
                </div>
              </div>

              {fileError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{fileError}</p>
              ) : null}

              <div className="mt-5 space-y-5">
                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <ToolbarIconButton
                        title="Add file"
                        onClick={() => setFileCreateKind('file')}
                      >
                        <Icon name="plus" className="h-4 w-4" />
                      </ToolbarIconButton>
                      <ToolbarIconButton
                        title="Add folder"
                        onClick={() => setFileCreateKind('folder')}
                      >
                        <Icon name="folder" className="h-4 w-4" />
                      </ToolbarIconButton>
                      <button
                        type="button"
                        onClick={() => fileUploadInputRef.current?.click()}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (fileSelectedPath && navigator?.clipboard?.writeText) {
                            navigator.clipboard.writeText(fileSelectedPath).catch(() => {});
                          }
                        }}
                        disabled={!fileSelectedPath}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (fileSelectedPath) {
                            setFileRenameName(fileSelectedMeta?.name || fileSelectedPath.split('/').pop() || '');
                          }
                        }}
                        disabled={!fileSelectedPath}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Move
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Not available yet"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400 disabled:cursor-not-allowed"
                      >
                        Download
                      </button>
                      <ToolbarIconButton
                        title="Rename"
                        disabled
                      >
                        <Icon name="edit" className="h-4 w-4" />
                      </ToolbarIconButton>
                      <ToolbarIconButton
                        title="Delete"
                        disabled
                        className="border-rose-200 bg-rose-50 text-rose-500"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </ToolbarIconButton>
                      <button
                        type="button"
                        disabled
                        title="Not available yet"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400 disabled:cursor-not-allowed"
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Not available yet"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400 disabled:cursor-not-allowed"
                      >
                        Permission
                      </button>
                      <button
                        type="button"
                        onClick={() => refreshFiles(fileBrowsePath)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        All tools
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-[240px]">
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Target
                        </label>
                        <select
                          value={fileTargetFilter}
                          onChange={(event) => {
                            const nextTarget = fileTargets.find((item) => item.domain === event.target.value);
                            if (nextTarget) {
                              selectFileTarget(nextTarget);
                            }
                          }}
                          disabled={fileTargetsLoading || fileTargets.length === 0}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1877ff] focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {fileTargets.length === 0 ? (
                            <option value="">Select target</option>
                          ) : (
                            fileTargetGroups.map((group) => (
                              <optgroup key={group.domain} label={group.label}>
                                <option value={group.domain}>{group.domain}</option>
                                {group.subdomainTargets.map((item) => (
                                  <option key={item.domain} value={item.domain}>
                                    {item.domain}
                                  </option>
                                ))}
                              </optgroup>
                            ))
                          )}
                        </select>
                      </div>
                      <div className="relative min-w-[240px] flex-1 xl:flex-none">
                        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          value={fileSearch}
                          onChange={(event) => setFileSearch(event.target.value)}
                          placeholder="Search"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-2.5 text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Path: <span className="font-mono text-slate-950">{fileCurrentPath ? `/${fileCurrentPath}` : '/'}</span>
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Accessible targets</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">Workspace tree</h3>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        {fileTargetsLoading ? 'Loading...' : `${fileTargets.length} targets`}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      {fileTargetsError ? (
                        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-700">{fileTargetsError}</p>
                      ) : null}

                      <div className="max-h-[340px] space-y-3 overflow-auto pr-1">
                        {fileTargetsLoading ? (
                          <div className="space-y-3">
                            <SkeletonBlock className="h-16 w-full rounded-[1.25rem]" />
                            <SkeletonBlock className="h-16 w-full rounded-[1.25rem]" />
                            <SkeletonBlock className="h-16 w-full rounded-[1.25rem]" />
                          </div>
                        ) : fileTargetGroups.length === 0 ? (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400">
                            No provisioned domain or subdomain found.
                          </div>
                        ) : (
                          fileTargetGroups.map((group) => {
                            const isActiveGroup =
                              selectedFileTarget?.parent_domain === group.domain ||
                              selectedFileTarget?.domain === group.domain;
                            const isCollapsed = collapsedTargetGroups.includes(group.domain);
                            return (
                              <div key={group.domain} className="rounded-[1.25rem] border border-slate-200 bg-white p-3">
                                <button
                                  type="button"
                                  onClick={() => selectFileTarget(group.domainTarget)}
                                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left transition ${
                                    isActiveGroup
                                      ? 'bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                                      : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="flex items-center gap-3">
                                    <Icon name="globe" className="h-4 w-4" />
                                    <span className="truncate font-semibold">{group.domain}</span>
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        toggleTargetGroup(group.domain);
                                      }}
                                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                                        isActiveGroup ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                      }`}
                                    >
                                      {isCollapsed ? 'Show' : 'Hide'}
                                    </button>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActiveGroup ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                      Main
                                    </span>
                                  </span>
                                </button>

                                {!isCollapsed && group.subdomainTargets.length > 0 ? (
                                  <div className="mt-2 space-y-1 border-l border-slate-200 pl-3">
                                    {group.subdomainTargets.map((item) => (
                                      <button
                                        key={item.domain}
                                        type="button"
                                        onClick={() => selectFileTarget(item)}
                                        className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left transition ${
                                          selectedFileTarget?.domain === item.domain
                                            ? 'bg-slate-100 text-slate-950'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                      >
                                        <span className="flex items-center gap-3">
                                          <Icon name="folder" className="h-4 w-4 text-sky-600" />
                                          <span className="truncate">{item.domain}</span>
                                        </span>
                                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                          Sub
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                ) : !isCollapsed ? (
                                  <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-400">
                                    No subdomains.
                                  </p>
                                ) : null}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Folder contents</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                          {fileCurrentPath ? `/${fileCurrentPath}` : '/'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          {fileLoading ? 'Loading...' : `${filteredFileEntries.length} total`}
                        </span>
                      </div>
                    </div>

                    <div className="max-h-[560px] overflow-auto">
                      <div className="overflow-x-auto">
                        <table className="min-w-max w-full divide-y divide-slate-200">
                          <thead className="bg-white">
                            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              <th className="whitespace-nowrap px-5 py-3">Name</th>
                              <th className="whitespace-nowrap px-5 py-3">Last modified</th>
                              <th className="whitespace-nowrap px-5 py-3">Permission</th>
                              <th className="whitespace-nowrap px-5 py-3">Size</th>
                              <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {fileLoading ? (
                              <TableSkeletonRows columns={5} rows={5} widths={['w-32', 'w-28', 'w-24', 'w-20', 'w-24']} />
                            ) : filteredFileEntries.length === 0 ? (
                              <tr>
                                <td className="px-5 py-6 text-sm text-slate-500" colSpan="5">
                                  Folder is empty.
                                </td>
                              </tr>
                            ) : (
                              filteredFileEntries.map((item) => (
                            <tr key={item.path} className={fileSelectedPath === item.path ? 'bg-slate-50/80' : ''}>
                              <td className="whitespace-nowrap px-5 py-4">
                                <button
                                  type="button"
                                  onClick={() => openFileItem(item)}
                                  className="flex items-center gap-3 text-left"
                                >
                                      <Icon
                                        name={item.type === 'dir' ? 'folder' : 'file'}
                                        className={`h-4 w-4 ${item.type === 'dir' ? 'text-sky-600' : 'text-slate-400'}`}
                                      />
                                      <div>
                                        <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                                        <p className="text-xs text-slate-400">{item.path}</p>
                                      </div>
                                    </button>
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                    {item.mod_time ? new Date(item.mod_time).toLocaleString() : '-'}
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                    {item.type === 'dir' ? '755' : '644'}
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                    {item.type === 'dir' ? 'folder' : formatBytes(item.size)}
                              </td>
                              <td className="whitespace-nowrap px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <ToolbarIconButton
                                    title="Open"
                                    onClick={() => openFileItem(item)}
                                  >
                                    <Icon name={item.type === 'dir' ? 'folder' : 'file'} className="h-4 w-4" />
                                  </ToolbarIconButton>
                                  <ToolbarIconButton
                                    title={fileDeleting === item.path ? 'Deleting...' : 'Delete'}
                                    onClick={() => deleteFileItem(item)}
                                    disabled={fileDeleting === item.path}
                                    className="border-rose-200 bg-rose-50 text-rose-500"
                                  >
                                    <Icon name="trash" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                </div>
                              </td>
                            </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <details className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]" open>
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-950">
                    Create and upload
                  </summary>
                  <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-start">
                    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5">
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                          <span>Domain target</span>
                          <span className="font-semibold text-slate-950">{selectedFileTarget?.label || 'Select target'}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <ToolbarIconButton
                            title="New file"
                            onClick={() => setFileCreateKind('file')}
                            className={fileCreateKind === 'file' ? 'bg-slate-950 text-white hover:bg-slate-800' : ''}
                          >
                            <Icon name="plus" className="h-4 w-4" />
                          </ToolbarIconButton>
                          <ToolbarIconButton
                            title="New folder"
                            onClick={() => setFileCreateKind('folder')}
                            className={fileCreateKind === 'folder' ? 'bg-slate-950 text-white hover:bg-slate-800' : ''}
                          >
                            <Icon name="folder" className="h-4 w-4" />
                          </ToolbarIconButton>
                        </div>

                        <PanelField
                          label="New item name"
                          placeholder={fileCreateKind === 'folder' ? 'assets' : 'index.html'}
                          value={fileCreateName}
                          onChange={(event) => setFileCreateName(event.target.value)}
                          name="file_new_name"
                        />

                        {fileCreateKind === 'file' ? (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-600">New file content</label>
                            <textarea
                              value={fileCreateContent}
                              onChange={(event) => setFileCreateContent(event.target.value)}
                              rows={6}
                              className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                              placeholder="File content"
                            />
                          </div>
                        ) : null}

                        <ToolbarIconButton
                          title={fileCreating ? 'Creating...' : 'Create item'}
                          onClick={createFileItem}
                          disabled={fileCreating || !fileTargetFilter || !fileCreateName}
                          className="bg-slate-950 text-white hover:bg-slate-800"
                        >
                          <Icon name="plus" className="h-4 w-4" />
                        </ToolbarIconButton>
                      </div>
                    </div>

                    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Upload file</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Uploads go to the folder you are currently viewing.
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          {fileUploadFile ? 'Selected' : 'No file'}
                        </span>
                      </div>
                      <div className="mt-4 rounded-[1.4rem] border border-dashed border-slate-300 bg-white px-4 py-4">
                        <input
                          ref={fileUploadInputRef}
                          type="file"
                          onChange={(event) => setFileUploadFile(event.target.files?.[0] ?? null)}
                          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                        />
                        {fileUploadFile ? (
                          <p className="mt-3 break-all text-xs text-slate-500">{fileUploadFile.name}</p>
                        ) : (
                          <p className="mt-3 text-xs text-slate-400">Choose a file to upload to the active target.</p>
                        )}
                      </div>
                      <ToolbarIconButton
                        title={fileUploading ? 'Uploading...' : 'Upload file'}
                        onClick={uploadFileItem}
                        disabled={!fileUploadFile || fileUploading || !fileTargetFilter}
                        className="mt-4 bg-slate-950 text-white hover:bg-slate-800"
                      >
                        <Icon name="upload" className="h-4 w-4" />
                      </ToolbarIconButton>
                    </div>
                  </div>
                </details>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:items-start">
                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Selected file</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                          {fileSelectedPath || 'Choose a file to open'}
                        </h3>
                      </div>
                      {fileSelectedPath ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          {fileSelectedBinary ? 'Binary' : 'Text'}
                        </span>
                      ) : null}
                    </div>

                    {fileSelectedPath ? (
                      <div className="mt-4 space-y-4">
                        <PanelField
                          label="Rename"
                          placeholder="new-name.html"
                          value={fileRenameName}
                          onChange={(event) => setFileRenameName(event.target.value)}
                          name="file_rename"
                        />
                        <div className="flex flex-wrap gap-2">
                          <ToolbarIconButton
                            title={fileRenaming ? 'Renaming...' : 'Rename'}
                            onClick={renameFileItem}
                            disabled={fileRenaming || !fileRenameName}
                          >
                            <Icon name="edit" className="h-4 w-4" />
                          </ToolbarIconButton>
                          <ToolbarIconButton
                            title={fileSaving ? 'Saving...' : 'Save file'}
                            onClick={saveFileItem}
                            disabled={fileSaving || fileSelectedBinary}
                            className="bg-slate-950 text-white hover:bg-slate-800"
                          >
                            <Icon name="save" className="h-4 w-4" />
                          </ToolbarIconButton>
                        </div>
                        {fileSelectedBinary ? (
                          <div className="rounded-[1.4rem] border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                            The file appears to be binary, so it cannot be edited in the text area.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <CodePreview content={fileSelectedContent} language={fileSelectedLanguage} />
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-600">Content</label>
                              <textarea
                                value={fileSelectedContent}
                                onChange={(event) => setFileSelectedContent(event.target.value)}
                                rows={18}
                                spellCheck={false}
                                className="w-full rounded-[1.4rem] border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[#1877ff] focus:bg-slate-900"
                                placeholder="File content"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        Click a file to view its contents, rename it, or save changes.
                      </p>
                    )}
                  </div>

                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                    <p className="text-sm font-medium text-slate-400">Notes</p>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                      <li className="rounded-2xl bg-slate-50 px-4 py-3">File manager only touches the domain public folder.</li>
                      <li className="rounded-2xl bg-slate-50 px-4 py-3">Folders can be created, files can be created, opened, edited, renamed, and deleted.</li>
                      <li className="rounded-2xl bg-slate-50 px-4 py-3">Binary files are blocked from text editing to avoid damage.</li>
                      <li className="rounded-2xl bg-slate-50 px-4 py-3">Path traversal is blocked so you cannot leave the domain root.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'ftp' ? (
            <section className="space-y-5">
              <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">FTP</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">Target-based FTP access</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                      Each FTP account points only to the selected site folder. This is ideal for AI, automation, or workflows that need per-target access.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                      {ftpAccountsLoading ? 'Loading...' : `${ftpAccounts.length} accounts`}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                      {ftpAccounts.filter((item) => item.active).length} active
                    </span>
                    <span className="rounded-full bg-sky-100 px-3 py-2 text-sm font-medium text-sky-700">
                      {ftpAccounts.filter((item) => item.password_ready).length} ready
                    </span>
                  </div>
                </div>

                {ftpAccountsError ? (
                  <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{ftpAccountsError}</p>
                ) : null}

                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                  <form onSubmit={submitFtpAccount} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">{ftpForm.id ? 'Edit FTP account' : 'Create FTP account'}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                          {ftpForm.id ? 'Update access' : 'New access profile'}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          The password is stored encrypted and used only for the selected target.
                        </p>
                      </div>

                      <PanelSelect
                        label="Site target"
                        value={ftpForm.siteTarget}
                        onChange={(event) => setFtpForm((current) => ({ ...current, siteTarget: event.target.value }))}
                        name="ftp_site_target"
                        disabled={siteEntries.length === 0}
                      >
                        {siteEntries.length === 0 ? <option value="">No sites available</option> : null}
                        {siteEntries.map((item) => (
                          <option key={item.fullDomain} value={item.fullDomain}>
                            {item.fullDomain} · {item.kind === 'domain' ? 'Domain' : 'Subdomain'}
                          </option>
                        ))}
                      </PanelSelect>

                      <PanelField
                        label="Username"
                        placeholder="ftpuser"
                        value={ftpForm.username}
                        onChange={(event) => setFtpForm((current) => ({ ...current, username: event.target.value }))}
                        name="ftp_username"
                      />

                      <PanelField
                        label="Password"
                        placeholder="••••••••"
                        value={ftpForm.password}
                        onChange={(event) => setFtpForm((current) => ({ ...current, password: event.target.value }))}
                        name="ftp_password"
                        type="password"
                      />

                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                        <input
                          type="checkbox"
                          checked={ftpForm.active}
                          onChange={(event) => setFtpForm((current) => ({ ...current, active: event.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 text-[#1f3d2e] focus:ring-[#cfe8d5]"
                        />
                        Enable FTP account
                      </label>

                      <div className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                        This FTP profile points only to the target site public folder and is ideal for project access.
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <ToolbarIconButton
                          title={creatingFtpAccount ? 'Saving...' : ftpForm.id ? 'Update FTP account' : 'Create FTP account'}
                          type="submit"
                          disabled={creatingFtpAccount || !ftpForm.siteTarget || !ftpForm.username.trim() || !ftpForm.password.trim()}
                        >
                          <Icon name="save" className="h-4 w-4" />
                        </ToolbarIconButton>
                        <ToolbarIconButton
                          title="Reset form"
                          onClick={() => setFtpForm({ id: 0, siteTarget: ftpForm.siteTarget || siteEntries[0]?.fullDomain || '', username: '', password: '', active: true })}
                        >
                          <Icon name="refresh" className="h-4 w-4" />
                        </ToolbarIconButton>
                      </div>
                    </div>
                  </form>

                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Selected FTP</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">{selectedFtpAccount?.username || 'Select an account from the table'}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedFtpAccount?.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {selectedFtpAccount?.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Site target</p>
                        <p className="mt-2 break-words text-sm font-semibold text-slate-950">{selectedFtpAccount?.site_target || '-'}</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Base path</p>
                        <p className="mt-2 break-all text-sm font-semibold text-slate-950">{selectedFtpAccount?.base_path || '-'}</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Target kind</p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">{selectedFtpAccount?.target_kind || '-'}</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Password</p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {selectedFtpAccount?.password_ready ? 'Stored and ready' : 'Not stored yet'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                      The selected FTP account can be used by AI or automation per target folder, without access to other target folders.
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">FTP accounts</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">Access profiles</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {ftpAccountsLoading ? 'Loading...' : `${ftpAccounts.length} total`}
                    </span>
                  </div>

                  <div className="max-h-[520px] overflow-auto">
                    <div className="overflow-x-auto">
                      <table className="min-w-max w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                          <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <th className="whitespace-nowrap px-5 py-3">Username</th>
                            <th className="whitespace-nowrap px-5 py-3">Site target</th>
                            <th className="whitespace-nowrap px-5 py-3">Base path</th>
                            <th className="whitespace-nowrap px-5 py-3">Password</th>
                            <th className="whitespace-nowrap px-5 py-3">Status</th>
                            <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {ftpAccountsLoading ? (
                            <TableSkeletonRows columns={6} rows={4} widths={['w-32', 'w-36', 'w-40', 'w-24', 'w-24', 'w-28']} />
                          ) : ftpAccounts.length === 0 ? (
                            <tr>
                              <td className="px-5 py-6 text-sm text-slate-500" colSpan="6">
                                No FTP accounts for the selected target.
                              </td>
                            </tr>
                          ) : (
                            ftpAccounts.map((item) => (
                              <tr key={item.id} className={selectedFtpAccount?.id === item.id ? 'bg-slate-50/80' : ''}>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedFtpAccount(item);
                                      setFtpForm({
                                        id: item.id,
                                        siteTarget: item.site_target || '',
                                        username: item.username || '',
                                        password: '',
                                        active: item.active !== false,
                                      });
                                    }}
                                    className="text-left"
                                  >
                                    <p className="text-sm font-semibold text-slate-950">{item.username}</p>
                                    <p className="mt-1 text-xs text-slate-400">{item.owner_email || '-'}</p>
                                  </button>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.site_target}</td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.base_path}</td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.password_ready ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {item.password_ready ? 'Ready' : 'Not set'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.active ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {item.active ? 'Enabled' : 'Disabled'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <ToolbarIconButton
                                      title="Details"
                                      onClick={() => {
                                        setSelectedFtpAccount(item);
                                        setFtpForm({
                                          id: item.id,
                                          siteTarget: item.site_target || '',
                                          username: item.username || '',
                                          password: '',
                                          active: item.active !== false,
                                        });
                                      }}
                                    >
                                      <Icon name="details" className="h-4 w-4" />
                                    </ToolbarIconButton>
                                    <ToolbarIconButton
                                      title={deletingFtpAccount === String(item.id) ? 'Deleting...' : 'Delete'}
                                      onClick={() => deleteFtpAccount(item)}
                                      disabled={deletingFtpAccount === String(item.id)}
                                      className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                    >
                                      <Icon name="trash" className="h-4 w-4" />
                                    </ToolbarIconButton>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'shell' ? (
            <section className="space-y-5">
              <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Shell</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">Restricted shell per site</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                      Shell sessions only run inside the selected target folder. Commands are restricted and cannot leave the site root.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                      {shellSessionsLoading ? 'Loading...' : `${shellSessions.length} sessions`}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                      {shellSessions.filter((item) => item.active).length} active
                    </span>
                    <span className="rounded-full bg-sky-100 px-3 py-2 text-sm font-medium text-sky-700">
                      {shellLogs.length} logs
                    </span>
                  </div>
                </div>

                {shellSessionsError ? (
                  <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{shellSessionsError}</p>
                ) : null}

                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                  <form onSubmit={submitShellSession} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">{shellForm.id ? 'Edit shell session' : 'Create shell session'}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                          {shellForm.id ? 'Update access session' : 'New restricted shell'}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          This session is used for per-site folder access, so AI or operators cannot leave the target folder.
                        </p>
                      </div>

                      <PanelSelect
                        label="Site target"
                        value={shellForm.siteTarget}
                        onChange={(event) => setShellForm((current) => ({ ...current, siteTarget: event.target.value }))}
                        name="shell_site_target"
                        disabled={siteEntries.length === 0}
                      >
                        {siteEntries.length === 0 ? <option value="">No sites available</option> : null}
                        {siteEntries.map((item) => (
                          <option key={item.fullDomain} value={item.fullDomain}>
                            {item.fullDomain} · {item.kind === 'domain' ? 'Domain' : 'Subdomain'}
                          </option>
                        ))}
                      </PanelSelect>

                      <PanelField
                        label="Session name"
                        placeholder="Deploy helper"
                        value={shellForm.name}
                        onChange={(event) => setShellForm((current) => ({ ...current, name: event.target.value }))}
                        name="shell_name"
                      />

                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                        <input
                          type="checkbox"
                          checked={shellForm.active}
                          onChange={(event) => setShellForm((current) => ({ ...current, active: event.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 text-[#1f3d2e] focus:ring-[#cfe8d5]"
                        />
                        Enable shell session
                      </label>

                      <div className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                        Shell commands may only touch the selected site base path.
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <ToolbarIconButton
                          title={creatingShellSession ? 'Saving...' : shellForm.id ? 'Update shell session' : 'Create shell session'}
                          type="submit"
                          disabled={creatingShellSession || !shellForm.siteTarget}
                        >
                          <Icon name="save" className="h-4 w-4" />
                        </ToolbarIconButton>
                        <ToolbarIconButton
                          title="Reset form"
                          onClick={() => setShellForm({ id: 0, siteTarget: shellForm.siteTarget || siteEntries[0]?.fullDomain || '', name: '', active: true })}
                        >
                          <Icon name="refresh" className="h-4 w-4" />
                        </ToolbarIconButton>
                      </div>
                    </div>
                  </form>

                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Selected shell</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">{selectedShellSession?.name || 'Select a session from the table'}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedShellSession?.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {selectedShellSession?.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Site target</p>
                        <p className="mt-2 break-words text-sm font-semibold text-slate-950">{selectedShellSession?.site_target || '-'}</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Base path</p>
                        <p className="mt-2 break-all text-sm font-semibold text-slate-950">{selectedShellSession?.base_path || '-'}</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Target kind</p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">{selectedShellSession?.target_kind || '-'}</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Last exit</p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">{selectedShellSession?.last_exit_code ?? 0}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                      This shell runner is limited to the target site folder, ideal for AI automation, deploy helpers, or short maintenance tasks.
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Command runner</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">Run per session</h3>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        {shellCommandRunning ? 'Running...' : 'Ready'}
                      </span>
                    </div>

                    <form onSubmit={executeShellCommand} className="mt-4 grid gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-600">Command</label>
                        <textarea
                          ref={shellCommandInputRef}
                          value={shellCommand}
                          onChange={(event) => setShellCommand(event.target.value)}
                          rows={5}
                          placeholder="ls -la"
                          className="w-full rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 font-mono text-sm outline-none transition focus:border-[#1f3d2e] focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <ToolbarIconButton
                          title={shellCommandRunning ? 'Running...' : 'Run command'}
                          type="submit"
                          disabled={shellCommandRunning || !selectedShellSession?.id || !shellCommand.trim()}
                          className="bg-[#1f3d2e] text-white hover:bg-[#2f5d50]"
                          tone="primary"
                        >
                          <Icon name="play" className="h-4 w-4" />
                        </ToolbarIconButton>
                        <ToolbarIconButton
                          title="Clear output"
                          onClick={() => {
                            setShellOutput('');
                            setShellExitCode(0);
                          }}
                        >
                          <Icon name="refresh" className="h-4 w-4" />
                        </ToolbarIconButton>
                      </div>
                    </form>

                    {shellLogsError ? (
                      <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{shellLogsError}</p>
                    ) : null}

                    <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-500">Command output</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shellExitCode === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          Exit {shellExitCode}
                        </span>
                      </div>
                      <pre className="mt-3 max-h-[280px] overflow-auto rounded-[1.2rem] bg-slate-950 px-4 py-4 text-sm leading-6 text-slate-100">
                        {shellOutput || 'Output will appear here after the command runs.'}
                      </pre>
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Recent logs</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">Command history</h3>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        {shellLogsLoading ? 'Loading...' : `${shellLogs.length} entries`}
                      </span>
                    </div>

                    <div className="mt-4 max-h-[620px] space-y-3 overflow-auto pr-1">
                      {shellLogsLoading ? (
                        <div className="space-y-3">
                          <SkeletonBlock className="h-24 w-full rounded-[1.4rem]" />
                          <SkeletonBlock className="h-24 w-full rounded-[1.4rem]" />
                          <SkeletonBlock className="h-24 w-full rounded-[1.4rem]" />
                        </div>
                      ) : shellLogs.length === 0 ? (
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                          No command logs for this session.
                        </div>
                      ) : (
                        shellLogs.map((item) => (
                          <div key={item.id} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-950">{item.command}</p>
                                <p className="mt-1 text-xs text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${Number(item.exit_code) === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                Exit {item.exit_code}
                              </span>
                            </div>
                            <pre className="mt-3 max-h-40 overflow-auto rounded-[1.2rem] bg-white px-3 py-3 text-xs leading-6 text-slate-700">
                              {item.output || '-'}
                            </pre>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Shell sessions</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">Allowed sessions</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {shellSessionsLoading ? 'Loading...' : `${shellSessions.length} total`}
                    </span>
                  </div>

                  <div className="max-h-[520px] overflow-auto">
                    <div className="overflow-x-auto">
                      <table className="min-w-max w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                          <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <th className="whitespace-nowrap px-5 py-3">Session</th>
                            <th className="whitespace-nowrap px-5 py-3">Target</th>
                            <th className="whitespace-nowrap px-5 py-3">Base path</th>
                            <th className="whitespace-nowrap px-5 py-3">Last command</th>
                            <th className="whitespace-nowrap px-5 py-3">Exit</th>
                            <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {shellSessionsLoading ? (
                            <TableSkeletonRows columns={6} rows={4} widths={['w-32', 'w-36', 'w-40', 'w-32', 'w-20', 'w-28']} />
                          ) : shellSessions.length === 0 ? (
                            <tr>
                              <td className="px-5 py-6 text-sm text-slate-500" colSpan="6">
                                No shell sessions for the selected target.
                              </td>
                            </tr>
                          ) : (
                            shellSessions.map((item) => (
                              <tr key={item.id} className={selectedShellSession?.id === item.id ? 'bg-slate-50/80' : ''}>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedShellSession(item);
                                      setShellForm({
                                        id: item.id,
                                        siteTarget: item.site_target || '',
                                        name: item.name || '',
                                        active: item.active !== false,
                                      });
                                    }}
                                    className="text-left"
                                  >
                                    <p className="text-sm font-semibold text-slate-950">{item.name || `Session #${item.id}`}</p>
                                    <p className="mt-1 text-xs text-slate-400">{item.owner_email || '-'}</p>
                                  </button>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.site_target}</td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.base_path}</td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.last_command || '-'}</td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${Number(item.last_exit_code) === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {Number(item.last_exit_code) === 0 ? 'OK' : `Exit ${item.last_exit_code}`}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <ToolbarIconButton
                                      title="Details"
                                      onClick={() => {
                                        setSelectedShellSession(item);
                                        setShellForm({
                                          id: item.id,
                                          siteTarget: item.site_target || '',
                                          name: item.name || '',
                                          active: item.active !== false,
                                        });
                                      }}
                                    >
                                      <Icon name="details" className="h-4 w-4" />
                                    </ToolbarIconButton>
                                    <ToolbarIconButton
                                      title={deletingShellSession === String(item.id) ? 'Deleting...' : 'Delete'}
                                      onClick={() => deleteShellSession(item)}
                                      disabled={deletingShellSession === String(item.id)}
                                      className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                    >
                                      <Icon name="trash" className="h-4 w-4" />
                                    </ToolbarIconButton>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'backup' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Backup</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Backup manager</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Create a site backup or combine it with a database dump for a provisioned domain.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {backups.length} backups
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Backup ready
                  </span>
                </div>
              </div>

              {backupsError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{backupsError}</p>
              ) : null}

              <div className="mt-5 space-y-5">
                {backupsError ? (
                  <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{backupsError}</p>
                ) : null}
                {backupRulesError ? (
                  <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">{backupRulesError}</p>
                ) : null}

                <form onSubmit={submitBackup} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4">
                    <PanelSelect
                      label="Domain"
                      value={backupDomainFilter}
                      onChange={(event) => setBackupDomainFilter(event.target.value)}
                      name="backup_domain"
                    >
                      {domains.length === 0 ? <option value="">No domains available</option> : null}
                      {domains.map((domain) => (
                        <option key={domain.domain} value={domain.domain}>
                          {domain.domain}
                        </option>
                      ))}
                    </PanelSelect>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Scope</label>
                      <select
                        value={backupScope}
                        onChange={(event) => setBackupScope(event.target.value)}
                        className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                      >
                        <option value="site">Site files only</option>
                        <option value="database">Database dumps only</option>
                        <option value="full">Full backup</option>
                      </select>
                    </div>

                    <div className="rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                      Manual backups are stored on the server and can be downloaded again from the backup table.
                    </div>

                    <ToolbarIconButton
                      title={creatingBackup ? 'Creating...' : 'Create backup'}
                      type="submit"
                      disabled={creatingBackup || !backupDomainFilter}
                      className="bg-slate-950 text-white hover:bg-slate-800"
                    >
                      <Icon name="archive" className="h-4 w-4" />
                    </ToolbarIconButton>
                  </div>
                </form>

                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Backup list</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">{backupDomainFilter || 'Select domain'}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {backupsLoading ? 'Loading...' : `${backups.length} total`}
                    </span>
                  </div>

                  <div className="max-h-[620px] overflow-auto">
                    <div className="overflow-x-auto">
                      <table className="min-w-max w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                          <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <th className="whitespace-nowrap px-5 py-3">File</th>
                            <th className="whitespace-nowrap px-5 py-3">Scope</th>
                            <th className="whitespace-nowrap px-5 py-3">Size</th>
                            <th className="whitespace-nowrap px-5 py-3">Created</th>
                            <th className="whitespace-nowrap px-5 py-3">Notes</th>
                            <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                        {backupsLoading ? (
                            <TableSkeletonRows columns={6} rows={4} widths={['w-32', 'w-24', 'w-20', 'w-24', 'w-36', 'w-24']} />
                          ) : backups.length === 0 ? (
                            <tr>
                              <td className="px-5 py-6 text-sm text-slate-500" colSpan="6">
                                No backups for this domain.
                              </td>
                            </tr>
                          ) : (
                            backups.map((item) => (
                              <tr key={item.id}>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-950">{item.file_name}</p>
                                    <p className="mt-1 text-xs text-slate-400">{item.domain}</p>
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {item.scope}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                  {formatBytes(item.file_size)}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                  {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                  {item.notes || '-'}
                                </td>
                              <td className="whitespace-nowrap px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <a
                                    href={item.download_url}
                                    title="Download"
                                    aria-label="Download"
                                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                  >
                                      <Icon name="download" className="h-4 w-4" />
                                      <span>Download</span>
                                  </a>
                                  <ToolbarIconButton
                                    title={deletingBackup === item.id ? 'Deleting...' : 'Delete'}
                                    onClick={() => deleteBackup(item)}
                                    disabled={deletingBackup === item.id}
                                    className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                  >
                                    <Icon name="trash" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                </div>
                              </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <form onSubmit={submitBackupRule} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Automatic backup</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">Scheduled backup</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        This schedule runs automatic backups and removes old backups based on retention.
                      </p>
                    </div>

                    <PanelSelect
                      label="Domain"
                      value={backupDomainFilter}
                      onChange={(event) => setBackupDomainFilter(event.target.value)}
                      name="backup_rule_domain"
                    >
                      {domains.length === 0 ? <option value="">No domains available</option> : null}
                      {domains.map((domain) => (
                        <option key={domain.domain} value={domain.domain}>
                          {domain.domain}
                        </option>
                      ))}
                    </PanelSelect>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Scope</label>
                      <select
                        value={backupRuleScope}
                        onChange={(event) => setBackupRuleScope(event.target.value)}
                        className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                      >
                        <option value="site">Site files only</option>
                        <option value="database">Database dumps only</option>
                        <option value="full">Full backup</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Frequency</label>
                      <select
                        value={backupRuleFrequency}
                        onChange={(event) => setBackupRuleFrequency(event.target.value)}
                        className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-600">Hour</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={backupRuleHour}
                          onChange={(event) => setBackupRuleHour(event.target.value)}
                          className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-600">Minute</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={backupRuleMinute}
                          onChange={(event) => setBackupRuleMinute(event.target.value)}
                          className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-600">Retention</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={backupRuleRetention}
                          onChange={(event) => setBackupRuleRetention(event.target.value)}
                          className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1877ff] focus:bg-white"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={backupRuleEnabled}
                        onChange={(event) => setBackupRuleEnabled(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#1877ff] focus:ring-[#1877ff]"
                      />
                      Enable automatic backup
                    </label>

                    <ToolbarIconButton
                      title={creatingBackupRule ? 'Saving...' : 'Save backup rule'}
                      type="submit"
                      disabled={creatingBackupRule || !backupDomainFilter}
                      className="bg-slate-950 text-white hover:bg-slate-800"
                    >
                      <Icon name="save" className="h-4 w-4" />
                    </ToolbarIconButton>
                  </div>
                </form>

                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Backup rules</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">{backupDomainFilter || 'Select domain'}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {backupRulesLoading ? 'Loading...' : `${backupRules.length} total`}
                    </span>
                  </div>

                  <div className="max-h-[480px] overflow-auto">
                    <div className="overflow-x-auto">
                      <table className="min-w-max w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                          <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <th className="whitespace-nowrap px-5 py-3">Domain</th>
                            <th className="whitespace-nowrap px-5 py-3">Scope</th>
                            <th className="whitespace-nowrap px-5 py-3">Schedule</th>
                            <th className="whitespace-nowrap px-5 py-3">Retention</th>
                            <th className="whitespace-nowrap px-5 py-3">Next run</th>
                            <th className="whitespace-nowrap px-5 py-3">Status</th>
                            <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                        {backupRulesLoading ? (
                            <TableSkeletonRows columns={7} rows={3} widths={['w-32', 'w-24', 'w-28', 'w-20', 'w-28', 'w-24', 'w-24']} />
                          ) : backupRules.length === 0 ? (
                            <tr>
                              <td className="px-5 py-6 text-sm text-slate-500" colSpan="7">
                                No automatic backups for this domain.
                              </td>
                            </tr>
                          ) : (
                            backupRules.map((item) => (
                              <tr key={item.id}>
                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-950">{item.domain}</td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.scope}</td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                  {item.frequency} at {String(item.hour).padStart(2, '0')}:{String(item.minute).padStart(2, '0')}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.retention_count} backups</td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                  {item.next_run_at ? new Date(item.next_run_at).toLocaleString() : '-'}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {item.enabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-right">
                                  <ToolbarIconButton
                                    title={deletingBackupRule === item.id ? 'Deleting...' : 'Delete'}
                                    onClick={() => deleteBackupRule(item)}
                                    disabled={deletingBackupRule === item.id}
                                    className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                  >
                                    <Icon name="trash" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-400">Notes</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">Manual backups copy the site files or database dump based on the selected scope.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">Automatic backups run from the server worker without opening the panel.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">Retention keeps only the latest backups based on the selected count.</li>
                    <li className="rounded-2xl bg-slate-50 px-4 py-3">Backup files can still be downloaded and deleted from the panel.</li>
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'ssh' ? (
            <section className="space-y-5">
              <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">SSH</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">Server access keys</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Manage public keys for Ubuntu SSH access with service status and active key list.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-2 text-sm font-medium ${sshStatus?.service_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {sshStatusLoading ? 'Checking...' : sshStatus?.service_active ? 'SSH active' : 'SSH inactive'}
                    </span>
                    <span className="rounded-full bg-sky-100 px-3 py-2 text-sm font-medium text-sky-700">
                      Port {sshStatus?.port || '22'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                      {sshStatusLoading ? 'Loading...' : `${sshStatus?.managed_keys || 0} keys`}
                    </span>
                  </div>
                </div>

                {sshStatusError ? (
                  <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{sshStatusError}</p>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-400">Host</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{sshStatus?.host || '-'}</p>
                  </div>
                  <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-400">Username</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{sshStatus?.user || 'ubuntu'}</p>
                  </div>
                  <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-400">Authorized keys</p>
                    <code className="mt-2 block break-all rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                      {sshStatus?.authorized_keys_path || '/home/ubuntu/.ssh/authorized_keys'}
                    </code>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Connection info</p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-950">SSH command</h3>
                  </div>
                  <code className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    ssh {sshStatus?.user || 'ubuntu'}@{sshStatus?.host || 'server-ip'} -p {sshStatus?.port || '22'}
                  </code>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-400">Quick tips</p>
                    <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                      <li className="rounded-2xl bg-white px-4 py-3">Add a public key below to enable SSH access.</li>
                      <li className="rounded-2xl bg-white px-4 py-3">Inactive keys will not be written to authorized_keys.</li>
                      <li className="rounded-2xl bg-white px-4 py-3">All changes sync to the Ubuntu server immediately.</li>
                    </ul>
                  </div>
                  <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-400">Current summary</p>
                    <div className="mt-3 grid gap-3">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Service</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">{sshStatus?.service_name || 'ssh'}</p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Managed keys</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">{sshStatus?.managed_keys || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={submitSSHKey} className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <div>
                  <p className="text-sm font-medium text-slate-400">{sshForm.id ? 'Edit SSH key' : 'Add SSH key'}</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950">{sshForm.id ? 'Update key' : 'Create key'}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Paste the SSH public key. The <code className="rounded bg-slate-100 px-1.5 py-0.5">authorized_keys</code> file syncs automatically.
                  </p>
                </div>

                {sshKeysError ? (
                  <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{sshKeysError}</p>
                ) : null}

                <div className="mt-5 grid gap-4">
                  <PanelField
                    label="Title"
                    placeholder="Laptop pribadi"
                    value={sshForm.title}
                    onChange={(event) => setSshForm((current) => ({ ...current, title: event.target.value }))}
                    name="ssh_title"
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">Public key</label>
                    <textarea
                      value={sshForm.publicKey}
                      onChange={(event) => setSshForm((current) => ({ ...current, publicKey: event.target.value }))}
                      rows={6}
                      placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA..."
                      className="w-full rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 font-mono text-sm outline-none transition focus:border-[#1877ff] focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={sshForm.enabled}
                      onChange={(event) => setSshForm((current) => ({ ...current, enabled: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-[#1877ff] focus:ring-[#1877ff]"
                    />
                    Enable this SSH key
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <ToolbarIconButton
                      title={sshSaving ? 'Saving...' : sshForm.id ? 'Update SSH key' : 'Add SSH key'}
                      type="submit"
                      disabled={sshSaving || !sshForm.title.trim() || !sshForm.publicKey.trim()}
                      className="bg-slate-950 text-white hover:bg-slate-800"
                    >
                      <Icon name="save" className="h-4 w-4" />
                    </ToolbarIconButton>
                    <ToolbarIconButton
                      title="Reset form"
                      onClick={() => setSshForm({ id: 0, title: '', publicKey: '', enabled: true })}
                    >
                      <Icon name="refresh" className="h-4 w-4" />
                    </ToolbarIconButton>
                  </div>
                </div>
              </form>

              <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-400">SSH keys</p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-950">Allowed keys</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                    {sshKeysLoading ? 'Loading...' : `${sshKeys.length} total`}
                  </span>
                </div>

                <div className="mt-5 max-h-[520px] overflow-auto">
                  <div className="overflow-x-auto">
                    <table className="min-w-max w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <th className="whitespace-nowrap px-5 py-3">Title</th>
                          <th className="whitespace-nowrap px-5 py-3">Fingerprint</th>
                          <th className="whitespace-nowrap px-5 py-3">Status</th>
                          <th className="whitespace-nowrap px-5 py-3">Created</th>
                          <th className="whitespace-nowrap px-5 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sshKeysLoading ? (
                          <TableSkeletonRows columns={5} rows={4} widths={['w-32', 'w-36', 'w-24', 'w-28', 'w-24']} />
                        ) : sshKeys.length === 0 ? (
                          <tr>
                            <td className="px-5 py-6 text-sm text-slate-500" colSpan="5">
                              No SSH keys registered.
                            </td>
                          </tr>
                        ) : (
                          sshKeys.map((item) => (
                            <tr key={item.id}>
                              <td className="whitespace-nowrap px-5 py-4">
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">{item.title || `Key #${item.id}`}</p>
                                  <p className="mt-1 max-w-[26rem] truncate text-xs text-slate-400">{item.public_key}</p>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.fingerprint || '-'}</td>
                              <td className="whitespace-nowrap px-5 py-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {item.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                              </td>
                              <td className="whitespace-nowrap px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <ToolbarIconButton
                                    title="Details"
                                    onClick={() => editSSHKey(item)}
                                  >
                                    <Icon name="details" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                  <ToolbarIconButton
                                    title={item.enabled ? 'Disable' : 'Enable'}
                                    onClick={() => toggleSSHKey(item, !item.enabled)}
                                    disabled={sshSaving}
                                    className="border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100"
                                  >
                                    <Icon name="switch" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                  <ToolbarIconButton
                                    title={sshDeleting === String(item.id) ? 'Deleting...' : 'Delete'}
                                    onClick={() => deleteSSHKey(item)}
                                    disabled={sshDeleting === String(item.id)}
                                    className="border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                                  >
                                    <Icon name="trash" className="h-4 w-4" />
                                  </ToolbarIconButton>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'users' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Users</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Approval queue</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Registrations stay pending until an admin approves them.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700">
                    Pending {users.filter((user) => !user.approved).length}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                    Approved {users.filter((user) => user.approved).length}
                  </span>
                </div>
              </div>

              {usersError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{usersError}</p>
              ) : null}

              <div className="mt-5 overflow-x-auto rounded-[1.6rem] border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {usersLoading ? (
                      <TableSkeletonRows columns={6} rows={5} widths={['w-36', 'w-48', 'w-20', 'w-24', 'w-28', 'w-24']} />
                    ) : users.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-sm text-slate-500" colSpan="6">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.email}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                                {user.initials}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                                <p className="text-xs text-slate-400">{user.company || 'No company'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">{user.email}</td>
                          <td className="px-4 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_admin ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                              {user.is_admin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(user.status)}`}>
                              {formatUserStatus(user.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {!user.email_verified ? (
                              <span className="text-sm font-medium text-slate-400">Need email verification</span>
                            ) : !user.approved ? (
                              <ToolbarIconButton
                                title={approvingEmail === user.email ? 'Approving...' : 'Approve'}
                                onClick={() => approveUser(user.email)}
                                disabled={approvingEmail === user.email}
                                className="bg-slate-950 text-white hover:bg-slate-800"
                              >
                                <Icon name="user" className="h-4 w-4" />
                              </ToolbarIconButton>
                            ) : (
                              <span className="text-sm font-medium text-slate-400">Approved</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export function App() {
  const apiBaseUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/api`
      : '/api';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const isEmailHost = EMAIL_HOSTS.has(currentHost);
  const { path, navigate } = useAppRoute();
  const auth = useAuthSession();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const normalizedPath = path.replace(/\/+$/, '') || '/';
  const isLoginRoute = normalizedPath.startsWith('/login');
  const isRegisterRoute = normalizedPath.startsWith('/register');
  const isVerifyEmailRoute = normalizedPath.startsWith('/verify-email');
  const isDashboardRoute = normalizedPath === '/' || normalizedPath.startsWith('/projects');
  let content;

  React.useEffect(() => {
    if (isEmailHost) {
      return;
    }

    if (auth.loading) {
      return;
    }

    if (auth.session && (isLoginRoute || isRegisterRoute)) {
      navigate('/projects');
      return;
    }

    if (auth.session && isVerifyEmailRoute) {
      navigate('/projects');
      return;
    }

    if (!auth.session && isDashboardRoute) {
      navigate('/login');
    }
  }, [auth.loading, auth.session, isDashboardRoute, isEmailHost, isLoginRoute, isRegisterRoute, isVerifyEmailRoute, navigate]);

  if (isEmailHost) {
    return (
      <div className="email-dashboard min-h-screen">
        <EmailWorkspace />
      </div>
    );
  }

  if (auth.loading) {
    return (
      <div className="brand-dashboard min-h-screen">
        <BrandThemeStyles />
        <LoadingShell />
      </div>
    );
  }

  if ((isLoginRoute || isRegisterRoute || isVerifyEmailRoute) && auth.session) {
    return (
      <div className="brand-dashboard min-h-screen">
        <BrandThemeStyles />
        <LoadingShell />
      </div>
    );
  }

  if (isVerifyEmailRoute) {
    content = <EmailVerifyShell token={searchParams.get('token') || ''} navigate={navigate} />;
  } else if (isLoginRoute && !auth.session) {
    content = (
      <AuthShell
        mode="login"
        navigate={navigate}
        onLogin={auth.signIn}
        onRegister={auth.signUp}
      />
    );
  } else if (isRegisterRoute && !auth.session) {
    content = (
      <AuthShell
        mode="register"
        navigate={navigate}
        onLogin={auth.signIn}
        onRegister={auth.signUp}
      />
    );
  } else if (isDashboardRoute && !auth.session) {
    content = (
      <AuthShell
        mode="login"
        navigate={navigate}
        onLogin={auth.signIn}
        onRegister={auth.signUp}
      />
    );
  } else {
    content = (
      <DashboardShell
        navigate={navigate}
        session={auth.session}
        onLogout={async () => {
          await auth.signOut();
          navigate('/login');
        }}
      />
    );
  }

  return (
    <div className="brand-dashboard min-h-screen">
      <BrandThemeStyles />
      {content}
    </div>
  );
}
