/**
 * Shared scraper utility — menggunakan got-scraping untuk bypass
 * Cloudflare TLS fingerprint detection.
 *
 * got-scraping otomatis:
 *  - Generate browser-like headers (User-Agent, Accept, dll.)
 *  - Gunakan TLS cipher suite yang mirip Chrome/Firefox
 *  - ALPN negotiation (HTTP/2 → HTTP/1.1 fallback)
 *  - Insecure HTTP parser untuk server non-compliant
 */

// got-scraping adalah ESM-only module.
// Next.js API routes di-compile sebagai CommonJS oleh Webpack,
// jadi kita pakai dynamic import dan cache instance-nya.

type GotScrapingInstance = {
  get: (urlOrOptions: string | Record<string, unknown>) => Promise<{ body: string }>;
};

let _gotScraping: GotScrapingInstance | null = null;

async function getGotScraping(): Promise<GotScrapingInstance> {
  if (!_gotScraping) {
    const mod = await import("got-scraping");
    _gotScraping = mod.gotScraping as unknown as GotScrapingInstance;
  }
  return _gotScraping;
}

/**
 * Fetch HTML dari URL menggunakan got-scraping.
 * Otomatis mem-bypass Cloudflare TLS fingerprint.
 *
 * @param url      — URL halaman yang akan di-scrape
 * @param retries  — jumlah retry jika gagal (default: 2)
 */
export async function fetchHtml(url: string, retries = 2): Promise<string> {
  const gotScraping = await getGotScraping();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await gotScraping.get({
        url,
        headerGeneratorOptions: {
          browsers: [{ name: "chrome", minVersion: 120, maxVersion: 131 }],
          devices: ["desktop"],
          locales: ["en-US", "id-ID"],
          operatingSystems: ["windows"],
        },
        headers: {
          referer: "https://komikindo.ch/",
        },
        timeout: {
          request: 30_000, // 30 detik max
        },
        retry: {
          limit: 0, // kita handle retry sendiri
        },
        // Jangan follow redirect lebih dari 5x
        followRedirect: true,
        maxRedirects: 5,
      } as Record<string, unknown>);

      const body = response.body;

      // Deteksi jika Cloudflare masih blocking (captcha / challenge page)
      if (
        body.includes("Checking your browser") ||
        body.includes("cf-challenge-running") ||
        body.includes("Just a moment...")
      ) {
        throw new Error("Cloudflare challenge detected — halaman belum bisa diakses");
      }

      return body;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Jangan retry kalau Cloudflare challenge (akan tetap gagal)
      if (lastError.message.includes("Cloudflare challenge")) {
        throw lastError;
      }

      if (attempt < retries) {
        // Exponential backoff: 2s, 4s
        const delay = (attempt + 1) * 2000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}
