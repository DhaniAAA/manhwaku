"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackSearch, trackError, trackManhwaClick, trackPagination } from "@/lib/gtm";

// 1. Update Interface sesuai JSON aslimu
interface Chapter {
    title: string;
    waktu_rilis: string;
    slug: string;
}

interface Manhwa {
    slug: string;
    title: string;
    cover_url: string; // Langsung URL lengkap
    genres: string[];
    type: string;
    status: string;
    rating: string;
    latestChapters: Chapter[];
}

export default function Home() {
    const [manhwas, setManhwas] = useState<Manhwa[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
    const itemsPerPage = 20;

    // 2. Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/all_manhwa");
                if (!res.ok) throw new Error("Gagal mengambil data");
                const data = await res.json();

                if (Array.isArray(data)) {
                    setManhwas(data);
                } else {
                    console.error("Format data salah:", data);
                }
            } catch (error) {
                console.error(error);
                trackError("api_fetch", error instanceof Error ? error.message : "Failed to fetch manhwa data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 3. Filter Pencarian
    const filteredManhwas = manhwas.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()));

    // 4. Sort berdasarkan waktu rilis chapter terbaru
    const sortedManhwas = [...filteredManhwas].sort((a, b) => {
        // Ambil waktu rilis chapter terbaru (index 0 adalah yang paling baru)
        const aLatestTime = a.latestChapters && a.latestChapters.length > 0 ? a.latestChapters[0].waktu_rilis : "";
        const bLatestTime = b.latestChapters && b.latestChapters.length > 0 ? b.latestChapters[0].waktu_rilis : "";

        // Jika salah satu tidak punya chapter, taruh di bawah
        if (!aLatestTime) return 1;
        if (!bLatestTime) return -1;

        // Parse ISO 8601 timestamp (format: "2025-11-20T20:19:22")
        const aTimestamp = new Date(aLatestTime).getTime();
        const bTimestamp = new Date(bLatestTime).getTime();

        // Jika parsing gagal, taruh di bawah
        if (isNaN(aTimestamp)) return 1;
        if (isNaN(bTimestamp)) return -1;

        // Sort: newest first (larger timestamp = more recent)
        return sortOrder === "newest" ? bTimestamp - aTimestamp : aTimestamp - bTimestamp;
    });

    // 5. Pagination Calculations
    const totalPages = Math.ceil(sortedManhwas.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentManhwas = sortedManhwas.slice(startIndex, endIndex);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Track search with debounce
    useEffect(() => {
        if (searchTerm) {
            // Debounce untuk tidak track setiap keystroke
            const timer = setTimeout(() => {
                trackSearch(searchTerm, sortedManhwas.length);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [searchTerm, sortedManhwas.length]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            {/* --- NAVBAR --- */}
            <nav className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <h1 className="text-2xl font-bold text-blue-600 tracking-tight whitespace-nowrap">
                            Manhwa<span className="text-gray-800">Ku</span>
                        </h1>

                        {/* Navigation Menu - Hidden on mobile */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                Home
                            </Link>
                            <Link href="/jelajahi" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                                Jelajahi
                            </Link>
                            <Link href="/library" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                                Library
                            </Link>
                            <Link href="/daftar-manhwa" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                                Daftar Manhwa
                            </Link>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-md relative">
                            <input
                                type="text"
                                placeholder="Cari manhwa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full py-2 px-4 pr-10 rounded-full text-sm text-gray-800 bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 placeholder-gray-400 transition-all"
                            />
                            <span className="absolute right-4 top-2.5 text-gray-400 text-sm">🔍</span>
                        </div>

                        {/* API Docs Link */}
                        <Link href="/api" className="hidden lg:block text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors whitespace-nowrap">
                            API Docs
                        </Link>
                    </div>

                    {/* Mobile Navigation Menu */}
                    <div className="md:hidden flex items-center gap-4 mt-3 overflow-x-auto pb-1">
                        <Link href="/" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap">
                            Home
                        </Link>
                        <Link href="/jelajahi" className="text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap">
                            Jelajahi
                        </Link>
                        <Link href="/library" className="text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap">
                            Library
                        </Link>
                        <Link href="/daftar-manhwa" className="text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap">
                            Daftar Manhwa
                        </Link>
                    </div>
                </div>
            </nav>

            {/* --- HERO --- */}
            <header className="bg-linear-to-r from-blue-600 to-blue-700 text-white py-12 px-4 text-center shadow-md">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Temukan Bacaan Favoritmu</h2>
                <p className="text-blue-100 text-lg max-w-2xl mx-auto">Koleksi manhwa terlengkap dengan update chapter terbaru setiap hari.</p>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col justify-center items-center h-64 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 animate-pulse">Sedang memuat komik...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && sortedManhwas.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-400 text-lg">Komik "{searchTerm}" tidak ditemukan.</p>
                    </div>
                )}

                {/* GRID LAYOUT */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
                    {currentManhwas.map((manhwa, index) => (
                        <Link
                            href={`/detail/${manhwa.slug}`}
                            key={index}
                            onClick={() => trackManhwaClick({
                                title: manhwa.title,
                                slug: manhwa.slug,
                                position: startIndex + index + 1
                            })}
                            className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                        >
                            {/* Image Cover */}
                            <div className="aspect-3/4 overflow-hidden bg-gray-200 relative">
                                {/* Label Chapter Terbaru di Pojok Kiri Atas */}
                                {manhwa.latestChapters && manhwa.latestChapters.length > 0 && (
                                    <div className="absolute top-2 left-2 z-10">
                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">{manhwa.latestChapters[0].title.replace("Chapter", "Ch.")}</span>
                                    </div>
                                )}

                                <img
                                    src={manhwa.cover_url} // Menggunakan URL langsung dari JSON
                                    alt={manhwa.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                    onError={(e) => {
                                        // Fallback image jika link rusak
                                        (e.target as HTMLImageElement).src = "https://placehold.co/300x400?text=No+Image";
                                    }}
                                />

                                {/* Rating Badge di Pojok Kanan Bawah Image */}
                                <div className="absolute bottom-0 right-0 bg-linear-to-t from-black/80 to-transparent w-full p-2 flex justify-end">
                                    <div className="flex items-center text-white text-xs font-bold">
                                        <span className="text-yellow-400 mr-1">★</span>
                                        {manhwa.rating}
                                    </div>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="p-3 flex flex-col grow">
                                {/* Genres (Tampilkan 1 saja biar rapi) */}
                                <div className="text-[10px] text-blue-600 font-semibold mb-1 uppercase tracking-wide">{manhwa.genres && manhwa.genres.length > 0 ? manhwa.genres[0] : manhwa.type}</div>

                                {/* Title */}
                                <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-blue-700 transition-colors">
                                    {manhwa.title.replace(" Bahasa Indonesia", "")}
                                    {/* Saya hapus "Bahasa Indonesia" agar judul tidak kepanjangan */}
                                </h3>

                                {/* Last Chapter Info */}
                                {manhwa.latestChapters && manhwa.latestChapters.length > 0 && (
                                    <div className="text-[10px] text-gray-500 mb-2">
                                        <span className="font-medium">Last: </span>
                                        {manhwa.latestChapters[manhwa.latestChapters.length - 1].title.replace("Chapter", "Ch.")}
                                    </div>
                                )}

                                {/* Status Badge (Footer Card) */}
                                <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${manhwa.status === "Ongoing" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{manhwa.status}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* PAGINATION CONTROLS */}
                {!loading && sortedManhwas.length > 0 && totalPages > 1 && (
                    <div className="mt-12 flex flex-col items-center gap-4">
                        {/* Page Info */}
                        <p className="text-sm text-gray-600">
                            Menampilkan {startIndex + 1}-{Math.min(endIndex, sortedManhwas.length)} dari {sortedManhwas.length} manhwa
                        </p>

                        {/* Pagination Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Previous Button */}
                            <button
                                onClick={() => {
                                    const newPage = Math.max(currentPage - 1, 1);
                                    setCurrentPage(newPage);
                                    trackPagination(newPage, totalPages);
                                }}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                ← Prev
                            </button>

                            {/* Page Numbers */}
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((page) => {
                                        // Show first page, last page, current page, and pages around current
                                        return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                                    })
                                    .map((page, index, array) => (
                                        <div key={page} className="flex items-center gap-1">
                                            {/* Show ellipsis if there's a gap */}
                                            {index > 0 && page - array[index - 1] > 1 && <span className="px-2 text-gray-400">...</span>}
                                            <button
                                                onClick={() => {
                                                    setCurrentPage(page);
                                                    trackPagination(page, totalPages);
                                                }}
                                                className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === page ? "bg-blue-600 text-white shadow-md" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                                            >
                                                {page}
                                            </button>
                                        </div>
                                    ))}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={() => {
                                    const newPage = Math.min(currentPage + 1, totalPages);
                                    setCurrentPage(newPage);
                                    trackPagination(newPage, totalPages);
                                }}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <footer className="bg-white border-t py-8 text-center text-gray-500 text-sm mt-auto">
                <p>© {new Date().getFullYear()} ManhwaKu. Data obtained from various sources.</p>
            </footer>
        </div>
    );
}
