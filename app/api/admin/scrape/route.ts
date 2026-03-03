import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

// Initialize Supabase Client (Admin)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const BUCKET_NAME = "manga-data";

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

const getHeaders = () => ({
  'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Referer': 'https://komikindo.ch/',
});

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

function sanitizeSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchHtml(url: string) {
  const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.text();
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
      const { url } = body;

      if (!url) throw new Error("URL is required");

      await pushMessage(`Memulai scraping dari URL: ${url}`);

      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      // Parse metadata
      const titleRaw = $('h1.entry-title').text().trim();
      const title = titleRaw.replace(/^Komik\s*/i, '').trim();
      const slug = sanitizeSlug(title);

      await pushMessage(`Ditemukan komik: ${title} (Slug: ${slug})`);

      const cover_url = $('.thumb img').attr('src') || $('.thumb img').attr('data-src') || '';

      const genres: string[] = [];
      $('.genre-info a').each((_, el) => {
        genres.push($(el).text().trim());
      });

      let synopsis = $('.entry-content-sinopsis, .entry-content .sinopsis').text().trim();
      if (!synopsis) {
         const p = $('.entry-content p').first().text().trim();
         if (p && !p.includes("yang dibuat oleh komikus")) synopsis = p;
      }
      synopsis = synopsis.replace(/^(Manhwa|Manhua|Manga)\s+[^.]+yang dibuat oleh[^.]+bercerita tentang\s*/i, '').trim();

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

      // Reverse so Chapter 1 is first
      const chapters = chaptersRaw.reverse();
      const total_chapters = chapters.length;

      await pushMessage(`Status: ${metadata['Status']} | Total Chapters Web: ${total_chapters}`);

      // Ambil existing chapters
      const existingData = await getFromSupabase(`${slug}/chapters.json`);
      const existingChaptersSet = new Set<string>();
      if (existingData && existingData.chapters) {
        existingData.chapters.forEach((c: any) => existingChaptersSet.add(c.slug));
        await pushMessage(`Ditemukan ${existingChaptersSet.size} chapter lama di Supabase.`);
      }

      const scrapedChaptersData: any[] = existingData?.chapters ? [...existingData.chapters] : [];
      let newScrapedCount = 0;

      // Scrape images per chapter
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        const chSlug = sanitizeSlug(ch.chapter);

        if (existingChaptersSet.has(chSlug)) {
           // Skip if already in DB
           continue;
        }

        await pushMessage(`Scraping Chapter: ${ch.chapter}... [${i+1}/${chapters.length}]`);
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
              scrapedChaptersData.push({
                  slug: chSlug,
                  title: ch.chapter,
                  url: ch.link,
                  waktu_rilis: ch.waktu_rilis,
                  total_images: images.length,
                  images: images
              });
              newScrapedCount++;
           } else {
              await pushMessage(`⚠️ Gagal mendapat gambar untuk ${ch.chapter} (Mungkin Cloudflare / Timeout)`);
           }

        } catch(e: any) {
           await pushMessage(`✗ Error Scrape Chapter ${ch.chapter}: ${e.message}`);
        }

        // Kasih jeda debounce
        await new Promise(r => setTimeout(r, 1000));
      }

      if (newScrapedCount > 0 || !existingData) {
          // Upload metadata
          const resultMetadata = {
             slug, title, url, cover_url, genres, synopsis, metadata, total_chapters: scrapedChaptersData.length
          };
          await uploadToSupabase(`${slug}/metadata.json`, resultMetadata);
          await pushMessage(`✓ Uploaded metadata.json ke folder ${slug}/`);

          // Upload chapters
          const resultChapters = {
             slug, title, total_chapters: scrapedChaptersData.length, chapters: scrapedChaptersData
          };
          await uploadToSupabase(`${slug}/chapters.json`, resultChapters);
          await pushMessage(`✓ Uploaded chapters.json ke folder ${slug}/`);

          // Update Global all-manhwa-metadata.json
          await pushMessage(`⚙️ Mengupdate all-manhwa-metadata.json global...`);
          const allManga = await getFromSupabase(`all-manhwa-metadata.json`) || [];

          const newEntry = {
              slug, title, cover_url,
              pengarang: metadata['Author'] || 'Unknown',
              ilustrator: metadata['Ilustrator'] || 'Unknown',
              genres,
              genre: genres.join(", "),
              type: metadata['Type'] || 'Manhwa',
              status: metadata['Status'] || 'Berjalan',
              rating: "0",
              total_chapters: scrapedChaptersData.length,
              latestChapters: scrapedChaptersData.slice(-2).reverse().map(c => ({
                  title: c.title,
                  waktu_rilis: c.waktu_rilis,
                  slug: c.slug
              })),
              lastUpdateTime: new Date().toISOString()
          };

          const existingIndex = allManga.findIndex((m: any) => m.slug === slug);
          if (existingIndex >= 0) {
             // Retain rating and update specific
             const oldEntry = allManga[existingIndex];
             newEntry.rating = oldEntry.rating || "0";
             allManga[existingIndex] = newEntry;
          } else {
             allManga.push(newEntry);
          }

          await uploadToSupabase(`all-manhwa-metadata.json`, allManga);
          await pushMessage(`✓ Sukses Update all-manhwa-metadata.json global!`);
      } else {
          await pushMessage(`ℹ️ Tidak ada chapter baru direkam. Selesai.`);
      }

      await pushSuccess({ slug, scraped: newScrapedCount });
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
