import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/jelajahi`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/library`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/daftar-manhwa`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
    ]

    // Fetch dynamic manhwa pages
    try {
        const res = await fetch(`${baseUrl}/api/all_manhwa`)
        const manhwas = await res.json()

        const manhwaPages: MetadataRoute.Sitemap = manhwas.map((manhwa: any) => ({
            url: `${baseUrl}/detail/${manhwa.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

        return [...staticPages, ...manhwaPages]
    } catch (error) {
        console.error('Error generating sitemap:', error)
        return staticPages
    }
}
