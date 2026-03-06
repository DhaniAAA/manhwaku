import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";
export const maxDuration: number = 300;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const BUCKET = "manga-data";
const META_FILE = "all-manhwa-metadata.json";
const KOMIKINDO_BASE = "https://komikindo.ch/komik";

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

const getHeaders = () => ({
    "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    Referer: "https://komikindo.ch/",
    Connection: "keep-alive",
});

function sanitizeSlug(text: string) {
    return text
        .toLowerCase()
        .replace(/'/g, " ")
        .replace(/[^\w\s-]/g, " ")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function convertRelativeToIso(relativeStr: string) {
    if (!relativeStr) return new Date().toISOString();
    const match = relativeStr.match(/(\d+)\s+(year|month|week|day|hour|minute)s?\s+ago/i);
    if (!match) return new Date().toISOString();
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const date = new Date();
    if (unit === "year") date.setFullYear(date.getFullYear() - amount);
    else if (unit === "month") date.setMonth(date.getMonth() - amount);
    else if (unit === "week") date.setDate(date.getDate() - amount * 7);
    else if (unit === "day") date.setDate(date.getDate() - amount);
    else if (unit === "hour") date.setHours(date.getHours() - amount);
    else if (unit === "minute") date.setMinutes(date.getMinutes() - amount);
    return date.toISOString();
}

async function fetchHtml(url: string) {
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
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

type MetaEntry = {
    slug: string;
    title: string;
    cover_url: string;
    type: string;
    status?: string;
    total_chapters: number;
    latestChapters: Array<{ title: string; waktu_rilis: string; slug: string }>;
    lastUpdateTime: string;
    genres?: string[];
    genre?: string;
    [key: string]: unknown;
};

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const {
        mode = "not_synced",
        delayMs = 1500,
        maxPerRun = 50,
        scrapeImages = false,
        concurrency = 3,
    } = body as {
        mode?: "all" | "not_synced";
        delayMs?: number;
        maxPerRun?: number;
        scrapeImages?: boolean;
        concurrency?: number;
    };

    // Clamp concurrency ke range aman (1–6)
    const workers = Math.max(1, Math.min(concurrency, 6));

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const push = async (msg: string, extra?: object) => {
        try { await writer.write(encoder.encode(`data: ${JSON.stringify({ message: msg, ...extra })}\n\n`)); } catch { }
    };
    const pushProgress = async (current: number, total: number, slug: string, status: "running" | "done" | "skip" | "error") => {
        try { await writer.write(encoder.encode(`data: ${JSON.stringify({ progress: { current, total, slug, status } })}\n\n`)); } catch { }
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
            await push("📖 Membaca all-manhwa-metadata.json dari Supabase...");
            const allMeta: MetaEntry[] = await getJsonFromSupabase<MetaEntry[]>(META_FILE) ?? [];
            if (allMeta.length === 0) throw new Error(`${META_FILE} tidak ditemukan di Supabase bucket '${BUCKET}'`);

            // Deduplicate by slug
            const seenSlugs = new Set<string>();
            const allComics = allMeta
                .filter(m => { if (!m.slug || seenSlugs.has(m.slug)) return false; seenSlugs.add(m.slug); return true; })
                .map(m => ({
                    slug: m.slug,
                    title: m.title,
                    link: `${KOMIKINDO_BASE}/${m.slug}/`,
                    type: m.type ?? "Manhwa",
                    totalChapters: m.total_chapters ?? 0,
                }));

            const toScrape = mode === "not_synced"
                ? allComics.filter(c => c.totalChapters === 0)
                : allComics;

            const limited = toScrape.slice(0, maxPerRun);
            await push(`✅ Mode: ${mode === "not_synced" ? "Belum Ada Chapter" : "Semua"} | ${limited.length} komik akan di-scrape (dari ${toScrape.length} total)`);
            await push(`⚙️ Concurrency: ${workers} | Delay antar batch: ${delayMs}ms | Max: ${maxPerRun} | Gambar: ${scrapeImages ? "Ya" : "Tidak"}`);

            let successCount = 0;
            let skipCount = 0;
            let errorCount = 0;
            const currentAllMeta: any[] = [...allMeta];

            // ─── Per-comic scrape function ─────────────────────────────────────
            const scrapeOne = async (comic: typeof limited[0], globalIdx: number) => {
                await push(`\n🔄 [${globalIdx + 1}/${limited.length}] Scraping: ${comic.title}`);
                await pushProgress(globalIdx + 1, limited.length, comic.slug, "running");

                try {
                    // 1. Fetch halaman komik dari web
                    const html = await fetchHtml(comic.link);
                    const $ = cheerio.load(html);

                    const titleRaw = $("h1.entry-title").text().trim();
                    const title = titleRaw.replace(/^Komik\s*/i, "").trim() || comic.title;
                    const slug = comic.slug; // Selalu pakai slug dari metadata, bukan dari title
                    const cover_url = $(".thumb img").attr("src") || $(".thumb img").attr("data-src") || "";

                    const genres: string[] = [];
                    $(".genre-info a").each((_, el) => { genres.push($(el).text().trim()); });

                    // Synopsis — sesuai struktur HTML komikindo
                    let synopsis = $('[itemprop="description"]').text().trim()
                        || $(".entry-content-single").text().trim();
                    if (!synopsis) synopsis = $(".entry-content p").first().text().trim();
                    synopsis = synopsis.replace(/\s+/g, " ").trim();
                    synopsis = synopsis.replace(/^(Manhwa|Manhua|Manga)\s+.+?yang dibuat oleh komikus?\s*(?:bernama)?\s*.+?(?:bercerita tentang|ini bercerita tentang)\s*/i, "").trim();
                    if (synopsis.length < 10) synopsis = "";

                    const metadata: Record<string, string> = {};
                    $(".spe span").each((_, el) => {
                        const text = $(el).text().trim();
                        if (text.includes("Status:")) metadata["Status"] = text.replace("Status:", "").trim();
                        if (text.includes("Jenis Komik:")) metadata["Type"] = $(el).find("a").text().trim();
                        if (text.includes("Pengarang:")) metadata["Author"] = text.replace("Pengarang:", "").trim();
                        if (text.includes("Ilustrator:")) metadata["Ilustrator"] = text.replace("Ilustrator:", "").trim();
                    });

                    // Parse chapter list dari HTML (sebelum request ke Supabase)
                    const chaptersRaw: any[] = [];
                    $("#chapter_list ul li").each((_, el) => {
                        const a = $(el).find(".lchx a");
                        if (a.length > 0) {
                            chaptersRaw.push({
                                chapter: a.text().trim(),
                                link: a.attr("href") || "",
                                waktu_rilis: convertRelativeToIso($(el).find(".dt").text().trim()),
                            });
                        }
                    });
                    const chapters = chaptersRaw.reverse();

                    // 2. Fetch metadata.json & chapters.json dari Supabase secara PARALEL
                    const [existingMeta, existingData] = await Promise.all([
                        getJsonFromSupabase<any>(`${slug}/metadata.json`),
                        getJsonFromSupabase<any>(`${slug}/chapters.json`),
                    ]);

                    // Fallback synopsis dari data lama jika scrape kosong
                    if (!synopsis && existingMeta?.synopsis) {
                        synopsis = existingMeta.synopsis;
                        await push(`   ℹ️ Synopsis kosong dari web, pakai synopsis lama.`);
                    }

                    const existingChapterSlugs = new Set<string>(
                        existingData?.chapters?.map((c: any) => c.slug) ?? []
                    );
                    const newChapters = chapters.filter(c => !existingChapterSlugs.has(sanitizeSlug(c.chapter)));

                    await push(`   → ${chapters.length} chapter di web | ${existingChapterSlugs.size} sudah tersimpan`);

                    if (newChapters.length === 0 && existingData) {
                        await push(`   ℹ️ Tidak ada chapter baru.`);
                        skipCount++;
                        await pushProgress(globalIdx + 1, limited.length, slug, "skip");
                    } else {
                        let chapterDataList: any[] = existingData?.chapters ? [...existingData.chapters] : [];

                        if (scrapeImages) {
                            for (const ch of newChapters) {
                                const chSlug = sanitizeSlug(ch.chapter);
                                try {
                                    const chHtml = await fetchHtml(ch.link);
                                    const $ch = cheerio.load(chHtml);
                                    const images: string[] = [];
                                    for (const sel of ["#chimg-auh img", ".chapter-image img", "#Baca_Komik img", ".img-landmine img", ".main-reading-area img"]) {
                                        $ch(sel).each((_, img) => { const src = $ch(img).attr("src"); if (src?.startsWith("http")) images.push(src); });
                                        if (images.length > 0) break;
                                    }
                                    await push(`   ✓ ${ch.chapter}: ${images.length} gambar`);
                                    chapterDataList.push({ slug: chSlug, title: ch.chapter, url: ch.link, waktu_rilis: ch.waktu_rilis, total_images: images.length, images });
                                    await new Promise(r => setTimeout(r, 800));
                                } catch (e: any) {
                                    await push(`   ⚠️ Skip ${ch.chapter}: ${e.message}`);
                                    chapterDataList.push({ slug: chSlug, title: ch.chapter, url: ch.link, waktu_rilis: ch.waktu_rilis, total_images: 0, images: [] });
                                }
                            }
                        } else {
                            for (const ch of newChapters) {
                                chapterDataList.push({ slug: sanitizeSlug(ch.chapter), title: ch.chapter, url: ch.link, waktu_rilis: ch.waktu_rilis, total_images: 0, images: [] });
                            }
                        }

                        // 3. Upload metadata.json & chapters.json ke Supabase secara PARALEL
                        await Promise.all([
                            uploadJsonToSupabase(`${slug}/metadata.json`, { slug, title, url: comic.link, cover_url, genres, synopsis, metadata, total_chapters: chapterDataList.length }),
                            uploadJsonToSupabase(`${slug}/chapters.json`, { slug, title, total_chapters: chapterDataList.length, chapters: chapterDataList }),
                        ]);

                        // Update in-memory global meta (JS single-thread → operasi sync ini aman dari race condition)
                        const newEntry: any = {
                            slug, title, cover_url,
                            pengarang: metadata["Author"] || "Unknown",
                            ilustrator: metadata["Ilustrator"] || "Unknown",
                            genres, genre: genres.join(", "),
                            type: metadata["Type"] || comic.type || "Manhwa",
                            status: metadata["Status"] || "Berjalan",
                            rating: "0",
                            total_chapters: chapterDataList.length,
                            latestChapters: chapterDataList.slice(-2).reverse().map((c: any) => ({ title: c.title, waktu_rilis: c.waktu_rilis, slug: c.slug })),
                            lastUpdateTime: new Date().toISOString(),
                        };
                        const existingIdx = currentAllMeta.findIndex((m: any) => m.slug === slug);
                        if (existingIdx >= 0) {
                            const old = currentAllMeta[existingIdx];
                            newEntry.rating = old.rating || "0";
                            if (newEntry.pengarang === "Unknown" && old.pengarang && old.pengarang !== "Unknown") newEntry.pengarang = old.pengarang;
                            if (newEntry.ilustrator === "Unknown" && old.ilustrator && old.ilustrator !== "Unknown") newEntry.ilustrator = old.ilustrator;
                            currentAllMeta[existingIdx] = newEntry;
                        } else {
                            currentAllMeta.push(newEntry);
                        }

                        await push(`   ✅ Selesai: ${title} (${newChapters.length} chapter baru)`);
                        successCount++;
                        await pushProgress(globalIdx + 1, limited.length, slug, "done");
                    }
                } catch (e: any) {
                    await push(`   ❌ Error: ${comic.title} — ${e.message}`);
                    errorCount++;
                    await pushProgress(globalIdx + 1, limited.length, comic.slug, "error");
                }
            };

            // ─── Batch-concurrent execution ────────────────────────────────────
            // Proses `workers` komik sekaligus, delay hanya antar batch
            const totalBatches = Math.ceil(limited.length / workers);
            for (let batchStart = 0; batchStart < limited.length; batchStart += workers) {
                const batch = limited.slice(batchStart, batchStart + workers);
                const batchNum = Math.floor(batchStart / workers) + 1;
                await push(`\n📦 Batch ${batchNum}/${totalBatches} — ${batch.length} komik paralel`);

                await Promise.all(
                    batch.map((comic, idx) => scrapeOne(comic, batchStart + idx))
                );

                // Delay antar batch (bukan antar komik individual)
                if (batchStart + workers < limited.length) {
                    await push(`⏳ Menunggu ${delayMs}ms sebelum batch berikutnya...`);
                    await new Promise(r => setTimeout(r, delayMs));
                }
            }

            // Upload final all-manhwa-metadata.json
            await push(`\n☁️ Mengupload all-manhwa-metadata.json (${currentAllMeta.length} entri)...`);
            await uploadJsonToSupabase("all-manhwa-metadata.json", currentAllMeta);

            await push(`\n✅ Scrape selesai! Berhasil: ${successCount} | Skip: ${skipCount} | Error: ${errorCount}`);
            await pushDone({ successCount, skipCount, errorCount, total: limited.length });

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
