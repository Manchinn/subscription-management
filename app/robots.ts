import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: ['/dashboard', '/subscriptions', '/settings', '/api'],
    },
    sitemap: 'https://chinnakrit.dev/sitemap.xml',
  }
}
