import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { fetchHtml, normalizeChapterSlug } from "@/lib/scraper";

// Initialize Supabase Client (Admin)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const BUCKET_NAME = "manga-data";

// Helper for relative time to ISO
function convertRelativeToIso(relativeStr: string) {
  if (!relativeStr) return new Date().toISOString();

  const match = relativeStr.match(/(\d+)\s+(year|month|week|day|hour|minute)s?\s+ago/i);
  if (!match) return new Date().toISOString();

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const date = new Date();

  if (unit === 'year') date.setFullYear(date.getFullYear() - amount);
  else if (unit === 'month') date.setMonth(date.getMonth() - amount);
  else if (unit === 'week') date.setDate(date.getDate() - (amount * 7));
  else if (unit === 'day') date.setDate(date.getDate() - amount);
  else if (unit === 'hour') date.setHours(date.getHours() - amount);
  else if (unit === 'minute') date.setMinutes(date.getMinutes() - amount);

  return date.toISOString();
}

/** Normalize slug matching Supabase folder naming:
 *  apostrophe (') → space → hyphen  e.g. "Margrave's" → "margrave-s"
 */
function sanitizeSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/'/g, " ")           // apostrophe → space
    .replace(/[^\w\s-]/g, " ")    // other special chars → space
    .replace(/[\s_]+/g, "-")      // spaces → hyphen
    .replace(/-+/g, "-")          // collapse multiple hyphens
    .replace(/^-+|-+$/g, "");     // trim
}

// Upload file to Supabase Storage
async function uploadToSupabase(path: string, data: any) {
  const fileBody = JSON.stringify(data, null, 2);
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, fileBody, {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) throw error;
}

