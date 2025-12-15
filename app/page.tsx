"use client";

import { useEffect, useState } from "react";
import { trackSearch } from "@/lib/gtm";
import { useManhwaData } from "@/hooks/useManhwaData";
import { ITEMS_PER_PAGE, SEARCH_DEBOUNCE_DELAY } from "@/constants/app";
import Navbar from "@/components/ui/Navbar";
import HeroSlider from "@/components/home/HeroSlider";
import ManhwaGrid from "@/components/home/ManhwaGrid";
import Pagination from "@/components/ui/Pagination";
import { FloatingAd, ResponsiveAd } from "@/components/AdComponents";
import ReadingHistory from "@/components/home/ReadingHistory";

export default function Home() {
    const { manhwas, loading } = useManhwaData();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

    // Filter Pencarian
    const filteredManhwas = manhwas.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort berdasarkan waktu rilis chapter terbaru
    const sortedManhwas = [...filteredManhwas].sort((a, b) => {
        const aLatestTime = a.latestChapters && a.latestChapters.length > 0 ? a.latestChapters[0].waktu_rilis : "";
        const bLatestTime = b.latestChapters && b.latestChapters.length > 0 ? b.latestChapters[0].waktu_rilis : "";

        if (!aLatestTime) return 1;
        if (!bLatestTime) return -1;

        const aTimestamp = new Date(aLatestTime).getTime();
        const bTimestamp = new Date(bLatestTime).getTime();

        if (isNaN(aTimestamp)) return 1;
        if (isNaN(bTimestamp)) return -1;

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
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            {/* Navbar */}
            <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

            {/* Floating Ad */}
            {/* <FloatingAd /> */}

            {/* Hero Slider */}
            <HeroSlider manhwas={manhwas} />

            {/* Banner Ad - After Hero */}
            <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResponsiveAd />
                <ResponsiveAd />
            </div>

            {/* Banner Ad - Iklan Sponsor */}
            <div className="max-w-7xl mx-auto px-4 mt-6">
                <div className="w-full h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                    <span className="font-semibold text-lg">Space Iklan Tersedia</span>
                    <span className="text-sm mt-1 text-center text-gray-600 ">Hubungi admin untuk pasang iklan di sini Email: 01windsurf@gmail.com</span>
                </div>
            </div>
            {/* Main Content with Sidebar */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column - Main Content */}
                    <main className="flex-1 min-w-0">
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
            {/* <div className="max-w-7xl mx-auto px-4 mb-8">
                <ResponsiveAd />
            </div> */}

            {/* Footer */}
            <footer className="bg-white border-t py-8 text-center text-gray-500 text-sm mt-auto">
                <p>© {new Date().getFullYear()} ManhwaKu. Data obtained from various sources.</p>
            </footer>
        </div>
    );
}
