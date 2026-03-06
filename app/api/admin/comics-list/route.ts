import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = "manga-data";
const META_FILE = "all-manhwa-metadata.json";
const KOMIKINDO_BASE = "https://komikindo.ch/komik";

async function getJsonFromSupabase<T>(filePath: string): Promise<T | null> {
    const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
    if (error || !data) return null;
    try { return JSON.parse(await data.text()) as T; } catch { return null; }
}

export async function GET() {
    try {
        // Sumber tunggal: all-manhwa-metadata.json dari Supabase
        const allMeta = await getJsonFromSupabase<Array<{
            slug: string;
            title: string;
            cover_url: string;
            type: string;
            status: string;
            total_chapters: number;
            latestChapters: Array<{ title: string; waktu_rilis: string; slug: string }>;
            lastUpdateTime: string;
            genres: string[];
            genre: string;
        }>>(META_FILE);

        if (!allMeta) {
            return NextResponse.json({ error: `${META_FILE} not found in Supabase` }, { status: 404 });
        }

        // Deduplicate by slug
        const seenSlugs = new Set<string>();
        const comics = allMeta
            .filter(m => {
                if (!m.slug || seenSlugs.has(m.slug)) return false;
                seenSlugs.add(m.slug);
                return true;
            })
            .map(m => ({
                title: m.title,
                slug: m.slug,
                link: `${KOMIKINDO_BASE}/${m.slug}/`,
                image: m.cover_url || "",
                type: m.type || "Manhwa",
                status: m.status || "Berjalan",
                inSupabase: true,   // semua di metadata = sudah di Supabase
                totalChapters: m.total_chapters ?? 0,
                lastUpdated: m.lastUpdateTime ?? null,
                latestChapter: m.latestChapters?.[0]?.title ?? null,
                genres: m.genres ?? [],
            }));

        return NextResponse.json({
            total: comics.length,
            synced: comics.length,
            notSynced: 0,
            comics,
        });
    } catch (err: any) {
        console.error("[admin/comics-list]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
