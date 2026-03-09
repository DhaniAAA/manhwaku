import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// ─── Config ─────────────────────────────────────────────────────────────────
const BUCKET = 'manga-data'
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://manhwaku.biz.id').replace(/\/$/, '')

// Cache sitemap 1 jam — aman karena sitemap2 fetch banyak file dari Supabase
// Google hanya butuh sitemap fresh 1x per hari, 1 jam sudah lebih dari cukup
export const revalidate = 3600

// Berapa manhwa yang diproses bersamaan saat fetch chapters.json
// Terlalu tinggi → rate limit Supabase, terlalu rendah → lambat
const CONCURRENT_CHAPTER_FETCH = 15

const ALL_GENRES = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
    "Martial Arts", "Mystery", "Romance", "Sci-Fi", "Slice of Life",
    "Sports", "Supernatural", "Thriller", "Tragedy", "Historical",
    "Psychological", "School Life", "Seinen", "Shoujo", "Shounen", "Josei",
    "Harem", "Isekai", "Ecchi", "Gore", "Mature", "Adult"
]

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChapterItem {
    slug: string
    waktu_rilis?: string
    // (images dan field lain sengaja diabaikan — tidak perlu untuk sitemap)
}

interface ChaptersFile {
    slug?: string
    chapters?: ChapterItem[]
}

interface ManhwaMetadata {
    slug: string
    title?: string
    total_chapters?: number
    latestChapters?: ChapterItem[]
    updated_at?: string
}

// ─── Supabase ────────────────────────────────────────────────────────────────
function createSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

/** Ambil daftar semua manhwa dari Supabase storage (1 request saja) */
async function fetchAllManhwa(): Promise<ManhwaMetadata[]> {
    try {
        const { data, error } = await createSupabase().storage
            .from(BUCKET)
            .download('all-manhwa-metadata.json')

        if (error || !data) {
            console.error('[Sitemap] fetchAllManhwa error:', error?.message)
            return []
        }
        const json = JSON.parse(await data.text())
        return Array.isArray(json) ? json : []
    } catch (err) {
        console.error('[Sitemap] fetchAllManhwa exception:', err)
        return []
    }
}

/**
 * Ambil SEMUA chapter dari chapters.json per manhwa.
 * Hanya ekstrak slug + waktu_rilis — data gambar diabaikan.
 */
async function fetchChaptersForManhwa(slug: string): Promise<ChapterItem[]> {
    try {
        const { data, error } = await createSupabase().storage
            .from(BUCKET)
            .download(`${slug}/chapters.json`)

        if (error || !data) return []

        const json: ChaptersFile | ChapterItem[] = JSON.parse(await data.text())

        // chapters.json bisa berupa array langsung atau object { chapters: [...] }
        const raw: ChapterItem[] = Array.isArray(json)
            ? json
            : (json as ChaptersFile).chapters ?? []

        // Hanya ambil field yang dibutuhkan sitemap (hemat memori)
        return raw.map(ch => ({ slug: ch.slug, waktu_rilis: ch.waktu_rilis }))
    } catch {
        return []
    }
}

/**
 * Proses array items secara paralel dengan batas concurrency.
 * Mencegah terlalu banyak request sekaligus ke Supabase.
 */
async function batchFetch<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    concurrency: number
): Promise<R[]> {
    const results: R[] = []
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency)
        const settled = await Promise.allSettled(batch.map(fn))
        for (const r of settled) {
            if (r.status === 'fulfilled') results.push(r.value)
        }
    }
    return results
}

// Safe date parser
function parseDate(dateStr?: string): Date {
    if (!dateStr) return new Date()
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? new Date() : d
}

// ─── Sitemap split ────────────────────────────────────────────────────────────
// ID 0 → Halaman statis + genre (cepat, tanpa Supabase)
// ID 1 → Semua halaman detail manhwa
// ID 2 → Semua halaman chapter (ALL chapters, bukan cuma 5!)

export async function generateSitemaps() {
    return [
        { id: 0 }, // static + genre
        { id: 1 }, // detail manhwa
        { id: 2 }, // ALL chapter pages
    ]
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default async function sitemap(
    { id }: { id: number }
): Promise<MetadataRoute.Sitemap> {

    // ── Sitemap 0: Static + Genre ────────────────────────────────────────────
    if (id === 0) {
        const staticPages: MetadataRoute.Sitemap = [
            { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
            { url: `${BASE_URL}/daftar-manhwa`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
            { url: `${BASE_URL}/jelajahi`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
            { url: `${BASE_URL}/library`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
        ]
        const genrePages: MetadataRoute.Sitemap = ALL_GENRES.map(genre => ({
            url: `${BASE_URL}/genre/${genre.toLowerCase().replace(/\s+/g, '-')}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }))
        return [...staticPages, ...genrePages]
    }

    // ── Fetch daftar manhwa (dipakai oleh id=1 dan id=2) ─────────────────────
    const manhwas = await fetchAllManhwa()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // ── Sitemap 1: Manhwa Detail Pages ───────────────────────────────────────
    if (id === 1) {
        return manhwas.map(manhwa => {
            const latestDate = manhwa.latestChapters?.[0]?.waktu_rilis
            const lastModified = parseDate(latestDate ?? manhwa.updated_at)
            const isActive = lastModified > thirtyDaysAgo

            const priority = (manhwa.total_chapters ?? 0) > 100 ? 0.9
                : (manhwa.total_chapters ?? 0) > 30 ? 0.8
                    : 0.7

            return {
                url: `${BASE_URL}/detail/${manhwa.slug}`,
                lastModified,
                changeFrequency: isActive ? 'daily' as const : 'weekly' as const,
                priority,
            }
        })
    }

    // ── Sitemap 2: ALL Chapter Pages ─────────────────────────────────────────
    // Fetch chapters.json per manhwa langsung dari Supabase
    // revalidate=3600 → proses ini hanya jalan 1x per jam, bukan tiap request
    if (id === 2) {
        console.log(`[Sitemap/2] Fetching chapters for ${manhwas.length} manhwa...`)

        // Batch fetch semua chapters.json secara paralel
        const chapterResults = await batchFetch(
            manhwas,
            async (manhwa) => {
                const chapters = await fetchChaptersForManhwa(manhwa.slug)
                return { manhwaSlug: manhwa.slug, chapters }
            },
            CONCURRENT_CHAPTER_FETCH
        )

        const chapterEntries: MetadataRoute.Sitemap = []

        for (const { manhwaSlug, chapters } of chapterResults) {
            for (const chapter of chapters) {
                if (!chapter.slug) continue

                const lastModified = parseDate(chapter.waktu_rilis)
                const isRecent = lastModified > thirtyDaysAgo

                chapterEntries.push({
                    url: `${BASE_URL}/read/${manhwaSlug}/${chapter.slug}`,
                    lastModified,
                    changeFrequency: isRecent ? 'weekly' as const : 'monthly' as const,
                    priority: isRecent ? 0.8 : 0.5,
                })
            }
        }

        console.log(`[Sitemap/2] Total chapter URLs: ${chapterEntries.length}`)
        return chapterEntries
    }

    return []
}
