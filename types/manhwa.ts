
/**
 * Interface untuk Chapter ringkas (di latestChapters pada all-manhwa-metadata.json)
 *
 * @interface Chapter
 * @property {string} title - Judul chapter (contoh: "Chapter 277")
 * @property {string} waktu_rilis - Waktu rilis dalam format ISO 8601 (contoh: "2025-11-20T20:19:22+07:00")
 * @property {string} slug - URL-friendly identifier untuk chapter
 */
export interface Chapter {
    title: string;
    waktu_rilis: string;
    slug: string;
}

/**
 * Interface untuk Manhwa (dari all-manhwa-metadata.json)
 * Digunakan di halaman utama, daftar manhwa, jelajahi, dll.
 *
 * @interface Manhwa
 * @property {string} slug - URL-friendly identifier untuk manhwa
 * @property {string} title - Judul lengkap manhwa (contoh: "All Rounder")
 * @property {string} cover_url - URL lengkap untuk gambar cover manhwa
 * @property {string} pengarang - Nama pengarang/penulis manhwa
 * @property {string} ilustrator - Nama ilustrator manhwa
 * @property {string[]} genres - Array genre manhwa (contoh: ["Action", "Adventure", "Fantasy"])
 * @property {string} genre - String genre gabungan (contoh: "Action, Adventure, Fantasy")
 * @property {string} type - Tipe komik (contoh: "Manhwa", "Manga", "Manhua")
 * @property {string} status - Status publikasi dalam Bahasa Indonesia ("Berjalan" atau "Tamat")
 * @property {string} rating - Rating manhwa dalam format string (contoh: "9.0")
 * @property {number} total_chapters - Total jumlah chapter yang tersedia
 * @property {Chapter[]} latestChapters - Array 2 chapter terbaru, diurutkan dari yang paling baru
 * @property {string} lastUpdateTime - Waktu terakhir data diupdate (ISO 8601)
 */
export interface Manhwa {
    slug: string;
    title: string;
    cover_url: string;
    pengarang: string;
    ilustrator: string;
    genres: string[];
    genre: string;
    type: string;
    status: string;
    rating: string;
    total_chapters: number;
    latestChapters: Chapter[];
    lastUpdateTime: string;
}

/**
 * Interface untuk metadata nested pada detail metadata manhwa
 * Berisi info status, author, ilustrator, dan tipe
 *
 * @interface ManhwaMetadataInfo
 */
export interface ManhwaMetadataInfo {
    Status: string;
    Author: string;
    Ilustrator: string;
    Type: string;
}

/**
 * Interface untuk detail Metadata Manhwa (dari {slug}/metadata.json)
 * Digunakan di halaman detail manhwa
 *
 * @interface ManhwaDetail
 * @property {string} slug - URL-friendly identifier untuk manhwa
 * @property {string} title - Judul lengkap manhwa
 * @property {string} url - URL sumber asli manhwa
 * @property {string} cover_url - URL lengkap untuk gambar cover manhwa
 * @property {string[]} genres - Array genre manhwa
 * @property {string} synopsis - Sinopsis manhwa dalam Bahasa Indonesia
 * @property {ManhwaMetadataInfo} metadata - Info nested (Status, Author, Ilustrator, Type)
 * @property {number} total_chapters - Total jumlah chapter yang tersedia
 */
export interface ManhwaDetail {
    slug: string;
    title: string;
    url: string;
    cover_url: string;
    genres: string[];
    synopsis: string;
    metadata: ManhwaMetadataInfo;
    total_chapters: number;
}

/**
 * Interface untuk detail Chapter dari chapters.json
 * Berisi semua informasi tentang satu chapter termasuk gambar
 *
 * @interface ChapterDetail
 * @property {string} slug - URL-friendly identifier untuk chapter
 * @property {string} title - Judul chapter (contoh: "Chapter2")
 * @property {string} url - URL sumber asli chapter
 * @property {string} waktu_rilis - Waktu rilis chapter (ISO 8601)
 * @property {number} total_images - Total jumlah gambar dalam chapter
 * @property {string[]} images - Array URL gambar chapter
 */
export interface ChapterDetail {
    slug: string;
    title: string;
    url: string;
    waktu_rilis: string;
    total_images: number;
    images: string[];
}

/**
 * Interface untuk response chapters.json
 * Wrapper yang berisi informasi manhwa dan array chapter
 *
 * @interface ChaptersResponse
 * @property {string} slug - Slug manhwa
 * @property {string} title - Judul manhwa
 * @property {number} total_chapters - Total jumlah chapter
 * @property {ChapterDetail[]} chapters - Array chapter detail
 */
export interface ChaptersResponse {
    slug: string;
    title: string;
    total_chapters: number;
    chapters: ChapterDetail[];
}
