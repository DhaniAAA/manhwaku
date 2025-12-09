"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BannerAd, ResponsiveAd } from "@/components/AdComponents";
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
  const [itemsPerPage, setItemsPerPage] = useState(20);

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

  // Sort chapters based on sortOrder
  const sortedChapters = [...chapters].sort((a, b) => {
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

  // Reset to page 1 when sort order or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOrder, itemsPerPage]);

  // --- RENDER UI ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Memuat data komik...</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-red-500 mb-4">Gagal memuat data komik.</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-12">
      {/* Navbar */}
      <nav className="bg-white shadow-sm py-4 px-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition">
            ←
          </Link>
          <h1 className="font-bold text-lg truncate text-gray-700">{meta.title}</h1>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {/* --- DETAIL HEADER --- */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8">
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
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">{meta.title}</h1>

              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center text-yellow-500 font-bold text-lg">★ {meta.rating}</div>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded font-medium text-xs">{meta.type || "Manhwa"}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {meta.genres &&
                  meta.genres.map((genre, idx) => (
                    <span key={idx} className="px-3 py-1 border border-gray-200 rounded-full text-xs text-gray-600">
                      {genre}
                    </span>
                  ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                <h3 className="font-bold text-gray-900 mb-1">Sinopsis</h3>
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
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Header with Controls */}
          <div className="border-b pb-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Daftar Chapter <span className="text-gray-400 text-xl font-normal">({chapters.length})</span>
              </h2>

              {/* Sort Controls */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Urutan:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortOrder("newest")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortOrder === "newest" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"}`}
                  >
                    Terbaru
                  </button>
                  <button
                    onClick={() => setSortOrder("oldest")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortOrder === "oldest" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"}`}
                  >
                    Terlama
                  </button>
                </div>
              </div>
            </div>

            {/* Items Per Page Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
              >
                <option value={10}>10 per halaman</option>
                <option value={20}>20 per halaman</option>
                <option value={30}>30 per halaman</option>
                <option value={50}>50 per halaman</option>
                <option value={100}>100 per halaman</option>
              </select>
            </div>
          </div>

          {/* Chapter List */}
          {chapters.length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic">Belum ada chapter yang diupload.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {currentChapters.map((chapter, index) => (
                  <Link key={index} href={`/read/${params.slug}/${chapter.slug}`} className="block p-4 rounded border border-gray-100 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 group-hover:text-blue-700 truncate">{chapter.title}</span>

                      {/* Format Tanggal */}
                      {chapter.waktu_rilis && (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded shrink-0 ml-2">
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
                  <div className="text-xs sm:text-sm text-gray-600 text-center">
                    <span className="block sm:inline">
                      Halaman <span className="font-semibold">{currentPage}</span> dari <span className="font-semibold">{totalPages}</span>
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
                      className={`hidden sm:block px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"}`}
                    >
                      ««
                    </button>

                    {/* Previous Page */}
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"}`}
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
                            className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${currentPage === pageNum ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
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
                      className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"}`}
                    >
                      <span className="sm:hidden">»</span>
                      <span className="hidden sm:inline">Next »</span>
                    </button>

                    {/* Last Page - Hidden on mobile */}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`hidden sm:block px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"}`}
                    >
                      »»
                    </button>
                  </div>
                </div>
              )}

              {/* Ad iklan Di bawah daftar chapter */}
              {totalPages > 1 && chapters.length > 10 && (
                <div className="mt-6 border-t pt-6 flex justify-center">
                  <BannerAd />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
