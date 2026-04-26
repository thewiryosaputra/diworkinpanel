'use client';

import { useEffect, useRef, useState } from 'react';

import {
  FiArrowRight,
  FiBookOpen,
  FiChevronDown,
  FiCode,
  FiCreditCard,
  FiDatabase,
  FiFolder,
  FiGlobe,
  FiGrid,
  FiLayers,
  FiMonitor,
  FiLink,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPenTool,
  FiPhone,
  FiShoppingCart,
  FiSettings,
  FiPlay,
  FiSend,
  FiShare2,
  FiShoppingBag,
  FiStar,
  FiTrendingUp,
  FiMessageCircle,
  FiMenu,
  FiSmartphone,
  FiHardDrive,
  FiTerminal,
  FiUploadCloud,
  FiVideo,
  FiTool,
  FiLayout,
  FiServer,
  FiShield,
  FiZap,
  FiUsers,
  FiInstagram,
  FiTwitter,
  FiYoutube,
  FiX,
} from 'react-icons/fi';
import { SiOpenai } from 'react-icons/si';

const panelUrl = process.env.NEXT_PUBLIC_PANEL_URL || 'https://panel.diworkin.com';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || `${panelUrl}/api`;

const trustItems = [
  {
    label: 'Always online',
    description: 'Keep your sites and panels reachable around the clock.',
    icon: FiServer,
    tone: 'text-[#1f3d2e]',
  },
  {
    label: 'Fast installs',
    description: 'Launch WordPress, Laravel, and CodeIgniter in minutes.',
    icon: FiZap,
    tone: 'text-[#4f8f6c]',
  },
  {
    label: 'Secure by default',
    description: 'SSL, backups, and safer operations from the start.',
    icon: FiShield,
    tone: 'text-[#8b6a3d]',
  },
  {
    label: 'Real support',
    description: 'Talk to a real team when you need help.',
    icon: FiMessageCircle,
    tone: 'text-[#2f5d50]',
  },
];

const platformFeatures = [
  {
    title: 'One launch stack',
    body: 'Hosting, panel control, branding, and AI tools in one stack.',
    icon: FiGlobe,
    tone: 'text-[#1f3d2e]',
  },
  {
    title: 'Sell digital products',
    body: 'Build stores for ebooks, courses, templates, and services.',
    icon: FiShoppingBag,
    tone: 'text-[#4f8f6c]',
  },
  {
    title: 'Branding that converts',
    body: 'Make every offer look premium, clear, and trustworthy.',
    icon: FiLayout,
    tone: 'text-[#8b6a3d]',
  },
  {
    title: 'Live control',
    body: 'Track traffic, resources, and service health in real time.',
    icon: FiTrendingUp,
    tone: 'text-[#2f5d50]',
  },
  {
    title: 'AI Assist',
    body: 'Use AI to write, structure, and move faster.',
    icon: SiOpenai,
    tone: 'text-[#1f3d2e]',
  },
];

const hostingFeatures = [
  {
    title: 'Domain Management',
    body: 'Manage root domains and add-on domains from one panel.',
    icon: FiGlobe,
  },
  {
    title: 'Subdomain Management',
    body: 'Create and organize subdomains in a fast, tidy flow.',
    icon: FiLink,
  },
  {
    title: 'Website / Sites',
    body: 'Install WordPress, Laravel, and CodeIgniter from one menu.',
    icon: FiMonitor,
  },
  {
    title: 'Email Hosting',
    body: 'Mailbox, aliases, and mail access directly from the panel.',
    icon: FiMail,
  },
  {
    title: 'DNS Management',
    body: 'Manage DNS records such as A, MX, TXT, CNAME, and more.',
    icon: FiServer,
  },
  {
    title: 'SSL / HTTPS',
    body: 'Issue and renew certificates for domains and subdomains.',
    icon: FiShield,
  },
  {
    title: 'Database',
    body: 'Create PostgreSQL, MariaDB, and MongoDB databases on demand.',
    icon: FiDatabase,
  },
  {
    title: 'Database Studio',
    body: 'Browse and edit data without opening a separate tool.',
    icon: FiGrid,
  },
  {
    title: 'File Manager',
    body: 'Access, edit, upload, and manage target files quickly.',
    icon: FiFolder,
  },
  {
    title: 'Backup',
    body: 'Run manual and automatic backups with retention rules.',
    icon: FiHardDrive,
  },
  {
    title: 'SSH Access',
    body: 'Access the server with secure key management.',
    icon: FiTerminal,
  },
  {
    title: 'FTP Access',
    body: 'Create FTP access per target for operational workflows.',
    icon: FiUploadCloud,
  },
  {
    title: 'Shell Access',
    body: 'Use a folder-limited command shell for quick workflows.',
    icon: FiCode,
  },
  {
    title: 'Users & Approval',
    body: 'Manage users, approvals, and roles from the admin panel.',
    icon: FiUsers,
  },
  {
    title: 'Packages',
    body: 'Set hosting plans, quotas, and the features you sell.',
    icon: FiPackage,
  },
  {
    title: 'Billing',
    body: 'Manage invoices, payment status, and billing ledgers.',
    icon: FiCreditCard,
  },
  {
    title: 'Settings',
    body: 'Update logo, business hours, contact info, and bank details.',
    icon: FiSettings,
  },
  {
    title: 'Affiliate',
    body: 'Referral links, coupons, and per-user affiliate commissions.',
    icon: FiShare2,
  },
];

const productOptions = [
  {
    title: 'E-book',
    body: 'Package your knowledge into a premium digital product.',
    icon: FiBookOpen,
    image: '/ebook.png',
    badge: 'Digital download',
  },
  {
    title: 'Brand Kit',
    body: 'Package logos, colors, and visual assets for a polished identity.',
    icon: FiPenTool,
    image: '/brandkit.png',
    badge: 'Identity system',
  },
  {
    title: 'Template',
    body: 'Sell landing pages, website kits, and ready-made layouts.',
    icon: FiGrid,
    image: '/template.png',
    badge: 'Ready-to-use',
  },
  {
    title: 'Online Course',
    body: 'Teach your expertise with a polished learning experience.',
    icon: FiVideo,
    image: '/Course.png',
    badge: 'Learning product',
  },
  {
    title: 'Digital Service',
    body: 'Offer design, build, or strategy services in a premium way.',
    icon: FiTool,
    image: '/digitalservice.png',
    badge: 'Done for you',
  },
  {
    title: 'Webinar / Workshop',
    body: 'Sell live sessions, workshops, and launch events online.',
    icon: FiPlay,
    image: '/webminar.png',
    badge: 'Live selling',
  },
  {
    title: 'SaaS / MVP',
    body: 'Validate app ideas with a polished product launch.',
    icon: FiLayers,
    image: '/saas.png',
    badge: 'Software product',
  },
  {
    title: 'Membership',
    body: 'Create recurring access to premium content or perks.',
    icon: FiUsers,
    image: '/membership.png',
    badge: 'Recurring access',
  },
  {
    title: 'Mobile App',
    body: 'Launch app-like products that look great on mobile.',
    icon: FiSmartphone,
    image: '/mobile.png',
    badge: 'App product',
  },
];

const topNavItems = [
  { label: 'Home', href: '/', sectionId: 'top' },
  { label: 'Why', href: '/why', sectionId: 'what-is' },
  { label: 'Products', href: '/products', sectionId: 'products' },
  { label: 'Hosting', href: '/hosting', sectionId: 'features' },
  { label: 'Pricing', href: '/pricing', sectionId: 'pricing' },
  { label: 'FAQ', href: '/faq', sectionId: 'faq' },
  { label: 'Contact', href: '/contact', sectionId: 'contact' },
];

const audience = [
  {
    title: 'Creators & Coaches',
    body: 'Ebooks, courses, and memberships.',
  },
  {
    title: 'Freelancers & Agencies',
    body: 'Sell services and packaged offers.',
  },
  {
    title: 'Developers & Builders',
    body: 'Deploy apps, small SaaS products, and MVPs.',
  },
  {
    title: 'Small Businesses & Brand Owners',
    body: 'Build stores and strong online brands.',
  },
];

