import './globals.css';

export const metadata = {
  metadataBase: new URL('https://diworkin.com'),
  title: {
    default: 'Diworkin | Hosting, Branding, and Digital Product Tools',
    template: '%s | Diworkin',
  },
  description:
    'Diworkin helps you launch, host, and sell online with a modern control panel, branding tools, email, SSL, backups, and AI-ready workflows.',
  applicationName: 'Diworkin',
  category: 'technology',
  keywords: [
    'Diworkin',
    'hosting panel',
    'website hosting',
    'digital product platform',
    'branding services',
    'WordPress hosting',
    'Laravel hosting',
    'CodeIgniter hosting',
    'email hosting',
    'SSL hosting',
    'website builder',
    'affiliate platform',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Diworkin | Hosting, Branding, and Digital Product Tools',
    description:
      'Launch and sell online with hosting, branding, email, SSL, backups, and a modern control panel built for creators and businesses.',
    url: 'https://diworkin.com',
    siteName: 'Diworkin',
    images: [
      {
        url: '/og-diworkin.svg',
        width: 1200,
        height: 630,
        alt: 'Diworkin hosting and branding platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diworkin | Hosting, Branding, and Digital Product Tools',
    description:
      'Hosting, branding, email, SSL, backups, and AI-ready workflows in one modern platform.',
    images: ['/og-diworkin.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://diworkin.com/#organization',
      name: 'Diworkin',
      url: 'https://diworkin.com',
      logo: 'https://diworkin.com/icon.png',
      sameAs: ['https://panel.diworkin.com'],
      description:
        'A hosting and branding platform for digital products, websites, and online businesses.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://diworkin.com/#website',
      url: 'https://diworkin.com',
      name: 'Diworkin',
      publisher: {
        '@id': 'https://diworkin.com/#organization',
      },
      inLanguage: 'en-US',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://diworkin.com/?s={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebPage',
      '@id': 'https://diworkin.com/#webpage',
      url: 'https://diworkin.com',
      name: 'Diworkin | Hosting, Branding, and Digital Product Tools',
      isPartOf: {
        '@id': 'https://diworkin.com/#website',
      },
      about: {
        '@id': 'https://diworkin.com/#organization',
      },
      description:
        'Hosting, branding, email, SSL, backups, and AI-ready workflows in one platform.',
      inLanguage: 'en-US',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://diworkin.com/#softwareapplication',
      name: 'Diworkin Panel',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://panel.diworkin.com',
      publisher: {
        '@id': 'https://diworkin.com/#organization',
      },
      description:
        'A modern hosting control panel for launching websites, managing email, SSL, backups, databases, and digital products.',
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
