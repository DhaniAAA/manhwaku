"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BannerAd, ResponsiveAd } from "@/components/Ads/AdComponents";
// --- 1. Definisi Interface (Disesuaikan dengan JSON kamu) ---

interface Metadata {
  title: string;
  cover_url: string;
  author?: string;
  status: string;
  rating: string;
  genres: string[];
  synopsis?: string;
  type?: string;
}

interface ChapterItem {
  slug: string;
  title: string;
  waktu_rilis: string;
  url: string;
}

// Struktur JSON chapters.json kamu ternyata berupa Object, bukan Array langsung
interface ChapterResponse {
  slug: string;
  title: string;
  total_chapters: number;
  chapters: ChapterItem[]; // <--- Kita butuh array ini
}

export default function ManhwaDetail() {
  const params = useParams();
  const router = useRouter();

  const [meta, setMeta] = useState<Metadata | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination & Sorting States
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(21);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!params.slug) return;
    const slug = params.slug as string;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Ambil Metadata & Chapters secara paralel
        const [metaRes, chapterRes] = await Promise.all([fetch(`/api/manhwa/${slug}?type=metadata`), fetch(`/api/manhwa/${slug}?type=chapters`)]);

        // --- Handle Metadata ---
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          setMeta(metaData);
        } else {
          throw new Error("Metadata tidak ditemukan.");
        }

        // --- Handle Chapters (PERBAIKAN DISINI) ---
        if (chapterRes.ok) {
          const rawData = await chapterRes.json();

          // Cek apakah dia punya properti 'chapters' (seperti di JSON kamu)
          if (rawData.chapters && Array.isArray(rawData.chapters)) {
            setChapters(rawData.chapters);
          }
          // Jaga-jaga kalau formatnya array biasa (backward compatibility)
          else if (Array.isArray(rawData)) {
            setChapters(rawData);
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.slug]);

  // --- Sorting & Pagination Logic ---

  // Helper function to extract chapter number from title
  const extractChapterNumber = (title: string): number => {
    // Match patterns like "Chapter 123", "Ch 123", "Ch. 123", etc.
    const match = title.match(/(?:chapter|ch\.?)\s*(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : 0;
  };

  // Filter chapters based on search query
  const filteredChapters = chapters.filter((chapter) =>
    chapter.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort chapters based on sortOrder
  const sortedChapters = [...filteredChapters].sort((a, b) => {
    const numA = extractChapterNumber(a.title);
    const numB = extractChapterNumber(b.title);

    if (sortOrder === "newest") {
      return numB - numA; // Highest chapter number first
    } else {
      return numA - numB; // Lowest chapter number first
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedChapters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChapters = sortedChapters.slice(startIndex, endIndex);

  // Reset to page 1 when sort order, items per page, or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOrder, itemsPerPage, searchQuery]);

  // --- RENDER UI ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-400">Memuat data komik...</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950">
        <p className="text-red-500 mb-4">Gagal memuat data komik.</p>
        <button onClick={() => router.back()} className="text-blue-500 hover:underline">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-gray-200 pb-12">
      {/* Navbar */}
      <nav className="bg-neutral-900 shadow-sm py-4 px-4 sticky top-0 z-20 border-b border-neutral-800">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-neutral-800 rounded-full transition text-gray-400 hover:text-white">
            ←
          </Link>
          <h1 className="font-bold text-lg truncate text-gray-200">{meta.title}</h1>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {/* --- DETAIL HEADER --- */}
        <div className="bg-neutral-900 rounded-xl shadow-sm p-6 md:p-8 mb-8 border border-neutral-800">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover */}
            <div className="shrink-0 md:w-64 w-full mx-auto">
              <div className="aspect-3/4 rounded-lg overflow-hidden shadow-md relative">
                <img
                  src={meta.cover_url}
                  alt={meta.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/300x400?text=No+Image";
                  }}
                />
                {/* Status */}
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${meta.status === "Ongoing" ? "bg-green-500" : "bg-red-500"}`}>{meta.status}</span>
                </div>
              </div>
            </div>

            {/* Info Text */}
            <div className="grow">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3">{meta.title}</h1>

              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center text-yellow-500 font-bold text-lg">★ {meta.rating}</div>
                <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded font-medium text-xs">{meta.type || "Manhwa"}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {meta.genres &&
                  meta.genres.map((genre, idx) => (
                    <span key={idx} className="px-3 py-1 border border-neutral-700 rounded-full text-xs text-gray-400">
                      {genre}
                    </span>
                  ))}
              </div>

              <div className="bg-neutral-800 p-4 rounded-lg text-sm text-gray-400">
                <h3 className="font-bold text-gray-200 mb-1">Sinopsis</h3>
                <p>{meta.synopsis || "Belum ada sinopsis."}</p>
              </div>
            </div>
          </div>
        </div>

        {/*Ad iklan Di antara Info dan Daftar Chapter */}
        <div className="mb-8 flex justify-center">
          <ResponsiveAd />
        </div>

        {/* --- CHAPTER LIST --- */}
        <div className="bg-neutral-900 rounded-xl shadow-sm p-6 border border-neutral-800">
          {/* Header with Controls */}
          <div className="border-b border-neutral-800 pb-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-white">
                Daftar Chapter <span className="text-gray-500 text-xl font-normal">({chapters.length})</span>
              </h2>

              {/* Sort Controls */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 font-medium">Urutan:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortOrder("newest")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortOrder === "newest" ? "bg-blue-600 text-white shadow-md" : "bg-neutral-800 text-gray-400 hover:bg-neutral-700 cursor-pointer"}`}
                  >
                    Terbaru
                  </button>
                  <button
                    onClick={() => setSortOrder("oldest")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortOrder === "oldest" ? "bg-blue-600 text-white shadow-md" : "bg-neutral-800 text-gray-400 hover:bg-neutral-700 cursor-pointer"}`}
                  >
                    Terlama
                  </button>
                </div>
              </div>
            </div>

            {/* Search Chapter Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari chapter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-10 py-2 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-neutral-800 text-white w-full sm:w-64 transition-all"
              />
              {/* <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div> */}
            </div>
          </div>

          {/* Chapter List */}
          {chapters.length === 0 ? (
            <div className="text-center py-10 text-gray-500 italic">Belum ada chapter yang diupload.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {currentChapters.map((chapter, index) => (
                  <Link key={index} href={`/read/${params.slug}/${chapter.slug}`} className="block p-4 rounded border border-neutral-800 hover:border-blue-500/50 hover:bg-blue-900/20 hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-300 group-hover:text-blue-400 truncate">{chapter.title}</span>

                      {/* Format Tanggal */}
                      {chapter.waktu_rilis && (
                        <span className="text-[10px] text-gray-500 bg-neutral-800 px-2 py-1 rounded shrink-0 ml-2">
                          {new Date(chapter.waktu_rilis).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 pt-4 border-t px-2">
                  {/* Page Info - Simplified for mobile */}
                  <div className="text-xs sm:text-sm text-gray-400 text-center">
                    <span className="block sm:inline">
                      Halaman <span className="font-semibold text-white">{currentPage}</span> dari <span className="font-semibold text-white">{totalPages}</span>
                    </span>
                    <span className="hidden sm:inline mx-2">•</span>
                    <span className="block sm:inline text-gray-500">
                      {startIndex + 1} - {Math.min(endIndex, sortedChapters.length)} dari {sortedChapters.length} chapter
                    </span>
                  </div>

                  {/* Pagination Buttons - Mobile Optimized */}
                  <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap w-full max-w-full">
                    {/* First Page - Hidden on mobile */}
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className={`hidden sm:block px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1 ? "bg-neutral-800 text-gray-600 cursor-not-allowed" : "bg-neutral-800 text-gray-300 hover:bg-neutral-700 cursor-pointer"}`}
                    >
                      ««
                    </button>

                    {/* Previous Page */}
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${currentPage === 1 ? "bg-neutral-800 text-gray-600 cursor-not-allowed" : "bg-neutral-800 text-gray-300 hover:bg-neutral-700 cursor-pointer"}`}
                    >
                      <span className="sm:hidden">«</span>
                      <span className="hidden sm:inline">« Prev</span>
                    </button>

                    {/* Page Numbers - Always show 5 */}
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        const maxVisible = 5;
                        if (totalPages <= maxVisible) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - maxVisible + 1 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${currentPage === pageNum ? "bg-blue-600 text-white shadow-md" : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Page */}
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${currentPage === totalPages ? "bg-neutral-800 text-gray-600 cursor-not-allowed" : "bg-neutral-800 text-gray-300 hover:bg-neutral-700 cursor-pointer"}`}
                    >
                      <span className="sm:hidden">»</span>
                      <span className="hidden sm:inline">Next »</span>
                    </button>

                    {/* Last Page - Hidden on mobile */}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`hidden sm:block px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages ? "bg-neutral-800 text-gray-600 cursor-not-allowed" : "bg-neutral-800 text-gray-300 hover:bg-neutral-700 cursor-pointer"}`}
                    >
                      »»
                    </button>
                  </div>
                </div>
              )}

              {/* Ad iklan Di bawah daftar chapter */}
              {/* <div className="mt-6 border-t border-neutral-800 pt-6 flex justify-center">
                <BannerAd />
              </div> */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