const workflow = [
  {
    step: '01',
    title: 'Pick your stack',
    body: 'Choose hosting, products, or branding.',
  },
  {
    step: '02',
    title: 'Shape the experience',
    body: 'We prepare a look that feels ready to sell.',
  },
  {
    step: '03',
    title: 'Go live',
    body: 'Website, email, and tracking turn on immediately.',
  },
  {
    step: '04',
    title: 'Scale the sales',
    body: 'Add products and campaigns with ease.',
  },
];

const testimonials = [
  {
    quote: 'DIWORKIN made the launch feel simple. The hosting stack and the panel were ready from day one.',
    name: 'Andi Pratama',
    role: 'Small business owner',
    date: '09/30/2024',
    avatar: 'AP',
    tone: 'from-[#eff4f1] via-[#f6f8f4] to-[#dbe8de]',
  },
  {
    quote: 'Deploying projects is fast, and the UI gives every launch a more premium feel.',
    name: 'Rizky Hidayat',
    role: 'Product developer',
    date: '09/30/2024',
    avatar: 'RH',
    featured: true,
    badge: 'Featured story',
    tone: 'from-[#e6efe9] via-[#f5f7f1] to-[#d8e6db]',
  },
  {
    quote: 'Branding, hosting, and launch tools finally live in one place.',
    name: 'Maya Sari',
    role: 'Brand owner',
    date: '09/30/2024',
    avatar: 'MS',
    tone: 'from-[#f2f4ef] via-[#f7f8f3] to-[#dde6df]',
  },
  {
    quote: 'We now move from idea to live product without losing time on setup.',
    name: 'Nadia Karim',
    role: 'Studio founder',
    date: '09/30/2024',
    avatar: 'NK',
    tone: 'from-[#edf5ee] via-[#f8faf7] to-[#d9e7dc]',
  },
];

const pricing = [
  {
    slug: 'basic',
    name: 'Basic',
    subtitle: 'Start',
    price: '$50',
    period: '/ month',
    points: ['1 website', 'Free SSL', 'Basic storage'],
    cta: 'Add to cart',
    tone: 'border-slate-200 bg-white',
    icon: FiMonitor,
  },
  {
    slug: 'pro',
    name: 'Pro',
    subtitle: 'Grow',
    price: '$199',
    period: '/ month',
    points: ['3 websites', 'Higher performance', 'Automatic backups'],
    cta: 'Add to cart',
    tone: 'border-[#1f3d2e] bg-[#f4faf5]',
    badge: 'Recommended',
    icon: FiGrid,
  },
  {
    slug: 'branding',
    name: 'Branding',
    subtitle: 'Launch',
    price: '$499',
    period: '/ project',
    points: ['Visual identity', 'Landing page design', 'Product presentation'],
    cta: 'Add to cart',
    tone: 'border-[#8b6a3d] bg-[#fcfaf6]',
    badge: 'New',
    icon: FiPenTool,
  },
  {
    slug: 'business',
    name: 'Business',
    subtitle: 'Scale',
    price: '$1000+',
    period: '/ month',
    points: ['Unlimited websites', 'Priority support', 'Advanced security'],
    cta: 'Add to cart',
    tone: 'border-slate-200 bg-white',
    icon: FiPackage,
  },
];

const faqItems = [
  {
    question: 'What does Diworkin include?',
    answer:
      'Hosting, domain tools, email, SSL, databases, file manager, backups, and a control panel for launching and managing websites in one place.',
  },
  {
    question: 'Can I launch WordPress or Laravel quickly?',
    answer:
      'Yes. You can install WordPress, Laravel, CodeIgniter, or a static website with guided setup and ready-to-use templates.',
  },
  {
    question: 'Can Diworkin help with branding?',
    answer:
      'Yes. We help your product look premium with cleaner visuals, launch pages, and a more convincing presentation for buyers.',
  },
  {
    question: 'Can Diworkin help me build a website?',
    answer:
      'Yes. You can start from a domain, choose a template, and launch a full website with the hosting stack already prepared.',
  },
  {
    question: 'Is Diworkin only for developers?',
    answer:
      'No. It is designed for founders, small businesses, freelancers, and creators who want to sell online without heavy technical work.',
  },
  {
    question: 'Can I use Diworkin for digital products?',
    answer:
      'Yes. It is built for ebooks, courses, templates, memberships, services, and other digital offers you want to sell online.',
  },
];

const CART_STORAGE_KEY = 'diworkin-cart-plan';

const portfolioTabs = ['All', 'Web', 'Branding', 'Design', 'Photography'];

const portfolioCards = [
  {
    title: 'Brand System',
    subtitle: 'identity guide',
    tone: 'from-[#eff4f1] via-[#e6eee7] to-[#dbe8de]',
    image: '/portfolio-brand-system.png',
    featured: true,
  },
  { title: 'Product Workspace', subtitle: 'sell-ready', tone: 'from-[#f7f8f3] via-[#eef2eb] to-[#dde7dd]' },
  { title: 'Digital Merch', subtitle: 'brand assets', tone: 'from-[#eef4ef] via-[#e8f0eb] to-[#d9e6db]' },
  {
    title: 'Instagram Strategy',
    subtitle: 'content growth',
    tone: 'from-[#edf2f7] via-[#e2eaf6] to-[#d3dff1]',
    image: '/portfolio-instagram-strategy.png',
    featured: true,
  },
  {
    title: 'Dashboard Builder',
    subtitle: 'dashboard system',
    tone: 'from-[#e7eef8] via-[#dce6f4] to-[#ced9ef]',
    image: '/portfolio-dashboard-builder.png',
    featured: true,
  },
  { title: 'Studio Grid', subtitle: 'content system', tone: 'from-[#f3f5f2] via-[#eaeee9] to-[#dce2dc]' },
  {
    title: 'Technology Solutions',
    subtitle: 'tech launch',
    tone: 'from-[#e6eef6] via-[#d8e4f3] to-[#c8d7ec]',
    image: '/portfolio-technology-solutions.png',
    featured: true,
  },
  { title: 'Campaign Set', subtitle: 'launch kit', tone: 'from-[#f6f7f4] via-[#edf0eb] to-[#dee6df]' },
];

function SectionTitle({ eyebrow, title, description, center = false }) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0b0f0d] sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-8 text-[#64706a]">{description}</p> : null}
    </div>
  );
}

