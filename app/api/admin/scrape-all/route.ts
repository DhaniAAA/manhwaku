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
const COMICS_LIST_FILE = "komikindo_scrape_results.json";

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
    return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
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

type ComicEntry = { Title: string; Link: string; Slug: string; Image: string; Type: string };

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const {
        mode = "not_synced",
        delayMs = 2000,
        maxPerRun = 50,
        scrapeImages = false,
    } = body as {
        mode?: "all" | "not_synced";
        delayMs?: number;
        maxPerRun?: number;
        scrapeImages?: boolean;
    };

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
            // Load comics list from Supabase
            await push("📖 Membaca komikindo_scrape_results.json dari Supabase...");
            const comicsList: ComicEntry[] = await getJsonFromSupabase<ComicEntry[]>(COMICS_LIST_FILE) ?? [];
            if (comicsList.length === 0) throw new Error(`${COMICS_LIST_FILE} tidak ditemukan di Supabase bucket '${BUCKET}'`);

            // Load all-manhwa-metadata
            await push("📖 Membaca metadata Supabase...");
            const allMeta: any[] = await getJsonFromSupabase("all-manhwa-metadata.json") ?? [];
            const syncedSlugs = new Set(allMeta.map((m: any) => m.slug?.toLowerCase()));

            // Normalize + deduplicate
            const seenSlugs = new Set<string>();
            const allComics = comicsList
                .map(c => ({ ...c, slug: sanitizeSlug(c.Slug || c.Title) }))
                .filter(c => { if (seenSlugs.has(c.slug)) return false; seenSlugs.add(c.slug); return true; });

            // Filter by mode
            const toScrape = mode === "not_synced"
                ? allComics.filter(c => !syncedSlugs.has(c.slug))
                : allComics;

            const limited = toScrape.slice(0, maxPerRun);
            await push(`✅ Mode: ${mode === "not_synced" ? "Belum Sync" : "Semua"} | ${limited.length} komik akan di-scrape (dari ${toScrape.length} total)`);
            await push(`⚙️ Delay: ${delayMs}ms | Max: ${maxPerRun} | Gambar: ${scrapeImages ? "Ya" : "Tidak"}`);

            let successCount = 0;
            let skipCount = 0;
            let errorCount = 0;
            const currentAllMeta: any[] = [...allMeta];

            for (let i = 0; i < limited.length; i++) {
                const comic = limited[i];
                await push(`\n🔄 [${i + 1}/${limited.length}] Scraping: ${comic.Title}`);
                await pushProgress(i + 1, limited.length, comic.slug, "running");

                try {
                    const html = await fetchHtml(comic.Link);
                    const $ = cheerio.load(html);

                    const titleRaw = $("h1.entry-title").text().trim();
                    const title = titleRaw.replace(/^Komik\s*/i, "").trim();
                    const slug = sanitizeSlug(title);
                    const cover_url = $(".thumb img").attr("src") || $(".thumb img").attr("data-src") || "";

                    const genres: string[] = [];
                    $(".genre-info a").each((_, el) => { genres.push($(el).text().trim()); });

                    let synopsis = $(".entry-content-sinopsis, .entry-content .sinopsis").text().trim();
                    if (!synopsis) {
                        const p = $(".entry-content p").first().text().trim();
                        if (p && !p.includes("yang dibuat oleh komikus")) synopsis = p;
                    }

                    const metadata: Record<string, string> = {};
                    $(".spe span").each((_, el) => {
                        const text = $(el).text().trim();
                        if (text.includes("Status:")) metadata["Status"] = text.replace("Status:", "").trim();
                        if (text.includes("Jenis Komik:")) metadata["Type"] = $(el).find("a").text().trim();
                        if (text.includes("Pengarang:")) metadata["Author"] = text.replace("Pengarang:", "").trim();
                        if (text.includes("Ilustrator:")) metadata["Ilustrator"] = text.replace("Ilustrator:", "").trim();
                    });

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

                    const existingData = await getJsonFromSupabase<any>(`${slug}/chapters.json`);
                    const existingChapterSlugs = new Set<string>(
                        existingData?.chapters?.map((c: any) => c.slug) ?? []
                    );
                    const newChapters = chapters.filter(c => !existingChapterSlugs.has(sanitizeSlug(c.chapter)));

                    await push(`   → ${chapters.length} chapter di web | ${existingChapterSlugs.size} sudah tersimpan`);

                    if (newChapters.length === 0 && existingData) {
                        await push(`   ℹ️ Tidak ada chapter baru.`);
                        skipCount++;
                        await pushProgress(i + 1, limited.length, slug, "skip");
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

                        await uploadJsonToSupabase(`${slug}/metadata.json`, { slug, title, url: comic.Link, cover_url, genres, synopsis, metadata, total_chapters: chapterDataList.length });
                        await uploadJsonToSupabase(`${slug}/chapters.json`, { slug, title, total_chapters: chapterDataList.length, chapters: chapterDataList });

                        const newEntry = {
                            slug, title, cover_url,
                            pengarang: metadata["Author"] || "Unknown",
                            ilustrator: metadata["Ilustrator"] || "Unknown",
                            genres, genre: genres.join(", "),
                            type: metadata["Type"] || comic.Type || "Manhwa",
                            status: metadata["Status"] || "Berjalan",
                            rating: "0",
                            total_chapters: chapterDataList.length,
                            latestChapters: chapterDataList.slice(-2).reverse().map((c: any) => ({ title: c.title, waktu_rilis: c.waktu_rilis, slug: c.slug })),
                            lastUpdateTime: new Date().toISOString(),
                        };

                        const existingIdx = currentAllMeta.findIndex((m: any) => m.slug === slug);
                        if (existingIdx >= 0) {
                            newEntry.rating = currentAllMeta[existingIdx].rating || "0";
                            currentAllMeta[existingIdx] = newEntry;
                        } else {
                            currentAllMeta.push(newEntry);
                        }

                        await push(`   ✅ Selesai: ${title} (${newChapters.length} chapter baru)`);
                        successCount++;
                        await pushProgress(i + 1, limited.length, slug, "done");
                    }
                } catch (e: any) {
                    await push(`   ❌ Error: ${comic.Title} — ${e.message}`);
                    errorCount++;
                    await pushProgress(i + 1, limited.length, comic.slug, "error");
                }

                if (i < limited.length - 1) {
                    await new Promise(r => setTimeout(r, delayMs));
                }
            }

            // Upload updated all-manhwa-metadata.json
            await push(`\n☁️ Mengupload all-manhwa-metadata.json (${currentAllMeta.length} total)...`);
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
