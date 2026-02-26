"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Home, Play, Bookmark, ListPlus, Star, Eye, Trophy, List, Bell, Book, Search, ArrowDown, ArrowUp } from "lucide-react";
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
    const [itemsPerPage] = useState(20);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

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

    const firstChapterSlug = sortedChapters.length > 0 ? sortedChapters[sortedChapters.length - 1]?.slug : "#";

    return (
        <div className="min-h-screen bg-neutral-950 font-sans text-gray-200 pb-12 relative overflow-hidden">
            {/* Background Blur Banner */}
            <div className="absolute top-0 left-0 w-full h-[400px] md:h-[500px] z-0 pointer-events-none">
                <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${meta.cover_url})`, filter: 'blur(20px) brightness(0.6)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/80 to-neutral-950" />
            </div>

            {/* Navbar */}
            <nav className="relative z-20 pt-6 px-4 md:px-8 flex justify-between items-center max-w-6xl mx-auto">
                <Link href="/" className="p-3 bg-neutral-900/60 hover:bg-neutral-800 rounded-full transition text-gray-200 backdrop-blur-md">
                    <ArrowLeft size={20} />
                </Link>
                <Link href="/" className="p-3 bg-neutral-900/60 hover:bg-neutral-800 rounded-full transition text-gray-200 backdrop-blur-md">
                    <Home size={20} />
                </Link>
            </nav>

            <div className="max-w-6xl mx-auto px-4 mt-8 relative z-10">
                {/* --- DETAIL HEADER --- */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 mb-8 items-start">
                    {/* Cover - Left */}
                    <div className="shrink-0 w-[180px] md:w-[220px] shadow-2xl rounded-xl overflow-hidden relative border border-neutral-800/50 z-20 mx-auto md:mx-0">
                        <div className="aspect-[3/4]">
                            <img
                                src={meta.cover_url}
                                alt={meta.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/300x400?text=No+Image";
                                }}
                            />
                            {/* Type badge on top left */}
                            <div className="absolute top-2 left-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-blue-600/90 shadow-sm backdrop-blur-sm uppercase tracking-wider">{type}</span>
                            </div>
                        </div>
                    </div>

                    {/* Info Text - Right */}
                    <div className="grow flex flex-col pt-2 md:pt-6 z-20 w-full">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400 mb-2 leading-tight drop-shadow-sm tracking-tight">{meta.title}</h1>
                        <h2 className="text-sm md:text-base text-violet-300/90 font-semibold mb-8 tracking-wide">{author}</h2>

                        {/* Action Buttons and Stats row */}
                        <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between mt-auto">
                            {/* Buttons */}
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href={firstChapterSlug !== "#" ? `/read/${slug}/${firstChapterSlug}` : "#"}
                                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-7 py-3 rounded-full font-bold transition-all shadow-lg shadow-indigo-500/20 shrink-0 hover:scale-[1.03] active:scale-95"
                                >
                                    <Play size={18} fill="currentColor" />
                                    Mulai Baca
                                </Link>
                                <button
                                    onClick={() => alert("Fitur segera datang.")}
                                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 px-5 py-3 rounded-full font-medium transition backdrop-blur-md cursor-pointer"
                                >
                                    <Bookmark size={18} />
                                    <span className="hidden sm:inline">Simpan</span>
                                </button>
                                <button
                                    onClick={() => alert("Fitur segera datang.")}
                                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 px-5 py-3 rounded-full font-medium transition backdrop-blur-md cursor-pointer"
                                >
                                    <ListPlus size={18} />
                                    <span className="hidden sm:inline">Koleksi</span>
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-gray-300 bg-black/20 px-5 py-3 rounded-2xl backdrop-blur-sm border border-white/5">
                                <div className="flex items-center gap-2"><Star size={16} fill="currentColor" className="text-amber-400" /> <span className="text-white">4.8</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Synopsis */}
                <div className="mb-10 text-[15px] md:text-base text-gray-300/90 leading-relaxed max-w-6xl p-6 md:p-8 bg-gradient-to-br from-neutral-900/60 to-neutral-900/20 rounded-3xl border border-white/5 backdrop-blur-md shadow-inner">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2.5 text-lg"><Book size={20} className="text-violet-400" /> Sinopsis</h3>
                    <p className={`inline ${!isSynopsisExpanded ? "line-clamp-3 md:line-clamp-4" : ""}`}>
                        {meta.synopsis || "Belum ada sinopsis."}
                    </p>
                    {meta.synopsis && meta.synopsis.length > 200 && (
                        <button
                            onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                            className="text-violet-400 hover:text-white font-bold ml-2 inline-flex transition-colors cursor-pointer text-sm uppercase tracking-wider mt-2"
                        >
                            {isSynopsisExpanded ? "Tutup" : "Baca Selengkapnya"}
                        </button>
                    )}
                </div>

                {/* Tags Info */}
                <div className="flex flex-wrap gap-3 mb-12 text-sm">
                    {meta.genres && meta.genres.length > 0 && meta.genres.map((genre, idx) => (
                        <span key={idx} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 rounded-xl text-xs font-medium transition-colors shadow-sm">
                            {genre}
                        </span>
                    ))}

                    {author && (
                        <span className="px-4 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-xl text-xs font-semibold shadow-sm">
                            📝 {author}
                        </span>
                    )}

                    {ilustrator && (
                        <span className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs font-semibold shadow-sm">
                            🎨 {ilustrator}
                        </span>
                    )}

                    {type && (
                        <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm">
                            {type}
                        </span>
                    )}
                </div>

                {/* Ad iklan Di antara Info dan Daftar Chapter */}
                {/* <div className="mb-8 flex justify-center">
                    <ResponsiveAd />
                </div> */}

                {/* --- CHAPTER LIST --- */}
                <div className="mt-8 mb-6">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-3 rounded-2xl text-violet-400 border border-white/5 shadow-inner">
                                <List size={26} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Chapters</h2>
                                <p className="text-gray-400 text-sm font-medium mt-0.5">{chapters.length} chapter rilis</p>
                            </div>
                        </div>

                        {/* Search and Sort */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative grow md:grow-0 md:w-64">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search size={18} className="text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Temukan chapter..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 pr-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 text-white w-full transition-all placeholder-gray-500 backdrop-blur-md shadow-inner"
                                />
                            </div>
                            <button
                                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 transition px-4 py-3 rounded-2xl flex items-center justify-center shrink-0 text-gray-300 backdrop-blur-md shadow-sm"
                                title={sortOrder === "newest" ? "Urutkan Terlama" : "Urutkan Terbaru"}
                            >
                                {sortOrder === "newest" ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Chapter List */}
                    {chapters.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 italic bg-white/5 border border-white/5 rounded-3xl backdrop-blur-sm">Belum ada chapter yang diupload.</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
                                {currentChapters.map((chapter, index) => {
                                    // Calculate time ago
                                    let timeAgoStr = "";
                                    if (chapter.waktu_rilis) {
                                        const rilisDate = new Date(chapter.waktu_rilis);
                                        const now = new Date();
                                        const diffMs = Math.abs(now.getTime() - rilisDate.getTime());
                                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                                        if (diffDays === 0) timeAgoStr = "Hari ini";
                                        else if (diffDays < 30) timeAgoStr = `${diffDays} hari lalu`;
                                        else if (diffDays < 365) timeAgoStr = `${Math.floor(diffDays / 30)} bln lalu`;
                                        else timeAgoStr = `${Math.floor(diffDays / 365)} thn lalu`;
                                    }

                                    // Parse chapter title (e.g., "Chapter 300 - Something" or "Chapter 300 Something")
                                    let displayCh = chapter.title;
                                    let displaySub = "";
                                    const parts = chapter.title.split(" - ");
                                    if (parts.length > 1) {
                                        displayCh = parts[0];
                                        displaySub = parts.slice(1).join(" - ");
                                    } else {
                                        const matchMatch = chapter.title.match(/^((?:\w+\s+)?\d+(?:\.\d+)?)\s+(.+)$/i);
                                        if (matchMatch) {
                                            displayCh = matchMatch[1];
                                            displaySub = matchMatch[2];
                                        }
                                    }

                                    // Try to pick a varied thumbnail by skipping the first image
                                    let thumbnailUrl = meta.cover_url;
                                    if (chapter.images && chapter.images.length > 0) {
                                        const targetIndex = Math.min(2, Math.floor(chapter.images.length / 3)); // skip to a scene
                                        thumbnailUrl = chapter.images[targetIndex] || chapter.images[0];
                                    }

                                    return (
                                        <Link key={index} href={`/read/${slug}/${chapter.slug}`} className="flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-violet-500/30 p-3 sm:p-4 rounded-[1.25rem] transition-all group overflow-hidden relative backdrop-blur-sm">
                                            {/* Glowing gradient effect on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-violet-600/0 to-violet-600/5 group-hover:to-violet-600/10 pointer-events-none transition-all duration-500"></div>

                                            {/* Left: Image (Fallback to cover_url) */}
                                            <div className="w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] shrink-0 relative overflow-hidden rounded-xl shadow-md bg-neutral-900 border border-white/5 z-10">
                                                <img
                                                    src={thumbnailUrl || meta.cover_url}
                                                    alt={chapter.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => {
                                                        const target = e.currentTarget;
                                                        const placeholder = "https://placehold.co/120x120/1a1a1a/4ade80?text=Ch";

                                                        // Prevent infinite loop if both thumbnail and cover_url fail
                                                        if (target.src === placeholder) return;

                                                        if (!target.dataset.fallbackTried && meta.cover_url) {
                                                            target.dataset.fallbackTried = "true";
                                                            target.src = meta.cover_url;
                                                        } else {
                                                            target.src = placeholder;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {/* Right: Info */}
                                            <div className="flex flex-col grow justify-center min-w-0 pr-1 z-10">
                                                <div className="flex items-start justify-between gap-3 mb-1">
                                                    <h3 className="font-extrabold text-white text-[16px] xl:text-[17px] group-hover:text-violet-400 transition-colors truncate">
                                                        {displayCh}
                                                    </h3>
                                                    <span className="text-gray-400 text-[11px] font-semibold bg-black/30 px-2 py-0.5 rounded-md whitespace-nowrap">{timeAgoStr}</span>
                                                </div>

                                                {displaySub ? (
                                                    <p className="text-gray-400 text-[13px] line-clamp-2 leading-relaxed">
                                                        {displaySub}
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-500 text-[13px] italic">Baca chapter ini sekarang...</p>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
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
            </div >
        </div >
    );
}