// Download JSON from Supabase
async function getFromSupabase(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(path);
  if (error) return null;
  const text = await data.text();
  try { return JSON.parse(text); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const pushMessage = async (msg: string) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ message: msg })}\n\n`));
  };
  const pushSuccess = async (data: any) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ success: true, data })}\n\n`));
    await writer.close();
  };
  const pushError = async (err: string) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ error: err })}\n\n`));
    await writer.close();
  };

  // Run async scraping process
  (async () => {
    try {
      const body = await req.json();
      const { url, scrapeMode = "all" } = body;
      // scrapeMode: "metadata_only" | "chapters_only" | "all"

      if (!url) throw new Error("URL is required");
      await pushMessage(`⚙️ Mode: ${{ metadata_only: "Metadata Saja", chapters_only: "Chapters Saja (tanpa gambar)", all: "Semua (metadata + chapter + gambar)" }[scrapeMode as string] ?? scrapeMode}`);

      await pushMessage(`Memulai scraping dari URL: ${url}`);

      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      // Parse metadata
      const titleRaw = $('h1.entry-title').text().trim();
      const title = titleRaw.replace(/^Komik\s*/i, '').trim();
      // ⚠️ PENTING: Ambil slug dari URL, BUKAN dari sanitizeSlug(title)
      // supaya folder Supabase selalu konsisten dengan slug di metadata/URL komikindo.
      // Contoh: URL ".../komik/a-spys-survival-in-the-demonic-cult/" → slug "a-spys-survival-in-the-demonic-cult"
      const urlSlug = url.replace(/\/$/, "").split("/").pop() ?? "";
      const slug = urlSlug || sanitizeSlug(title);

      await pushMessage(`Ditemukan komik: ${title} (Slug: ${slug})`);

      const cover_url = $('.thumb img').attr('src') || $('.thumb img').attr('data-src') || '';

      const genres: string[] = [];
      $('.genre-info a').each((_, el) => {
        genres.push($(el).text().trim());
      });

      // Selector utama: div[itemprop="description"] sesuai struktur HTML komikindo
      let synopsis = $('[itemprop="description"]').text().trim()
        || $('.entry-content-single').text().trim();
      if (!synopsis) {
        synopsis = $('.entry-content p').first().text().trim();
      }
      // Collapse whitespace/newlines lalu hapus boilerplate komikindo
      synopsis = synopsis.replace(/\s+/g, ' ').trim();
      synopsis = synopsis.replace(/^(Manhwa|Manhua|Manga)\s+.+?yang dibuat oleh komikus?\s*(?:bernama)?\s*.+?(?:bercerita tentang|ini bercerita tentang)\s*/i, '').trim();
      if (synopsis.length < 10) synopsis = '';

      const metadata: Record<string, string> = {};
      $('.spe span').each((_, el) => {
        const text = $(el).text().trim();
        if (text.includes('Status:')) metadata['Status'] = text.replace('Status:', '').trim();
        if (text.includes('Jenis Komik:')) metadata['Type'] = $(el).find('a').text().trim();
        if (text.includes('Pengarang:')) metadata['Author'] = text.replace('Pengarang:', '').trim();
        if (text.includes('Ilustrator:')) metadata['Ilustrator'] = text.replace('Ilustrator:', '').trim();
      });

      const chaptersRaw: any[] = [];
      $('#chapter_list ul li').each((_, el) => {
        const a = $(el).find('.lchx a');
        if (a.length > 0) {
          const chTitle = a.text().trim();
          const chLink = a.attr('href') || '';
          const waktuRaw = $(el).find('.dt').text().trim() || 'N/A';
          chaptersRaw.push({
            chapter: chTitle,
            link: chLink,
            waktu_rilis: convertRelativeToIso(waktuRaw)
          });
        }
      });

      // Deduplicate — Komikindo sering punya 2x chapter list di HTML (desktop+mobile)
      const seenLinks = new Set<string>();
      const chaptersDeduped = chaptersRaw.filter(ch => {
        if (seenLinks.has(ch.link)) return false;
        seenLinks.add(ch.link);
        return true;
      });

      // Reverse so Chapter 1 is first
      const chapters = chaptersDeduped.reverse();
      const total_chapters = chapters.length;

      await pushMessage(`Status: ${metadata['Status']} | Total Chapters Web: ${total_chapters}`);

      // ─── Helper: build & upload global all-manhwa-metadata.json ───
      const updateGlobalMetadata = async (finalChapterCount: number, latestChapters: any[]) => {
        await pushMessage(`⚙️ Mengupdate all-manhwa-metadata.json global...`);
        const allManga = await getFromSupabase(`all-manhwa-metadata.json`) || [];
        const newEntry: any = {
          slug, title, cover_url,
          pengarang: metadata['Author'] || 'Unknown',
          ilustrator: metadata['Ilustrator'] || 'Unknown',
          genres,
          genre: genres.join(", "),
          type: metadata['Type'] || 'Manhwa',
          status: metadata['Status'] || 'Berjalan',
          rating: "0",
          total_chapters: finalChapterCount,
          latestChapters,
          lastUpdateTime: new Date().toISOString()
        };
        const existingIndex = allManga.findIndex((m: any) => m.slug === slug);
        if (existingIndex >= 0) {
          newEntry.rating = allManga[existingIndex].rating || "0";
          allManga[existingIndex] = newEntry;
        } else {
          allManga.push(newEntry);
        }
        await uploadToSupabase(`all-manhwa-metadata.json`, allManga);
        await pushMessage(`✓ Sukses Update all-manhwa-metadata.json global!`);
      };

      // ─── MODE: metadata_only ──────────────────────────────────────
      if (scrapeMode === "metadata_only") {
        const resultMetadata = {
          slug, title, url, cover_url, genres, synopsis, metadata, total_chapters
        };
        await uploadToSupabase(`${slug}/metadata.json`, resultMetadata);
        await pushMessage(`✅ Uploaded metadata.json ke folder ${slug}/`);

        // Also update global list — hitung chapter count dari actual array (dedup by slug)
        const existingChaptersData = await getFromSupabase(`${slug}/chapters.json`);
        let actualChapterCount = 0;
        let existingLatest: any[] = [];
        if (existingChaptersData?.chapters) {
          // Dedup by slug untuk mendapatkan count yang benar
          const dedupMap = new Map<string, any>();
          (existingChaptersData.chapters as any[]).forEach((c: any) => dedupMap.set(c.slug, c));
          actualChapterCount = dedupMap.size;
          const dedupArr = [...dedupMap.values()];
          existingLatest = dedupArr.slice(-2).reverse().map((c: any) => ({ title: c.title, waktu_rilis: c.waktu_rilis, slug: c.slug }));
        }
        await updateGlobalMetadata(actualChapterCount || total_chapters, existingLatest);

        await pushSuccess({ slug, scraped: 0 });
        return;
      }

      // ─── MODE: chapters_only  (list, no images) ───────────────────
      if (scrapeMode === "chapters_only") {
        const existingData = await getFromSupabase(`${slug}/chapters.json`);
        // Dedup existing chapters by slug via Map (mencegah duplikat dari data lama)
        const existingChapterMap = new Map<string, any>();
        if (existingData?.chapters) {
          (existingData.chapters as any[]).forEach((c: any) => existingChapterMap.set(normalizeChapterSlug(c.slug), { ...c, slug: normalizeChapterSlug(c.slug) }));
          await pushMessage(`Ditemukan ${existingChapterMap.size} chapter lama di Supabase.`);
        }
        const scrapedChaptersData: any[] = [...existingChapterMap.values()];

        let newCount = 0;
        for (const ch of chapters) {
          const chSlug = sanitizeSlug(ch.chapter);
          if (existingChapterMap.has(chSlug)) continue;
          scrapedChaptersData.push({
            slug: chSlug,
            title: ch.chapter,
            url: ch.link,
            waktu_rilis: ch.waktu_rilis,
            total_images: 0,
            images: []
          });
          newCount++;
        }

        // Force update jika data lama punya duplikat (raw length > deduped map size)
        const hasDuplicates = (existingData?.chapters?.length ?? 0) > existingChapterMap.size;
        if (hasDuplicates) {
          await pushMessage(`🛠️ Membersihkan ${(existingData?.chapters?.length ?? 0) - existingChapterMap.size} chapter duplikat dari data lama.`);
        }

        if (newCount > 0 || !existingData || hasDuplicates) {
          const resultChapters = { slug, title, total_chapters: scrapedChaptersData.length, chapters: scrapedChaptersData };
          await uploadToSupabase(`${slug}/chapters.json`, resultChapters);
          await pushMessage(`✅ Uploaded chapters.json (${newCount} chapter baru) ke folder ${slug}/`);

          // Also update metadata.json
          const resultMetadata = { slug, title, url, cover_url, genres, synopsis, metadata, total_chapters: scrapedChaptersData.length };
          await uploadToSupabase(`${slug}/metadata.json`, resultMetadata);
          await pushMessage(`✅ Uploaded metadata.json ke folder ${slug}/`);

          const latestChapters = scrapedChaptersData.slice(-2).reverse().map((c: any) => ({ title: c.title, waktu_rilis: c.waktu_rilis, slug: c.slug }));
          await updateGlobalMetadata(scrapedChaptersData.length, latestChapters);
        } else {
          await pushMessage(`ℹ️ Tidak ada chapter baru. Selesai.`);
        }

        await pushSuccess({ slug, scraped: newCount });
        return;
      }

      // ─── MODE: all (default) — metadata + chapters + images ───────
      {
        const [existingData, existingMetaData] = await Promise.all([
          getFromSupabase(`${slug}/chapters.json`),
          getFromSupabase(`${slug}/metadata.json`),
        ]);

        // Gunakan Map untuk bisa cek konten + dedup existing data by slug
        const existingChapterMap = new Map<string, any>();
        if (existingData?.chapters) {
          (existingData.chapters as any[]).forEach((c: any) => existingChapterMap.set(normalizeChapterSlug(c.slug), { ...c, slug: normalizeChapterSlug(c.slug) }));
          await pushMessage(`Ditemukan ${existingChapterMap.size} chapter lama di Supabase.`);
        }

        // Identifikasi chapter kosong gambar yang perlu di-repair
        const emptyImageSlugs = new Set<string>(
          [...existingChapterMap.values()].filter((c: any) => (c.images?.length ?? 0) === 0).map((c: any) => c.slug)
        );
        if (emptyImageSlugs.size > 0) {
          await pushMessage(`⚠️ ${emptyImageSlugs.size} chapter ditemukan kosong gambar, akan di-repair.`);
        }

        // Cek apakah synopsis tadinya kosong tapi sekarang bisa diisi
        const synopsisRefreshed = !existingMetaData?.synopsis && !!synopsis;
        if (synopsisRefreshed) await pushMessage(`🔄 Synopsis baru ditemukan (sebelumnya kosong), akan diperbarui.`);

        // Inisialisasi dari Map values (bukan raw array) → otomatis dedup
        const scrapedChaptersData: any[] = [...existingChapterMap.values()];
        let newScrapedCount = 0;
        let repairedCount = 0;

        for (let i = 0; i < chapters.length; i++) {
          const ch = chapters[i];
          const chSlug = sanitizeSlug(ch.chapter);
          const isRepair = emptyImageSlugs.has(chSlug);

          // Skip hanya jika sudah ada DAN memiliki gambar
          if (existingChapterMap.has(chSlug) && !isRepair) continue;

          await pushMessage(`${isRepair ? "🔧 Repair" : "Scraping"} Chapter: ${ch.chapter}... [${i + 1}/${chapters.length}]`);
          try {
            const chHtml = await fetchHtml(ch.link);
            const $ch = cheerio.load(chHtml);
            const images: string[] = [];
            const selectors = ['#chimg-auh img', '.chapter-image img', '#Baca_Komik img', '.img-landmine img', '.main-reading-area img'];
            for (const selector of selectors) {
              $ch(selector).each((_, img) => {
                const src = $ch(img).attr('src');
                if (src && src.startsWith('http')) images.push(src);
              });
              if (images.length > 0) break;
            }
            if (images.length > 0) {
              await pushMessage(`✓ Sukses mendapat ${images.length} gambar untuk ${ch.chapter}`);
              const entry = { slug: chSlug, title: ch.chapter, url: ch.link, waktu_rilis: ch.waktu_rilis, total_images: images.length, images };
              if (isRepair) {
                // Update entri lama
                const idx = scrapedChaptersData.findIndex((c: any) => c.slug === chSlug);
                if (idx >= 0) scrapedChaptersData[idx] = entry;
                repairedCount++;
              } else {
                scrapedChaptersData.push(entry);
                newScrapedCount++;
              }
            } else {
              await pushMessage(`⚠️ Gagal mendapat gambar untuk ${ch.chapter} (Mungkin Cloudflare / Timeout)`);
            }
          } catch (e: any) {
            await pushMessage(`✗ Error Scrape Chapter ${ch.chapter}: ${e.message}`);
          }
          await new Promise(r => setTimeout(r, 1000));
        }

        // Force update jika data lama punya duplikat
        const hasDuplicates = (existingData?.chapters?.length ?? 0) > existingChapterMap.size;
        if (hasDuplicates) {
          await pushMessage(`🛠️ Membersihkan ${(existingData?.chapters?.length ?? 0) - existingChapterMap.size} chapter duplikat dari data lama.`);
        }

        if (newScrapedCount > 0 || repairedCount > 0 || emptyImageSlugs.size > 0 || !existingData || synopsisRefreshed || hasDuplicates) {
          const resultMetadata = { slug, title, url, cover_url, genres, synopsis, metadata, total_chapters: scrapedChaptersData.length };
          await uploadToSupabase(`${slug}/metadata.json`, resultMetadata);
          await pushMessage(`✅ Uploaded metadata.json ke folder ${slug}/`);

          const resultChapters = { slug, title, total_chapters: scrapedChaptersData.length, chapters: scrapedChaptersData };
          await uploadToSupabase(`${slug}/chapters.json`, resultChapters);

          const repairFailed = emptyImageSlugs.size > 0 && repairedCount === 0;
          const repairMsg = repairFailed
            ? ` | ⚠️ ${emptyImageSlugs.size} repair gagal (Cloudflare? Jalankan dari localhost)`
            : repairedCount > 0 ? ` | 🔧${repairedCount} repair` : "";
          await pushMessage(`✅ Uploaded chapters.json ke folder ${slug}/ (+${newScrapedCount} baru${repairMsg})`);

          const latestChapters = scrapedChaptersData.slice(-2).reverse().map((c: any) => ({ title: c.title, waktu_rilis: c.waktu_rilis, slug: c.slug }));
          await updateGlobalMetadata(scrapedChaptersData.length, latestChapters);
        } else {
          await pushMessage(`ℹ️ Tidak ada chapter baru, repair, atau perubahan synopsis. Selesai.`);
        }

        await pushSuccess({ slug, scraped: newScrapedCount, repaired: repairedCount });
      }
    } catch (err: any) {
      console.error(err);
      await pushError(err.message || "Unknown error occurred");
    }
  })();

  return new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
