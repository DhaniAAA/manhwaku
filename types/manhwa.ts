
/**
 * Interface untuk Chapter (Bab) dari sebuah Manhwa
 *
 * @interface Chapter
 * @property {string} title - Judul chapter (contoh: "Chapter 277")
 * @property {string} waktu_rilis - Waktu rilis dalam format ISO 8601 (contoh: "2025-11-20T20:19:22")
 * @property {string} slug - URL-friendly identifier untuk chapter
 */
export interface Chapter {
    title: string;
    waktu_rilis: string;
    slug: string;
}

/**
 * Interface untuk Manhwa (Komik Korea)
 *
 * @interface Manhwa
 * @property {string} slug - URL-friendly identifier untuk manhwa
 * @property {string} title - Judul lengkap manhwa (contoh: "A Bad Person Bahasa Indonesia")
 * @property {string} cover_url - URL lengkap untuk gambar cover manhwa
 * @property {string[]} genres - Array genre manhwa (contoh: ["Action", "Comedy", "Drama"])
 * @property {string} type - Tipe komik (contoh: "Manhwa", "Manga", "Manhua")
 * @property {string} status - Status publikasi ("Ongoing" atau "Completed")
 * @property {string} rating - Rating manhwa dalam format string (contoh: "9.0")
 * @property {Chapter[]} latestChapters - Array chapter terbaru, diurutkan dari yang paling baru
 */
export interface Manhwa {
    slug: string;
    title: string;
    cover_url: string;
    genres: string[];
    type: string;
    status: string;
    rating: string;
    latestChapters: Chapter[];
}
