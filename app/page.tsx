"use client";

import { useEffect, useState } from "react";
import { trackSearch } from "@/lib/gtm";
import { useManhwaData } from "@/hooks/useManhwaData";
import { useChaptersUpdateTimes } from "@/hooks/useChaptersUpdateTimes";
import { ITEMS_PER_PAGE, SEARCH_DEBOUNCE_DELAY } from "@/constants/app";
import Navbar from "@/components/ui/Navbar";
import HeroSlider from "@/components/home/HeroSlider";
import ManhwaGrid from "@/components/home/ManhwaGrid";
import Pagination from "@/components/ui/Pagination";
import { FloatingAd, ResponsiveAd } from "@/components/Ads/AdComponents";
import ReadingHistory from "@/components/home/ReadingHistory";

export default function Home() {
    const { manhwas, loading } = useManhwaData();
    const { chaptersUpdateTimes } = useChaptersUpdateTimes();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

    // Filter Pencarian
    const filteredManhwas = manhwas.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper function: Ambil timestamp dari last modified chapters.json di Storage
    const getUpdateTimestamp = (manhwa: typeof manhwas[0]): number => {
        // Gunakan last modified dari chapters.json di Supabase Storage
        const storageTime = chaptersUpdateTimes[manhwa.slug];
        if (storageTime) {
            const timestamp = new Date(storageTime).getTime();
            if (!isNaN(timestamp)) return timestamp;
        }

        return 0;
    };

    // Sort berdasarkan last modified chapters.json (Update Terbaru)
    const sortedManhwas = [...filteredManhwas].sort((a, b) => {
        const aTimestamp = getUpdateTimestamp(a);
        const bTimestamp = getUpdateTimestamp(b);

        // Manhwa tanpa timestamp valid ditaruh di akhir
        if (aTimestamp === 0 && bTimestamp === 0) return 0;
        if (aTimestamp === 0) return 1;
        if (bTimestamp === 0) return -1;

        return sortOrder === "newest" ? bTimestamp - aTimestamp : aTimestamp - bTimestamp;
    });

    // Pagination Calculations
    const totalPages = Math.ceil(sortedManhwas.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentManhwas = sortedManhwas.slice(startIndex, endIndex);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Track search with debounce
    useEffect(() => {
        if (searchTerm) {
            const timer = setTimeout(() => {
                trackSearch(searchTerm, sortedManhwas.length);
            }, SEARCH_DEBOUNCE_DELAY);

            return () => clearTimeout(timer);
        }
    }, [searchTerm, sortedManhwas.length]);

    return (
        <div className="min-h-screen bg-neutral-950 text-gray-200 font-sans">
            {/* Navbar */}
            <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

            {/* Floating Ad */}
            {/* <FloatingAd /> */}

            {/* Hero Slider */}
            <HeroSlider manhwas={manhwas} />

            {/* Banner Ad - After Hero */}
            <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1">
                <ResponsiveAd />
            </div>

            {/* Banner Ad - Iklan Sponsor */}
            <div className="max-w-7xl mx-auto px-4 mt-6">
                <div className="w-full h-32 bg-neutral-900 rounded-xl border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center text-gray-500 hover:bg-neutral-800 transition-colors">
                    <span className="font-semibold text-lg">Space Iklan Tersedia</span>
                    <span className="text-sm mt-1 text-center text-gray-400 ">Hubungi admin untuk pasang iklan di sini Email: 01windsurf@gmail.com</span>
                </div>
            </div>
            {/* Main Content with Sidebar */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column - Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-1.5 bg-linear-to-b from-blue-500 to-cyan-400 rounded-full"></div>
                                <h2 className="text-2xl font-bold text-white">Update Terbaru</h2>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Auto-refresh 5 menit</span>
                            </div>
                        </div>
                        {/* Loading State */}
                        {loading && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="bg-neutral-800 rounded-xl aspect-3/4 mb-3"></div>
                                        <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && sortedManhwas.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/50 rounded-2xl border border-neutral-800">
                                <div className="w-20 h-20 mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-400 text-lg mb-2">Tidak ada hasil untuk "{searchTerm}"</p>
                                <p className="text-gray-500 text-sm">Coba kata kunci lain atau hapus filter</p>
                            </div>
                        )}

                        {/* Manhwa Grid */}
                        {!loading && sortedManhwas.length > 0 && (
                            <>
                                <ManhwaGrid manhwas={currentManhwas} startIndex={startIndex} />

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center w-full">
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

                    {/* Right Column - Reading History Sidebar */}
                    <aside className="w-full lg:w-80 shrink-0 self-start">
                        <ReadingHistory />
                    </aside>
                </div>
            </div>

            {/* Banner Ad - Before Footer */}
            <div className="max-w-7xl mx-auto px-4 mb-8">
                <ResponsiveAd />
            </div>

            {/* Footer */}
            <footer className="bg-neutral-900 border-t border-neutral-800 py-8 text-center text-gray-400 text-sm mt-auto">
                <p>© {new Date().getFullYear()} ManhwaKu. Data obtained from various sources.</p>
            </footer>
        </div>
    );
}
