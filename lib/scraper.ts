/**
 * Shared scraper utility — menggunakan got-scraping untuk bypass
 * Cloudflare TLS fingerprint detection.
 *
 * got-scraping memberikan:
 *  - TLS cipher suite yang mirip Chrome/Firefox (bypass fingerprint!)
 *  - ALPN negotiation (HTTP/2 → HTTP/1.1 fallback)
 *  - Insecure HTTP parser untuk server non-compliant
 *  - HTTP/1.1 headers otomatis di-format Pascal-Case seperti browser
 *
 * CATATAN: headerGenerator di-disable karena package `header-generator`
 * membutuhkan file JSON dari disk yang tidak tersedia di serverless
 * environment (Vercel). Sebagai gantinya, kita set header manual.
 * TLS fingerprint bypass tetap bekerja karena itu di layer koneksi,
 * bukan di layer header.
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

// Chrome-like User-Agents — dirotasi setiap request
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

function getRandomUA(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
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
                // Disable header generator — data files tidak ada di serverless env
                useHeaderGenerator: false,
                // Set header manual mirip Chrome
                headers: {
                    "user-agent": getRandomUA(),
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "accept-language": "en-US,en;q=0.9,id;q=0.8",
                    "accept-encoding": "gzip, deflate, br",
                    "cache-control": "max-age=0",
                    "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"Windows"',
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "none",
                    "sec-fetch-user": "?1",
                    "upgrade-insecure-requests": "1",
                    "referer": "https://komikindo.ch/",
                },
                timeout: {
                    request: 30_000, // 30 detik max
                },
                retry: {
                    limit: 0, // kita handle retry sendiri
                },
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
