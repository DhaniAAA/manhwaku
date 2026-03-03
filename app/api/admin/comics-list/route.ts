import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = "manga-data";
const COMICS_LIST_FILE = "komikindo_scrape_results.json";

/** Normalize slug the same way the scraper does */
function normalizeSlug(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function getJsonFromSupabase<T>(filePath: string): Promise<T | null> {
    const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
    if (error || !data) return null;
    try { return JSON.parse(await data.text()) as T; } catch { return null; }
}

export async function GET() {
    try {
        // Load comics list from Supabase Storage
        const comicsList = await getJsonFromSupabase<
            Array<{ Title: string; Link: string; Slug: string; Image: string; Type: string }>
        >(COMICS_LIST_FILE);

        if (!comicsList) {
            return NextResponse.json({ error: "komikindo_scrape_results.json not found in Supabase" }, { status: 404 });
        }

        // Get all-manhwa-metadata for sync status
        const allMeta = await getJsonFromSupabase<
            Array<{ slug: string; total_chapters: number; latestChapters: any[]; lastUpdateTime: string }>
        >("all-manhwa-metadata.json") ?? [];

        // Build lookup map using normalized slugs
        const metaMap = new Map(allMeta.map((m) => [normalizeSlug(m.slug), m]));

        // Merge + deduplicate by slug
        const seenSlugs = new Set<string>();
        const merged = comicsList
            .map((comic) => {
                const slug = normalizeSlug(comic.Slug || comic.Title);
                const supabaseMeta = metaMap.get(slug);
                return {
                    title: comic.Title,
                    link: comic.Link,
                    slug,
                    image: comic.Image,
                    type: comic.Type,
                    inSupabase: !!supabaseMeta,
                    totalChapters: supabaseMeta?.total_chapters ?? 0,
                    lastUpdated: supabaseMeta?.lastUpdateTime ?? null,
                    latestChapter: supabaseMeta?.latestChapters?.[0]?.title ?? null,
                };
            })
            .filter((comic) => {
                if (seenSlugs.has(comic.slug)) return false;
                seenSlugs.add(comic.slug);
                return true;
            });

        return NextResponse.json({
            total: merged.length,
            synced: merged.filter((c) => c.inSupabase).length,
            notSynced: merged.filter((c) => !c.inSupabase).length,
            comics: merged,
        });
    } catch (err: any) {
        console.error("[admin/comics-list]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
