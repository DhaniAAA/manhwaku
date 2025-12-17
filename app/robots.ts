import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/_next/',
                    '/admin/',
                ],
                crawlDelay: 1, // Prevent aggressive crawling
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/api/'],
            },
            {
                userAgent: 'Googlebot-Image',
                allow: '/',
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
