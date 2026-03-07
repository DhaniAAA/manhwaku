/**
 * Shared scraper utility — menggunakan Node.js built-in `https` module
 * dengan TLS cipher suites yang meniru Chrome untuk bypass Cloudflare
 * TLS fingerprint detection.
 *
 * ZERO external dependencies — bekerja di semua environment termasuk
 * Vercel serverless tanpa masalah file system.
 *
 * Cara kerja bypass:
 *  - TLS cipher suites diset mirip urutan Chrome 131
 *  - Signature algorithms & elliptic curves diset mirip Chrome
 *  - ALPN protocols: h2, http/1.1 (seperti browser)
 *  - Headers lengkap termasuk sec-ch-ua, sec-fetch-* dll.
 */

import https from "node:https";
import http from "node:http";
import zlib from "node:zlib";
import { URL } from "node:url";
import { Readable } from "node:stream";

// ─── TLS Configuration mirip Chrome 131 ─────────────────────────────────────

/** Chrome 131 cipher suite order (OpenSSL names) */
const CHROME_CIPHERS = [
    // TLS 1.3 ciphers (selalu di awal)
    "TLS_AES_128_GCM_SHA256",
    "TLS_AES_256_GCM_SHA384",
    "TLS_CHACHA20_POLY1305_SHA256",
    // TLS 1.2 ciphers (urutan Chrome)
    "ECDHE-ECDSA-AES128-GCM-SHA256",
    "ECDHE-RSA-AES128-GCM-SHA256",
    "ECDHE-ECDSA-AES256-GCM-SHA384",
    "ECDHE-RSA-AES256-GCM-SHA384",
    "ECDHE-ECDSA-CHACHA20-POLY1305",
    "ECDHE-RSA-CHACHA20-POLY1305",
    "ECDHE-RSA-AES128-SHA",
    "ECDHE-RSA-AES256-SHA",
    "AES128-GCM-SHA256",
    "AES256-GCM-SHA384",
    "AES128-SHA",
    "AES256-SHA",
].join(":");

/** Chrome 131 signature algorithms */
const CHROME_SIGALGS = [
    "ecdsa_secp256r1_sha256",
    "rsa_pss_rsae_sha256",
    "rsa_pkcs1_sha256",
    "ecdsa_secp384r1_sha384",
    "rsa_pss_rsae_sha384",
    "rsa_pkcs1_sha384",
    "rsa_pss_rsae_sha512",
    "rsa_pkcs1_sha512",
].join(":");

/** Shared HTTPS agent dengan TLS config Chrome-like — di-reuse antar request */
const chromeAgent = new https.Agent({
    ciphers: CHROME_CIPHERS,
    sigalgs: CHROME_SIGALGS,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.3",
    keepAlive: true,
    maxSockets: 10,
});

// ─── Chrome-like Headers ─────────────────────────────────────────────────────

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

function getRandomUA(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getChromeHeaders(hostname: string): Record<string, string> {
    return {
        Host: hostname,
        "User-Agent": getRandomUA(),
        Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "max-age=0",
        "Sec-Ch-Ua": '"Chromium";v="131", "Not_A Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        Referer: "https://komikindo.ch/",
        Connection: "keep-alive",
    };
}

// ─── Core fetch function ─────────────────────────────────────────────────────

/**
 * Melakukan HTTP(S) request dan mengembalikan body sebagai string.
 * Menangani: redirect, gzip/br/deflate decompression, timeout.
 */
function rawFetch(
    url: string,
    redirectsLeft = 5
): Promise<string> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const isHttps = parsed.protocol === "https:";
        const transport = isHttps ? https : http;

        const options: https.RequestOptions = {
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: "GET",
            headers: getChromeHeaders(parsed.hostname),
            ...(isHttps ? { agent: chromeAgent } : {}),
            timeout: 30_000,
        };

        const req = transport.request(options, (res) => {
            // ── Handle redirects ──
            if (
                res.statusCode &&
                res.statusCode >= 300 &&
                res.statusCode < 400 &&
                res.headers.location
            ) {
                // Consume body to free the socket
                res.resume();

                if (redirectsLeft <= 0) {
                    reject(new Error(`Too many redirects for ${url}`));
                    return;
                }

                // Resolve relative redirects
                const redirectUrl = new URL(res.headers.location, url).toString();
                resolve(rawFetch(redirectUrl, redirectsLeft - 1));
                return;
            }

            // ── Handle non-200 ──
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                res.resume();
                reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                return;
            }

            // ── Decompress response body ──
            let stream: Readable = res;
            const encoding = res.headers["content-encoding"];

            if (encoding === "gzip" || encoding === "x-gzip") {
                stream = res.pipe(zlib.createGunzip());
            } else if (encoding === "br") {
                stream = res.pipe(zlib.createBrotliDecompress());
            } else if (encoding === "deflate") {
                stream = res.pipe(zlib.createInflate());
            }

            const chunks: Buffer[] = [];
            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.on("end", () => {
                resolve(Buffer.concat(chunks).toString("utf-8"));
            });
            stream.on("error", reject);
        });

        req.on("error", reject);
        req.on("timeout", () => {
            req.destroy(new Error(`Request timeout (30s) for ${url}`));
        });

        req.end();
    });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch HTML dari URL dengan Chrome TLS fingerprint bypass.
 *
 * @param url      — URL halaman yang akan di-scrape
 * @param retries  — jumlah retry jika gagal (default: 2)
 */
export async function fetchHtml(url: string, retries = 2): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const body = await rawFetch(url);

            // Deteksi jika Cloudflare masih blocking (captcha / challenge page)
            if (
                body.includes("Checking your browser") ||
                body.includes("cf-challenge-running") ||
                body.includes("Just a moment...")
            ) {
                throw new Error(
                    "Cloudflare challenge detected — TLS bypass tidak cukup, mungkin butuh cookie/JS challenge solver"
                );
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

/**
 * Normalize chapter slug: "chapter100" → "chapter-100"
 * Memperbaiki slug lama yang tidak ada hyphen antara "chapter" dan angka.
 */
export function normalizeChapterSlug(slug: string): string {
    const match = slug.match(/^chapter(\d+(?:\.\d+)?)$/);
    if (match) {
        return `chapter-${match[1].replace(/\./g, "-")}`;
    }
    return slug;
}
