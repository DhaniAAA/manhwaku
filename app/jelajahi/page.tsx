"use client";

import { useEffect, useState } from "react";
import { useManhwaData } from "@/hooks/useManhwaData";
import Navbar from "@/components/ui/Navbar";
import ManhwaGrid from "@/components/home/ManhwaGrid";
import Pagination from "@/components/ui/Pagination";

// List of all possible genres
const ALL_GENRES = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
    "Martial Arts", "Mystery", "Romance", "Sci-Fi", "Slice of Life",
    "Sports", "Supernatural", "Thriller", "Tragedy", "Historical",
    "Psychological", "School Life", "Seinen", "Shoujo", "Shounen", "Josei",
    "Harem", "Isekai", "Ecchi", "Gore", "Mature", "Adult"
];

const ITEMS_PER_PAGE = 20;

export default function JelajahiPage() {
    const { manhwas, loading } = useManhwaData();
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(true);

    // Get unique types from data
    const types = ["all", ...new Set(manhwas.map(m => m.type).filter(Boolean))];
    const statuses = ["all", "Berjalan", "Tamat"];

    // Toggle genre selection
    const toggleGenre = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        );
        setCurrentPage(1);
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedGenres([]);
        setSelectedType("all");
        setSelectedStatus("all");
        setSortBy("newest");
        setCurrentPage(1);
    };

    // Filter manhwas
    const filteredManhwas = manhwas.filter(manhwa => {
        // Genre filter
        if (selectedGenres.length > 0) {
            const hasMatchingGenre = selectedGenres.some(genre =>
                manhwa.genres?.some(g => g.toLowerCase().includes(genre.toLowerCase()))
            );
            if (!hasMatchingGenre) return false;
        }

        // Type filter
        if (selectedType !== "all" && manhwa.type !== selectedType) {
            return false;
        }

        // Status filter
        if (selectedStatus !== "all" && manhwa.status !== selectedStatus) {
            return false;
        }

        return true;
    });

    // Sort manhwas
    const sortedManhwas = [...filteredManhwas].sort((a, b) => {
        switch (sortBy) {
            case "newest":
                const aTime = a.lastUpdateTime || a.latestChapters?.[0]?.waktu_rilis || "";
                const bTime = b.lastUpdateTime || b.latestChapters?.[0]?.waktu_rilis || "";
                return new Date(bTime).getTime() - new Date(aTime).getTime();
            case "oldest":
                const aTimeOld = a.lastUpdateTime || a.latestChapters?.[0]?.waktu_rilis || "";
                const bTimeOld = b.lastUpdateTime || b.latestChapters?.[0]?.waktu_rilis || "";
                return new Date(aTimeOld).getTime() - new Date(bTimeOld).getTime();
            case "rating":
                return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
            case "title":
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedManhwas.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentManhwas = sortedManhwas.slice(startIndex, endIndex);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedGenres, selectedType, selectedStatus, sortBy]);

    return (
        <div className="min-h-screen bg-neutral-950 text-gray-200 font-sans">
            {/* Navbar */}
            <Navbar showSearch={false} />

            {/* Page Title */}
            <div className="bg-neutral-900 border-b border-neutral-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h1 className="text-xl font-bold text-white">Jelajahi Manhwa</h1>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors lg:hidden"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {showFilters ? "Sembunyikan" : "Filter"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Filters */}
                    <aside className={`lg:w-72 shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block`}>
                        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filter
                                </h2>
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-red-500 hover:text-red-400 font-medium"
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Type Filter */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-400 mb-3">Tipe</h3>
                                <div className="flex flex-wrap gap-2">
                                    {types.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setSelectedType(type);
                                                setCurrentPage(1);
                                            }}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${selectedType === type
                                                ? "bg-blue-600 text-white"
                                                : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                                                }`}
                                        >
                                            {type === "all" ? "Semua" : type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-400 mb-3">Status</h3>
                                <div className="flex flex-wrap gap-2">
                                    {statuses.map(status => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setSelectedStatus(status);
                                                setCurrentPage(1);
                                            }}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${selectedStatus === status
                                                ? "bg-blue-600 text-white"
                                                : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                                                }`}
                                        >
                                            {status === "all" ? "Semua" : status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort By */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-400 mb-3">Urutkan</h3>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-neutral-800 text-gray-200"
                                >
                                    <option value="newest">Terbaru</option>
                                    <option value="oldest">Terlama</option>
                                    <option value="rating">Rating Tertinggi</option>
                                    <option value="title">Judul (A-Z)</option>
                                </select>
                            </div>

                            {/* Genre Filter */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 mb-3">Genre</h3>
                                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                    {ALL_GENRES.map(genre => (
                                        <button
                                            key={genre}
                                            onClick={() => toggleGenre(genre)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${selectedGenres.includes(genre)
                                                ? "bg-blue-600 text-white"
                                                : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                                                }`}
                                        >
                                            {genre}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Active Filters Count */}
                            {(selectedGenres.length > 0 || selectedType !== "all" || selectedStatus !== "all") && (
                                <div className="mt-6 pt-4 border-t border-neutral-800">
                                    <p className="text-xs text-gray-500">
                                        <span className="font-semibold text-blue-600">
                                            {selectedGenres.length + (selectedType !== "all" ? 1 : 0) + (selectedStatus !== "all" ? 1 : 0)}
                                        </span> filter aktif
                                    </p>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-gray-400">
                                Menampilkan <span className="font-semibold text-white">{sortedManhwas.length}</span> manhwa
                            </p>
                            {selectedGenres.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedGenres.map(genre => (
                                        <span
                                            key={genre}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900/30 text-blue-400 text-xs font-medium rounded-full"
                                        >
                                            {genre}
                                            <button
                                                onClick={() => toggleGenre(genre)}
                                                className="hover:text-blue-300"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <p className="text-gray-400 animate-pulse">Sedang memuat...</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && sortedManhwas.length === 0 && (
                            <div className="text-center py-20 bg-neutral-900 rounded-xl border border-dashed border-neutral-800">
                                <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-gray-400 text-lg mb-2">Tidak ada manhwa ditemukan</p>
                                <p className="text-gray-500 text-sm">Coba ubah filter pencarian Anda</p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Reset Filter
                                </button>
                            </div>
                        )}

                        {/* Manhwa Grid */}
                        {!loading && sortedManhwas.length > 0 && (
                            <>
                                <ManhwaGrid manhwas={currentManhwas} startIndex={startIndex} />

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center w-full mt-8">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            startIndex={startIndex}
                                            endIndex={endIndex}
                                            totalItems={sortedManhwas.length}
                                            onPageChange={setCurrentPage}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-neutral-900 border-t border-neutral-800 py-8 text-center text-gray-500 text-sm mt-auto">
                <p>© {new Date().getFullYear()} ManhwaKu. Data obtained from various sources.</p>
            </footer>
        </div>
    );
}
