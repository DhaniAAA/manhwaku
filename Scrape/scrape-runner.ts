/**
 * Standalone Scraper Script for GitHub Actions
 * Run: npx tsx Scrape/scrape-runner.ts
 *
 * Env vars needed:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_SUPABASE_SERVICE_ROLE_KEY  (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */

import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env

// ─── Config ───────────────────────────────────────────────────
const MODE = (process.env.SCRAPE_MODE ?? "not_synced") as "all" | "not_synced";
const MAX_PER_RUN = parseInt(process.env.SCRAPE_MAX ?? "30");
const DELAY_MS = parseInt(process.env.SCRAPE_DELAY ?? "3000");
const SCRAPE_IMAGES = process.env.SCRAPE_IMAGES === "true";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = process.env.NEXT_BUCKET_NAME ?? process.env.BUCKET_NAME ?? "manga-data";
const COMICS_LIST_FILE = "komikindo_scrape_results.json";

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing SUPABASE env vars. Check .env.local or GitHub Secrets.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helpers ──────────────────────────────────────────────────
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

function getHeaders() {
    return {
        "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Referer: "https://komikindo.ch/",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    };
}

function log(msg: string) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
}

function sanitizeSlug(text: string): string {
    return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function convertRelativeToIso(str: string): string {
    if (!str) return new Date().toISOString();
    const m = str.match(/(\d+)\s+(year|month|week|day|hour|minute)s?\s+ago/i);
    if (!m) return new Date().toISOString();
    const n = parseInt(m[1]);
    const u = m[2].toLowerCase();
    const d = new Date();
    if (u === "year") d.setFullYear(d.getFullYear() - n);
    else if (u === "month") d.setMonth(d.getMonth() - n);
    else if (u === "week") d.setDate(d.getDate() - n * 7);
    else if (u === "day") d.setDate(d.getDate() - n);
    else if (u === "hour") d.setHours(d.getHours() - n);
    else if (u === "minute") d.setMinutes(d.getMinutes() - n);
    return d.toISOString();
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchHtml(url: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, { headers: getHeaders() as any });
            if (res.status === 403) throw new Error(`HTTP 403 (Cloudflare block)`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        } catch (err: any) {
            log(`  ⚠️  Attempt ${i + 1}/${retries} failed: ${err.message}`);
            if (i < retries - 1) await sleep(2000 * (i + 1));
            else throw err;
        }
    }
    throw new Error("Max retries exceeded");
}

async function getFromSupabase<T>(path: string): Promise<T | null> {
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) return null;
    try { return JSON.parse(await data.text()) as T; } catch { return null; }
}

async function uploadToSupabase(path: string, data: unknown) {
    const { error } = await supabase.storage.from(BUCKET).upload(
        path,
        JSON.stringify(data, null, 2),
        { contentType: "application/json", upsert: true }
    );
    if (error) throw error;
}

