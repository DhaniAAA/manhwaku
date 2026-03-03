import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = "manga-data";
const COMICS_LIST_FILE = "komikindo_scrape_results.json";

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function getHeaders() {
    return {
        "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://komikindo.ch/",
    };
}

function normalizeSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

type ComicEntry = { Title: string; Link: string; Slug: string; Image: string; Type: string };

async function getJsonFromSupabase<T>(filePath: string): Promise<T | null> {
    const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
    if (error || !data) return null;
    try { return JSON.parse(await data.text()) as T; } catch { return null; }
}

async function uploadJsonToSupabase(filePath: string, data: unknown) {
    const { error } = await supabase.storage.from(BUCKET).upload(
        filePath,
        JSON.stringify(data, null, 4),
        { contentType: "application/json", upsert: true }
    );
    if (error) throw error;
}

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const push = async (msg: string) => {
        try { await writer.write(encoder.encode(`data: ${JSON.stringify({ message: msg })}\n\n`)); } catch { }
    };
    const pushDone = async (data?: unknown) => {
        try {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ success: true, data })}\n\n`));
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
            const body = await req.json().catch(() => ({}));
            const { searchUrl } = body as { searchUrl?: string };

            // ── Step 1: Load existing comics list from Supabase ──
            await push("📂 Membaca komikindo_scrape_results.json dari Supabase...");
            const existingList: ComicEntry[] = await getJsonFromSupabase<ComicEntry[]>(COMICS_LIST_FILE) ?? [];
            const existingSlugs = new Set(existingList.map((c) => normalizeSlug(c.Slug || c.Title)));
            await push(`ℹ️ Daftar komik di Supabase: ${existingList.length} entri.`);

            // ── Step 2: Get all bucket folders ──
            await push("📂 Mengambil daftar folder dari Supabase bucket...");
            const existingFolders = new Set<string>();
            let offset = 0;
            const limit = 100;
            while (true) {
                await push(`   → Fetching bucket listing offset ${offset}...`);
                const { data: items, error: listErr } = await supabase.storage
                    .from(BUCKET)
                    .list("", { limit, offset, sortBy: { column: "name", order: "asc" } });
                if (listErr) throw new Error(listErr.message);
                if (!items || items.length === 0) break;
                for (const item of items) {
                    const name: string = item.name ?? "";
                    if (name && !name.includes(".")) existingFolders.add(name);
                }
                if (items.length < limit) break;
                offset += limit;
            }
            await push(`✅ Ditemukan ${existingFolders.size} folder komik di Supabase.`);

            const newEntries: ComicEntry[] = [];

            // ── Step 3: Add missing Supabase folders to list ──
            const missing = [...existingFolders].filter((f) => !existingSlugs.has(normalizeSlug(f)));
            await push(`🔍 ${missing.length} folder di Supabase belum ada di daftar.`);
            for (const folder of missing) {
                const slug = normalizeSlug(folder);
                if (!newEntries.find((e) => normalizeSlug(e.Slug) === slug)) {
                    newEntries.push({
                        Title: folder.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                        Link: `https://komikindo.ch/komik/${folder}/`,
                        Slug: slug,
                        Image: "",
                        Type: "Manhwa",
                    });
                    existingSlugs.add(slug);
                }
            }

            // ── Step 4: Optionally scrape a komikindo listing page ──
            if (searchUrl) {
                await push(`🌐 Scraping halaman daftar: ${searchUrl}`);
                try {
                    const res = await fetch(searchUrl, { headers: getHeaders(), cache: "no-store" });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const html = await res.text();
                    const $ = cheerio.load(html);
                    let scraped = 0;

                    $(".listupd .bs, .listupd .bsx").each((_, el) => {
                        const a = $(el).find("a").first();
                        const link = a.attr("href") || "";
                        const rawTitle = a.attr("title") || $(el).find(".tt, h4").text().trim();
                        const img = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
                        const type = $(el).find(".typeflag, .limit span").text().trim() || "Manhwa";
                        if (!link || !rawTitle) return;

                        const urlSlug = link.replace(/\/$/, "").split("/").pop() || "";
                        const slug = normalizeSlug(urlSlug || rawTitle);
                        if (!existingSlugs.has(slug)) {
                            newEntries.push({ Title: rawTitle, Link: link, Slug: slug, Image: img, Type: type });
                            existingSlugs.add(slug);
                            scraped++;
                        }
                    });
                    await push(`✓ Ditemukan ${scraped} komik baru dari halaman pencarian.`);
                } catch (e: any) {
                    await push(`⚠️ Gagal scrape URL: ${e.message}`);
                }
            }

            if (newEntries.length === 0) {
                await push("ℹ️ Tidak ada komik baru untuk ditambahkan.");
                await pushDone({ added: 0, total: existingList.length });
                return;
            }

            // ── Step 5: Upload updated list to Supabase ──
            await push(`📝 Menambahkan ${newEntries.length} komik baru...`);
            const updated = [...existingList, ...newEntries];
            await uploadJsonToSupabase(COMICS_LIST_FILE, updated);
            await push(`✅ komikindo_scrape_results.json diperbarui di Supabase! Total: ${updated.length} komik.`);
            await pushDone({ added: newEntries.length, total: updated.length });

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
