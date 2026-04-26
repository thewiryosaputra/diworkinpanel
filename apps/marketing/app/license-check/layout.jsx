export const metadata = {
  title: 'License Check',
  description:
    'Verify Diworkin license keys before installation. Check domain binding, product name, and license type.',
  alternates: {
    canonical: '/license-check',
  },
  openGraph: {
    title: 'License Check | Diworkin',
    description:
      'Verify Diworkin license keys before installation and confirm domain binding, product name, and license type.',
    url: 'https://diworkin.com/license-check',
    siteName: 'Diworkin',
    images: [
      {
        url: '/og-diworkin.svg',
        width: 1200,
        height: 630,
        alt: 'Diworkin license check page',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'License Check | Diworkin',
    description:
      'Verify Diworkin license keys before installation and confirm domain binding, product name, and license type.',
    images: ['/og-diworkin.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LicenseCheckLayout({ children }) {
  return children;
}
