"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useManhwaData } from "@/hooks/useManhwaData";
import Navbar from "@/components/ui/Navbar";
import ManhwaGrid from "@/components/home/ManhwaGrid";
import Pagination from "@/components/ui/Pagination";

const ALPHABET = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ITEMS_PER_PAGE = 25;

export default function DaftarManhwaPage() {
    const { manhwas, loading } = useManhwaData();
    const [selectedLetter, setSelectedLetter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Filter by letter or search
    const filteredManhwas = manhwas.filter(manhwa => {
        // Search filter
        if (searchTerm) {
            return manhwa.title.toLowerCase().includes(searchTerm.toLowerCase());
        }

        // Letter filter
        if (selectedLetter === "all") return true;
        if (selectedLetter === "#") {
            const firstChar = manhwa.title.charAt(0).toUpperCase();
            return !ALPHABET.includes(firstChar) || /[0-9]/.test(firstChar);
        }
        return manhwa.title.charAt(0).toUpperCase() === selectedLetter;
    });

    // Sort alphabetically
    const sortedManhwas = [...filteredManhwas].sort((a, b) =>
        a.title.localeCompare(b.title)
    );

    // Pagination
    const totalPages = Math.ceil(sortedManhwas.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentManhwas = sortedManhwas.slice(startIndex, endIndex);

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedLetter, searchTerm]);

    // Get count per letter for stats
    const getCountForLetter = (letter: string) => {
        if (letter === "#") {
            return manhwas.filter(m => {
                const firstChar = m.title.charAt(0).toUpperCase();
                return !ALPHABET.includes(firstChar) || /[0-9]/.test(firstChar);
            }).length;
        }
        return manhwas.filter(m => m.title.charAt(0).toUpperCase() === letter).length;
    };

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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <h1 className="text-xl font-bold text-white">Daftar Manhwa</h1>
                        </div>

                        {/* View Toggle */}
                        <div className="hidden sm:flex items-center gap-2 bg-neutral-800 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-neutral-700 shadow-sm text-blue-400" : "text-gray-500 hover:text-white"}`}
                                title="Grid View"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-neutral-700 shadow-sm text-blue-400" : "text-gray-500 hover:text-white"}`}
                                title="List View"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Search Bar */}
                <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 mb-6">
                    <div className="relative max-w-2xl mx-auto">
                        <input
                            type="text"
                            placeholder="Cari manhwa berdasarkan judul..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-3 px-5 pr-12 rounded-full text-sm text-gray-200 bg-neutral-800 focus:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500 transition-all"
                        />
                        <span className="absolute right-5 top-3.5 text-gray-500 text-lg">🔍</span>
                    </div>
                </div>

                {/* Alphabet Navigation */}
                <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        <h2 className="text-sm font-semibold text-gray-300">Filter berdasarkan huruf</h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => {
                                setSelectedLetter("all");
                                setSearchTerm("");
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedLetter === "all" && !searchTerm
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                                }`}
                        >
                            SEMUA
                        </button>
                        {ALPHABET.map(letter => {
                            const count = getCountForLetter(letter);
                            return (
                                <button
                                    key={letter}
                                    onClick={() => {
                                        setSelectedLetter(letter);
                                        setSearchTerm("");
                                    }}
                                    disabled={count === 0}
                                    className={`w-9 h-9 text-xs font-bold rounded-lg transition-all ${selectedLetter === letter && !searchTerm
                                        ? "bg-blue-600 text-white shadow-md"
                                        : count === 0
                                            ? "bg-neutral-900 text-neutral-700 cursor-not-allowed"
                                            : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                                        }`}
                                    title={count > 0 ? `${count} manhwa` : "Tidak ada"}
                                >
                                    {letter}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Results Info */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-400">
                            {searchTerm ? (
                                <>Hasil pencarian: <span className="font-semibold text-white">"{searchTerm}"</span></>
                            ) : selectedLetter === "all" ? (
                                <>Semua manhwa</>
                            ) : (
                                <>Huruf: <span className="font-semibold text-blue-400">{selectedLetter}</span></>
                            )}
                        </p>
                        <span className="text-neutral-700">|</span>
                        <p className="text-sm text-gray-400">
                            <span className="font-semibold text-white">{sortedManhwas.length}</span> judul
                        </p>
                    </div>
                    {(searchTerm || selectedLetter !== "all") && (
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedLetter("all");
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col justify-center items-center h-64 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 animate-pulse">Memuat daftar manhwa...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && sortedManhwas.length === 0 && (
                    <div className="text-center py-20 bg-neutral-900 rounded-xl border border-dashed border-neutral-800">
                        <svg className="w-16 h-16 mx-auto text-neutral-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-400 text-lg mb-2">
                            {searchTerm ? `Tidak ada manhwa dengan judul "${searchTerm}"` : `Tidak ada manhwa dengan huruf "${selectedLetter}"`}
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedLetter("all");
                            }}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            Lihat Semua
                        </button>
                    </div>
                )}

                {/* Manhwa Grid / List */}
                {!loading && sortedManhwas.length > 0 && (
                    <>
                        {viewMode === "grid" ? (
                            <ManhwaGrid manhwas={currentManhwas} startIndex={startIndex} />
                        ) : (
                            <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-neutral-800 border-b border-neutral-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">No</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Judul</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Tipe</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800">
                                        {currentManhwas.map((manhwa, index) => (
                                            <tr key={manhwa.slug} className="hover:bg-neutral-800 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-500">{startIndex + index + 1}</td>
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/detail/${manhwa.slug}`}
                                                        className="flex items-center gap-3 group"
                                                    >
                                                        <img
                                                            src={manhwa.cover_url}
                                                            alt={manhwa.title}
                                                            className="w-10 h-14 object-cover rounded shadow-sm"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                                                                {manhwa.title.replace(" Bahasa Indonesia", "")}
                                                            </p>
                                                            {manhwa.genres && manhwa.genres.length > 0 && (
                                                                <p className="text-xs text-gray-400 mt-0.5">
                                                                    {manhwa.genres.slice(0, 2).join(", ")}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    <span className="text-xs font-medium text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                                                        {manhwa.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    <span className={`text-xs font-medium px-2 py-1 rounded ${manhwa.status === "Ongoing"
                                                        ? "bg-green-900/30 text-green-400"
                                                        : "bg-red-900/30 text-red-400"
                                                        }`}>
                                                        {manhwa.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <span className="text-yellow-400">★</span>
                                                        <span className="font-medium text-gray-300">{manhwa.rating}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

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

                {/* Stats Section */}
                {!loading && manhwas.length > 0 && (
                    <div className="mt-12 bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Statistik Koleksi
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-blue-400">{manhwas.length}</p>
                                <p className="text-xs text-gray-400 mt-1">Total Manhwa</p>
                            </div>
                            <div className="text-center p-4 bg-green-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-green-400">
                                    {manhwas.filter(m => m.status === "Ongoing").length}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Ongoing</p>
                            </div>
                            <div className="text-center p-4 bg-red-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-red-400">
                                    {manhwas.filter(m => m.status === "Completed").length}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Completed</p>
                            </div>
                            <div className="text-center p-4 bg-yellow-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-yellow-400">
                                    {(manhwas.reduce((acc, m) => acc + parseFloat(m.rating || "0"), 0) / manhwas.length).toFixed(1)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Rata-rata Rating</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-neutral-900 border-t border-neutral-800 py-8 text-center text-gray-400 text-sm mt-auto">
                <p>© {new Date().getFullYear()} ManhwaKu. Data obtained from various sources.</p>
            </footer>
        </div>
    );
}
