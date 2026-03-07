import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration: number = 300;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const BUCKET = "manga-data";

/**
 * Normalize chapter slug: "chapter100" → "chapter-100", "chapter5.5" → "chapter-5-5"
 * Tetap mempertahankan slug yang sudah benar ("chapter-100" → "chapter-100")
 */
function normalizeChapterSlug(slug: string): string {
    // Match "chapter" diikuti langsung oleh angka (tanpa hyphen)
    // e.g. "chapter100", "chapter5", "chapter5.5"
    const match = slug.match(/^chapter(\d+(?:\.\d+)?)$/);
    if (match) {
        // Konversi ke format dengan hyphen, dan titik → hyphen
        return `chapter-${match[1].replace(/\./g, "-")}`;
    }
    return slug;
}

async function getJsonFromSupabase<T>(filePath: string): Promise<T | null> {
    const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
    if (error || !data) return null;
    try { return JSON.parse(await data.text()) as T; } catch { return null; }
}

async function uploadJsonToSupabase(filePath: string, data: unknown) {
    const { error } = await supabase.storage.from(BUCKET).upload(
        filePath,
        JSON.stringify(data, null, 2),
        { contentType: "application/json", upsert: true }
    );
    if (error) throw error;
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const { dryRun = false } = body as { dryRun?: boolean };

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const push = async (msg: string, extra?: object) => {
        try { await writer.write(encoder.encode(`data: ${JSON.stringify({ message: msg, ...extra })}\n\n`)); } catch { }
    };
    const pushDone = async (summary: object) => {
        try {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ success: true, summary })}\n\n`));
            await writer.close();
        } catch { }
    };
    const pushError = async (err: string) => {
        try {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ error: err })}\n\n`));
            await writer.close();
        } catch { }
    };

    (async () => {
        try {
            await push(`🧹 Cleanup chapters.json — ${dryRun ? "DRY RUN (tidak ada perubahan)" : "LIVE MODE"}`);

            // 1. List semua folder di bucket
            await push("📂 Mengambil daftar folder dari Supabase...");
            const folders: string[] = [];
            let offset = 0;
            const limit = 100;
            while (true) {
                const { data: items, error } = await supabase.storage
                    .from(BUCKET)
                    .list("", { limit, offset, sortBy: { column: "name", order: "asc" } });
                if (error) throw new Error(error.message);
                if (!items || items.length === 0) break;
                for (const item of items) {
                    const name: string = item.name ?? "";
                    if (name && !name.includes(".")) folders.push(name);
                }
                if (items.length < limit) break;
                offset += limit;
            }
            await push(`✅ Ditemukan ${folders.length} folder komik.`);

            // 2. Load global metadata
            await push("📖 Membaca all-manhwa-metadata.json...");
            type MetaEntry = { slug: string; total_chapters: number;[key: string]: unknown };
            const allMeta: MetaEntry[] = await getJsonFromSupabase<MetaEntry[]>("all-manhwa-metadata.json") ?? [];
            const metaMap = new Map<string, MetaEntry>(allMeta.map(m => [m.slug, m]));

            let fixedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            // 3. Process setiap folder
            for (let i = 0; i < folders.length; i++) {
                const slug = folders[i];

                try {
                    const chaptersData = await getJsonFromSupabase<any>(`${slug}/chapters.json`);
                    if (!chaptersData?.chapters || !Array.isArray(chaptersData.chapters) || chaptersData.chapters.length === 0) {
                        skippedCount++;
                        continue;
                    }

                    const originalLength = chaptersData.chapters.length;

                    // Dedup: normalize slug, lalu gunakan Map untuk dedup
                    // Prioritaskan entry dengan hyphen (chapter-X) karena itu format yang benar
                    // Jika ada dua entry untuk chapter yang sama, pilih yang punya images
                    const dedupMap = new Map<string, any>();

                    for (const ch of chaptersData.chapters) {
                        const normalizedSlug = normalizeChapterSlug(ch.slug);
                        const existing = dedupMap.get(normalizedSlug);

                        if (!existing) {
                            // Normalize slug dan title
                            dedupMap.set(normalizedSlug, {
                                ...ch,
                                slug: normalizedSlug,
                                title: ch.title.replace(/^(Chapter)(\d)/, "$1 $2"), // "Chapter100" → "Chapter 100"
                            });
                        } else {
                            // Sudah ada — pilih yang punya lebih banyak data (images)
                            const existingImages = existing.images?.length ?? 0;
                            const newImages = ch.images?.length ?? 0;
                            if (newImages > existingImages) {
                                dedupMap.set(normalizedSlug, {
                                    ...ch,
                                    slug: normalizedSlug,
                                    title: ch.title.replace(/^(Chapter)(\d)/, "$1 $2"),
                                });
                            }
                        }
                    }

                    const dedupedChapters = [...dedupMap.values()];
                    const removedCount = originalLength - dedupedChapters.length;

                    if (removedCount === 0) {
                        // Masih cek apakah ada slug yang perlu dinormalisasi
                        const needsNormalize = chaptersData.chapters.some((ch: any) =>
                            normalizeChapterSlug(ch.slug) !== ch.slug
                        );

                        if (!needsNormalize) {
                            skippedCount++;
                            continue;
                        }
                    }

                    await push(`🛠️ [${i + 1}/${folders.length}] ${slug}: ${originalLength} → ${dedupedChapters.length} chapters (${removedCount > 0 ? `-${removedCount} duplikat` : "normalize slugs"})`);

                    if (!dryRun) {
                        // Upload cleaned chapters.json
                        const cleanedData = {
                            ...chaptersData,
                            total_chapters: dedupedChapters.length,
                            chapters: dedupedChapters,
                        };
                        await uploadJsonToSupabase(`${slug}/chapters.json`, cleanedData);

                        // Update global metadata
                        const metaEntry = metaMap.get(slug);
                        if (metaEntry) {
                            metaEntry.total_chapters = dedupedChapters.length;
                            const latest = dedupedChapters.slice(-2).reverse().map((c: any) => ({
                                title: c.title, waktu_rilis: c.waktu_rilis, slug: c.slug
                            }));
                            (metaEntry as any).latestChapters = latest;
                        }
                    }

                    fixedCount++;
                } catch (e: any) {
                    await push(`   ❌ Error ${slug}: ${e.message}`);
                    errorCount++;
                }
            }

            // 4. Upload updated global metadata
            if (!dryRun && fixedCount > 0) {
                await push("\n☁️ Mengupload all-manhwa-metadata.json yang sudah diperbaiki...");
                const finalMeta = Array.from(metaMap.values());
                await uploadJsonToSupabase("all-manhwa-metadata.json", finalMeta);
                await push(`✅ all-manhwa-metadata.json diperbarui (${finalMeta.length} entri).`);
            }

            await push(`\n✅ Cleanup selesai! Fixed: ${fixedCount} | Skipped: ${skippedCount} | Errors: ${errorCount}`);
            await pushDone({ fixedCount, skippedCount, errorCount, mode: dryRun ? "dry_run" : "live" });

        } catch (err: any) {
            await pushError(err.message || "Unknown error");
        }
    })();

    return new NextResponse(stream.readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
