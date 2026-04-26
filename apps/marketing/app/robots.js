export const dynamic = 'force-static';

export default function robots() {
  const baseUrl = 'https://diworkin.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
