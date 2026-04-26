'use client';

import { useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiGlobe,
  FiPackage,
  FiSearch,
  FiShield,
} from 'react-icons/fi';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://panel.diworkin.com/api';

const defaultForm = {
  licenseKey: '',
  domain: '',
  productName: '',
  licenseType: 'hosting',
};

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#1f2b24]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[1.2rem] border border-[rgba(31,61,46,0.14)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#4f8f6c] focus:ring-4 focus:ring-[#cfe8d5]/50"
      />
    </label>
  );
}

function Badge({ tone = 'slate', children }) {
  const classes = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-[#cfe8d5] text-[#1f3d2e]',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes[tone] || classes.slate}`}>{children}</span>;
}

export default function LicenseCheckPage() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(
    () =>
      [
        `LICENSE_API_URL=${apiBaseUrl}/licenses/verify`,
        `LICENSE_KEY=${form.licenseKey || 'LIC-XXXX-XXXX-XXXX-XXXX'}`,
        `LICENSE_DOMAIN=${form.domain || 'example.com'}`,
        `LICENSE_PRODUCT=${form.productName || 'Diworkin Hosting'}`,
        `LICENSE_TYPE=${form.licenseType || 'hosting'}`,
      ].join('\n'),
    [form.domain, form.licenseKey, form.licenseType, form.productName],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${apiBaseUrl}/licenses/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          license_key: form.licenseKey.trim(),
          domain: form.domain.trim(),
          product_name: form.productName.trim(),
          license_type: form.licenseType,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.valid) {
        throw new Error(payload?.error || payload?.message || 'License tidak valid');
      }
      setResult(payload.license || payload);
    } catch (err) {
      setError(err?.message || 'Gagal memverifikasi license');
    } finally {
      setLoading(false);
    }
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setError('Gagal menyalin snippet license');
    }
  };

  const isValid = Boolean(result?.license_key);

  return (
    <main className="min-h-screen bg-[#fbfcfa] px-4 py-8 text-[#1f2b24] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-[rgba(31,61,46,0.08)] bg-white p-6 shadow-[0_18px_50px_rgba(31,61,46,0.06)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#4f8f6c]">License Check</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#1f2b24] sm:text-5xl">
                Cek license sebelum install
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[#64706a]">
                Pastikan key, domain, dan tipe license cocok sebelum installer melanjutkan proses setup.
                Halaman ini dipakai oleh installer dan juga bisa dipakai untuk verifikasi manual.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Badge tone="green">
                  <span className="inline-flex items-center gap-2">
                    <FiShield className="h-4 w-4" />
                    Installer ready
                  </span>
                </Badge>
                <Badge tone="slate">
                  <span className="inline-flex items-center gap-2">
                    <FiSearch className="h-4 w-4" />
                    Verify before install
                  </span>
                </Badge>
                <Badge tone="amber">
                  <span className="inline-flex items-center gap-2">
                    <FiClock className="h-4 w-4" />
                    Expiry check
                  </span>
                </Badge>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[rgba(31,61,46,0.10)] bg-[#f7fbf8] p-5 lg:w-[22rem]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Quick note</p>
              <p className="mt-2 text-sm leading-7 text-[#2f5d50]">
                Gunakan <span className="font-semibold">LICENSE_API_URL</span> dan <span className="font-semibold">LICENSE_KEY</span>
                di <code className="rounded bg-white px-1.5 py-0.5">installer/config.env</code>. Jika license cocok,
                installer lanjut otomatis.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <form onSubmit={handleSubmit} className="rounded-[1.8rem] border border-[rgba(31,61,46,0.10)] bg-[#f8fbf8] p-5">
              <div className="grid gap-4">
                <Field
                  label="License key"
                  placeholder="LIC-XXXX-XXXX-XXXX-XXXX"
                  value={form.licenseKey}
                  onChange={(value) => setForm((current) => ({ ...current, licenseKey: value }))}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Domain"
                    placeholder="example.com"
                    value={form.domain}
                    onChange={(value) => setForm((current) => ({ ...current, domain: value }))}
                  />
                  <Field
                    label="Product name"
                    placeholder="Diworkin Hosting"
                    value={form.productName}
                    onChange={(value) => setForm((current) => ({ ...current, productName: value }))}
                  />
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#1f2b24]">License type</span>
                  <select
                    value={form.licenseType}
                    onChange={(event) => setForm((current) => ({ ...current, licenseType: event.target.value }))}
                    className="w-full rounded-[1.2rem] border border-[rgba(31,61,46,0.14)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4f8f6c] focus:ring-4 focus:ring-[#cfe8d5]/50"
                  >
                    <option value="hosting">Hosting</option>
                    <option value="panel">Panel</option>
                    <option value="product">Product</option>
                    <option value="app">App</option>
                    <option value="website">Website</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>

                <div className="grid gap-3 rounded-[1.3rem] border border-[rgba(31,61,46,0.10)] bg-white p-4 text-sm text-[#1f2b24]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#64706a]">API endpoint</span>
                    <span className="font-medium">{apiBaseUrl}/licenses/verify</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#64706a]">Scope</span>
                    <span className="font-medium">Installer verification</span>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-[1.3rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <span className="inline-flex items-center gap-2">
                      <FiAlertTriangle className="h-4 w-4" />
                      {error}
                    </span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || !form.licenseKey.trim()}
                  className="inline-flex items-center justify-center rounded-full bg-[#1f3d2e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2f5d50] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Checking...' : 'Verify license'}
                </button>
              </div>
            </form>

            <div className="space-y-5">
              <div className="rounded-[1.8rem] border border-[rgba(31,61,46,0.10)] bg-white p-5 shadow-[0_18px_44px_rgba(31,61,46,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#64706a]">Installer snippet</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#1f2b24]">Copy untuk config.env</h2>
                  </div>
                  <button
                    type="button"
                    onClick={copySnippet}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(31,61,46,0.14)] bg-[#f7fbf8] px-4 py-2 text-sm font-semibold text-[#1f3d2e] transition hover:border-[#1f3d2e]"
                  >
                    <FiCopy className="h-4 w-4" />
                    {copied ? 'Copied' : 'Copy snippet'}
                  </button>
                </div>
                <pre className="mt-4 overflow-x-auto rounded-[1.4rem] bg-[#0f172a] p-4 text-[11px] leading-6 text-[#dbe7dd]">
                  {snippet}
                </pre>
              </div>

              <div className="rounded-[1.8rem] border border-[rgba(31,61,46,0.10)] bg-[#f7fbf8] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#64706a]">Result</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#1f2b24]">Status verifikasi</h2>
                  </div>
                  <Badge tone={isValid ? 'green' : result ? 'amber' : 'slate'}>{isValid ? 'Valid' : result ? 'Pending' : 'Idle'}</Badge>
                </div>

                {result ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-[1.3rem] border border-[rgba(31,61,46,0.10)] bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#cfe8d5] text-[#1f3d2e]">
                          <FiCheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1f2b24]">{result.product_name || 'License valid'}</p>
                          <p className="mt-1 text-sm leading-6 text-[#64706a]">
                            {result.message || 'License cocok dan siap dipakai installer.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-[1.3rem] border border-[rgba(31,61,46,0.10)] bg-white p-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#64706a]">License key</span>
                        <span className="font-medium text-[#1f2b24]">{result.license_key || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#64706a]">Domain</span>
                        <span className="font-medium text-[#1f2b24]">{result.domain || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#64706a]">Type</span>
                        <span className="font-medium text-[#1f2b24]">{result.license_type || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#64706a]">Expiry</span>
                        <span className="font-medium text-[#1f2b24]">
                          {result.expires_at ? new Date(result.expires_at).toLocaleString() : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[1.3rem] border border-dashed border-[rgba(31,61,46,0.15)] bg-white p-5">
                    <div className="flex items-center gap-3 text-[#64706a]">
                      <FiShield className="h-5 w-5 text-[#4f8f6c]" />
                      <p className="text-sm leading-7">
                        Masukkan license key lalu klik verify. Halaman ini akan menampilkan hasil validasi secara langsung.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