// ─── Scrape single comic page ──────────────────────────────────
async function scrapeComic(url: string) {
    const html = await fetchHtml(url);
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
        const t = $(el).text().trim();
        if (t.includes("Status:")) metadata["Status"] = t.replace("Status:", "").trim();
        if (t.includes("Jenis Komik:")) metadata["Type"] = $(el).find("a").text().trim();
        if (t.includes("Pengarang:")) metadata["Author"] = t.replace("Pengarang:", "").trim();
        if (t.includes("Ilustrator:")) metadata["Ilustrator"] = t.replace("Ilustrator:", "").trim();
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

    return { slug, title, cover_url, genres, synopsis, metadata, chapters: chaptersRaw.reverse() };
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
    log("🚀 Scraper started");
    log(`   Mode: ${MODE} | Max: ${MAX_PER_RUN} | Delay: ${DELAY_MS}ms | Images: ${SCRAPE_IMAGES}`);

    // Load comics list from Supabase
    log("📂 Loading comics list from Supabase...");
    const comicsList = await getFromSupabase<Array<{ Title: string; Link: string; Slug: string; Image: string; Type: string }>>(COMICS_LIST_FILE);
    if (!comicsList || comicsList.length === 0) {
        log(`❌ ${COMICS_LIST_FILE} not found in Supabase bucket '${BUCKET}'`);
        process.exit(1);
    }
    log(`   ✓ ${comicsList.length} comics in list`);

    // Load all-manhwa-metadata
    log("📂 Loading all-manhwa-metadata.json...");
    const allMeta: any[] = await getFromSupabase("all-manhwa-metadata.json") ?? [];
    const syncedSlugs = new Set(allMeta.map((m: any) => m.slug?.toLowerCase()));
    log(`   ✓ ${allMeta.length} already in Supabase`);

    // Deduplicate + normalize
    const seenSlugs = new Set<string>();
    const allComics = comicsList
        .map(c => ({ ...c, slug: sanitizeSlug(c.Slug || c.Title) }))
        .filter(c => { if (seenSlugs.has(c.slug)) return false; seenSlugs.add(c.slug); return true; });

    // Filter by mode
    const toScrape = MODE === "not_synced"
        ? allComics.filter(c => !syncedSlugs.has(c.slug))
        : allComics;

    const limited = toScrape.slice(0, MAX_PER_RUN);
    log(`\n📋 ${limited.length} comics to scrape (from ${toScrape.length} total)\n`);

    let successCount = 0, skipCount = 0, errorCount = 0;
    const currentAllMeta = [...allMeta];

    for (let i = 0; i < limited.length; i++) {
        const comic = limited[i];
        log(`\n[${i + 1}/${limited.length}] ${comic.Title}`);
        log(`   URL: ${comic.Link}`);

        try {
            const { slug, title, cover_url, genres, synopsis, metadata, chapters } = await scrapeComic(comic.Link);

            const existingData = await getFromSupabase<any>(`${slug}/chapters.json`);
            const existingChapterSlugs = new Set<string>(existingData?.chapters?.map((c: any) => c.slug) ?? []);
            const newChapters = chapters.filter(c => !existingChapterSlugs.has(sanitizeSlug(c.chapter)));

            log(`   → ${chapters.length} chapters on site | ${existingChapterSlugs.size} already saved | ${newChapters.length} new`);

            if (newChapters.length === 0 && existingData) {
                log(`   ℹ️  No new chapters — skip`);
                skipCount++;
            } else {
                let chapterDataList: any[] = existingData?.chapters ? [...existingData.chapters] : [];

                if (SCRAPE_IMAGES) {
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
                            log(`   ✓ ${ch.chapter}: ${images.length} images`);
                            chapterDataList.push({ slug: chSlug, title: ch.chapter, url: ch.link, waktu_rilis: ch.waktu_rilis, total_images: images.length, images });
                            await sleep(800);
                        } catch (e: any) {
                            log(`   ⚠️  Skip images ${ch.chapter}: ${e.message}`);
                            chapterDataList.push({ slug: chSlug, title: ch.chapter, url: ch.link, waktu_rilis: ch.waktu_rilis, total_images: 0, images: [] });
                        }
                    }
                } else {
                    for (const ch of newChapters) {
                        chapterDataList.push({ slug: sanitizeSlug(ch.chapter), title: ch.chapter, url: ch.link, waktu_rilis: ch.waktu_rilis, total_images: 0, images: [] });
                    }
                }

                await uploadToSupabase(`${slug}/metadata.json`, { slug, title, url: comic.Link, cover_url, genres, synopsis, metadata, total_chapters: chapterDataList.length });
                await uploadToSupabase(`${slug}/chapters.json`, { slug, title, total_chapters: chapterDataList.length, chapters: chapterDataList });

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

                log(`   ✅ Done: ${title} (+${newChapters.length} chapters)`);
                successCount++;
            }
        } catch (e: any) {
            log(`   ❌ Error: ${e.message}`);
            errorCount++;
        }

        if (i < limited.length - 1) {
            log(`   ⏳ Waiting ${DELAY_MS}ms...`);
            await sleep(DELAY_MS);
        }
    }

    // Upload updated all-manhwa-metadata.json
    log(`\n☁️  Uploading all-manhwa-metadata.json (${currentAllMeta.length} total)...`);
    await uploadToSupabase("all-manhwa-metadata.json", currentAllMeta);

    // Summary
    log("\n" + "═".repeat(50));
    log(`✅ Scraping complete!`);
    log(`   ✓ Success : ${successCount}`);
    log(`   ℹ️  Skipped : ${skipCount}`);
    log(`   ❌ Errors  : ${errorCount}`);
    log(`   📚 Total   : ${limited.length}`);
    log("═".repeat(50));

    if (errorCount === limited.length && limited.length > 0) {
        log("\n⚠️  All comics returned errors — likely Cloudflare block on GitHub Actions IP.");
        log("   Consider using a scraping proxy service (ScraperAPI, ZenRows, etc.)");
        process.exit(1);
    }
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
