import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FiBell,
  FiCheck,
  FiBookOpen,
  FiBox,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiCode,
  FiAlignCenter,
  FiAlignJustify,
  FiAlignLeft,
  FiAlignRight,
  FiCopy,
  FiDownload,
  FiFileText,
  FiBarChart2,
  FiGrid,
  FiHelpCircle,
  FiHome,
  FiImage,
  FiLayers,
  FiLink,
  FiList,
  FiMapPin,
  FiMaximize,
  FiCircle,
  FiHexagon,
  FiMinus,
  FiMove,
  FiMusic,
  FiPlus,
  FiRotateCw,
  FiSave,
  FiSettings,
  FiShare2,
  FiSliders,
  FiSquare,
  FiStar,
  FiTag,
  FiTrash2,
  FiTriangle,
  FiType,
  FiUploadCloud,
  FiVideo,
  FiHash,
} from 'react-icons/fi';
import './styles.css';

const initialPages = [
  {
    id: 'cover',
    name: 'Cover',
    background: '#f8fafc',
    elements: [
      { id: 'el-title', type: 'heading', x: 10, y: 12, w: 72, h: 18, text: 'Diworkin Growth Playbook' },
      { id: 'el-copy', type: 'text', x: 10, y: 34, w: 58, h: 16, text: 'Interactive ebook viewer dengan 3D flipbook untuk materi bisnis, katalog, dan case study.' },
      { id: 'el-badge', type: 'label', x: 10, y: 70, w: 32, h: 8, text: 'DIWORKIN STUDIO' },
    ],
  },
  {
    id: 'page-2',
    name: 'Chapter 01',
    background: '#fff7ed',
    elements: [
      { id: 'el-chapter', type: 'heading', x: 9, y: 11, w: 62, h: 14, text: 'Strategy Brief' },
      { id: 'el-body', type: 'text', x: 9, y: 31, w: 72, h: 28, text: 'Susun konten halaman demi halaman, tempatkan teks dan aset secara bebas, lalu preview hasilnya sebagai flipbook.' },
    ],
  },
];

const paletteItems = [
  { type: 'heading', label: 'Heading', icon: FiType },
  { type: 'text', label: 'Text', icon: FiFileText },
  { type: 'label', label: 'Label', icon: FiTag },
  { type: 'image', label: 'Image', icon: FiImage },
];

function DiamondGlyph({ className = '' }) {
  return <FiSquare className={`${className} rotate-45`} />;
}

const elementGroups = [
  {
    label: 'Basic',
    items: [
      { type: 'text', label: 'Text', icon: FiType },
      { type: 'image', label: 'Image', icon: FiImage },
      { type: 'shape', label: 'Square', icon: FiSquare },
      { type: 'circle', label: 'Circle', icon: FiCircle },
      { type: 'diamond', label: 'Diamond', icon: DiamondGlyph },
      { type: 'triangle', label: 'Triangle', icon: FiTriangle },
      { type: 'pill', label: 'Pill', icon: FiHexagon },
      { type: 'hexagon', label: 'Hexagon', icon: FiHexagon },
      { type: 'line', label: 'Line', icon: FiMinus },
      { type: 'button', label: 'Button', icon: FiArrowRight },
    ],
  },
  {
    label: 'Media',
    items: [
      { type: 'video', label: 'Video', icon: FiVideo },
      { type: 'audio', label: 'Audio', icon: FiMusic },
      { type: 'gallery', label: 'Gallery', icon: FiLayers },
      { type: 'embed', label: 'Embed', icon: FiCode },
    ],
  },
  {
    label: 'Advanced',
    items: [
      { type: 'table', label: 'Table', icon: FiGrid },
      { type: 'chart', label: 'Chart', icon: FiBarChart2 },
      { type: 'map', label: 'Map', icon: FiMapPin },
      { type: 'qr', label: 'QR Code', icon: FiHash },
    ],
  },
];

const colors = ['#f8fafc', '#fff7ed', '#ecfdf5', '#eff6ff', '#f5f3ff', '#fef2f2'];

