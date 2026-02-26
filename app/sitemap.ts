import { MetadataRoute } from 'next'

interface ChapterItem {
    slug: string;
    waktu_rilis?: string;
}

interface ManhwaData {
    slug: string;
    total_chapters?: number;
    latestChapters?: { slug: string; waktu_rilis?: string }[];
}

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
        const manhwas: ManhwaData[] = await res.json()

        // Detail pages for each manhwa
        const manhwaPages: MetadataRoute.Sitemap = manhwas.map((manhwa) => ({
            url: `${baseUrl}/detail/${manhwa.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

        // Chapter pages - fetch chapters for each manhwa
        // Ambil 300 Manhwa terbaru
        const chapterPagesPromises = manhwas.slice(0, 250).map(async (manhwa) => {
            try {
                const chaptersRes = await fetch(`${baseUrl}/api/manhwa/${manhwa.slug}?type=chapters`)
                if (!chaptersRes.ok) return []

                const data = await chaptersRes.json()
                const chapters: ChapterItem[] = data.chapters || data || []

                return chapters.slice(0, 5).map((chapter) => {
                    // Safe date parsing
                    let lastModified = new Date()
                    if (chapter.waktu_rilis) {
                        const parsedDate = new Date(chapter.waktu_rilis)
                        if (!isNaN(parsedDate.getTime())) {
                            lastModified = parsedDate
                        }
                    }

                    return {
                        url: `${baseUrl}/read/${manhwa.slug}/${chapter.slug}`,
                        lastModified,
                        changeFrequency: 'monthly' as const,
                        priority: 0.5,
                    }
                })
            } catch {
                return []
            }
        })

        const chapterPagesArrays = await Promise.all(chapterPagesPromises)
        const chapterPages = chapterPagesArrays.flat()

        return [...staticPages, ...manhwaPages, ...chapterPages]
    } catch (error) {
        console.error('Error generating sitemap:', error)
        return staticPages
    }
}