function FeatureCard({ title, body, icon: Icon, tone }) {
  return (
    <article className="rounded-[1.8rem] border border-[rgba(31,61,46,0.10)] bg-white/90 p-6 shadow-[0_18px_44px_rgba(31,61,46,0.06)] backdrop-blur transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(31,61,46,0.12)]">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4faf5] ${tone || 'text-[#1f3d2e]'}`}>
        {Icon ? <Icon className="h-7 w-7" /> : <div className="h-5 w-5 rounded-md bg-[#cfe8d5]" />}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#1f2b24]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#64706a]">{body}</p>
    </article>
  );
}

function HostingFeatureCard({ item }) {
  const Icon = item.icon;
  return (
    <article className="group rounded-[1.8rem] border border-[rgba(31,61,46,0.10)] bg-white/90 p-6 shadow-[0_18px_44px_rgba(31,61,46,0.06)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(31,61,46,0.12)]">
      <div className="flex items-start gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-[#f4faf5] text-[#1f3d2e] transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-9 w-9" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#1f2b24]">{item.title}</h3>
          <p className="mt-2 text-sm leading-7 text-[#64706a]">{item.body}</p>
        </div>
      </div>
    </article>
  );
}

function ProductCarousel({ items }) {
  const railRef = useRef(null);

  const scrollRail = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    const amount = direction === 'next' ? rail.clientWidth * 0.82 : -rail.clientWidth * 0.82;
    rail.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="relative mt-6">
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollRail('prev')}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(31,61,46,0.10)] bg-white text-[#1f2b24] shadow-[0_12px_28px_rgba(31,61,46,0.08)] transition hover:-translate-y-0.5 hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
          aria-label="Scroll product cards left"
        >
          <FiArrowRight className="h-4 w-4 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => scrollRail('next')}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(31,61,46,0.10)] bg-white text-[#1f2b24] shadow-[0_12px_28px_rgba(31,61,46,0.08)] transition hover:-translate-y-0.5 hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
          aria-label="Scroll product cards right"
        >
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={railRef}
        className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="group relative min-w-[310px] shrink-0 snap-start overflow-hidden rounded-[2rem] border border-[rgba(31,61,46,0.10)] bg-white shadow-[0_18px_44px_rgba(31,61,46,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(31,61,46,0.12)]"
            >
              <div className="relative h-[24rem] overflow-hidden bg-[#f4f6f2]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full scale-[1.18] object-cover object-center transition-transform duration-700 group-hover:scale-[1.24]"
                />
                <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#1f3d2e] shadow-[0_12px_28px_rgba(31,61,46,0.14)] backdrop-blur">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#8b6a3d] shadow-[0_10px_24px_rgba(31,61,46,0.08)] backdrop-blur">
                  {item.badge}
                </div>
              </div>
              <div className="p-6">
                <h3 className="mt-3 text-xl font-semibold text-[#1f2b24]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#64706a]">{item.body}</p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-[rgba(255,255,255,0.18)] transition group-hover:ring-[rgba(31,61,46,0.12)]" />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TrustChip({ item }) {
  const Icon = item.icon;
  return (
    <div className="flex items-start gap-4 rounded-[1.5rem] border border-[rgba(31,61,46,0.10)] bg-white px-4 py-4 shadow-[0_14px_34px_rgba(31,61,46,0.06)]">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4faf5] ${item.tone}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1f2b24]">{item.label}</p>
        <p className="mt-1 text-xs leading-5 text-[#64706a]">{item.description}</p>
      </div>
    </div>
  );
}

function WorkflowCard({ item }) {
  return (
    <article className="rounded-[1.7rem] border border-[rgba(31,61,46,0.10)] bg-white p-6 shadow-[0_18px_44px_rgba(31,61,46,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1f3d2e] text-sm font-semibold text-white">
          {item.step}
        </span>
        <div className="h-px flex-1 bg-[rgba(31,61,46,0.10)]" />
        <FiArrowRight className="h-4 w-4 text-[#4f8f6c]" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-[#1f2b24]">{item.title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#64706a]">{item.body}</p>
    </article>
  );
}

function PricingCard({ item }) {
  const cartHref = `/cart/${encodeURIComponent(item.slug || item.name.toLowerCase())}`;
  return (
    <a
      href={cartHref}
      className={`group flex h-full flex-col rounded-[2rem] border p-6 shadow-[0_18px_44px_rgba(31,61,46,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(31,61,46,0.14)] ${item.tone}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1f3d2e] shadow-[0_12px_28px_rgba(31,61,46,0.08)]">
            <item.icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b6a3d]">{item.subtitle}</p>
            <h3 className="mt-1 text-2xl font-semibold text-[#1f2b24]">{item.name}</h3>
          </div>
        </div>
        {item.badge ? (
          <span className="rounded-full bg-[#1f3d2e] px-3 py-1 text-xs font-semibold text-white">
            {item.badge}
          </span>
        ) : null}
      </div>

      <div className="mt-6 rounded-[1.6rem] border border-[rgba(31,61,46,0.08)] bg-white/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b6a3d]">Starting from</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-black tracking-[-0.06em] text-[#1f2b24]">{item.price}</span>
          <span className="pb-1 text-sm font-medium text-[#64706a]">{item.period}</span>
        </div>
      </div>

      <ul className="mt-6 space-y-3 text-sm text-[#1f2b24]">
        {item.points.map((point) => (
          <li key={point} className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4f8f6c]" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <span className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1f3d2e] px-5 py-3 text-sm font-semibold text-white transition group-hover:bg-[#153126]">
        <FiShoppingCart className="h-4 w-4" />
        {item.cta}
      </span>
    </a>
  );
}

function PricingCarousel({ items }) {
  const railRef = useRef(null);

  const scrollRail = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    const amount = direction === 'next' ? rail.clientWidth * 0.8 : -rail.clientWidth * 0.8;
    rail.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="relative mt-6">
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollRail('prev')}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(31,61,46,0.10)] bg-white text-[#1f2b24] shadow-[0_12px_28px_rgba(31,61,46,0.08)] transition hover:-translate-y-0.5 hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
          aria-label="Scroll pricing cards left"
        >
          <FiArrowRight className="h-4 w-4 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => scrollRail('next')}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(31,61,46,0.10)] bg-white text-[#1f2b24] shadow-[0_12px_28px_rgba(31,61,46,0.08)] transition hover:-translate-y-0.5 hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
          aria-label="Scroll pricing cards right"
        >
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={railRef}
        className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item.name} className="min-w-[290px] shrink-0 snap-start lg:min-w-[320px]">
            <PricingCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialCarousel({ items }) {
  const railRef = useRef(null);

  const scrollRail = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    const amount = direction === 'next' ? rail.clientWidth * 0.82 : -rail.clientWidth * 0.82;
    rail.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="relative mt-8">
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollRail('prev')}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(31,61,46,0.10)] bg-white text-[#1f2b24] shadow-[0_12px_28px_rgba(31,61,46,0.08)] transition hover:-translate-y-0.5 hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
          aria-label="Scroll testimonials left"
        >
          <FiArrowRight className="h-4 w-4 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => scrollRail('next')}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(31,61,46,0.10)] bg-white text-[#1f2b24] shadow-[0_12px_28px_rgba(31,61,46,0.08)] transition hover:-translate-y-0.5 hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
          aria-label="Scroll testimonials right"
        >
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={railRef}
        className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <blockquote
            key={item.name}
            className={`group relative min-w-[292px] shrink-0 snap-start overflow-hidden rounded-[2rem] border border-[rgba(31,61,46,0.10)] bg-white shadow-[0_18px_44px_rgba(31,61,46,0.06)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(31,61,46,0.14)] ${
              item.featured ? 'md:min-w-[430px]' : 'md:min-w-[340px]'
            } ${item.featured ? 'md:scale-[1.02]' : ''}`}
          >
            <div className={`flex h-full min-h-[470px] flex-col ${item.featured ? 'bg-[#f4f6f1]' : 'bg-white'}`}>
              {item.featured ? (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.tone}`} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(79,143,108,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(31,61,46,0.04))]" />

                  <div className="relative flex h-full flex-col p-5 sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1f2b24]/70">{item.name}</p>
                        <p className="mt-1 text-sm text-[#1f2b24]/60">{item.role}</p>
                      </div>
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1f2b24] shadow-[0_10px_24px_rgba(31,61,46,0.12)]">
                        <FiPlay className="h-4 w-4 translate-x-[1px]" />
                      </div>
                    </div>

                    <div className="relative flex-1 overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/45 shadow-[0_18px_40px_rgba(31,61,46,0.1)]">
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(79,143,108,0.14))]" />
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border border-dashed border-[#cfe8d5] bg-white/70 text-[#1f3d2e] shadow-[0_18px_40px_rgba(31,61,46,0.08)] backdrop-blur">
                          <FiGrid className="h-12 w-12" />
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#1f3d2e]/85 via-[#1f3d2e]/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">{item.badge}</p>
                        <p className="mt-2 max-w-xs text-2xl font-semibold leading-tight">
                          Premium launches feel easier with one place for hosting and branding.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-[#f5b301]">
                          {Array.from({ length: 5 }).map((_, starIndex) => (
                            <FiStar key={starIndex} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[#1f2b24]/75">{item.quote}</p>
                      </div>
                      <p className="text-sm font-medium text-[#64706a]">{item.date}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col p-5 sm:p-6">
                  <div className={`relative overflow-hidden rounded-[1.6rem] border border-[rgba(31,61,46,0.08)] bg-gradient-to-br ${item.tone} p-4 shadow-[0_16px_36px_rgba(31,61,46,0.06)]`}>
                    <div className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1f2b24] shadow-[0_8px_18px_rgba(31,61,46,0.12)]">
                      <FiMessageCircle className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1f3d2e] text-sm font-semibold text-white shadow-[0_12px_28px_rgba(31,61,46,0.16)]">
                        {item.avatar}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[#1f2b24]">{item.name}</p>
                        <p className="text-sm text-[#64706a]">{item.role}</p>
                      </div>
                    </div>

                    <div className="mt-8 flex h-44 items-center justify-center rounded-[1.4rem] border border-white/60 bg-white/35">
                      <div className="grid h-24 w-24 grid-cols-2 gap-2 rounded-[1.5rem] border border-dashed border-[#cfe8d5] bg-white/70 p-4 text-[#1f3d2e] shadow-[0_16px_34px_rgba(31,61,46,0.08)]">
                        <span className="rounded-sm border-2 border-current" />
                        <span className="rounded-sm border-2 border-current" />
                        <span className="rounded-sm border-2 border-current" />
                        <span className="rounded-sm border-2 border-current" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 flex-1">
                    <p className="max-w-sm text-2xl font-semibold leading-[1.2] tracking-[-0.03em] text-[#0b0f0d]">
                      “{item.quote}”
                    </p>
                  </div>

                  <div className="mt-7 flex items-end justify-between gap-4">
                    <div className="flex items-center gap-1 text-[#f5b301]">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <FiStar key={starIndex} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-[#64706a]">{item.date}</p>
                  </div>
                </div>
              )}
            </div>
          </blockquote>
        ))}
      </div>
    </div>
  );
}

const SUPPORT_STORAGE_KEY = 'diworkin-support-chat-v1';
const SUPPORT_DEFAULT_VISITOR = { name: '', email: '', company: '' };
const SUPPORT_CHANNELS = [
  { key: 'support', label: 'Support', description: 'Technical help and account support' },
  { key: 'sales', label: 'Sales', description: 'Pricing, packages, and onboarding' },
];

function safeLoadSupportState() {
  if (typeof window === 'undefined') {
    return {
      token: '',
      channel: 'support',
      visitor: SUPPORT_DEFAULT_VISITOR,
    };
  }

  try {
    const raw = window.localStorage.getItem(SUPPORT_STORAGE_KEY);
    if (!raw) {
      return {
        token: '',
        channel: 'support',
        visitor: SUPPORT_DEFAULT_VISITOR,
      };
    }

    const parsed = JSON.parse(raw);
    return {
      token: typeof parsed?.token === 'string' ? parsed.token : '',
      channel: parsed?.channel === 'sales' ? 'sales' : 'support',
      visitor: {
        name: String(parsed?.visitor?.name || ''),
        email: String(parsed?.visitor?.email || ''),
        company: String(parsed?.visitor?.company || ''),
      },
    };
  } catch {
    return {
      token: '',
      channel: 'support',
      visitor: SUPPORT_DEFAULT_VISITOR,
    };
  }
}

function saveSupportState(nextState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    SUPPORT_STORAGE_KEY,
    JSON.stringify({
      token: nextState.token || '',
      channel: nextState.channel === 'sales' ? 'sales' : 'support',
      visitor: {
        name: String(nextState.visitor?.name || ''),
        email: String(nextState.visitor?.email || ''),
        company: String(nextState.visitor?.company || ''),
      },
    }),
  );
}

function formatSupportTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState('support');
  const [token, setToken] = useState('');
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [visitor, setVisitor] = useState(SUPPORT_DEFAULT_VISITOR);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messageListRef = useRef(null);

  const fetchSupportJson = async (path, options = {}) => {
    const response = await fetch(`/api/support/public${path}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to load support chat');
    }

    return payload;
  };

  const persistChat = (nextToken, nextChannel, nextVisitor) => {
    setToken(nextToken || '');
    setChannel(nextChannel === 'sales' ? 'sales' : 'support');
    setVisitor({
      name: String(nextVisitor?.name || ''),
      email: String(nextVisitor?.email || ''),
      company: String(nextVisitor?.company || ''),
    });
    saveSupportState({
      token: nextToken || '',
      channel: nextChannel,
      visitor: nextVisitor,
    });
  };

  const loadThread = async (chatToken) => {
    if (!chatToken) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = await fetchSupportJson(`/thread?token=${encodeURIComponent(chatToken)}`, {
        method: 'GET',
      });
      setConversation(payload?.conversation || null);
      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
      if (payload?.conversation?.channel) {
        setChannel(payload.conversation.channel === 'sales' ? 'sales' : 'support');
      }
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load support chat');
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setToken('');
    setConversation(null);
    setMessages([]);
    setDraft('');
    setError('');
    setIsClosing(false);
    setChannel('support');
    setVisitor(SUPPORT_DEFAULT_VISITOR);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SUPPORT_STORAGE_KEY);
    }
  };

  useEffect(() => {
    const saved = safeLoadSupportState();
    setToken(saved.token);
    setChannel(saved.channel);
    setVisitor(saved.visitor);
  }, []);

  useEffect(() => {
    if (!token) {
      setConversation(null);
      setMessages([]);
      return undefined;
    }

    if (open) {
      loadThread(token);
    }

    const timer = window.setInterval(() => {
      if (open) {
        loadThread(token);
      }
    }, 4000);

    return () => window.clearInterval(timer);
  }, [open, token]);

  useEffect(() => {
    if (!messageListRef.current) {
      return;
    }
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, open]);

  const startConversation = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) {
      setError('Tulis pesan dulu sebelum mulai chat.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = await fetchSupportJson('/start', {
        method: 'POST',
        body: JSON.stringify({
          channel,
          name: visitor.name,
          email: visitor.email,
          company: visitor.company,
          message,
          page_url: typeof window !== 'undefined' ? window.location.href : '',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        }),
      });

      const nextToken = String(payload?.token || '');
      const nextConversation = payload?.conversation || null;
      const nextMessages = Array.isArray(payload?.messages) ? payload.messages : [];
      persistChat(nextToken, nextConversation?.channel || channel, visitor);
      setConversation(nextConversation);
      setMessages(nextMessages);
      setDraft('');
    } catch (startError) {
      setError(startError?.message || 'Failed to start support chat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (conversation?.status === 'closed') {
      setError('Chat sudah diakhiri. Klik New chat untuk memulai percakapan baru.');
      return;
    }
    const message = draft.trim();
    if (!token) {
      await startConversation(event);
      return;
    }
    if (!message) {
      setError('Tulis pesan dulu sebelum dikirim.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = await fetchSupportJson('/message', {
        method: 'POST',
        body: JSON.stringify({
          token,
          message,
        }),
      });

      const nextConversation = payload?.conversation || null;
      const nextMessages = Array.isArray(payload?.messages) ? payload.messages : [];
      if (nextConversation?.channel) {
        setChannel(nextConversation.channel === 'sales' ? 'sales' : 'support');
      }
      setConversation(nextConversation);
      setMessages(nextMessages);
      setDraft('');
    } catch (sendError) {
      setError(sendError?.message || 'Failed to send support message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeConversation = async () => {
    if (!token || conversation?.status === 'closed') {
      return;
    }

    if (typeof window !== 'undefined' && !window.confirm('End chat dan kirim rekapan ke email?')) {
      return;
    }

    setIsClosing(true);
    setError('');

    try {
      const payload = await fetchSupportJson('/close', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      setConversation(payload?.conversation || null);
      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
      setDraft('');
    } catch (closeError) {
      setError(closeError?.message || 'Failed to end support chat');
    } finally {
      setIsClosing(false);
    }
  };

  const activeChannel = SUPPORT_CHANNELS.find((item) => item.key === channel) || SUPPORT_CHANNELS[1];
  const hasConversation = Boolean(token && conversation);
  const isConversationClosed = conversation?.status === 'closed';

  return (
    <div className="fixed bottom-5 right-5 z-[80] md:bottom-6 md:right-6">
      <div
        className={`mb-3 w-[min(94vw,24rem)] origin-bottom-right overflow-hidden rounded-[1.5rem] border border-[rgba(31,61,46,0.12)] bg-white/96 shadow-[0_24px_60px_rgba(31,61,46,0.16)] backdrop-blur transition-all duration-300 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(31,61,46,0.08)] px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1f3d2e] text-white shadow-[0_12px_26px_rgba(31,61,46,0.2)]">
              <FiMessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-[#1f2b24]">Live support</p>
              <p className="mt-1 text-xs leading-5 text-[#64706a]">
                Talk to sales or support from the same chat widget.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(31,61,46,0.10)] bg-white text-[#1f2b24] transition hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
            aria-label="Close support widget"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 px-4 py-4">
          <div className="grid gap-2 rounded-[1.15rem] bg-[#f4faf5] p-1.5 sm:grid-cols-2">
            {SUPPORT_CHANNELS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (!hasConversation) {
                    setChannel(item.key);
                    return;
                  }
                  setError('Mulai chat baru dulu untuk pindah channel.');
                }}
                className={`flex min-h-[5.9rem] flex-col justify-start rounded-[1rem] px-3 py-3 text-left transition ${
                  channel === item.key
                    ? 'bg-white text-[#1f2b24] shadow-[0_10px_24px_rgba(31,61,46,0.08)]'
                    : 'text-[#64706a] hover:bg-white/70 hover:text-[#1f2b24]'
                }`}
              >
                <span className="block text-sm font-semibold leading-5">{item.label}</span>
                <span className="mt-1 block text-[11px] leading-4">{item.description}</span>
              </button>
            ))}
          </div>

          {token && !hasConversation ? (
            <div className="rounded-[1.25rem] border border-[rgba(31,61,46,0.10)] bg-white px-4 py-6 text-center text-sm text-[#64706a]">
              Loading conversation...
            </div>
          ) : hasConversation ? (
            <div className="rounded-[1.25rem] border border-[rgba(31,61,46,0.10)] bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-[rgba(31,61,46,0.08)] px-3 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b6a3d]">Connected</p>
                  <p className="text-sm font-semibold text-[#1f2b24]">{activeChannel.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isConversationClosed ? (
                    <button
                      type="button"
                      onClick={closeConversation}
                      disabled={isClosing}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isClosing ? 'Ending...' : 'End chat'}
                    </button>
                  ) : (
                    <span className="rounded-full bg-[#edf7ef] px-3 py-1.5 text-xs font-semibold text-[#1f3d2e]">
                      Chat ended
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={resetConversation}
                    className="rounded-full border border-[rgba(31,61,46,0.10)] bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#1f2b24] transition hover:bg-slate-100"
                  >
                    New chat
                  </button>
                </div>
              </div>

              {isConversationClosed ? (
                <div className="border-b border-[rgba(31,61,46,0.08)] bg-[#f4faf5] px-3 py-3 text-sm text-[#1f2b24]">
                  Chat sudah diakhiri. Rekapan percakapan dikirim ke email kamu dan admin@diworkin.com.
                </div>
              ) : null}

              <div ref={messageListRef} className="max-h-[20rem] space-y-3 overflow-y-auto px-3 py-3">
                {isLoading && messages.length === 0 ? (
                  <div className="rounded-[1rem] bg-slate-50 px-3 py-3 text-sm text-[#64706a]">
                    Loading conversation...
                  </div>
                ) : null}

                {messages.map((message) => {
                  const isVisitor = message.sender_role === 'visitor';
                  return (
                    <div
                      key={`${message.id}-${message.created_at}`}
                      className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-[1.1rem] px-3 py-2 text-sm leading-6 ${
                          isVisitor
                            ? 'bg-[#1f3d2e] text-white'
                            : 'border border-[rgba(31,61,46,0.10)] bg-slate-50 text-[#1f2b24]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.body}</p>
                        <p className={`mt-1 text-[10px] uppercase tracking-[0.16em] ${isVisitor ? 'text-white/60' : 'text-[#8d98a0]'}`}>
                          {message.sender_role === 'admin' ? 'Diworkin Team' : 'You'} · {formatSupportTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={sendMessage} className="border-t border-[rgba(31,61,46,0.08)] px-3 py-3">
                <label className="sr-only" htmlFor="support-message">
                  Support message
                </label>
                <textarea
                  id="support-message"
                  rows={3}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={isConversationClosed}
                  placeholder="Type your reply..."
                  className="w-full resize-none rounded-[1rem] border border-[rgba(31,61,46,0.12)] bg-white px-3 py-3 text-sm text-[#1f2b24] outline-none transition placeholder:text-[#8d98a0] focus:border-[#1f3d2e] focus:ring-4 focus:ring-[#cfe8d5]/50 disabled:bg-slate-50 disabled:text-slate-400"
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-[#64706a]">
                    {isConversationClosed ? 'Start a new chat to continue.' : `Replies go to ${activeChannel.label.toLowerCase()}.`}
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting || isConversationClosed}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1f3d2e] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,61,46,0.18)] transition hover:bg-[#2f5d50] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    <FiSend className="h-4 w-4" />
                    {isConversationClosed ? 'Closed' : isSubmitting ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={startConversation} className="space-y-3 rounded-[1.25rem] border border-[rgba(31,61,46,0.10)] bg-white p-3">
              <div className="grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6a3d]">Name</span>
                  <input
                    value={visitor.name}
                    onChange={(event) => setVisitor((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Your name"
                    className="rounded-[0.95rem] border border-[rgba(31,61,46,0.10)] bg-slate-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-[#8d98a0] focus:border-[#1f3d2e] focus:ring-4 focus:ring-[#cfe8d5]/50"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6a3d]">Email</span>
                  <input
                    type="email"
                    value={visitor.email}
                    onChange={(event) => setVisitor((current) => ({ ...current, email: event.target.value }))}
                    placeholder="you@example.com"
                    className="rounded-[0.95rem] border border-[rgba(31,61,46,0.10)] bg-slate-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-[#8d98a0] focus:border-[#1f3d2e] focus:ring-4 focus:ring-[#cfe8d5]/50"
                  />
                </label>
              </div>
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6a3d]">Company</span>
                <input
                  value={visitor.company}
                  onChange={(event) => setVisitor((current) => ({ ...current, company: event.target.value }))}
                  placeholder="Company name"
                  className="rounded-[0.95rem] border border-[rgba(31,61,46,0.10)] bg-slate-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-[#8d98a0] focus:border-[#1f3d2e] focus:ring-4 focus:ring-[#cfe8d5]/50"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6a3d]">Message</span>
                <textarea
                  rows={4}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Describe what you need..."
                  className="resize-none rounded-[1rem] border border-[rgba(31,61,46,0.10)] bg-slate-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-[#8d98a0] focus:border-[#1f3d2e] focus:ring-4 focus:ring-[#cfe8d5]/50"
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs leading-5 text-[#64706a]">
                  Your chat will be routed to {activeChannel.label.toLowerCase()}.
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1f3d2e] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,61,46,0.18)] transition hover:bg-[#2f5d50] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  <FiSend className="h-4 w-4" />
                  {isSubmitting ? 'Starting...' : 'Start chat'}
                </button>
              </div>
            </form>
          )}

          {error ? <p className="rounded-[1rem] bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{error}</p> : null}

          <div className="grid gap-2">
            <a
              href="https://wa.me/628990608878"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-[1rem] border border-[rgba(31,61,46,0.10)] bg-[#f4faf5] px-3 py-3 text-sm font-semibold text-[#1f2b24] transition hover:border-[#1f3d2e] hover:bg-[#edf7ef]"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1f3d2e] text-white">
                  <FiPhone className="h-4 w-4" />
                </span>
                WhatsApp chat
              </span>
              <FiArrowRight className="h-4 w-4 text-[#4f8f6c]" />
            </a>
            <a
              href="mailto:support@diworkin.com?subject=Diworkin%20Support%20Request"
              className="flex items-center justify-between rounded-[1rem] border border-[rgba(31,61,46,0.10)] bg-white px-3 py-3 text-sm font-semibold text-[#1f2b24] transition hover:border-[#1f3d2e] hover:bg-[#fbfcfa]"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#a9c88a] text-[#1f2b24]">
                  <FiMail className="h-4 w-4" />
                </span>
                Email support
              </span>
              <FiArrowRight className="h-4 w-4 text-[#4f8f6c]" />
            </a>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="group flex items-center gap-3 rounded-full border border-[rgba(31,61,46,0.10)] bg-white px-4 py-3 shadow-[0_18px_44px_rgba(31,61,46,0.14)] transition hover:-translate-y-0.5 hover:border-[#1f3d2e]"
        aria-label="Toggle support chat"
      >
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1f3d2e] via-[#2f5d50] to-[#4f8f6c] text-white shadow-[0_14px_34px_rgba(31,61,46,0.22)]">
          <FiMessageCircle className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#a9c88a]" />
        </span>
        <span className="pr-1 text-left">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b6a3d]">
            Need help?
          </span>
          <span className="block text-sm font-semibold text-[#1f2b24]">Chat with support</span>
        </span>
      </button>
    </div>
  );
}

function HeroVisual({ cartCount = 0 }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('top');
  const mobilePanelRef = useRef(null);
  const navLinkBase =
    'inline-flex items-center justify-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] transition-all duration-200';

  const bubbleCloud = [
    { left: '7%', top: '14%', size: '5.4rem', delay: '0s', duration: '18s', className: 'hero-bubble hero-bubble-down' },
    { left: '13%', top: '68%', size: '2.4rem', delay: '-4s', duration: '13s', className: 'hero-bubble hero-bubble-up' },
    { left: '20%', top: '26%', size: '3.2rem', delay: '-2.5s', duration: '15s', className: 'hero-bubble hero-bubble-down' },
    { left: '32%', top: '78%', size: '4.2rem', delay: '-6s', duration: '17s', className: 'hero-bubble hero-bubble-up' },
    { left: '45%', top: '18%', size: '2.8rem', delay: '-1.5s', duration: '14s', className: 'hero-bubble hero-bubble-down' },
    { left: '58%', top: '72%', size: '3.6rem', delay: '-5.5s', duration: '16s', className: 'hero-bubble hero-bubble-up' },
    { left: '69%', top: '23%', size: '2.2rem', delay: '-3.2s', duration: '12s', className: 'hero-bubble hero-bubble-down' },
    { left: '76%', top: '63%', size: '4.8rem', delay: '-7s', duration: '19s', className: 'hero-bubble hero-bubble-up' },
    { left: '85%', top: '12%', size: '3rem', delay: '-2s', duration: '14s', className: 'hero-bubble hero-bubble-down' },
    { left: '90%', top: '54%', size: '2rem', delay: '-4.8s', duration: '11s', className: 'hero-bubble hero-bubble-up' },
  ];

  useEffect(() => {
    const sectionIds = topNavItems.map((item) => item.sectionId);
    const sections = sectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter(Boolean);

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    const handlePointerDown = (event) => {
      const mobilePanel = mobilePanelRef.current;

      if (mobilePanel && !mobilePanel.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handlePointerDown);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target?.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        root: null,
        rootMargin: '-32% 0px -58% 0px',
        threshold: [0.08, 0.12, 0.18, 0.24, 0.34, 0.5, 0.72],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handlePointerDown);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id="top"
      className="hero-shell relative overflow-hidden bg-white"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.9),rgba(255,255,255,0.76)_24%,rgba(247,251,248,0.46)_50%,rgba(255,255,255,0)_76%)]"
      />
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(207,232,213,0.78),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(169,200,138,0.22),transparent_24%),radial-gradient(circle_at_50%_18%,rgba(79,143,108,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,251,248,0.82)_58%,rgba(207,232,213,0.22)_82%,rgba(31,61,46,0.08)_100%)]" />
      <div className="pointer-events-none absolute left-[-8rem] top-[8%] h-[32rem] w-[32rem] rounded-full bg-[#cfe8d5]/48 blur-[110px] hero-aurora" />
      <div className="pointer-events-none absolute right-[-9rem] top-[5%] h-[38rem] w-[38rem] rounded-full bg-[#a9c88a]/28 blur-[120px] hero-aurora hero-aurora-reverse" />
      <div className="pointer-events-none absolute left-1/2 top-[16%] h-[54vw] w-[118vw] -translate-x-1/2 rounded-full border border-dashed border-[rgba(31,61,46,0.12)] hero-ring" />
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-[34vw] w-[34vw] -translate-x-1/2 rounded-full border border-[rgba(31,61,46,0.08)] hero-holo-ring hero-holo-ring-1" />
      <div className="pointer-events-none absolute left-1/2 top-[34%] h-[48vw] w-[48vw] -translate-x-1/2 rounded-full border border-[rgba(169,200,138,0.10)] hero-holo-ring hero-holo-ring-2" />
      <div className="pointer-events-none absolute inset-0 hero-scanline" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-bubble-fog hero-bubble-fog-1" />
        <div className="hero-bubble-fog hero-bubble-fog-2" />
        <div className="hero-bubble-fog hero-bubble-fog-3" />
        <div className="hero-bubble-stream hero-bubble-stream-1" />
        <div className="hero-bubble-stream hero-bubble-stream-2" />
        <div className="hero-bubble-stream hero-bubble-stream-3" />
        <div className="hero-bubble-stream hero-bubble-stream-4" />
        <div className="hero-bubble-stream hero-bubble-stream-5" />
        <div className="hero-bubble-river" />
        <div className="hero-bubble-river hero-bubble-river-reverse" />
        <div className="hero-bubble-bloom hero-bubble-bloom-1" />
        <div className="hero-bubble-bloom hero-bubble-bloom-2" />
        <div className="hero-bubble-bloom hero-bubble-bloom-3" />
        <div className="hero-city-stage" aria-hidden="true">
          <div className="hero-city-track">
            <div className="hero-city-panel">
              <img src="/hero-city-bloom.png" alt="" className="hero-city-image" />
            </div>
            <div className="hero-city-panel" aria-hidden="true">
              <img src="/hero-city-bloom.png" alt="" className="hero-city-image" />
            </div>
          </div>
          <div className="hero-city-glow" />
        </div>
        {bubbleCloud.map((bubble, index) => (
          <span
            key={`${bubble.left}-${bubble.top}-${index}`}
            className="hero-bubble-frame"
            style={{
              left: bubble.left,
              top: bubble.top,
              width: bubble.size,
              height: bubble.size,
            }}
          >
            <span
              className={bubble.className}
              style={{
                animationDelay: bubble.delay,
                animationDuration: bubble.duration,
              }}
            />
          </span>
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <header className="relative flex items-center justify-between gap-4 py-5 sm:py-6">
          <a href="#" className="flex items-center gap-4">
            <span className="flex items-center gap-3 rounded-full border border-[rgba(31,61,46,0.08)] bg-white/95 px-3 py-2 shadow-[0_10px_30px_rgba(31,61,46,0.06)] backdrop-blur">
              <img
                src="/diworkin-mark-dark.png"
                alt="Diworkin"
                className="h-12 w-12 rounded-2xl object-contain sm:h-14 sm:w-14"
              />
              <span className="hidden sm:block">
                <span className="block text-base font-semibold leading-none text-[#1f2b24]">Diworkin</span>
                <span className="block text-[11px] font-medium tracking-[0.14em] text-[#64706a]">
                  Digital Work. Real Impact.
                </span>
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex xl:gap-8">
            {topNavItems.map((item) => {
              const isActive = activeSection === item.sectionId;

              return (
              <a
                key={item.label}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`${navLinkBase} ${
                  isActive
                    ? 'bg-[#f4faf5] text-[#1f3d2e] shadow-[0_12px_28px_rgba(31,61,46,0.08)] ring-1 ring-inset ring-[#1f3d2e]/10'
                    : 'text-[#1f2b24] hover:-translate-y-0.5 hover:bg-white hover:text-[#1f3d2e] hover:shadow-[0_12px_28px_rgba(31,61,46,0.05)]'
                }`}
              >
                {item.label}
              </a>
            );
            })}
          </nav>

          <div className="flex items-center gap-2 text-[#1f2b24]">
            <a
              href="/cart/pro"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(31,61,46,0.10)] bg-white transition hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
              aria-label="Open cart"
            >
              <FiShoppingCart className="h-4 w-4" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8b6a3d] px-1 text-[0.62rem] font-bold leading-none text-white shadow-[0_10px_20px_rgba(139,106,61,0.24)]">
                  {cartCount}
                </span>
              ) : null}
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen((state) => !state);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(31,61,46,0.10)] bg-white transition hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <FiX className="h-4 w-4" /> : <FiMenu className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <div className="relative z-20">
          {mobileMenuOpen && (
            <div
              ref={mobilePanelRef}
              className="absolute left-0 right-0 top-0 z-20 pt-1 xl:hidden"
            >
              <div className="rounded-[1.6rem] border border-[rgba(31,61,46,0.10)] bg-white/96 p-4 shadow-[0_28px_58px_rgba(31,61,46,0.12)] backdrop-blur">
                <div className="mt-4 grid gap-2">
                  {topNavItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={activeSection === item.sectionId ? 'page' : undefined}
                      className={`flex items-center justify-between rounded-[1rem] border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                        activeSection === item.sectionId
                          ? 'border-[#1f3d2e]/15 bg-[#f4faf5] text-[#1f3d2e] shadow-[0_10px_24px_rgba(31,61,46,0.08)]'
                          : 'border-[rgba(31,61,46,0.08)] bg-[#f8fbf7] text-[#1f2b24] hover:border-[#1f3d2e]/20 hover:bg-white hover:text-[#1f3d2e]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {activeSection === item.sectionId ? (
                        <span className="h-2 w-2 rounded-full bg-[#4f8f6c]" />
                      ) : null}
                    </a>
                  ))}
                  <a
                    href="/cart/pro"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-[1rem] border border-[rgba(31,61,46,0.08)] bg-[#f8fbf7] px-4 py-3 text-sm font-semibold text-[#1f2b24] transition-all duration-200 hover:border-[#1f3d2e]/20 hover:bg-white hover:text-[#1f3d2e]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="relative inline-flex h-6 w-6 items-center justify-center">
                        <FiShoppingCart className="h-4 w-4" />
                        {cartCount > 0 ? (
                          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8b6a3d] px-1 text-[0.58rem] font-bold leading-none text-white">
                            {cartCount}
                          </span>
                        ) : null}
                      </span>
                      Cart
                    </span>
                    <FiArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-h-[78vh] flex-col items-center justify-center pb-16 pt-10 text-center sm:pb-20 sm:pt-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(31,61,46,0.10)] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#1f3d2e] shadow-[0_12px_28px_rgba(31,61,46,0.06)] backdrop-blur">
            <FiZap className="h-3.5 w-3.5 text-[#4f8f6c]" />
            Hosting + branding + ai tools
          </p>

          <h1 className="mt-7 max-w-6xl text-5xl font-black tracking-[-0.04em] text-[#0b0f0d] sm:text-6xl md:text-7xl lg:text-[5.7rem] lg:leading-[1]">
            Build, launch,
            <br />
            and sell online.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-[#64706a] sm:text-lg">
            A single hosting stack for domains, websites, branding, and AI-ready launch tools.
            Everything you need to go live, sell faster, and look premium from day one.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href={`${panelUrl}/register`}
              className="inline-flex items-center justify-center rounded-full bg-[#1f3d2e] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(31,61,46,0.18)] transition hover:bg-[#153126]"
            >
              Start now
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(31,61,46,0.12)] bg-white px-7 py-3.5 text-sm font-semibold text-[#1f2b24] transition hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
            >
              View packages <FiArrowRight className="ml-2 inline h-4 w-4" />
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {[
              '99.9% uptime',
              'Fast installs',
              'Secure by default',
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[rgba(31,61,46,0.10)] bg-white/85 px-4 py-2 text-sm font-medium text-[#1f2b24] shadow-[0_14px_34px_rgba(31,61,46,0.06)] backdrop-blur"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ['Panel live', 'Control everything in one place.'],
              ['1-click installs', 'Launch WordPress and Laravel fast.'],
              ['Brand ready', 'Look premium from the start.'],
              ['AI assist', 'Move faster with smart tools.'],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="rounded-[1.5rem] border border-[rgba(31,61,46,0.10)] bg-white/88 px-4 py-4 text-left shadow-[0_14px_34px_rgba(31,61,46,0.06)] backdrop-blur"
              >
                <p className="text-sm font-semibold text-[#1f2b24]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[#64706a]">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-6 border-t border-dashed border-[rgba(31,61,46,0.12)] py-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#64706a]">
          <span>Creative agency</span>
          <span>Branding</span>
          <span>Hosting</span>
          <span>Websites</span>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const hideCursor = () => setCursor((state) => ({ ...state, visible: false }));
    window.addEventListener('blur', hideCursor);
    return () => window.removeEventListener('blur', hideCursor);
  }, []);

  useEffect(() => {
    const syncCartCount = () => {
      setCartCount(window.localStorage.getItem(CART_STORAGE_KEY) ? 1 : 0);
    };

    syncCartCount();
    window.addEventListener('storage', syncCartCount);

    return () => window.removeEventListener('storage', syncCartCount);
  }, []);

  const handlePointerMove = (event) => {
    setCursor({
      x: event.clientX,
      y: event.clientY,
      visible: true,
    });
  };

  return (
    <main
      className="relative min-h-screen overflow-x-hidden bg-white text-[#1f2b24]"
      onMouseMove={handlePointerMove}
      onMouseEnter={() => setCursor((state) => ({ ...state, visible: true }))}
      onMouseLeave={() => setCursor((state) => ({ ...state, visible: false }))}
    >
      <div
        className={`pointer-events-none fixed left-0 top-0 z-[999] hidden md:block ${cursor.visible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
          transition: 'transform 120ms ease-out, opacity 250ms ease-out',
        }}
      >
        <div className="absolute -left-8 -top-8 h-16 w-16 rounded-full border border-[#4f8f6c]/35 bg-[#cfe8d5]/15 blur-[1px]" />
        <div className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-[#1f3d2e] shadow-[0_0_0_6px_rgba(207,232,213,0.22)]" />
        <div className="absolute -left-5 -top-5 h-10 w-10 rounded-full border border-[#a9c88a]/60" />
      </div>

      <HeroVisual cartCount={cartCount} />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <section className="py-4 sm:py-6">
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {trustItems.map((item) => (
              <TrustChip key={item.label} item={item} />
            ))}
          </div>
        </section>

        <section id="products" className="py-8 sm:py-10">
          <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">ABOUT DIWORKIN</p>
              <h2 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.045em] text-[#0b0f0d] sm:text-6xl lg:text-[5.1rem] lg:leading-[0.95]">
                From concept to website, we help you ship.
              </h2>
            </div>

            <div className="max-w-xl xl:ml-auto xl:pt-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8b6a3d]">Simple. Clear. Ready.</p>
              <p className="mt-4 text-base leading-8 text-[#64706a] sm:text-lg">
                Start with the idea, add the brand, and go live with a website that feels ready to sell.
                We handle the hosting stack, visuals, and launch setup so you can focus on revenue.
              </p>
              <a
                href={`${panelUrl}/register`}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1f3d2e] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(31,61,46,0.2)] transition hover:bg-[#153126]"
              >
                Get started
                <FiArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-[1400px]">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              {portfolioTabs.map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    index === 0
                      ? 'bg-[#1f3d2e] text-white shadow-[0_12px_28px_rgba(31,61,46,0.16)]'
                      : 'border border-[rgba(31,61,46,0.10)] bg-white text-[#1f2b24] hover:border-[#1f3d2e] hover:text-[#1f3d2e]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {portfolioCards.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className={`group relative overflow-hidden rounded-[2rem] border border-[rgba(31,61,46,0.10)] bg-white shadow-[0_18px_44px_rgba(31,61,46,0.06)] transition-all duration-500 ease-out hover:z-20 hover:-translate-y-2 hover:shadow-[0_28px_60px_rgba(31,61,46,0.14)] ${item.featured ? 'aspect-[1.65/1] md:col-span-2 xl:col-span-2' : 'aspect-[0.93/1]'}` }
                >
                  <div className="relative h-full overflow-hidden bg-[#f5f6f1]">
                    {item.image ? (
                      <>
                        <img
                          src={item.image}
                          alt={item.title}
                          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_36%,rgba(15,23,20,0.12)_100%)]" />
                      </>
                    ) : (
                      <>
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.tone}`} />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_38%,rgba(31,61,46,0.03))]" />
                        <div className="absolute inset-0 grid place-items-center px-8">
                          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] border border-dashed border-[#cfe8d5] bg-white/55 text-[#1f3d2e] shadow-[0_18px_44px_rgba(31,61,46,0.06)] backdrop-blur">
                            <FiGrid className="h-10 w-10" />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-[#1f2b24] shadow-[0_10px_24px_rgba(31,61,46,0.12)] transition-transform duration-500 group-hover:scale-110">
                      <FiArrowRight className="h-5 w-5" />
                    </div>
                    <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] bg-white/96 p-4 shadow-[0_18px_36px_rgba(31,61,46,0.12)] backdrop-blur">
                      <p className="text-sm font-semibold text-[#1f2b24]">{item.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#64706a]">{item.subtitle}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="what-is" className="py-8 sm:py-10">
          <SectionTitle
            eyebrow="What is Diworkin"
            title="One platform for hosting, selling, and branding"
            description="You focus on the product and the sale. We handle the server, setup, visuals, and AI assist."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {platformFeatures.map((item) => (
              <FeatureCard key={item.title} title={item.title} body={item.body} icon={item.icon} tone={item.tone} />
            ))}
          </div>
        </section>

        <section id="faq" className="py-8 sm:py-10">
          <SectionTitle
            eyebrow="What you sell"
            title="All the digital products you can sell"
            description="Pick the format that fits your offer. Everything is presented in a cleaner, faster, and more convincing way."
          />
          <ProductCarousel items={productOptions} />
        </section>

        <section id="features" className="py-8 sm:py-10">
          <SectionTitle
            eyebrow="Core features"
            title="Every hosting feature you need"
            description="Domain, subdomains, email, DNS, SSL, databases, files, backups, and server access all live in one panel."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hostingFeatures.map((item) => (
              <HostingFeatureCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <SectionTitle eyebrow="Target use case" title="Who is it for?" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {audience.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.7rem] border border-[rgba(31,61,46,0.10)] bg-white p-6 shadow-[0_18px_44px_rgba(31,61,46,0.06)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b6a3d]">Audience</p>
                <h3 className="mt-3 text-lg font-semibold text-[#1f2b24]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#64706a]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <SectionTitle eyebrow="How it works" title="How to start" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((item) => (
              <WorkflowCard key={item.step} item={item} />
            ))}
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full border border-[rgba(31,61,46,0.10)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#1f3d2e] shadow-[0_12px_28px_rgba(31,61,46,0.06)]">
                Testimonial
              </p>
              <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.05em] text-[#0b0f0d] sm:text-5xl lg:text-[4.35rem] lg:leading-[0.94]">
                Chosen by builders growing online businesses worldwide.
              </h2>
            </div>

            <a
              href={`${panelUrl}/register`}
              className="inline-flex items-center justify-center rounded-full bg-[#0b0f0d] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(11,15,13,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1f3d2e]"
            >
              Contact Sales
            </a>
          </div>

          <TestimonialCarousel items={testimonials} />
        </section>

        <section id="pricing" className="py-8 sm:py-10">
          <SectionTitle
            eyebrow="Pricing"
            title="Pick the right plan"
            description="Choose a plan that fits your stage, from an entry package at $50 up to custom work starting at $1000+."
          />
          <PricingCarousel items={pricing} />
        </section>

        <section className="py-8 sm:py-10">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-[rgba(31,61,46,0.12)] bg-gradient-to-br from-[#153126] via-[#1f3d2e] to-[#4f8f6c] p-8 text-white shadow-[0_28px_70px_rgba(31,61,46,0.18)] sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(207,232,213,0.20),transparent_32%),radial-gradient(circle_at_82%_14%,rgba(255,255,255,0.12),transparent_22%),radial-gradient(circle_at_84%_82%,rgba(169,200,138,0.18),transparent_26%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:64px_64px]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-[#cfe8d5]" />
                  Final CTA
                </div>
                <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[3.35rem]">
                  Ready to launch online?
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
                  Start with hosting, deploy, and branding in one place. Build faster, look better, and sell with confidence.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={`${panelUrl}/register`}
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#173326] transition hover:bg-[#f3e8d5]"
                  >
                    Start free now
                  </a>
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/10 px-6 py-3 text-sm font-semibold text-white/92 backdrop-blur transition hover:bg-white/16"
                  >
                    View pricing
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/70">Launch stack</p>
                  <div className="mt-4 space-y-3">
                    {[
                      { label: 'Hosting + panel', value: 'Ready in minutes' },
                      { label: 'Branding + visuals', value: 'Looks premium' },
                      { label: 'Digital products', value: 'Ready to sell' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-[1.1rem] border border-white/10 bg-white/8 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <p className="mt-1 text-xs text-white/70">{item.value}</p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white">
                          <FiArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <SectionTitle
            eyebrow="FAQ"
            title="Common questions, answered"
            description="A quick overview for anyone who wants to start with Diworkin, launch fast, and keep the setup simple."
          />
          <div className="mt-6 flex w-full flex-col gap-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-[1.8rem] border border-[rgba(31,61,46,0.10)] bg-white p-6 shadow-[0_18px_44px_rgba(31,61,46,0.06)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                  <span className="text-lg font-semibold text-[#1f2b24]">{item.question}</span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(31,61,46,0.10)] bg-[#f4faf5] text-[#1f3d2e] transition group-open:rotate-180">
                    <FiChevronDown className="h-4 w-4" />
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-[#64706a]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

      </div>

      <footer id="contact" className="mt-8 w-full overflow-hidden border-y border-[rgba(31,61,46,0.10)] bg-gradient-to-br from-[#173326] via-[#1f3d2e] to-[#2f5d50] text-white shadow-[0_28px_70px_rgba(31,61,46,0.18)]">
        <div className="relative mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="pointer-events-none absolute right-[-4rem] top-[-2rem] h-64 w-64 rounded-full bg-[#4f8f6c]/20 blur-3xl" />
          <div className="pointer-events-none absolute left-[-3rem] bottom-[-4rem] h-72 w-72 rounded-full bg-[#a9c88a]/16 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-16 top-12 h-8 w-8 rounded-full bg-[#cfe8d5]/12 blur-sm" />

          <div className="relative flex flex-col gap-8 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Stay close to your launch</p>
              <h3 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Get product, hosting, and brand updates in one place.
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-white/72">
                Receive launch tips, product updates, and platform news for teams building online businesses with Diworkin.
              </p>
            </div>

            <form className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row lg:w-[32rem]">
              <label className="relative flex-1">
                <FiMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64706a]" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="h-14 w-full rounded-full border border-white/12 bg-white pl-11 pr-5 text-sm font-medium text-[#1f2b24] caret-[#1f2b24] outline-none placeholder:text-[#7a7a7a] focus:border-[#cfe8d5] focus:ring-4 focus:ring-[#cfe8d5]/20"
                />
              </label>
              <button
                type="button"
                className="inline-flex h-14 items-center justify-center rounded-full bg-[#a9c88a] px-6 text-sm font-semibold text-[#173326] transition hover:bg-[#cfe8d5]"
              >
                Subscribe
              </button>
            </form>
          </div>

          <div className="relative mt-8 grid gap-10 xl:grid-cols-[1.2fr_1.8fr] xl:items-start">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <img
                    src="/diworkin-mark-dark.png"
                    alt="Diworkin"
                    className="h-9 w-9 rounded-lg object-contain"
                  />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight">Diworkin</p>
                  <p className="text-sm text-white/65">Digital Work. Real Impact.</p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-8 text-white/72">
                Building hosting, product, and branding tools for people who want to launch fast and sell with confidence.
              </p>
              <div className="flex items-center gap-3">
                {[
                  FiInstagram,
                  FiTwitter,
                  FiYoutube,
                  FiMessageCircle,
                ].map((Icon) => (
                  <span
                    key={Icon.displayName || Icon.name}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white/80 transition hover:bg-white/14 hover:text-white"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/60">Company</p>
                <ul className="mt-4 space-y-3 text-sm text-white/80">
                  <li><a href="#what-is" className="transition hover:text-white">About Diworkin</a></li>
                  <li><a href="#features" className="transition hover:text-white">Hosting Features</a></li>
                  <li><a href="#pricing" className="transition hover:text-white">Pricing</a></li>
                  <li><a href={`${panelUrl}/register`} className="transition hover:text-white">Get Started</a></li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/60">Support</p>
                <ul className="mt-4 space-y-3 text-sm text-white/80">
                  <li><a href="#pricing" className="transition hover:text-white">Plans</a></li>
                  <li><a href="/license-check" className="transition hover:text-white">License Check</a></li>
                  <li><a href={`${panelUrl}/login`} className="transition hover:text-white">Panel Login</a></li>
                  <li><a href="#contact" className="transition hover:text-white">Contact</a></li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/60">Contact</p>
                <ul className="mt-4 space-y-4 text-sm text-white/80">
                  <li className="flex items-start gap-3">
                    <FiPhone className="mt-0.5 h-4 w-4 text-[#a9c88a]" />
                    <span>+62 812-0000-0000</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiMail className="mt-0.5 h-4 w-4 text-[#a9c88a]" />
                    <span>support@diworkin.com</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiMapPin className="mt-0.5 h-4 w-4 text-[#a9c88a]" />
                    <span>Indonesia, remote-first studio</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="relative mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Diworkin. Digital Work. Real Impact.</p>
            <div className="flex flex-wrap gap-5">
              <a href="#" className="transition hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="transition hover:text-white">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
      <SupportWidget />
    </main>
  );
}