const fontOptions = [
  { name: 'Space Grotesk', family: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif", sample: 'Modern tech editorial' },
  { name: 'Inter', family: "'Inter', ui-sans-serif, system-ui, sans-serif", sample: 'Clean product guide' },
  { name: 'Playfair Display', family: "'Playfair Display', Georgia, serif", sample: 'Premium magazine layout' },
  { name: 'Merriweather', family: "'Merriweather', Georgia, serif", sample: 'Readable long-form ebook' },
  { name: 'Poppins', family: "'Poppins', ui-sans-serif, system-ui, sans-serif", sample: 'Friendly creator workbook' },
  { name: 'Source Serif 4', family: "'Source Serif 4', Georgia, serif", sample: 'Polished research report' },
];

const alignmentOptions = [
  { value: 'left', label: 'Left', icon: FiAlignLeft },
  { value: 'center', label: 'Center', icon: FiAlignCenter },
  { value: 'right', label: 'Right', icon: FiAlignRight },
  { value: 'justify', label: 'Justify', icon: FiAlignJustify },
];

const sidebarNavItems = [
  { key: 'dashboard', label: 'Dashboard', icon: FiHome },
  { key: 'books', label: 'My Books', icon: FiBookOpen },
  { key: 'create', label: 'Create New', icon: FiBox },
  { key: 'templates', label: 'Templates', icon: FiGrid },
  { key: 'layouts', label: 'Layouts', icon: FiLayers },
  { key: 'elements', label: 'Elements', icon: FiStar },
  { key: 'media', label: 'Media Library', icon: FiImage },
  { key: 'text', label: 'Text Styles', icon: FiType },
  { key: 'settings', label: 'Settings', icon: FiSettings },
];

const sidebarMessages = {
  dashboard: 'Dashboard view selected',
  books: 'Books list selected',
  create: 'Create new ebook selected',
  templates: 'Templates selected',
  layouts: 'Layout tools selected',
  elements: 'Element tools selected',
  media: 'Media library selected',
  text: 'Text styles selected',
  settings: 'Settings selected',
};

const workspaceSummaries = {
  dashboard: {
    title: 'Dashboard',
    description: 'Ringkasan workspace ebook, aktivitas terakhir, dan pintasan ke builder.',
    accent: '#1f3d2e',
  },
  books: {
    title: 'My Books',
    description: 'Daftar buku, draft, dan halaman yang sedang kamu kelola.',
    accent: '#4f8f6c',
  },
  templates: {
    title: 'Templates',
    description: 'Pilihan template untuk cover, chapter, katalog, dan case study.',
    accent: '#8b6a3d',
  },
  layouts: {
    title: 'Layouts',
    description: 'Susunan halaman dan struktur untuk presentasi konten yang lebih rapi.',
    accent: '#2f5d50',
  },
  elements: {
    title: 'Elements',
    description: 'Koleksi elemen yang bisa kamu taruh ke canvas: teks, gambar, media, dan data.',
    accent: '#1f4b7d',
  },
  media: {
    title: 'Media Library',
    description: 'Asset visual yang siap dipakai untuk halaman ebook.',
    accent: '#0f766e',
  },
  text: {
    title: 'Text Styles',
    description: 'Preset font, ukuran, alignment, dan tone teks untuk halaman ebook.',
    accent: '#7c3aed',
  },
  settings: {
    title: 'Settings',
    description: 'Pengaturan workspace, metadata buku, dan konfigurasi publish.',
    accent: '#0f172a',
  },
};

function WorkspacePage({
  menu,
  pages,
  bookTitle,
  author,
  publishSlug,
  defaultFontName,
  onOpenCreate,
  onOpenPreview,
  onSelectMenu,
}) {
  const summary = workspaceSummaries[menu] || workspaceSummaries.dashboard;

  if (menu === 'dashboard') {
    const stats = [
      { label: 'Pages', value: String(pages.length), tone: 'bg-[#1f3d2e]' },
      { label: 'Active font', value: defaultFontName, tone: 'bg-[#4f8f6c]' },
      { label: 'Publish slug', value: publishSlug || 'viewer', tone: 'bg-[#8b6a3d]' },
      { label: 'Status', value: 'Draft ready', tone: 'bg-[#2f5d50]' },
    ];

    return (
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <section className="panel-card overflow-hidden bg-gradient-to-br from-[#f8faf4] via-white to-[#edf4ef]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Workspace overview</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Dashboard</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                Lihat status ebook, buka editor, dan lanjutkan halaman yang sudah ada tanpa pindah keluar dari workspace.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={onOpenCreate} className="btn-primary justify-center">
                <FiPlus /> New page
              </button>
              <button type="button" onClick={onOpenPreview} className="btn-secondary justify-center">
                <FiBookOpen /> Preview
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
                <div className={`mb-3 h-10 w-10 rounded-2xl ${stat.tone} grid place-items-center text-white`}>
                  <FiCheck />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Recent pages</h2>
                <button type="button" onClick={() => onSelectMenu('books')} className="text-sm font-semibold text-[#1f3d2e] hover:underline">
                  View all
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                {pages.map((page, index) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={onOpenCreate}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-[#1f3d2e]/20 hover:bg-white"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{index + 1}. {page.name}</p>
                      <p className="text-xs text-slate-500">{page.elements.length} elements</p>
                    </div>
                    <span className="h-3 w-3 rounded-full" style={{ background: page.background }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Current draft</p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight">{bookTitle}</h3>
              <p className="mt-2 text-sm leading-7 text-white/72">
                {author} sedang mengerjakan draft dengan {pages.length} halaman. Buka editor untuk menambahkan halaman, elemen, atau preview 3D.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Builder ready</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Flipbook preview</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{defaultFontName}</span>
              </div>
              <button type="button" onClick={onOpenCreate} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Open editor <FiArrowRight />
              </button>
            </div>
          </div>
        </section>

        <aside className="grid gap-5">
          <div className="panel-card">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Quick actions</p>
            <div className="mt-4 grid gap-3">
              <button type="button" onClick={onOpenCreate} className="btn-primary justify-center">
                <FiPlus /> Create new page
              </button>
              <button type="button" onClick={onOpenPreview} className="btn-secondary justify-center">
                <FiBookOpen /> Preview flipbook
              </button>
              <button type="button" onClick={() => onSelectMenu('settings')} className="btn-secondary justify-center">
                <FiSettings /> Open settings
              </button>
            </div>
          </div>

          <div className="panel-card">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Publishing</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Viewer URL</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">https://ebook.diworkin.com/{publishSlug || 'viewer'}</p>
              </div>
              <button type="button" onClick={() => onSelectMenu('books')} className="btn-secondary justify-center">
                <FiGrid /> Manage pages
              </button>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  if (menu === 'books') {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Library</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">My Books</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Lihat draft yang ada, cek nama halaman, dan lanjutkan editing tanpa keluar dari workspace.
              </p>
            </div>
            <button type="button" onClick={onOpenCreate} className="btn-primary">
              <FiPlus /> New book
            </button>
          </div>

          <div className="mt-6 grid gap-3">
            {pages.map((page, index) => (
              <article key={page.id} className="grid gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Page {index + 1}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">{page.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{page.elements.length} elements, background {page.background}</p>
                </div>
                <button type="button" onClick={onOpenCreate} className="btn-secondary justify-center">
                  Open editor
                </button>
              </article>
            ))}
          </div>
        </section>

        <aside className="grid gap-5">
          <div className="panel-card">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Status</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Total pages</span>
                <span className="font-semibold text-slate-900">{pages.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Selected font</span>
                <span className="font-semibold text-slate-900">{defaultFontName}</span>
              </div>
            </div>
          </div>
          <div className="panel-card">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Actions</p>
            <div className="mt-4 grid gap-3">
              <button type="button" onClick={onOpenCreate} className="btn-primary justify-center">
                <FiBookOpen /> Open create page
              </button>
              <button type="button" onClick={() => onSelectMenu('templates')} className="btn-secondary justify-center">
                <FiGrid /> Browse templates
              </button>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  if (menu === 'templates') {
    const templates = [
      { title: 'Cover Story', copy: 'Cocok untuk cover, hero, dan pembuka buku.', icon: FiBookOpen },
      { title: 'Case Study', copy: 'Layout rapi untuk cerita bisnis dan hasil kerja.', icon: FiFileText },
      { title: 'Catalog Grid', copy: 'Pas untuk katalog produk dan listing ringan.', icon: FiGrid },
      { title: 'Editorial Split', copy: 'Dua kolom untuk teks dan visual.', icon: FiLayers },
    ];

    return (
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Templates</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Template library</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Pilih struktur halaman yang paling sesuai untuk ebook, lalu lanjutkan ke Create New untuk menyesuaikan isi.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {templates.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[1.4rem] border border-slate-200 bg-white p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f5fbf7] text-[#1f3d2e]">
                    <Icon />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </section>
        <aside className="panel-card">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Next step</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">Setelah memilih template, buka editor untuk menyesuaikan teks dan asset.</p>
          <button type="button" onClick={onOpenCreate} className="mt-5 btn-primary w-full justify-center">
            <FiPlus /> Use a template
          </button>
        </aside>
      </div>
    );
  }

  if (menu === 'layouts') {
    const layouts = [
      { title: 'Single focus', copy: 'Satu pesan besar, cocok untuk cover dan section utama.', icon: FiSquare },
      { title: 'Two column', copy: 'Teks dan visual berdampingan.', icon: FiLayers },
      { title: 'Feature grid', copy: 'Pas untuk daftar manfaat dan fitur.', icon: FiGrid },
      { title: 'Timeline', copy: 'Cocok untuk cerita proses dan journey.', icon: FiArrowRight },
    ];

    return (
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Layouts</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Layout tools</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Atur struktur halaman sebelum menaruh elemen. Ini membantu saat menyiapkan ebook yang berlapis dan konsisten.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {layouts.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[1.4rem] border border-slate-200 bg-white p-5">
                  <Icon className="text-2xl text-slate-700" />
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </section>
        <aside className="panel-card">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Builder shortcut</p>
          <button type="button" onClick={onOpenCreate} className="mt-5 btn-primary w-full justify-center">
            <FiLayers /> Open layout editor
          </button>
        </aside>
      </div>
    );
  }

  if (menu === 'elements') {
    const groups = [
      { title: 'Basic', items: ['Text', 'Image', 'Shape', 'Button'] },
      { title: 'Media', items: ['Video', 'Audio', 'Gallery', 'Embed'] },
      { title: 'Advanced', items: ['Table', 'Chart', 'Map', 'QR Code'] },
    ];

    return (
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Elements</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Element library</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Semua elemen yang bisa dipakai di ebook ada di sini. Buka Create New jika ingin menaruh elemen ke canvas.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {groups.map((group) => (
              <article key={group.title} className="rounded-[1.4rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{group.title}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="panel-card">
          <button type="button" onClick={onOpenCreate} className="btn-primary w-full justify-center">
            <FiStar /> Add elements in editor
          </button>
        </aside>
      </div>
    );
  }

  if (menu === 'media') {
    const mediaItems = [
      { title: 'Cover image', kind: 'PNG', tone: '#f8fafc' },
      { title: 'Product mockup', kind: 'JPG', tone: '#eff6ff' },
      { title: 'Promo video', kind: 'MP4', tone: '#ecfdf5' },
      { title: 'Audio intro', kind: 'MP3', tone: '#fff7ed' },
    ];

    return (
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Media Library</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Asset library</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Simpan asset visual dan media pendukung untuk dipakai ulang di beberapa halaman ebook.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {mediaItems.map((item) => (
              <article key={item.title} className="rounded-[1.4rem] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{item.kind}</span>
                </div>
                <div className="mt-4 h-28 rounded-2xl" style={{ background: item.tone }} />
              </article>
            ))}
          </div>
        </section>
        <aside className="panel-card">
          <button type="button" onClick={onOpenCreate} className="btn-primary w-full justify-center">
            <FiUploadCloud /> Upload to canvas
          </button>
        </aside>
      </div>
    );
  }

  if (menu === 'text') {
    const styles = [
      { title: 'Heading', copy: 'Judul besar dan kuat.', tone: 'bg-slate-950 text-white' },
      { title: 'Body', copy: 'Paragraf panjang yang nyaman dibaca.', tone: 'bg-slate-100 text-slate-900' },
      { title: 'Label', copy: 'Penanda kecil dan tegas.', tone: 'bg-[#1f3d2e] text-white' },
      { title: 'CTA', copy: 'Teks tombol dan call to action.', tone: 'bg-[#4f8f6c] text-white' },
    ];

    return (
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Text Styles</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Typography presets</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Gunakan font style yang konsisten agar ebook tetap rapi dari cover sampai halaman terakhir.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {styles.map((item) => (
              <article key={item.title} className={`rounded-[1.4rem] p-5 ${item.tone}`}>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 opacity-90">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>
        <aside className="panel-card">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Default font</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">{defaultFontName}</p>
          <button type="button" onClick={onOpenCreate} className="mt-5 btn-primary w-full justify-center">
            <FiType /> Edit text on canvas
          </button>
        </aside>
      </div>
    );
  }

  if (menu === 'settings') {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Settings</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Workspace settings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Simpan metadata buku dan pengaturan publish sebelum mengirim hasilnya ke viewer flipbook.
          </p>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Book title</span>
              <input readOnly value={bookTitle} className="settings-control" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Author</span>
              <input readOnly value={author} className="settings-control" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Publish slug</span>
              <input readOnly value={publishSlug} className="settings-control" />
            </label>
          </div>
        </section>
        <aside className="panel-card">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Actions</p>
          <div className="mt-4 grid gap-3">
            <button type="button" onClick={onOpenCreate} className="btn-primary justify-center">
              <FiSettings /> Update in editor
            </button>
            <button type="button" onClick={() => onSelectMenu('dashboard')} className="btn-secondary justify-center">
              <FiHome /> Back to dashboard
            </button>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="panel-card">
      <h1 className="text-3xl font-black tracking-tight text-slate-950">{summary.title}</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">{summary.description}</p>
      <button type="button" onClick={onOpenCreate} className="mt-5 btn-primary">
        <FiPlus /> Open editor
      </button>
    </div>
  );
}

const textElementTypes = ['heading', 'text', 'label', 'button', 'link'];

const defaultTypography = {
  heading: { fontSize: 32, fontWeight: 700, lineHeight: 1.15, letterSpacing: 0, textAlign: 'left' },
  text: { fontSize: 16, fontWeight: 400, lineHeight: 1.55, letterSpacing: 0, textAlign: 'left' },
  label: { fontSize: 12, fontWeight: 700, lineHeight: 1.2, letterSpacing: 1, textAlign: 'center' },
  button: { fontSize: 13, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0.4, textAlign: 'center' },
  link: { fontSize: 13, fontWeight: 700, lineHeight: 1.25, letterSpacing: 0.2, textAlign: 'left' },
};

const defaultTransform = {
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createElement(type, x = 12, y = 12) {
  const base = { id: uid('el'), type, x, y, ...defaultTransform };

  if (type === 'heading') {
    return { ...base, w: 58, h: 13, text: 'New section title' };
  }

  if (type === 'image') {
    return { ...base, w: 38, h: 28, text: '', src: '' };
  }

  if (type === 'label') {
    return { ...base, w: 30, h: 8, text: 'FEATURED' };
  }

  if (type === 'line') {
    return { ...base, w: 34, h: 3, text: '', lineColor: '#1f3d2e', lineWidth: 2 };
  }

  if (type === 'link') {
    return { ...base, w: 36, h: 10, text: 'https://diworkin.com', href: 'https://diworkin.com' };
  }

  if (type === 'shape') {
    return { ...base, w: 34, h: 18, text: '' };
  }

  if (type === 'circle') {
    return { ...base, w: 22, h: 22, text: '', shapeColor: '#cfe8d5' };
  }

  if (type === 'diamond') {
    return { ...base, w: 22, h: 22, text: '', shapeColor: '#dbeafe' };
  }

  if (type === 'triangle') {
    return { ...base, w: 24, h: 22, text: '', shapeColor: '#fde68a' };
  }

  if (type === 'pill') {
    return { ...base, w: 36, h: 14, text: '', shapeColor: '#c7d2fe' };
  }

  if (type === 'hexagon') {
    return { ...base, w: 24, h: 22, text: '', shapeColor: '#fecaca' };
  }

  if (type === 'button') {
    return { ...base, w: 28, h: 9, text: 'Learn More' };
  }

  if (type === 'video') {
    return { ...base, w: 44, h: 28, text: 'Product walkthrough', poster: '' };
  }

  if (type === 'audio') {
    return { ...base, w: 38, h: 12, text: 'Chapter narration', source: '' };
  }

  if (type === 'gallery') {
    return { ...base, w: 44, h: 30, text: 'Gallery', items: [] };
  }

  if (type === 'embed') {
    return { ...base, w: 46, h: 28, text: '<iframe />', source: 'https://example.com' };
  }

  if (type === 'table') {
    return { ...base, w: 42, h: 24, text: 'Table', rows: 4, columns: 3 };
  }

  if (type === 'chart') {
    return { ...base, w: 38, h: 24, text: 'Chart', values: [20, 48, 36, 54] };
  }

  if (type === 'map') {
    return { ...base, w: 40, h: 24, text: 'Map pin', location: 'Jakarta' };
  }

  if (type === 'qr') {
    return { ...base, w: 18, h: 18, text: 'QR', value: 'https://diworkin.com' };
  }

  return { ...base, w: 54, h: 18, text: 'Write body copy for this ebook page.' };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function typographyStyle(element, fallbackFontFamily) {
  const defaults = defaultTypography[element.type] || defaultTypography.text;
  return {
    fontFamily: element.fontFamily || fallbackFontFamily,
    fontSize: `${element.fontSize ?? defaults.fontSize}px`,
    fontWeight: element.fontWeight ?? defaults.fontWeight,
    lineHeight: element.lineHeight ?? defaults.lineHeight,
    letterSpacing: `${element.letterSpacing ?? defaults.letterSpacing}px`,
    textAlign: element.textAlign || defaults.textAlign,
  };
}

function textContentStyle(element, fallbackFontFamily, previewMode = false) {
  const textStyle = typographyStyle(element, fallbackFontFamily);
  const align = textStyle.textAlign || 'left';
  const maxWidth =
    element.type === 'heading'
      ? previewMode
        ? '34ch'
        : '36ch'
      : element.type === 'text'
        ? previewMode
          ? '40ch'
          : '42ch'
        : element.type === 'label' || element.type === 'button' || element.type === 'link'
          ? 'fit-content'
          : previewMode
            ? '36ch'
            : '38ch';

  return {
    ...textStyle,
    display: 'inline-block',
    width: 'fit-content',
    maxWidth,
    boxSizing: 'border-box',
    padding:
      element.type === 'heading'
        ? previewMode
          ? '0.55rem 0.9rem'
          : '0.7rem 1.05rem'
        : element.type === 'text'
          ? previewMode
            ? '1rem 1.35rem'
            : '1.15rem 1.5rem'
        : element.type === 'label' || element.type === 'button' || element.type === 'link'
          ? previewMode
            ? '0.2rem 0.55rem'
            : '0.3rem 0.7rem'
          : previewMode
            ? '0.35rem 0.7rem'
            : '0.45rem 0.85rem',
    whiteSpace: 'pre-wrap',
    textAlign: align,
  };
}

function getElementPreviewContent(element) {
  switch (element.type) {
    case 'image':
      return element.src ? <img src={element.src} alt={element.text || 'Asset'} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400"><FiImage /></div>;
    case 'shape':
      return <span className="block h-full w-full bg-[#cfe8d5]" />;
    case 'circle':
      return <span className="block h-full w-full rounded-full" style={{ background: element.shapeColor || '#cfe8d5' }} />;
    case 'diamond':
      return <span className="block h-full w-full rotate-45 scale-[0.72]" style={{ background: element.shapeColor || '#dbeafe' }} />;
    case 'triangle':
      return (
        <span
          className="block h-full w-full"
          style={{
            background: element.shapeColor || '#fde68a',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          }}
        />
      );
    case 'pill':
      return <span className="block h-full w-full rounded-full" style={{ background: element.shapeColor || '#c7d2fe' }} />;
    case 'hexagon':
      return (
        <span
          className="block h-full w-full"
          style={{
            background: element.shapeColor || '#fecaca',
            clipPath: 'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)',
          }}
        />
      );
    case 'line':
      return <span className="block h-full w-full rounded-full bg-[#1f3d2e]" style={{ height: `${element.lineWidth ?? 2}px`, background: element.lineColor || '#1f3d2e' }} />;
    case 'button':
      return (
        <span className="flex h-full w-full items-center justify-between gap-2 rounded-[inherit] bg-[#1f3d2e] px-4 py-3 text-white">
          <span className="truncate">{element.text}</span>
          <FiArrowRight className="shrink-0" />
        </span>
      );
    case 'link':
      return (
        <span className="flex h-full w-full items-center gap-2 px-4 py-3 text-[#1f3d2e] underline decoration-[#1f3d2e]/30 underline-offset-4">
          <FiLink className="shrink-0" />
          <span className="truncate">{element.text}</span>
        </span>
      );
    case 'video':
      return (
        <div className="grid h-full w-full place-items-center bg-slate-950 text-white">
          <span className="grid gap-2 text-center text-xs font-bold uppercase tracking-[0.2em]">
            <FiVideo className="mx-auto text-2xl" />
            Video
          </span>
        </div>
      );
    case 'audio':
      return (
        <div className="grid h-full w-full place-items-center bg-[#f5f7f3] text-slate-800">
          <span className="grid gap-2 text-center text-xs font-bold uppercase tracking-[0.2em]">
            <FiMusic className="mx-auto text-2xl text-[#1f3d2e]" />
            Audio
          </span>
        </div>
      );
    case 'gallery':
      return (
        <div className="grid h-full w-full grid-cols-2 gap-2 bg-[#eef3ea] p-3">
          <div className="rounded-lg bg-white/90" />
          <div className="rounded-lg bg-[#d8e6d7]" />
          <div className="rounded-lg bg-[#cfe8d5]" />
          <div className="grid place-items-center rounded-lg bg-white/90 text-[#1f3d2e]">
            <FiImage />
          </div>
        </div>
      );
    case 'embed':
      return (
        <div className="grid h-full w-full place-items-center rounded-[inherit] bg-slate-900 text-white">
          <span className="grid gap-2 text-center text-xs font-bold uppercase tracking-[0.2em]">
            <FiCode className="mx-auto text-2xl" />
            Embed
          </span>
        </div>
      );
    case 'table':
      return (
        <div className="grid h-full w-full grid-cols-3 grid-rows-4 gap-px bg-slate-300 p-px">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className={`${index < 3 ? 'bg-[#1f3d2e] text-white' : 'bg-white'}`} />
          ))}
        </div>
      );
    case 'chart':
      return (
        <div className="flex h-full w-full items-end gap-2 bg-white px-4 py-3">
          {[22, 50, 34, 62].map((height, index) => (
            <div key={index} className="flex-1 rounded-t-lg bg-[#1f3d2e]/80" style={{ height: `${height}%` }} />
          ))}
        </div>
      );
    case 'map':
      return (
        <div className="grid h-full w-full place-items-center bg-[#eef6ef] text-[#1f3d2e]">
          <span className="grid gap-1 text-center text-xs font-bold uppercase tracking-[0.2em]">
            <FiMapPin className="mx-auto text-2xl" />
            Map
          </span>
        </div>
      );
    case 'qr':
      return (
        <div className="grid h-full w-full grid-cols-4 gap-1 bg-white p-2">
          {Array.from({ length: 16 }).map((_, index) => (
            <span key={index} className={`rounded-[2px] ${index % 3 === 0 || index % 5 === 0 ? 'bg-slate-950' : 'bg-slate-200'}`} />
          ))}
        </div>
      );
    default:
      return (
        <span
          className={`block p-4 ${
            element.type === 'heading'
              ? 'leading-tight'
              : element.type === 'label' || element.type === 'button'
                ? 'uppercase'
                : ''
          }`}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {element.text}
        </span>
      );
  }
}

function isTextElement(type) {
  return ['heading', 'text', 'label', 'button', 'link'].includes(type);
}

function elementTransformStyle(element) {
  const rotation = element.rotation ?? defaultTransform.rotation;
  const scaleX = element.scaleX ?? defaultTransform.scaleX;
  const scaleY = element.scaleY ?? defaultTransform.scaleY;

  return {
    transform: `rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`,
    transformOrigin: element.transformOrigin || 'center center',
  };
}

function elementBoxStyle(element) {
  if (isTextElement(element.type)) {
    return {
      width: 'fit-content',
      height: 'fit-content',
      minWidth: 'unset',
      minHeight: 'unset',
      display: 'inline-block',
    };
  }

  return {
    width: `${element.w}%`,
    height: `${element.h}%`,
  };
}

function App() {
  const [bookTitle, setBookTitle] = useState('Diworkin Growth Playbook');
  const [author, setAuthor] = useState('Diworkin Studio');
  const [publishSlug, setPublishSlug] = useState('growth-playbook');
  const [activeInspectorTab, setActiveInspectorTab] = useState('pages');
  const [activeSidebarMenu, setActiveSidebarMenu] = useState('create');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pageLayout, setPageLayout] = useState('single');
  const [pages, setPages] = useState(initialPages);
  const [activePageId, setActivePageId] = useState(initialPages[0].id);
  const [selectedElementId, setSelectedElementId] = useState(initialPages[0].elements[0].id);
  const [notice, setNotice] = useState('Draft ready');
  const [draggingElementId, setDraggingElementId] = useState(null);
  const [dragSession, setDragSession] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const canvasRef = useRef(null);
  const [transformSession, setTransformSession] = useState(null);
  const historyPastRef = useRef([]);
  const historyFutureRef = useRef([]);
  const [historyTick, setHistoryTick] = useState(0);
  const [canvasZoom, setCanvasZoom] = useState(78);

  const activeIndex = pages.findIndex((page) => page.id === activePageId);
  const activePage = pages[activeIndex] || pages[0];
  const selectedElement = activePage?.elements.find((item) => item.id === selectedElementId);
  const selectedElementTypography = selectedElement ? defaultTypography[selectedElement.type] || defaultTypography.text : defaultTypography.text;
  const selectedElementTransform = selectedElement || defaultTransform;
  const canEditTypography = selectedElement && textElementTypes.includes(selectedElement.type);
  const canEditTransform = Boolean(selectedElement);
  const defaultFont = fontOptions[0];
  const viewerUrl = `https://ebook.diworkin.com/${publishSlug || 'viewer'}`;
  const currentPageIndex = Math.max(0, activeIndex);
  const zoomLabel = `${canvasZoom}%`;

  const captureSnapshot = () =>
    JSON.parse(
      JSON.stringify({
        bookTitle,
        author,
        publishSlug,
        activeInspectorTab,
        activeSidebarMenu,
        sidebarCollapsed,
        pageLayout,
        pages,
        activePageId,
        selectedElementId,
      }),
    );

  const applySnapshot = (snapshot) => {
    if (!snapshot) return;
    setBookTitle(snapshot.bookTitle);
    setAuthor(snapshot.author);
    setPublishSlug(snapshot.publishSlug);
    setActiveInspectorTab(snapshot.activeInspectorTab);
    setActiveSidebarMenu(snapshot.activeSidebarMenu);
    setSidebarCollapsed(Boolean(snapshot.sidebarCollapsed));
    setPageLayout(snapshot.pageLayout || 'single');
    setPages(snapshot.pages || []);
    setActivePageId(snapshot.activePageId);
    setSelectedElementId(snapshot.selectedElementId);
  };

  const pushHistory = () => {
    historyPastRef.current = [...historyPastRef.current, captureSnapshot()];
    historyFutureRef.current = [];
    setHistoryTick((value) => value + 1);
  };

  const handleUndo = () => {
    const previous = historyPastRef.current.pop();
    if (!previous) {
      setNotice('Nothing to undo');
      return;
    }
    historyFutureRef.current = [captureSnapshot(), ...historyFutureRef.current];
    applySnapshot(previous);
    setHistoryTick((value) => value + 1);
    setNotice('Undo');
  };

  const handleRedo = () => {
    const next = historyFutureRef.current.shift();
    if (!next) {
      setNotice('Nothing to redo');
      return;
    }
    historyPastRef.current = [...historyPastRef.current, captureSnapshot()];
    applySnapshot(next);
    setHistoryTick((value) => value + 1);
    setNotice('Redo');
  };

  const updateActivePage = (updater, options = { recordHistory: true }) => {
    if (options.recordHistory) {
      pushHistory();
    }
    setPages((current) => current.map((page) => (page.id === activePage.id ? updater(page) : page)));
  };

  const updateSelectedElement = (patch, options = { recordHistory: true }) => {
    if (!selectedElement) return;
    updateElementById(selectedElement.id, patch, options);
  };

  const updateElementById = (elementId, patch, options = { recordHistory: true }) => {
    updateActivePage(
      (page) => ({
        ...page,
        elements: page.elements.map((item) => (item.id === elementId ? { ...item, ...patch } : item)),
      }),
      options,
    );
  };

  const updateTypography = (patch) => {
    if (!canEditTypography) return;
    updateSelectedElement(patch);
    setNotice('Typography updated');
  };

  const updateTransform = (patch) => {
    if (!canEditTransform) return;
    updateSelectedElement(patch);
    setNotice('Transform updated');
  };

  const startTransformSession = (mode, element, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + ((element.x + element.w / 2) / 100) * rect.width;
    const centerY = rect.top + ((element.y + element.h / 2) / 100) * rect.height;
    const pointerX = event.clientX;
    const pointerY = event.clientY;
    const startAngle = Math.atan2(pointerY - centerY, pointerX - centerX);
    const widthPx = Math.max(12, rect.width * ((element.w || 1) / 100));
    const heightPx = Math.max(12, rect.height * ((element.h || 1) / 100));

    setTransformSession({
      elementId: element.id,
      mode,
      centerX,
      centerY,
      startAngle,
      startPointerX: pointerX,
      startPointerY: pointerY,
      startRotation: element.rotation ?? defaultTransform.rotation,
      startScaleX: element.scaleX ?? defaultTransform.scaleX,
      startScaleY: element.scaleY ?? defaultTransform.scaleY,
      startWidthPx: widthPx,
      startHeightPx: heightPx,
      aspectRatio: widthPx / heightPx,
      handle: event.currentTarget.dataset.handle || 'br',
    });
  };

  useEffect(() => {
    if (!transformSession) return undefined;

    const updateTransformFromPointer = (event) => {
      if (transformSession.mode === 'rotate') {
        const angle = Math.atan2(event.clientY - transformSession.centerY, event.clientX - transformSession.centerX);
        const rotation = transformSession.startRotation + ((angle - transformSession.startAngle) * 180) / Math.PI;
        updateElementById(transformSession.elementId, { rotation: Number(rotation.toFixed(1)) }, { recordHistory: false });
      }

      if (transformSession.mode === 'scale') {
        const handle = transformSession.handle || 'br';
        const directionX = handle.includes('l') ? -1 : 1;
        const directionY = handle.includes('t') ? -1 : 1;
        const deltaX = (event.clientX - transformSession.startPointerX) * directionX;
        const deltaY = (event.clientY - transformSession.startPointerY) * directionY;
        const widthFactor = (transformSession.startWidthPx + deltaX) / transformSession.startWidthPx;
        const heightFactor = (transformSession.startHeightPx + deltaY) / transformSession.startHeightPx;
        const dominantFactor = clamp(Math.max(widthFactor, heightFactor), 0.25, 3);
        const scaleX = clamp(transformSession.startScaleX * dominantFactor, 0.25, 3);
        const scaleY = clamp(transformSession.startScaleY * dominantFactor, 0.25, 3);
        updateElementById(
          transformSession.elementId,
          {
            scaleX: Number(scaleX.toFixed(2)),
            scaleY: Number(scaleY.toFixed(2)),
          },
          { recordHistory: false },
        );
      }
    };

    const endTransform = () => setTransformSession(null);

    window.addEventListener('pointermove', updateTransformFromPointer);
    window.addEventListener('pointerup', endTransform);
    window.addEventListener('pointercancel', endTransform);

    return () => {
      window.removeEventListener('pointermove', updateTransformFromPointer);
      window.removeEventListener('pointerup', endTransform);
      window.removeEventListener('pointercancel', endTransform);
    };
  }, [transformSession]);

  useEffect(() => {
    if (!dragSession || !canvasRef.current) return undefined;

    const updateDragFromPointer = (event) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const current = activePage.elements.find((item) => item.id === dragSession.elementId);
      if (!current) return;

      const nextX = clamp(((event.clientX - rect.left - dragSession.offsetX) / rect.width) * 100, 0, 100 - (current.w || 0));
      const nextY = clamp(((event.clientY - rect.top - dragSession.offsetY) / rect.height) * 100, 0, 100 - (current.h || 0));
      updateActivePage(
        (page) => ({
          ...page,
          elements: page.elements.map((item) => (item.id === dragSession.elementId ? { ...item, x: nextX, y: nextY } : item)),
        }),
        { recordHistory: false },
      );
    };

    const endDrag = () => {
      setDragSession(null);
      setDraggingElementId(null);
    };

    window.addEventListener('pointermove', updateDragFromPointer);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    return () => {
      window.removeEventListener('pointermove', updateDragFromPointer);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [dragSession, activePage.elements]);

  const addPage = () => {
    pushHistory();
    const next = {
      id: uid('page'),
      name: `Page ${pages.length + 1}`,
      background: '#f8fafc',
      elements: [createElement('heading', 10, 12), createElement('text', 10, 30)],
    };
    setPages((current) => [...current, next]);
    setActivePageId(next.id);
    setSelectedElementId(next.elements[0].id);
  };

  const goToPage = (pageIndex) => {
    const nextIndex = clamp(pageIndex, 0, pages.length - 1);
    const nextPage = pages[nextIndex];
    if (!nextPage) return;
    setActivePageId(nextPage.id);
    setSelectedElementId(nextPage.elements[0]?.id || '');
  };

  const goPrevPage = () => {
    goToPage(currentPageIndex - 1);
  };

  const goNextPage = () => {
    goToPage(currentPageIndex + 1);
  };

  const deletePage = () => {
    if (pages.length === 1) return;
    pushHistory();
    const remaining = pages.filter((page) => page.id !== activePage.id);
    setPages(remaining);
    setActivePageId(remaining[0].id);
    setSelectedElementId(remaining[0].elements[0]?.id || '');
  };

  const addElementAt = (type, clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = rect ? clamp(((clientX - rect.left) / rect.width) * 100, 2, 82) : 12;
    const y = rect ? clamp(((clientY - rect.top) / rect.height) * 100, 2, 86) : 12;
    const element = createElement(type, x, y);
    updateActivePage((page) => ({ ...page, elements: [...page.elements, element] }));
    setSelectedElementId(element.id);
  };

  const addImageFileAt = (file, clientX = 260, clientY = 220) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      const x = rect ? clamp(((clientX - rect.left) / rect.width) * 100, 2, 62) : 30;
      const y = rect ? clamp(((clientY - rect.top) / rect.height) * 100, 2, 70) : 34;
      const element = { ...createElement('image', x, y), src: String(reader.result || ''), text: file.name };
      updateActivePage((page) => ({ ...page, elements: [...page.elements, element] }));
      setSelectedElementId(element.id);
      setNotice('Asset added to page');
    };
    reader.readAsDataURL(file);
  };

  const onCanvasDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      addImageFileAt(file, event.clientX, event.clientY);
      return;
    }

    const type = event.dataTransfer.getData('application/diworkin-element');
    if (type) {
      addElementAt(type, event.clientX, event.clientY);
    }
  };

  const removeSelectedElement = () => {
    if (!selectedElement) return;
    updateActivePage((page) => ({
      ...page,
      elements: page.elements.filter((item) => item.id !== selectedElement.id),
    }));
    setSelectedElementId('');
  };

  const handleAssetUpload = (event) => {
    const file = event.target.files?.[0];
    addImageFileAt(file);
  };

  const exportConfig = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            title: bookTitle,
            author,
            typography: defaultFont.name,
            pages,
            viewerUrl,
            exportedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${publishSlug || 'ebook'}-builder.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice('Builder config exported');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(viewerUrl);
      setNotice('Viewer link copied');
    } catch {
      setNotice(viewerUrl);
    }
  };

  const shareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: bookTitle,
          text: `Open ${bookTitle}`,
          url: viewerUrl,
        });
        setNotice('Viewer link shared');
        return;
      }
      await copyLink();
    } catch {
      setNotice('Share cancelled');
    }
  };

  const handleSidebarMenu = (key) => {
    setActiveSidebarMenu(key);
    if (key === 'books' || key === 'layouts') {
      setActiveInspectorTab('pages');
    }
    if (key === 'text' || key === 'settings') {
      setActiveInspectorTab('properties');
    }
    if (key === 'media') {
      setNotice('Drag an image onto the canvas or use Image element');
      return;
    }
    if (key === 'create') {
      addPage();
      setNotice('New page added');
      return;
    }
    setNotice(sidebarMessages[key] || 'Menu selected');
  };

  const addToolbarElement = (type) => {
    addElementAt(type, 260, 220);
    setNotice(`${type} element added`);
  };

  const setZoom = (nextZoom) => {
    const clamped = clamp(nextZoom, 60, 140);
    setCanvasZoom(clamped);
    setNotice(`Canvas zoom ${clamped}%`);
  };

  if (activeSidebarMenu !== 'create') {
    return (
      <main className="min-h-screen bg-[#f6f4ee] text-slate-950">
        <div
          className="grid min-h-screen gap-5 p-4"
          style={{ gridTemplateColumns: sidebarCollapsed ? '96px minmax(0,1fr)' : '292px minmax(0,1fr)' }}
        >
          <aside className={`hidden min-h-0 shrink-0 flex-col rounded-[2rem] border border-white/70 bg-white p-4 shadow-[0_30px_100px_rgba(15,23,42,0.12)] lg:flex ${sidebarCollapsed ? 'items-center' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
                  <img src="/diworkin-mark-dark.png" alt="Diworkin" className="h-full w-full object-contain" />
                </div>
                {!sidebarCollapsed ? (
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-slate-950">Diworkin</p>
                    <p className="text-sm text-slate-500">Ebook studio</p>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((value) => !value)}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100"
                title="Collapse sidebar"
              >
                <FiList className="h-5 w-5" />
              </button>
            </div>

            {!sidebarCollapsed ? (
              <div className="mt-4 flex items-center justify-between rounded-[1.4rem] bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <span>Workspace</span>
                <span className="font-medium text-slate-900">Diworkin</span>
              </div>
            ) : null}

            <nav className="mt-5 space-y-2">
              {sidebarNavItems.map(({ key, label, icon: Icon }) => {
                const active = activeSidebarMenu === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSidebarMenu(key)}
                    className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                      active
                        ? 'bg-[#1f3d2e] text-white shadow-[0_14px_30px_rgba(31,61,46,0.22)]'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                    }`}
                  >
                    <span className={`grid h-10 w-10 place-items-center rounded-2xl ${active ? 'bg-white/10' : 'bg-slate-50'}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    {!sidebarCollapsed ? <span className="text-sm font-medium">{label}</span> : null}
                  </button>
                );
              })}
            </nav>

            {!sidebarCollapsed ? (
              <div className="mt-auto grid gap-4">
                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Studio</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Builder</span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Ready</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Pages</span>
                      <span className="font-medium text-slate-900">{pages.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Default font</span>
                      <span className="font-medium text-slate-900">{defaultFont.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>

          <section className="grid min-w-0 grid-rows-[82px_minmax(0,1fr)]">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-950">{workspaceSummaries[activeSidebarMenu]?.title || 'Workspace'}</h1>
                  <button type="button" onClick={() => setActiveSidebarMenu('create')} className="text-slate-400 transition hover:text-slate-900" title="Back to editor">
                    <FiSettings className="text-slate-400" />
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span className="grid h-4 w-4 place-items-center rounded-full border border-[#16a34a] text-[10px] text-[#16a34a]">
                    <FiCheck className="h-2.5 w-2.5" />
                  </span>
                  <span>{notice}</span>
                </div>
              </div>

            <div className="hidden items-center gap-8 text-xs text-slate-500 md:flex">
              <button type="button" onClick={handleUndo} disabled={historyPastRef.current.length === 0} className="grid gap-1 text-center hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300">
                <FiChevronLeft className="mx-auto rotate-45 text-lg" />
                Undo
              </button>
              <button type="button" onClick={handleRedo} disabled={historyFutureRef.current.length === 0} className="grid gap-1 text-center hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300">
                <FiChevronRight className="mx-auto -rotate-45 text-lg" />
                Redo
              </button>
            </div>

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setActiveSidebarMenu('create')} className="btn-secondary">
                  <FiBookOpen /> Open editor
                </button>
                <button type="button" onClick={() => setNotice('Settings page saved')} className="btn-primary">
                  <FiSave /> Save
                </button>
              </div>
            </header>

            <div className="min-h-0 overflow-auto p-4 lg:p-6">
              <WorkspacePage
                menu={activeSidebarMenu}
                pages={pages}
                bookTitle={bookTitle}
                author={author}
                publishSlug={publishSlug}
                defaultFontName={defaultFont.name}
                onOpenCreate={() => setActiveSidebarMenu('create')}
                onOpenPreview={() => setShowPreview(true)}
                onSelectMenu={handleSidebarMenu}
              />
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-slate-950">
      <div
        className="grid min-h-screen gap-5 p-4"
        style={{ gridTemplateColumns: sidebarCollapsed ? '96px minmax(0,1fr)' : '292px minmax(0,1fr)' }}
      >
        <aside className={`hidden min-h-0 shrink-0 flex-col rounded-[2rem] border border-white/70 bg-white p-4 shadow-[0_30px_100px_rgba(15,23,42,0.12)] lg:flex ${sidebarCollapsed ? 'items-center' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
                <img src="/diworkin-mark-dark.png" alt="Diworkin" className="h-full w-full object-contain" />
              </div>
              {!sidebarCollapsed ? (
                <div>
                  <p className="text-lg font-semibold tracking-tight text-slate-950">Diworkin</p>
                  <p className="text-sm text-slate-500">Ebook studio</p>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100"
              title="Collapse sidebar"
            >
              <FiList className="h-5 w-5" />
            </button>
          </div>

          {!sidebarCollapsed ? (
            <div className="mt-4 flex items-center justify-between rounded-[1.4rem] bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <span>Workspace</span>
              <span className="font-medium text-slate-900">Diworkin</span>
            </div>
          ) : null}

          <nav className="mt-5 space-y-2">
            {sidebarNavItems.map(({ key, label, icon: Icon }) => {
              const active = activeSidebarMenu === key;
              return (
              <button
                key={key}
                type="button"
                onClick={() => handleSidebarMenu(key)}
                className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  active
                    ? 'bg-[#1f3d2e] text-white shadow-[0_14px_30px_rgba(31,61,46,0.22)]'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className={`grid h-10 w-10 place-items-center rounded-2xl ${active ? 'bg-white/10' : 'bg-slate-50'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                    {!sidebarCollapsed ? <span className="text-sm font-medium">{label}</span> : null}
                  </button>
                );
              })}
            </nav>

            {!sidebarCollapsed ? (
              <div className="mt-auto grid gap-4">
                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Studio</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Builder</span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Ready</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Pages</span>
                      <span className="font-medium text-slate-900">{pages.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Default font</span>
                      <span className="font-medium text-slate-900">{defaultFont.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>

        <section className="grid min-w-0 grid-rows-[82px_minmax(0,1fr)]">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
            <div>
              <div className="flex items-center gap-2">
                <input
                  value={bookTitle}
                  onChange={(event) => setBookTitle(event.target.value)}
                  className="w-48 bg-transparent text-lg font-bold text-slate-950 outline-none"
                />
                <button type="button" onClick={() => setActiveInspectorTab('properties')} className="text-slate-400 transition hover:text-slate-900" title="Open properties">
                  <FiSettings className="text-slate-400" />
                </button>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span className="grid h-4 w-4 place-items-center rounded-full border border-[#16a34a] text-[10px] text-[#16a34a]"><FiCheck className="h-2.5 w-2.5" /></span>
                <span>{notice}</span>
              </div>
            </div>

            <div className="hidden items-center gap-8 text-xs text-slate-500 md:flex">
              <button type="button" className="grid gap-1 text-center hover:text-slate-900">
                <FiChevronLeft className="mx-auto rotate-45 text-lg text-slate-900" />
                Undo
              </button>
              <button type="button" className="grid gap-1 text-center text-slate-300">
                <FiChevronRight className="mx-auto -rotate-45 text-lg" />
                Redo
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowPreview(true)} className="btn-secondary">
                <FiBookOpen /> Preview
              </button>
              <button type="button" onClick={() => setNotice('Builder draft saved')} className="btn-secondary">
                <FiSave /> Save
              </button>
              <button type="button" onClick={exportConfig} className="btn-primary">
                <FiUploadCloud /> Export
              </button>
              <button type="button" onClick={copyLink} className="icon-btn hidden lg:grid" title="Copy viewer link">
                <FiCopy />
              </button>
              <button type="button" onClick={shareLink} className="icon-btn hidden lg:grid" title="Share viewer link">
                <FiShare2 />
              </button>
              <button type="button" onClick={exportConfig} className="icon-btn hidden lg:grid" title="Download config">
                <FiDownload />
              </button>
              <button type="button" onClick={() => setNotice('Help: drag items onto the canvas, then use Properties to edit them.')} className="icon-btn hidden lg:grid" title="Help">
                <FiHelpCircle />
              </button>
              <button type="button" onClick={() => setNotice('Notifications are not connected yet.')} className="icon-btn hidden lg:grid" title="Notifications">
                <FiBell />
              </button>
              <div className="hidden items-center gap-3 lg:flex">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#1f4b7d] text-lg font-bold text-white">D</span>
                <div>
                  <p className="text-sm font-bold">Dworkin</p>
                  <p className="text-xs font-medium text-[#16a34a]">Premium Plan</p>
                </div>
              </div>
            </div>
          </header>

          <div className="grid min-h-0 gap-5 p-4 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
            <aside className="hidden min-h-0 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)] xl:block">
              <h2 className="text-lg font-bold">Add Elements</h2>
              <div className="mt-6 grid gap-7">
                {elementGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-3 text-xs font-bold uppercase text-slate-500">{group.label}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {group.items.map(({ type, label, icon: Icon }) => (
                        <button
                          key={type}
                          type="button"
                          draggable
                          onDragStart={(event) => event.dataTransfer.setData('application/diworkin-element', type)}
                          onClick={() => addElementAt(type, 260, 220)}
                          className="grid h-[92px] place-items-center rounded-xl border border-slate-200 bg-white text-center text-sm font-medium text-slate-700 transition hover:border-[#24a84f] hover:bg-[#f5fbf7]"
                        >
                          <span className="grid gap-2">
                            <Icon className="mx-auto text-3xl text-slate-800" />
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <section id="builder" className="grid min-w-0 grid-rows-[70px_minmax(0,1fr)_74px]">
              <div className="mx-auto flex w-full max-w-[860px] items-center justify-between rounded-xl border border-slate-200 bg-white px-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
              <div className="flex gap-5">
                {paletteItems.map(({ type, label, icon: Icon }, index) => (
                    <button
                      key={type}
                      type="button"
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData('application/diworkin-element', type)}
                      onClick={() => addElementAt(type, 260, 220)}
                      className={`grid h-12 min-w-12 place-items-center rounded-xl px-3 text-xs font-medium ${
                        index === 0 ? 'border border-[#24a84f] bg-[#f5fbf7] text-[#15803d]' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="text-xl" />
                      <span className="mt-1">{label}</span>
                    </button>
                  ))}
                  <button type="button" onClick={() => addToolbarElement('line')} className="grid h-12 min-w-12 place-items-center rounded-xl px-3 text-xs font-medium text-slate-500 hover:bg-slate-50">
                    <FiMinus className="text-xl" />
                    <span className="mt-1">Line</span>
                  </button>
                  <button type="button" onClick={() => addToolbarElement('link')} className="grid h-12 min-w-12 place-items-center rounded-xl px-3 text-xs font-medium text-slate-500 hover:bg-slate-50">
                    <FiLink className="text-xl" />
                    <span className="mt-1">Link</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xl text-slate-600">
                  <button type="button" onClick={() => setActiveInspectorTab('pages')} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-50" title="Pages">
                    <FiList />
                  </button>
                  <button type="button" onClick={() => setActiveInspectorTab('properties')} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-50" title="Properties">
                    <FiFileText />
                  </button>
                  <button type="button" onClick={removeSelectedElement} className="hover:text-rose-600"><FiTrash2 /></button>
                </div>
              </div>

              <div className="relative grid min-h-0 place-items-center overflow-hidden px-10 py-8">
                <button type="button" onClick={goPrevPage} disabled={currentPageIndex <= 0} className="absolute left-2 top-1/2 hidden h-14 w-14 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-2xl shadow-[0_16px_30px_rgba(15,23,42,0.10)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:grid" title="Previous page">
                  <FiChevronLeft />
                </button>
                <div
                  className="overflow-hidden"
                  style={{
                    transform: `scale(${canvasZoom / 100})`,
                    transformOrigin: 'center center',
                    width: `${100 / (canvasZoom / 100)}%`,
                  }}
                >
                  <div
                    ref={canvasRef}
                    onDrop={onCanvasDrop}
                    onDragOver={(event) => event.preventDefault()}
                    className={`relative ${pageLayout === 'spread' ? 'aspect-[4/3]' : 'aspect-[3/4]'} h-full max-h-[820px] min-h-[520px] overflow-hidden bg-white shadow-[0_8px_26px_rgba(15,23,42,0.22)]`}
                    style={{ background: activePage.background, fontFamily: defaultFont.family }}
                  >
                    <div className="absolute left-10 top-10 rounded-full bg-[#1f3d2e] px-3 py-1 text-xs font-bold uppercase text-white">{author}</div>
                    {activePage.elements.map((element) => (
                      <EditableElement
                        key={element.id}
                        element={element}
                        active={element.id === selectedElementId}
                        fallbackFontFamily={defaultFont.family}
                        onSelect={() => setSelectedElementId(element.id)}
                        onDragStart={(event) => {
                          setSelectedElementId(element.id);
                          setDraggingElementId(element.id);
                          const elementRect = event.currentTarget.getBoundingClientRect();
                          setDragSession({
                            elementId: element.id,
                            offsetX: event.clientX - elementRect.left,
                            offsetY: event.clientY - elementRect.top,
                          });
                        }}
                        onRotateStart={(event) => startTransformSession('rotate', element, event)}
                        onScaleStart={(event) => startTransformSession('scale', element, event)}
                      />
                    ))}
                  </div>
                </div>
                <button type="button" onClick={goNextPage} disabled={currentPageIndex >= pages.length - 1} className="absolute right-2 top-1/2 hidden h-14 w-14 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-2xl shadow-[0_16px_30px_rgba(15,23,42,0.10)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:grid" title="Next page">
                  <FiChevronRight />
                </button>
              </div>

              <div className="mx-auto flex w-full max-w-[860px] items-center justify-between gap-4">
                <button type="button" onClick={addPage} className="btn-secondary min-w-[160px] justify-center">
                  <FiPlus className="rounded-full bg-[#24a84f] p-1 text-2xl text-white" /> Add Page
                </button>
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <button type="button" onClick={goPrevPage} disabled={currentPageIndex <= 0} className="text-slate-600 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page">
                    <FiChevronLeft />
                  </button>
                  <input value={activeIndex + 1} readOnly className="h-10 w-20 rounded-lg border border-slate-200 text-center font-semibold outline-none" />
                  <span className="text-sm font-semibold text-slate-500">/ {pages.length}</span>
                  <button type="button" onClick={goNextPage} disabled={currentPageIndex >= pages.length - 1} className="text-slate-600 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page">
                    <FiChevronRight />
                  </button>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <button type="button" onClick={() => setZoom(canvasZoom - 8)} className="text-slate-600 transition hover:text-slate-900" aria-label="Zoom out">
                    <FiMinus />
                  </button>
                  <button type="button" onClick={() => setZoom(78)} className="min-w-12 text-center text-sm font-semibold text-slate-700" aria-label="Reset zoom">
                    {zoomLabel}
                  </button>
                  <button type="button" onClick={() => setZoom(canvasZoom + 8)} className="text-slate-600 transition hover:text-slate-900" aria-label="Zoom in">
                    <FiPlus />
                  </button>
                  <button type="button" onClick={() => setZoom(78)} className="text-slate-600 transition hover:text-slate-900" title="Reset zoom">
                    <FiMaximize />
                  </button>
                </div>
              </div>
            </section>

            <aside className="min-h-0 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
              <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                {[
                  ['pages', 'Pages', FiFileText],
                  ['properties', 'Properties', FiSliders],
                ].map(([tab, label, Icon]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveInspectorTab(tab)}
                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-bold transition ${
                      activeInspectorTab === tab
                        ? 'bg-white text-slate-950 shadow-[0_8px_18px_rgba(15,23,42,0.08)]'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon />
                    {label}
                  </button>
                ))}
              </div>

              {activeInspectorTab === 'pages' ? (
                <section className="min-h-0">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Pages</h2>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={deletePage} className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600">
                        <FiTrash2 /> Delete
                      </button>
                      <button type="button" onClick={addPage} className="inline-flex items-center gap-2 text-sm font-semibold text-[#159447]">
                        <FiPlus /> Add Blank Page
                      </button>
                    </div>
                  </div>
                  <div className="grid max-h-[720px] gap-4 overflow-auto pr-1">
                    {pages.map((page, index) => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => {
                          setActivePageId(page.id);
                          setSelectedElementId(page.elements[0]?.id || '');
                        }}
                        className="grid grid-cols-[1fr_28px] items-center gap-3 text-left"
                      >
                        <MiniPage page={page} active={page.id === activePage.id} fontFamily={defaultFont.family} />
                        <span className={`grid h-7 w-7 place-items-center rounded-md text-sm font-bold ${page.id === activePage.id ? 'bg-[#24a84f] text-white' : 'text-slate-700'}`}>
                          {index + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <section className="min-h-0 overflow-auto">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Properties</h2>
                    <span className="rounded-lg bg-[#f5fbf7] px-3 py-1 text-xs font-bold text-[#15803d]">Page</span>
                  </div>
                  <div className="grid gap-4">
                    <label className="settings-row">
                      <span className="inline-flex items-center gap-2"><FiMaximize /> Size</span>
                      <select className="settings-control" defaultValue="A4">
                        <option>A4 (210 x 297 mm)</option>
                        <option>Letter</option>
                        <option>Square</option>
                      </select>
                    </label>
                    <div className="settings-row">
                      <span className="inline-flex items-center gap-2"><FiBookOpen /> Layout</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPageLayout('single');
                            setNotice('Single page layout selected');
                          }}
                          className={`grid h-10 w-14 place-items-center rounded-lg border transition ${
                            pageLayout === 'single' ? 'border-[#24a84f] bg-[#f5fbf7] text-[#15803d]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <FiFileText />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPageLayout('spread');
                            setNotice('Spread layout selected');
                          }}
                          className={`grid h-10 w-14 place-items-center rounded-lg border transition ${
                            pageLayout === 'spread' ? 'border-[#24a84f] bg-[#f5fbf7] text-[#15803d]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <FiBookOpen />
                        </button>
                      </div>
                    </div>
                    <label className="settings-row">
                      <span className="inline-flex items-center gap-2"><FiSquare /> Fill</span>
                      <div className="settings-control flex items-center justify-between">
                        <input value={activePage.background.toUpperCase()} onChange={(event) => updateActivePage((page) => ({ ...page, background: event.target.value }))} className="w-24 bg-transparent outline-none" />
                        <span className="h-5 w-5 rounded border border-slate-200" style={{ background: activePage.background }} />
                      </div>
                    </label>
                    <label className="settings-row">
                      <span className="inline-flex items-center gap-2"><FiFileText /> Name</span>
                      <input className="settings-control" value={activePage.name} onChange={(event) => updateActivePage((page) => ({ ...page, name: event.target.value }))} />
                    </label>
                    <div className="border-t border-slate-100 pt-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="inline-flex items-center gap-2 text-sm font-bold uppercase text-slate-500">
                          <FiType /> Typography
                        </h3>
                        <span className="text-xs font-bold text-[#15803d]">{canEditTypography ? selectedElement.type : 'Select text'}</span>
                      </div>
                      {canEditTypography ? (
                      <div className="grid gap-4">
                        <label className="grid gap-2">
                          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-500"><FiFileText /> Content</span>
                          <textarea
                            value={selectedElement.text || ''}
                            onChange={(event) => updateSelectedElement({ text: event.target.value })}
                            className="min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-[#24a84f] focus:ring-4 focus:ring-green-100"
                          />
                        </label>
                        <div className="grid gap-3">
                          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-500"><FiType /> Font Family</span>
                        {fontOptions.map((font) => (
                          <button
                            key={font.name}
                            type="button"
                            onClick={() => {
                              updateTypography({ fontFamily: font.family, fontName: font.name });
                              setNotice(`${font.name} applied`);
                            }}
                            className={`rounded-xl border p-3 text-left transition ${
                              (selectedElement.fontName || defaultFont.name) === font.name
                                ? 'border-[#24a84f] bg-[#f5fbf7] ring-2 ring-[#cfe8d5]'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                            style={{ fontFamily: font.family }}
                          >
                            <span className="flex items-center justify-between gap-3">
                              <span className="text-sm font-bold text-slate-950">{font.name}</span>
                              <span className={`h-3 w-3 rounded-full border ${(selectedElement.fontName || defaultFont.name) === font.name ? 'border-[#24a84f] bg-[#24a84f]' : 'border-slate-300'}`} />
                            </span>
                            <span className="mt-2 block text-lg leading-tight text-slate-900">Aa The quick brand playbook</span>
                            <span className="mt-1 block text-xs text-slate-500">{font.sample}</span>
                          </button>
                        ))}
                        </div>
                        <div className="grid gap-2">
                          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-500"><FiAlignLeft /> Alignment</span>
                          <div className="grid grid-cols-4 gap-2">
                            {alignmentOptions.map(({ value, label, icon: Icon }) => (
                              <button
                                key={value}
                                type="button"
                                title={label}
                                onClick={() => updateTypography({ textAlign: value })}
                                className={`grid h-10 place-items-center rounded-lg border text-lg transition ${
                                  (selectedElement.textAlign || selectedElementTypography.textAlign) === value
                                    ? 'border-[#24a84f] bg-[#f5fbf7] text-[#15803d]'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <Icon />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="grid gap-2">
                            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-500"><FiType /> Size</span>
                            <input
                              type="number"
                              min="8"
                              max="96"
                              value={selectedElement.fontSize ?? selectedElementTypography.fontSize}
                              onChange={(event) => updateTypography({ fontSize: Number(event.target.value) })}
                              className="settings-control"
                            />
                          </label>
                          <label className="grid gap-2">
                            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-500"><FiSliders /> Weight</span>
                            <select
                              value={selectedElement.fontWeight ?? selectedElementTypography.fontWeight}
                              onChange={(event) => updateTypography({ fontWeight: Number(event.target.value) })}
                              className="settings-control"
                            >
                              {[300, 400, 500, 600, 700, 800].map((weight) => (
                                <option key={weight} value={weight}>{weight}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label className="grid gap-2">
                          <span className="inline-flex items-center justify-between gap-2 text-xs font-bold uppercase text-slate-500">
                            <span className="inline-flex items-center gap-2"><FiAlignJustify /> Line Height</span>
                            <span>{selectedElement.lineHeight ?? selectedElementTypography.lineHeight}</span>
                          </span>
                          <input
                            type="range"
                            min="0.8"
                            max="2.4"
                            step="0.05"
                            value={selectedElement.lineHeight ?? selectedElementTypography.lineHeight}
                            onChange={(event) => updateTypography({ lineHeight: Number(event.target.value) })}
                            className="w-full accent-[#24a84f]"
                          />
                        </label>
                        <label className="grid gap-2">
                          <span className="inline-flex items-center justify-between gap-2 text-xs font-bold uppercase text-slate-500">
                            <span className="inline-flex items-center gap-2"><FiSliders /> Letter Spacing</span>
                            <span>{selectedElement.letterSpacing ?? selectedElementTypography.letterSpacing}px</span>
                          </span>
                          <input
                            type="range"
                            min="-2"
                            max="8"
                            step="0.1"
                            value={selectedElement.letterSpacing ?? selectedElementTypography.letterSpacing}
                            onChange={(event) => updateTypography({ letterSpacing: Number(event.target.value) })}
                            className="w-full accent-[#24a84f]"
                          />
                        </label>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" style={typographyStyle(selectedElement, defaultFont.family)}>
                          Aa Preview typography
                        </div>
                      </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
                          Select a text, heading, label, or button element to edit typography.
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-100 pt-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="inline-flex items-center gap-2 text-sm font-bold uppercase text-slate-500">
                          <FiRotateCw /> Transform
                        </h3>
                        <button
                          type="button"
                          onClick={() => updateTransform({ ...defaultTransform })}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                          Reset
                        </button>
                      </div>
                      {canEditTransform ? (
                        <div className="grid gap-4">
                          <label className="grid gap-2">
                            <span className="inline-flex items-center justify-between gap-2 text-xs font-bold uppercase text-slate-500">
                              <span className="inline-flex items-center gap-2"><FiRotateCw /> Rotate</span>
                              <span>{selectedElementTransform.rotation ?? 0}deg</span>
                            </span>
                            <input
                              type="range"
                              min="-180"
                              max="180"
                              step="1"
                              value={selectedElementTransform.rotation ?? 0}
                              onChange={(event) => updateTransform({ rotation: Number(event.target.value) })}
                              className="w-full accent-[#24a84f]"
                            />
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="grid gap-2">
                              <span className="inline-flex items-center justify-between gap-2 text-xs font-bold uppercase text-slate-500">
                                <span className="inline-flex items-center gap-2"><FiMaximize /> Scale X</span>
                                <span>{Number((selectedElementTransform.scaleX ?? 1).toFixed(2))}x</span>
                              </span>
                              <input
                                type="range"
                                min="0.25"
                                max="2"
                                step="0.05"
                                value={selectedElementTransform.scaleX ?? 1}
                                onChange={(event) => updateTransform({ scaleX: Number(event.target.value) })}
                                className="w-full accent-[#24a84f]"
                              />
                            </label>
                            <label className="grid gap-2">
                              <span className="inline-flex items-center justify-between gap-2 text-xs font-bold uppercase text-slate-500">
                                <span className="inline-flex items-center gap-2"><FiMaximize /> Scale Y</span>
                                <span>{Number((selectedElementTransform.scaleY ?? 1).toFixed(2))}x</span>
                              </span>
                              <input
                                type="range"
                                min="0.25"
                                max="2"
                                step="0.05"
                                value={selectedElementTransform.scaleY ?? 1}
                                onChange={(event) => updateTransform({ scaleY: Number(event.target.value) })}
                                className="w-full accent-[#24a84f]"
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
                          Select any element to adjust rotation and scale.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </aside>
          </div>
        </section>
      </div>

      {showPreview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-6 backdrop-blur-sm">
          <div className="w-full max-w-6xl rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_30px_100px_rgba(15,23,42,0.24)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Custom 3D Flipbook Preview</h2>
                <p className="text-sm text-slate-500">3D page turn custom, tanpa plugin.</p>
              </div>
              <button type="button" onClick={() => setShowPreview(false)} className="btn-secondary">Close</button>
            </div>
            <VanillaFlipBook pages={pages} fontFamily={defaultFont.family} />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function EditableElement({ element, active, fallbackFontFamily, onSelect, onDragStart, onRotateStart, onScaleStart }) {
  const style = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    ...elementBoxStyle(element),
    ...elementTransformStyle(element),
  };
  const isVisualOnly = ['image', 'shape', 'circle', 'diamond', 'triangle', 'pill', 'hexagon', 'line', 'video', 'audio', 'gallery', 'embed', 'table', 'chart', 'map', 'qr'].includes(element.type);
  const content = getElementPreviewContent(element);
  const surfaceClass = isTextElement(element.type)
      ? element.type === 'label'
        ? 'bg-[#1f3d2e] text-white'
        : 'bg-transparent text-slate-950'
    : isVisualOnly
      ? 'bg-white/90 text-slate-950'
      : 'bg-transparent text-slate-950';

  return (
    <div
      onPointerDown={onDragStart}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      className={`absolute cursor-move touch-none overflow-visible rounded-xl border text-left transition ${
        active ? 'border-[#1f3d2e] ring-4 ring-[#cfe8d5]' : 'border-transparent hover:border-slate-300'
      } ${element.type === 'line' ? 'rounded-full border-0 bg-transparent shadow-none' : ''}`}
      style={style}
    >
      <div
        className={`relative h-full w-full overflow-hidden rounded-[inherit] ${surfaceClass} ${element.type === 'line' ? 'rounded-full bg-transparent' : ''}`}
      >
        <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-lg bg-white/80 text-slate-500">
          <FiMove />
        </span>
        {element.type === 'line' ? (
          <span className="absolute inset-x-4 top-1/2 h-1 -translate-y-1/2 rounded-full" style={{ background: element.lineColor || '#1f3d2e', height: `${element.lineWidth ?? 2}px` }} />
        ) : element.type === 'shape' ? (
          <span className="block h-full w-full bg-[#cfe8d5]" />
        ) : isVisualOnly ? (
          content
        ) : (
          <div
            className={`${
              element.type === 'heading'
                ? 'leading-tight'
                : element.type === 'label' || element.type === 'button' || element.type === 'link'
                  ? 'uppercase'
                  : ''
            }`}
            style={textContentStyle(element, fallbackFontFamily)}
          >
            {element.text}
          </div>
        )}
      </div>

      {active ? (
        <>
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRotateStart(event);
            }}
            className="absolute left-1/2 top-[-34px] grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition hover:bg-slate-50"
            title="Rotate"
            aria-label="Rotate element"
          >
            <FiRotateCw className="h-4 w-4" />
          </button>
          {[
            { key: 'tl', className: 'left-[-7px] top-[-7px] cursor-nwse-resize' },
            { key: 'tr', className: 'right-[-7px] top-[-7px] cursor-nesw-resize' },
            { key: 'bl', className: 'left-[-7px] bottom-[-7px] cursor-nesw-resize' },
            { key: 'br', className: 'right-[-7px] bottom-[-7px] cursor-nwse-resize' },
          ].map((handle) => (
            <button
              key={handle.key}
              type="button"
              data-handle={handle.key}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onScaleStart(event);
              }}
              className={`absolute grid h-3.5 w-3.5 rounded-[2px] border border-slate-300 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.14)] ${handle.className}`}
              title="Resize"
              aria-label="Resize element"
            />
          ))}
        </>
      ) : null}
    </div>
  );
}

function MiniPage({ page, active, fontFamily }) {
  return (
    <div className={`relative aspect-[16/10] overflow-hidden rounded-lg border bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] ${active ? 'border-[#24a84f] ring-2 ring-[#cfe8d5]' : 'border-slate-200'}`} style={{ background: page.background }}>
      <div className="absolute inset-0 scale-[0.26] origin-top-left" style={{ fontFamily }}>
        <div className="relative h-[384px] w-[615px]">
          {page.elements.slice(0, 8).map((element) => (
            <PreviewElement key={element.id} element={element} fallbackFontFamily={fontFamily} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewElement({ element, fallbackFontFamily = "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }) {
  return renderPreviewElement(element, fallbackFontFamily, false);
}

function renderPreviewElement(element, fallbackFontFamily, previewMode) {
  const isVisualOnly = ['image', 'shape', 'circle', 'diamond', 'triangle', 'pill', 'hexagon', 'line', 'video', 'audio', 'gallery', 'embed', 'table', 'chart', 'map', 'qr'].includes(element.type);
  const content = getElementPreviewContent(element);
  const surfaceClass = isTextElement(element.type)
    ? element.type === 'label'
      ? previewMode
        ? 'bg-transparent text-slate-950'
        : 'bg-[#1f3d2e] text-white'
      : 'bg-transparent text-slate-950'
    : isVisualOnly
      ? previewMode
        ? 'bg-transparent text-slate-950'
        : 'bg-white/70 text-slate-950'
      : 'bg-transparent text-slate-950';
  return (
    <div
      className={`absolute overflow-hidden rounded-lg ${surfaceClass}`}
      style={{ left: `${element.x}%`, top: `${element.y}%`, ...elementBoxStyle(element), ...elementTransformStyle(element) }}
    >
      {element.type === 'line' ? (
        <span className="absolute inset-x-4 top-1/2 h-1 -translate-y-1/2 rounded-full" style={{ background: element.lineColor || '#1f3d2e', height: `${element.lineWidth ?? 2}px` }} />
      ) : isVisualOnly ? (
        content
      ) : (
        <div
          className={`${element.type === 'heading' ? 'leading-tight' : element.type === 'label' || element.type === 'button' || element.type === 'link' ? 'uppercase' : ''}`}
          style={textContentStyle(element, fallbackFontFamily, previewMode)}
        >
          {element.text}
        </div>
      )}
    </div>
  );
}

function VanillaFlipBook({ pages, fontFamily }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [turn, setTurn] = useState(null);
  const turnRaf = useRef(null);
  const totalPages = pages.length;

  const isAnimating = !!turn;
  const current = pages[currentPage] || pages[0];
  const prev = pages[currentPage - 1] || null;

  const commitTurn = () => {
    if (!turn) return;
    setCurrentPage(turn.to);
    setTurn(null);
  };

  const startTurn = (direction) => {
    if (isAnimating || totalPages <= 1) return;
    const target = direction === 'next' ? currentPage + 1 : currentPage - 1;
    if (target < 0 || target >= totalPages) return;
    setTurn({
      direction,
      from: currentPage,
      to: target,
      phase: 'prep',
    });
  };

  useEffect(() => {
    if (!turn || turn.phase !== 'prep') return undefined;
    turnRaf.current = requestAnimationFrame(() => {
      setTurn((state) => (state ? { ...state, phase: 'run' } : state));
    });
    return () => {
      if (turnRaf.current) cancelAnimationFrame(turnRaf.current);
    };
  }, [turn]);

  const goToPage = (pageIndex) => {
    if (isAnimating) return;
    const nextPage = clamp(pageIndex, 0, Math.max(0, totalPages - 1));
    if (nextPage === currentPage) return;
    if (Math.abs(nextPage - currentPage) === 1) {
      startTurn(nextPage > currentPage ? 'next' : 'prev');
      return;
    }
    setCurrentPage(nextPage);
  };

  return (
    <div className="book-scene rounded-[1.5rem] border border-slate-200 bg-[#eef3ea]" style={{ fontFamily }}>
      <div className="flip-toolbar">
        <button type="button" className="icon-btn" onClick={() => startTurn('prev')} disabled={currentPage <= 0 || isAnimating} title="Previous page">
          <FiChevronLeft />
        </button>
        <span>Page {currentPage + 1}/{pages.length}</span>
        <button type="button" className="icon-btn" onClick={() => startTurn('next')} disabled={currentPage >= pages.length - 1 || isAnimating} title="Next page">
          <FiChevronRight />
        </button>
      </div>

      <div className="react-flipbook-shell">
        <div className={`book-preview ${turn?.direction === 'prev' ? 'direction-prev' : 'direction-next'}`}>
          <div className="book-ground" />

          <div className="book-side book-left">
            {prev ? <BookPageFace page={prev} fallbackFontFamily={fontFamily} /> : <BookCoverFace label="START" />}
          </div>

          <div className="book-side book-right">
            {current ? <BookPageFace page={current} fallbackFontFamily={fontFamily} /> : <BookCoverFace label="EMPTY" />}
          </div>

          <div className="book-spine" />
          <div className="page-thickness thickness-left" />
          <div className="page-thickness thickness-right" />

          {turn ? (
            <div
              className="page-turner"
              style={{
                '--flip-rotation': turn.phase === 'run' ? (turn.direction === 'next' ? '-180deg' : '180deg') : '0deg',
                '--flip-lift': '14px',
                '--flip-skew': '0deg',
                transitionDuration: '720ms',
                willChange: 'transform',
              }}
              onTransitionEnd={(event) => {
                if (event.propertyName === 'transform') {
                  commitTurn();
                }
              }}
            >
              <div className="turn-face turn-front">
                <BookPageFace page={pages[turn.from] || current} fallbackFontFamily={fontFamily} />
              </div>
              <div className="turn-face turn-back">
                <BookPageFace page={pages[turn.to] || current} fallbackFontFamily={fontFamily} />
              </div>
            </div>
          ) : null}

          <button type="button" className="corner-hotspot hotspot-left" onClick={() => startTurn('prev')} disabled={currentPage <= 0 || isAnimating} aria-label="Previous page" />
          <button type="button" className="corner-hotspot hotspot-right" onClick={() => startTurn('next')} disabled={currentPage >= pages.length - 1 || isAnimating} aria-label="Next page" />
        </div>
      </div>

      <div className="flip-page-menu">
        <button type="button" className="flip-menu-arrow" onClick={() => startTurn('prev')} disabled={currentPage <= 0 || isAnimating} title="Previous page">
          <FiChevronLeft />
        </button>
        <div className="flip-page-dots">
          {pages.map((page, index) => (
            <button
              key={page.id}
              type="button"
              onClick={() => goToPage(index)}
              className={currentPage === index ? 'active' : ''}
              disabled={isAnimating}
              title={`Open ${page.name}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <button type="button" className="flip-menu-arrow" onClick={() => startTurn('next')} disabled={currentPage >= pages.length - 1 || isAnimating} title="Next page">
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}

function BookCoverFace({ label }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[inherit] bg-gradient-to-br from-[#1f3d2e] via-[#2f5d50] to-[#12231b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_22%)]" />
      <div className="relative flex h-full w-full items-end p-8">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/60">{label}</div>
          <div className="mt-2 text-2xl font-bold">Diworkin Ebook</div>
        </div>
      </div>
    </div>
  );
}

function BookPageFace({ page, fallbackFontFamily }) {
  return (
    <div className="page flipbook-page" style={{ background: page.background, fontFamily: fallbackFontFamily }}>
      <div className="relative h-full w-full">
        {page.elements.map((element) => (
          <React.Fragment key={element.id}>
            {renderPreviewElement(element, fallbackFontFamily, true)}
          </React.Fragment>
        ))}
        <div className="pointer-events-none absolute right-4 bottom-4 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500/80">
          {page.name}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
