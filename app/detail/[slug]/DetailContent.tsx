"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ResponsiveAd } from "@/components/Ads/AdComponents";
import { ManhwaDetail, ChapterDetail } from "@/types/manhwa";

// --- Props Interface ---
interface DetailContentProps {
    meta: ManhwaDetail;
    chapters: ChapterDetail[];
    slug: string;
}

export default function DetailContent({ meta, chapters, slug }: DetailContentProps) {
    // Pagination & Sorting States
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(21);
    const [searchQuery, setSearchQuery] = useState("");

    // Get metadata info
    const status = meta.metadata?.Status || "Berjalan";
    const author = meta.metadata?.Author || "";
    const ilustrator = meta.metadata?.Ilustrator || "";
    const type = meta.metadata?.Type || "Manhwa";

    // Helper function to extract chapter number from title
    const extractChapterNumber = (title: string): number => {
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
            return numB - numA;
        } else {
            return numA - numB;
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
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${status === "Berjalan" ? "bg-green-500" : "bg-red-500"}`}>{status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Info Text */}
                        <div className="grow">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3">{meta.title}</h1>

                            <div className="flex items-center gap-4 mb-4 text-sm">
                                <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded font-medium text-xs">{type}</span>
                                {meta.total_chapters > 0 && (
                                    <span className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded font-medium text-xs">
                                        {meta.total_chapters} Chapter
                                    </span>
                                )}
                            </div>

                            {/* Author & Ilustrator Info */}
                            {(author || ilustrator) && (
                                <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 text-sm text-gray-400">
                                    {author && (
                                        <div>
                                            <span className="text-gray-500">Author:</span>{" "}
                                            <span className="text-gray-300 font-medium">{author}</span>
                                        </div>
                                    )}
                                    {ilustrator && (
                                        <div>
                                            <span className="text-gray-500">Ilustrator:</span>{" "}
                                            <span className="text-gray-300 font-medium">{ilustrator}</span>
                                        </div>
                                    )}
                                </div>
                            )}

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

                {/* Ad iklan Di antara Info dan Daftar Chapter */}
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
                        </div>
                    </div>

                    {/* Chapter List */}
                    {chapters.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 italic">Belum ada chapter yang diupload.</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                                {currentChapters.map((chapter, index) => (
                                    <Link key={index} href={`/read/${slug}/${chapter.slug}`} className="block p-4 rounded border border-neutral-800 hover:border-blue-500/50 hover:bg-blue-900/20 hover:shadow-sm transition-all group">
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
                                    {/* Page Info */}
                                    <div className="text-xs sm:text-sm text-gray-400 text-center">
                                        <span className="block sm:inline">
                                            Halaman <span className="font-semibold text-white">{currentPage}</span> dari <span className="font-semibold text-white">{totalPages}</span>
                                        </span>
                                        <span className="hidden sm:inline mx-2">•</span>
                                        <span className="block sm:inline text-gray-500">
                                            {startIndex + 1} - {Math.min(endIndex, sortedChapters.length)} dari {sortedChapters.length} chapter
                                        </span>
                                    </div>

                                    {/* Pagination Buttons */}
                                    <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap w-full max-w-full">
                                        {/* First Page */}
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

                                        {/* Page Numbers */}
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

                                        {/* Last Page */}
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
