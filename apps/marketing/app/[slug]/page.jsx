import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  FiArrowRight,
  FiBookOpen,
  FiCode,
  FiCreditCard,
  FiGrid,
  FiHardDrive,
  FiHelpCircle,
  FiLayout,
  FiLink,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiMonitor,
  FiPackage,
  FiPenTool,
  FiPhone,
  FiShield,
  FiShoppingBag,
  FiSmartphone,
  FiStar,
  FiServer,
  FiUsers,
  FiGlobe,
} from 'react-icons/fi';

const panelUrl = process.env.NEXT_PUBLIC_PANEL_URL || 'https://panel.diworkin.com';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Why', href: '/why' },
  { label: 'Products', href: '/products' },
  { label: 'Hosting', href: '/hosting' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

const pageData = {
  why: {
    eyebrow: 'Why Diworkin',
    title: 'One launch stack for content, hosting, and brand work.',
    description:
      'Diworkin is built for creators and teams who want to move from idea to launch without stitching together separate tools for hosting, products, and presentation.',
    accent: 'from-[#f7fbf8] via-[#edf4ef] to-[#dbe8de]',
    icon: FiLayout,
    summaryTitle: 'What this page covers',
    summaryBody:
      'The platform brings together the parts most teams need on day one: a clear brand, a stable stack, and a way to sell digital products quickly.',
    bullets: [
      { icon: FiShoppingBag, title: 'Digital products', body: 'Package ebooks, courses, services, and memberships.' },
      { icon: FiShield, title: 'Safer setup', body: 'SSL, backups, and admin controls are part of the flow.' },
      { icon: FiStar, title: 'Premium feel', body: 'Pages and offers are designed to look polished from the start.' },
      { icon: FiServer, title: 'Operational control', body: 'Hosting, panel, and support live in the same ecosystem.' },
    ],
    stats: [
      { label: 'Audience', value: 'Creators & teams' },
      { label: 'Focus', value: 'Launch-ready' },
      { label: 'Outcome', value: 'Sell faster' },
    ],
  },
  products: {
    eyebrow: 'Products',
    title: 'Pages for ebooks, courses, services, and memberships.',
    description:
      'Each product page is a dedicated surface for a specific offer type, so buyers can understand the value quickly and take action without friction.',
    accent: 'from-[#fffaf2] via-[#f8f4ea] to-[#efe5d2]',
    icon: FiShoppingBag,
    summaryTitle: 'Product families',
    summaryBody:
      'Use the menu page to present the core offer types that Diworkin supports: downloadable products, packaged services, and recurring access.',
    products: [
      { icon: FiBookOpen, title: 'E-book', body: 'Premium digital downloads for guides, playbooks, and case studies.' },
      { icon: FiPenTool, title: 'Brand Kit', body: 'Visual identity assets, logos, color systems, and launch-ready files.' },
      { icon: FiBookOpen, title: 'Online Course', body: 'Structured learning products with strong presentation and clear modules.' },
      { icon: FiLayout, title: 'Digital Service', body: 'Package service offers into a clear, high-converting page.' },
      { icon: FiUsers, title: 'Membership', body: 'Recurring access for communities, content libraries, and support.' },
      { icon: FiSmartphone, title: 'Mobile App', body: 'App-like products that are easy to browse on smaller screens.' },
    ],
  },
  hosting: {
    eyebrow: 'Hosting',
    title: 'Everything you need to launch and manage the stack.',
    description:
      'The hosting page focuses on the operational side: domains, email, SSL, databases, files, backups, and access control for the sites you run.',
    accent: 'from-[#eef6ef] via-[#e7f0e7] to-[#d7e8da]',
    icon: FiServer,
    summaryTitle: 'Core controls',
    summaryBody:
      'This menu groups the infrastructure features that matter when the site is live and needs to stay online.',
    features: [
      { icon: FiGlobe, title: 'Domain management', body: 'Manage root domains and add-ons in one place.' },
      { icon: FiLink, title: 'Subdomains', body: 'Create and organize subdomains with minimal overhead.' },
      { icon: FiMonitor, title: 'Sites', body: 'Install WordPress, Laravel, and CodeIgniter quickly.' },
      { icon: FiMail, title: 'Email hosting', body: 'Mailbox and alias workflows for team communication.' },
      { icon: FiShield, title: 'SSL / HTTPS', body: 'Issue and renew certificates for safe browsing.' },
      { icon: FiGrid, title: 'Databases', body: 'Create and manage PostgreSQL, MariaDB, and MongoDB.' },
      { icon: FiCode, title: 'Shell access', body: 'Use folder-limited shell access for quick operations.' },
      { icon: FiHardDrive, title: 'Backup', body: 'Run backups with clear retention rules.' },
      { icon: FiUsers, title: 'Users & approval', body: 'Control permissions and team access.' },
      { icon: FiPackage, title: 'Packages', body: 'Set plans, quotas, and product limits.' },
    ],
  },
  pricing: {
    eyebrow: 'Pricing',
    title: 'Simple plans for launch, growth, branding, and scale.',
    description:
      'The pricing page can show a clean ladder of options, from a starting plan to a more complete package for teams that need more capacity.',
    accent: 'from-[#f8fafc] via-[#f0f4f1] to-[#e1ebe4]',
    icon: FiCreditCard,
    summaryTitle: 'Plan intent',
    summaryBody:
      'Each tier is framed around the outcome a buyer wants, not just the technical limit they receive.',
    plans: [
      { name: 'Basic', price: '$50', period: '/ month', points: ['1 website', 'Free SSL', 'Basic storage'], tone: 'border-slate-200 bg-white' },
      { name: 'Pro', price: '$199', period: '/ month', points: ['3 websites', 'Higher performance', 'Automatic backups'], tone: 'border-[#1f3d2e] bg-[#f4faf5]', badge: 'Recommended' },
      { name: 'Branding', price: '$499', period: '/ project', points: ['Visual identity', 'Landing page design', 'Product presentation'], tone: 'border-[#8b6a3d] bg-[#fcfaf6]', badge: 'New' },
      { name: 'Business', price: '$1000+', period: '/ month', points: ['Unlimited websites', 'Priority support', 'Advanced security'], tone: 'border-slate-200 bg-white' },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Questions people usually ask before they buy.',
    description:
      'This page answers the usual objections around setup, speed, licensing, and what the platform actually includes.',
    accent: 'from-[#f6fbf7] via-[#edf4ef] to-[#d9e6dc]',
    icon: FiHelpCircle,
    summaryTitle: 'Common questions',
    summaryBody:
      'The layout works best when the most important question has a short answer and a clear next step.',
    faqs: [
      { q: 'What does Diworkin include?', a: 'Hosting, domain tools, email, SSL, backups, databases, file manager, and a panel for managing launches.' },
      { q: 'Can I launch WordPress or Laravel quickly?', a: 'Yes. The panel is built for quick installs and guided setup.' },
      { q: 'Is this suitable for digital products?', a: 'Yes. E-books, courses, services, and memberships are all a good fit.' },
      { q: 'Does it support branding work too?', a: 'Yes. The product and brand pages are designed to present premium offers clearly.' },
    ],
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Talk to the team when you are ready to launch.',
    description:
      'Use this page for support, sales questions, or to send people into the panel and checkout flow.',
    accent: 'from-[#173326] via-[#1f3d2e] to-[#2f5d50]',
    icon: FiMessageCircle,
    summaryTitle: 'Reach us',
    summaryBody:
      'Keep the contact page direct. Give people the fastest path to the panel and a simple way to ask for help.',
    contacts: [
      { icon: FiPhone, label: 'Phone', value: '+62 812-0000-0000' },
      { icon: FiMail, label: 'Email', value: 'support@diworkin.com' },
      { icon: FiMapPin, label: 'Location', value: 'Indonesia, remote-first studio' },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(pageData).map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const page = pageData[params.slug];

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/${params.slug}`,
    },
  };
}

export default function MenuPage({ params }) {
  const page = pageData[params.slug];

  if (!page) {
    notFound();
  }

  const Icon = page.icon;

  return (
    <main className="min-h-screen bg-[#fbfcfa] text-[#1f2b24]">
      <div className="relative overflow-hidden">
        <div className={`absolute inset-x-0 top-0 h-[26rem] bg-gradient-to-br ${page.accent}`} />
        <div className="absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-white/35 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 py-5 sm:px-6 lg:px-10 xl:px-16">
          <header className="flex flex-wrap items-center justify-between gap-4 py-4">
            <Link href="/" className="flex items-center gap-4">
              <span className="flex items-center gap-3 rounded-full border border-[rgba(31,61,46,0.08)] bg-white/95 px-3 py-2 shadow-[0_10px_30px_rgba(31,61,46,0.06)] backdrop-blur">
                <img src="/diworkin-mark-dark.png" alt="Diworkin" className="h-12 w-12 rounded-2xl object-contain sm:h-14 sm:w-14" />
                <span className="hidden sm:block">
                  <span className="block text-base font-semibold leading-none text-[#1f2b24]">Diworkin</span>
                  <span className="block text-[11px] font-medium tracking-[0.14em] text-[#64706a]">Digital Work. Real Impact.</span>
                </span>
              </span>
            </Link>

            <nav className="hidden flex-wrap items-center gap-2 lg:flex">
              {navItems.map((item) => {
                const active = item.href === `/${params.slug}`;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? 'border-[#1f3d2e]/10 bg-[#1f3d2e] text-white shadow-[0_12px_28px_rgba(31,61,46,0.14)]'
                        : 'border-[rgba(31,61,46,0.08)] bg-white/90 text-[#1f2b24] hover:-translate-y-0.5 hover:border-[#1f3d2e]/20 hover:text-[#1f3d2e]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/license-check" className="rounded-full border border-[rgba(31,61,46,0.10)] bg-white px-4 py-2 text-sm font-semibold text-[#1f2b24] transition hover:border-[#1f3d2e]/20 hover:text-[#1f3d2e]">
                License Check
              </Link>
              <a href={`${panelUrl}/login`} className="inline-flex items-center gap-2 rounded-full bg-[#1f3d2e] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(31,61,46,0.18)] transition hover:bg-[#2f5d50]">
                Open Panel <FiArrowRight />
              </a>
            </div>
          </header>

          <section className="grid flex-1 gap-8 pb-8 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:pt-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(31,61,46,0.08)] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c] shadow-[0_12px_28px_rgba(31,61,46,0.05)]">
                <Icon className="h-4 w-4" />
                {page.eyebrow}
              </div>
              <h1 className="max-w-4xl text-4xl font-black tracking-[-0.045em] text-[#0b0f0d] sm:text-5xl lg:text-[4.8rem] lg:leading-[0.95]">
                {page.title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#4d5a54] sm:text-xl">
                {page.description}
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={`${panelUrl}/register`} className="inline-flex items-center gap-2 rounded-full bg-[#1f3d2e] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(31,61,46,0.18)] transition hover:bg-[#2f5d50]">
                  Get Started <FiArrowRight />
                </a>
                <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[rgba(31,61,46,0.12)] bg-white px-5 py-3 text-sm font-semibold text-[#1f2b24] transition hover:border-[#1f3d2e]/20 hover:text-[#1f3d2e]">
                  Back to home
                </Link>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-[rgba(31,61,46,0.10)] bg-white p-5 shadow-[0_20px_60px_rgba(31,61,46,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Overview</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#1f2b24]">{page.summaryTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-[#64706a]">{page.summaryBody}</p>
              <div className="mt-6 grid gap-3">
                {(page.stats || []).map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-[1.2rem] bg-[#f8fbf8] px-4 py-3 text-sm">
                    <span className="text-[#64706a]">{item.label}</span>
                    <span className="font-semibold text-[#1f2b24]">{item.value}</span>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="grid gap-6 pb-10 lg:grid-cols-2 xl:grid-cols-3">
            {(page.bullets || page.products || page.features || page.plans || page.faqs || page.contacts || []).map((item) => {
              if (page.plans) {
                return (
                  <article key={item.name} className={`rounded-[1.6rem] border p-5 shadow-[0_14px_40px_rgba(31,61,46,0.06)] ${item.tone}`}>
                    {item.badge ? <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#4f8f6c]">{item.badge}</span> : null}
                    <h3 className="mt-4 text-2xl font-semibold text-[#1f2b24]">{item.name}</h3>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-4xl font-black tracking-[-0.05em] text-[#0b0f0d]">{item.price}</span>
                      <span className="pb-1 text-sm font-medium text-[#64706a]">{item.period}</span>
                    </div>
                    <ul className="mt-5 space-y-3 text-sm text-[#4d5a54]">
                      {item.points.map((point) => (
                        <li key={point} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#4f8f6c]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              }

              if (page.faqs) {
                return (
                  <article key={item.q} className="rounded-[1.6rem] border border-[rgba(31,61,46,0.10)] bg-white p-5 shadow-[0_14px_40px_rgba(31,61,46,0.06)]">
                    <p className="text-lg font-semibold text-[#1f2b24]">{item.q}</p>
                    <p className="mt-3 text-sm leading-7 text-[#64706a]">{item.a}</p>
                  </article>
                );
              }

              if (page.contacts) {
                return (
                  <article key={item.label} className="rounded-[1.6rem] border border-white/10 bg-white/8 p-5 text-white shadow-[0_14px_40px_rgba(31,61,46,0.12)] backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-[#cfe8d5]">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">{item.label}</p>
                        <p className="mt-1 text-base font-semibold">{item.value}</p>
                      </div>
                    </div>
                  </article>
                );
              }

              return (
                <article key={item.title} className="rounded-[1.6rem] border border-[rgba(31,61,46,0.10)] bg-white p-5 shadow-[0_14px_40px_rgba(31,61,46,0.06)]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f4faf5] text-[#1f3d2e]">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-semibold text-[#1f2b24]">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#64706a]">{item.body}</p>
                </article>
              );
            })}
          </section>

          <section className={`mb-4 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${page.accent} p-6 shadow-[0_18px_50px_rgba(31,61,46,0.10)] ${page.contacts ? 'text-white' : 'text-[#1f2b24]'}`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${page.contacts ? 'text-white/60' : 'text-[#4f8f6c]'}`}>Next step</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Ready to move this menu into a live page?</h2>
                <p className={`mt-3 max-w-2xl text-sm leading-7 ${page.contacts ? 'text-white/75' : 'text-[#64706a]'}`}>
                  Keep the page focused, give it one clear action, and send users to the panel or checkout when they are ready.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={`${panelUrl}/register`} className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${page.contacts ? 'bg-white text-[#173326]' : 'bg-[#1f3d2e] text-white'}`}>
                  Open registration <FiArrowRight />
                </a>
                <Link href="/" className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold ${page.contacts ? 'border-white/20 bg-white/10 text-white' : 'border-[rgba(31,61,46,0.12)] bg-white text-[#1f2b24]'}`}>
                  Back to home
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
