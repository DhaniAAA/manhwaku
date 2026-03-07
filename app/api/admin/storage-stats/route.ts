import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const BUCKET = "manga-data";
const META_FILE = "all-manhwa-metadata.json";

async function getJson<T>(path: string): Promise<T | null> {
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) return null;
    try { return JSON.parse(await data.text()) as T; } catch { return null; }
}

/**
 * Normalisasi slug untuk perbandingan fuzzy.
 * Menangani perbedaan format apostrof antar versi sanitizeSlug:
 *   "margrave-s-bastard-..." (apostrof→spasi→hyphen, versi baru)
 *   "margraves-bastard-..."  (apostrof dihapus langsung, versi lama)
 * Keduanya dinormalisasi menjadi "margraves-bastard-..."
 */
function normalizeSlug(slug: string): string {
    return slug
        .toLowerCase()
        .replace(/-s-/g, "s-")      // "margrave-s-" → "margraves-"
        .replace(/-s$/g, "s")       // trailing "-s" → "s"
        .replace(/'/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export async function GET() {
    try {
        // 1. Baca all-manhwa-metadata.json sebagai referensi daftar komik
        const allMeta = await getJson<any[]>(META_FILE);
        if (!allMeta) {
            return NextResponse.json({ error: `${META_FILE} tidak ditemukan` }, { status: 404 });
        }
        const totalInMeta = allMeta.length;

        // 2. List semua folder di root bucket
        //    File (mis. all-manhwa-metadata.json) dikenali dari ekstensi dan di-skip.
        const folderSlugs = new Set<string>();
        let offset = 0;
        const PAGE = 1000;
        while (true) {
            const { data, error } = await supabase.storage.from(BUCKET).list("", {
                limit: PAGE, offset,
                sortBy: { column: "name", order: "asc" },
            });
            if (error || !data) break;
            data.forEach(item => {
                if (!item.name.includes(".")) folderSlugs.add(item.name);
            });
            if (data.length < PAGE) break;
            offset += PAGE;
        }
        const totalFolders = folderSlugs.size;

        // 3. Build index metadata — exact slug dan normalized slug
        const seenSlugs = new Set<string>();
        const normalizedMetaSlugs = new Map<string, string>(); // normalized → originalSlug

        const comics = allMeta
            .filter(m => {
                if (!m.slug || seenSlugs.has(m.slug)) return false;
                seenSlugs.add(m.slug);
                normalizedMetaSlugs.set(normalizeSlug(m.slug), m.slug);
                return true;
            })
            .map(m => ({
                slug: m.slug,
                title: m.title,
                image: m.cover_url || "",
                type: m.type || "Manhwa",
                status: m.status || "Berjalan",
                totalChapters: m.total_chapters ?? 0,
                lastUpdated: m.lastUpdateTime ?? null,
                latestChapter: m.latestChapters?.[0]?.title ?? null,
                genres: m.genres ?? [],
                hasFolder: folderSlugs.has(m.slug),
                hasChapters: (m.total_chapters ?? 0) > 0,
                inSupabase: folderSlugs.has(m.slug),
                link: `https://komikindo.ch/komik/${m.slug}/`,
            }));

        // 4. Klasifikasi tiap folder di storage:
        //    - exact match  → aman, slug sama persis
        //    - near match   → slug mismatch (komik sama, format slug berbeda)
        //    - true orphan  → tidak ada di metadata sama sekali
        const slugMismatch: Array<{ storageSlug: string; metaSlug: string }> = [];
        const trueOrphans: string[] = [];

        folderSlugs.forEach(storageSlug => {
            if (seenSlugs.has(storageSlug)) return; // exact match → ok
            const matched = normalizedMetaSlugs.get(normalizeSlug(storageSlug));
            if (matched) {
                slugMismatch.push({ storageSlug, metaSlug: matched });
            } else {
                trueOrphans.push(storageSlug);
            }
        });

        // 5. Hitung statistik
        // "Efektif ada folder" = exact match ATAU near-match (slug mismatch)
        const effectivelyFoldered = comics.filter(c =>
            c.hasFolder || slugMismatch.some(m => m.metaSlug === c.slug)
        ).length;
        const withChapters = comics.filter(c => c.hasChapters).length;
        const withoutChapters = comics.filter(c => !c.hasChapters).length;

        return NextResponse.json({
            totalInMeta,
            totalFolders,
            withFolder: effectivelyFoldered,
            withoutFolder: totalInMeta - effectivelyFoldered,
            withChapters,
            withoutChapters,
            // True orphan = folder di storage tanpa komik apapun yang cocok
            orphanFolders: trueOrphans,
            orphanCount: trueOrphans.length,
            // Slug mismatch = folder ada tapi namanya beda dari slug di metadata
            slugMismatch,
            slugMismatchCount: slugMismatch.length,
            pctFoldered: totalInMeta > 0 ? Math.round((effectivelyFoldered / totalInMeta) * 100) : 0,
            pctChaptered: totalInMeta > 0 ? Math.round((withChapters / totalInMeta) * 100) : 0,
            comics,
        });
    } catch (err: any) {
        console.error("[storage-stats]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
