"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/ui/Navbar";
import ManhwaGrid from "@/components/home/ManhwaGrid";
import Pagination from "@/components/ui/Pagination";
import { Manhwa } from "@/types/manhwa";
import Link from "next/link";

interface GenreContentProps {
    genreName: string;
    manhwas: Manhwa[];
}

const ITEMS_PER_PAGE = 24;

export default function GenreContent({ genreName, manhwas }: GenreContentProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<string>("title");

    // Sort manhwas (default alphabetically)
    const sortedManhwas = [...manhwas].sort((a, b) => {
        switch (sortBy) {
            case "rating":
                return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
            case "title":
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });

    // Pagination Calculations
    const totalPages = Math.ceil(sortedManhwas.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentManhwas = sortedManhwas.slice(startIndex, endIndex);

    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentPage]);

    return (
        <div className="min-h-screen bg-neutral-950 text-gray-200 font-sans">
            <Navbar showSearch={true} />

            {/* Hero Header untuk Kategori */}
            <div className="bg-neutral-900 border-b border-neutral-800">
                <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center text-center">
                    <div className="mb-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase">
                        Top Genre
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                        Manhwa <span className="text-blue-500">{genreName}</span> Terbaik
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto mb-6">
                        Kumpulan komik manhwa dengan genre {genreName} paling seru. Mulai dari yang populer hingga masterpiece tersembunyi.
                    </p>

                    <div className="flex gap-4">
                        <Link
                            href="/jelajahi"
                            className="px-5 py-2.5 bg-neutral-800 text-gray-300 font-medium rounded-lg hover:bg-neutral-700 transition"
                        >
                            Cari Genre Lain
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-sm text-gray-400">
                        Menampilkan <span className="font-semibold text-white">{sortedManhwas.length}</span> Manhwa
                    </p>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 text-sm border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-neutral-800 text-gray-200"
                    >
                        <option value="title">Judul (A-Z)</option>
                        <option value="rating">Rating Tertinggi</option>
                    </select>
                </div>

                {/* Manhwa Grid */}
                {sortedManhwas.length > 0 && (
                    <>
                        <ManhwaGrid manhwas={currentManhwas} startIndex={startIndex} />

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center w-full mt-10">
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
            </div>

            <footer className="bg-neutral-900 border-t border-neutral-800 py-8 text-center text-gray-500 text-sm mt-auto">
                <p>© {new Date().getFullYear()} ManhwaKu. Data obtained from various sources.</p>
            </footer>
        </div>
    );
}
