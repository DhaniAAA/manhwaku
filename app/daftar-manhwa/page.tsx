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
            <div className="bg-neutral-900/50 border-b border-neutral-800 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Daftar Manhwa</h1>
                                <p className="text-sm text-gray-400">Jelajahi koleksi manhwa lengkap kami</p>
                            </div>
                        </div>

                        {/* View Toggle */}
                        <div className="hidden sm:flex items-center gap-1 bg-neutral-800/80 p-1.5 rounded-xl border border-neutral-700/50">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-neutral-700 shadow-sm text-blue-400" : "text-gray-500 hover:text-white hover:bg-neutral-700/50"}`}
                                title="Grid View"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-neutral-700 shadow-sm text-blue-400" : "text-gray-500 hover:text-white hover:bg-neutral-700/50"}`}
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
                <div className="bg-neutral-900/60 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-800/50 p-4 mb-6">
                    <div className="relative max-w-2xl mx-auto">
                        <input
                            type="text"
                            placeholder="Cari manhwa berdasarkan judul..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-3 px-5 pr-14 rounded-xl text-sm text-gray-200 bg-neutral-800/80 focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 border border-neutral-700/50 placeholder-gray-500 transition-all"
                        />
                        <svg className="absolute right-5 top-3 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Alphabet Navigation */}
                <div className="bg-neutral-900/60 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-800/50 p-5 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        <h2 className="text-sm font-semibold text-gray-300">Filter berdasarkan huruf</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => {
                                setSelectedLetter("all");
                                setSearchTerm("");
                            }}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${selectedLetter === "all" && !searchTerm
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                                : "bg-neutral-800 text-gray-400 hover:bg-neutral-700 hover:text-white"
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
                                    className={`w-10 h-10 text-xs font-bold rounded-xl transition-all ${selectedLetter === letter && !searchTerm
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                                        : count === 0
                                            ? "bg-neutral-900 text-neutral-700 cursor-not-allowed"
                                            : "bg-neutral-800 text-gray-400 hover:bg-neutral-700 hover:text-white"
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
                                <span>Hasil pencarian: <span className="font-semibold text-white">"{searchTerm}"</span></span>
                            ) : selectedLetter === "all" ? (
                                <span>Semua manhwa</span>
                            ) : (
                                <span>Huruf: <span className="font-semibold text-blue-400">{selectedLetter}</span></span>
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
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reset Filter
                        </button>
                    )}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-neutral-900/50 rounded-2xl p-4">
                                <div className="bg-neutral-800 rounded-xl aspect-3/4 mb-3"></div>
                                <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && sortedManhwas.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 bg-neutral-900/30 rounded-3xl border border-neutral-800/50">
                        <div className="w-24 h-24 mb-6 rounded-3xl bg-neutral-800/50 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-lg mb-2">
                            {searchTerm ? `Tidak ada manhwa dengan judul "${searchTerm}"` : `Tidak ada manhwa dengan huruf "${selectedLetter}"`}
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedLetter("all");
                            }}
                            className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-medium"
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
                            <div className="bg-neutral-900/60 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-800/50 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-neutral-800/50 border-b border-neutral-700/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">No</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Judul</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Tipe</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800/50">
                                        {currentManhwas.map((manhwa, index) => (
                                            <tr key={manhwa.slug} className="hover:bg-neutral-800/50 transition-colors group">
                                                <td className="px-4 py-3 text-sm text-gray-500">{startIndex + index + 1}</td>
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/detail/${manhwa.slug}`}
                                                        className="flex items-center gap-3 group"
                                                    >
                                                        <img
                                                            src={manhwa.cover_url}
                                                            alt={manhwa.title}
                                                            className="w-10 h-14 object-cover rounded-lg shadow-md group-hover:ring-2 ring-blue-500/50 transition-all"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                                                                {manhwa.title.replace(" Bahasa Indonesia", "")}
                                                            </p>
                                                            {manhwa.genres && manhwa.genres.length > 0 && (
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    {manhwa.genres.slice(0, 2).join(", ")}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    <span className="text-xs font-medium text-blue-400 bg-blue-900/20 px-2.5 py-1 rounded-lg">
                                                        {manhwa.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${manhwa.status === "Berjalan"
                                                        ? "bg-green-900/20 text-green-400"
                                                        : "bg-red-900/20 text-red-400"
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
                    <div className="mt-12 bg-neutral-900/60 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-800/50 p-6">
                        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Statistik Koleksi
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="text-center p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                                <p className="text-3xl font-bold text-blue-400">{manhwas.length}</p>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Total Manhwa</p>
                            </div>
                            <div className="text-center p-5 bg-green-500/10 rounded-2xl border border-green-500/20 hover:border-green-500/40 transition-colors">
                                <p className="text-3xl font-bold text-green-400">
                                    {manhwas.filter(m => m.status === "Berjalan").length}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Ongoing</p>
                            </div>
                            <div className="text-center p-5 bg-red-500/10 rounded-2xl border border-red-500/20 hover:border-red-500/40 transition-colors">
                                <p className="text-3xl font-bold text-red-400">
                                    {manhwas.filter(m => m.status === "Tamat").length}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Completed</p>
                            </div>
                            <div className="text-center p-5 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
                                <p className="text-3xl font-bold text-yellow-400">
                                    {(manhwas.reduce((acc, m) => acc + parseFloat(m.rating || "0"), 0) / manhwas.length).toFixed(1)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Rata-rata Rating</p>
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
