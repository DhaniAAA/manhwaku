"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { NativeBannerAd, ResponsiveAd } from "@/components/AdComponents";

// --- Interface Data ---
interface ChapterItem {
  slug: string;
  title: string;
  url: string;
  images: string[]; // Array URL gambar
}

interface ChapterResponse {
  chapters: ChapterItem[];
}

export default function ReadPage() {
  // 1. Tangkap Parameter URL
  const params = useParams();
  const router = useRouter();

  // Casting tipe agar TypeScript tidak complain
  const manhwaSlug = params.slug as string;
  const chapterSlug = params.chapterSlug as string;

  // State
  const [chapterData, setChapterData] = useState<ChapterItem | null>(null);
  const [allChapters, setAllChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 2. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!manhwaSlug || !chapterSlug) return;

      try {
        setLoading(true);
        // Kita ambil list chapter penuh dari API
        const res = await fetch(`/api/manhwa/${manhwaSlug}?type=chapters`);

        if (!res.ok) throw new Error("Gagal mengambil data chapter");

        const data = await res.json();

        // Validasi struktur data
        let chaptersArray: ChapterItem[] = [];
        if (data.chapters && Array.isArray(data.chapters)) {
          chaptersArray = data.chapters;
        } else if (Array.isArray(data)) {
          chaptersArray = data;
        }

        setAllChapters(chaptersArray);

        // 3. Cari Chapter yang sesuai dengan URL saat ini
        const current = chaptersArray.find((ch) => ch.slug === chapterSlug);

        if (current) {
          setChapterData(current);
        } else {
          throw new Error("Chapter tidak ditemukan.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Scroll ke paling atas setiap kali pindah chapter
    window.scrollTo(0, 0);
  }, [manhwaSlug, chapterSlug]);

  // --- Logic Navigasi Next/Prev ---

  // Helper function to extract chapter number from title
  const extractChapterNumber = (title: string): number => {
    const match = title.match(/(?:chapter|ch\.?)\s*(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : 0;
  };

  // Sort chapters by chapter number (ascending: Ch 1, Ch 2, Ch 3, ...)
  const sortedChapters = [...allChapters].sort((a, b) => {
    const numA = extractChapterNumber(a.title);
    const numB = extractChapterNumber(b.title);
    return numA - numB; // Ascending order
  });

  const currentIndex = sortedChapters.findIndex((ch) => ch.slug === chapterSlug);

  // Prev Chapter = Chapter dengan nomor lebih kecil (index lebih kecil)
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;

  // Next Chapter = Chapter dengan nomor lebih besar (index lebih besar)
  const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  // --- RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
        Memuat gambar...
      </div>
    );
  }

  if (error || !chapterData) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan</h2>
        <p className="text-gray-400 mb-4">{error || "Chapter hilang."}</p>
        <button onClick={() => router.back()} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      {/* HEADER/NAVBAR Sticky */}
      <div className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 shadow-lg transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Tombol Kembali ke Daftar Chapter */}
          <Link href={`/detail/${manhwaSlug}`} className="flex items-center text-sm font-medium hover:text-blue-400 transition">
            <span className="mr-1">←</span> Daftar
          </Link>

          {/* Judul Chapter (Tengah) */}
          <h1 className="text-sm md:text-base font-bold truncate max-w-[200px] md:max-w-md text-center text-white">{chapterData.title}</h1>

          {/* Navigasi Cepat Header */}
          <div className="flex gap-2">
            {/* Tombol Prev */}
            <Link
              href={prevChapter ? `/read/${manhwaSlug}/${prevChapter.slug}` : "#"}
              className={`px-3 py-1 rounded text-xs font-bold border ${prevChapter ? "border-gray-600 hover:bg-gray-800 text-white" : "border-gray-800 text-gray-600 cursor-not-allowed"}`}
              aria-disabled={!prevChapter}
            >
              ← Prev
            </Link>

            {/* Tombol Next */}
            <Link
              href={nextChapter ? `/read/${manhwaSlug}/${nextChapter.slug}` : "#"}
              className={`px-3 py-1 rounded text-xs font-bold border ${nextChapter ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700" : "border-gray-800 text-gray-600 cursor-not-allowed"}`}
              aria-disabled={!nextChapter}
            >
              Next →
            </Link>


          </div>
        </div>
      </div>

      {/* Ad Iklan Di bawah Prev dan Next */}
      <div className="max-w-3xl mx-auto mt-4 mb-2">
        <ResponsiveAd className="bg-gray-800 rounded-lg" />
      </div>

      {/* AREA BACA (GAMBAR) */}
      <main className="max-w-3xl mx-auto bg-black min-h-screen shadow-2xl">
        {chapterData.images && chapterData.images.length > 0 ? (
          chapterData.images.map((imgUrl, idx) => (
            <img
              key={idx}
              src={imgUrl}
              alt={`Page ${idx + 1}`}
              loading="lazy" // Lazy load agar hemat bandwidth
              className="w-full h-auto block"
              // 'block' penting untuk menghilangkan celah putih antar gambar
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none"; // Sembunyikan gambar error
              }}
            />
          ))
        ) : (
          <div className="py-20 text-center text-gray-500">Tidak ada gambar untuk ditampilkan.</div>
        )}
      </main>

      {/* FOOTER NAVIGASI */}
      <div className="max-w-3xl mx-auto p-8 bg-gray-900 text-center space-y-6 border-t border-gray-800 mt-4">
        <p className="text-gray-400 text-sm">Kamu baru saja selesai membaca:</p>
        <h2 className="text-xl font-bold text-white">{chapterData.title}</h2>

        <div className="flex justify-center gap-4 mt-4">
          {prevChapter && (
            <Link href={`/read/${manhwaSlug}/${prevChapter.slug}`} className="px-6 py-3 rounded-full border border-gray-600 hover:bg-gray-800 transition font-semibold">
              ← {prevChapter.title}
            </Link>
          )}

          {nextChapter ? (
            <Link href={`/read/${manhwaSlug}/${nextChapter.slug}`} className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition font-semibold shadow-lg shadow-blue-900/20">
              {nextChapter.title} →
            </Link>
          ) : (
            <div className="px-6 py-3 rounded-full bg-gray-800 text-gray-500 cursor-not-allowed">Sudah Chapter Terakhir</div>
          )}
        </div>

        {/* Native Banner Ad - Looks like content recommendations */}
        <div className="mt-8">
          <p className="text-xs text-gray-500 mb-2">Sponsored - Iklan Di Bawah Sini</p>
          <NativeBannerAd className="rounded-lg overflow-hidden bg-gray-800" />
        </div>

      </div>
    </div>
  );
}
