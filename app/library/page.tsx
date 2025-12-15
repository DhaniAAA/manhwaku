"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";

interface ReadingHistoryItem {
    slug: string;
    title: string;
    cover: string;
    lastChapter: string;
    lastRead: number;
    expiresAt: number;
}

export default function LibraryPage() {
    const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<"recent" | "title" | "expiring">("recent");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = () => {
        try {
            const stored = localStorage.getItem('manhwa_reading_history');
            if (stored) {
                const parsed = JSON.parse(stored);
                setHistory(parsed);
            }
        } catch (error) {
            console.error('Error loading reading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = () => {
        if (confirm('Hapus semua riwayat baca?')) {
            localStorage.removeItem('manhwa_reading_history');
            setHistory([]);
        }
    };

    const removeItem = (slug: string) => {
        try {
            const filtered = history.filter(item => item.slug !== slug);
            localStorage.setItem('manhwa_reading_history', JSON.stringify(filtered));
            setHistory(filtered);
        } catch (error) {
            console.error('Error removing history item:', error);
        }
    };

    const formatTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Baru saja';
        if (minutes < 60) return `${minutes} menit lalu`;
        if (hours < 24) return `${hours} jam lalu`;
        if (days < 7) return `${days} hari lalu`;
        return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter and sort
    const filteredHistory = history
        .filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            switch (sortBy) {
                case "recent":
                    return b.lastRead - a.lastRead;
                case "title":
                    return a.title.localeCompare(b.title);
                case "expiring":
                    return a.expiresAt - b.expiresAt;
                default:
                    return 0;
            }
        });

    return (
        <div className="min-h-screen bg-neutral-950 text-gray-200 font-sans">
            {/* Navbar */}
            <Navbar showSearch={false} />

            {/* Page Title */}
            <div className="bg-neutral-900 border-b border-neutral-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h1 className="text-xl font-bold text-white">Library Saya</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-neutral-900 rounded-xl p-6 shadow-sm border border-neutral-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Dibaca</p>
                                <p className="text-2xl font-bold text-white">{history.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-neutral-900 rounded-xl p-6 shadow-sm border border-neutral-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Terakhir Dibaca</p>
                                <p className="text-sm font-semibold text-white">
                                    {history.length > 0 ? formatTimeAgo(Math.max(...history.map(h => h.lastRead))) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-neutral-900 rounded-xl p-6 shadow-sm border border-neutral-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Akan Kedaluwarsa</p>
                                <p className="text-2xl font-bold text-white">
                                    {history.filter(h => (h.expiresAt - Date.now()) / (24 * 60 * 60 * 1000) <= 7).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Cari di library..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full py-2 px-4 pr-10 rounded-full text-sm text-white bg-neutral-800 focus:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-blue-400/50 placeholder-gray-400 transition-all"
                            />
                            <span className="absolute right-4 top-2.5 text-gray-400 text-sm">🔍</span>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as "recent" | "title" | "expiring")}
                                className="px-4 py-2 text-sm border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-neutral-800 text-gray-200"
                            >
                                <option value="recent">Terbaru Dibaca</option>
                                <option value="title">Judul (A-Z)</option>
                                <option value="expiring">Akan Kedaluwarsa</option>
                            </select>

                            {/* Clear All */}
                            {history.length > 0 && (
                                <button
                                    onClick={clearHistory}
                                    className="px-4 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors font-medium"
                                >
                                    Hapus Semua
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col justify-center items-center h-64 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-400 animate-pulse">Memuat library...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && history.length === 0 && (
                    <div className="text-center py-20 bg-neutral-900 rounded-xl border border-dashed border-neutral-800">
                        <svg className="w-24 h-24 mx-auto text-neutral-800 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-gray-500 text-lg mb-2">Library Anda masih kosong</p>
                        <p className="text-gray-400 text-sm mb-6">Mulai baca manhwa untuk menambahkan ke library</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Jelajahi Manhwa
                        </Link>
                    </div>
                )}

                {/* No Results */}
                {!loading && history.length > 0 && filteredHistory.length === 0 && (
                    <div className="text-center py-20 bg-neutral-900 rounded-xl border border-dashed border-neutral-800">
                        <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-gray-400 text-lg mb-2">Tidak ditemukan "{searchTerm}"</p>
                        <button
                            onClick={() => setSearchTerm("")}
                            className="mt-2 text-blue-500 hover:text-blue-400 font-medium text-sm"
                        >
                            Hapus pencarian
                        </button>
                    </div>
                )}

                {/* History Grid */}
                {!loading && filteredHistory.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredHistory.map((item) => {
                            const now = Date.now();
                            const daysUntilExpiry = Math.floor((item.expiresAt - now) / (24 * 60 * 60 * 1000));
                            const isExpiringSoon = daysUntilExpiry <= 7;

                            return (
                                <div
                                    key={item.slug}
                                    className="group bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex gap-4 p-4">
                                        <Link href={`/detail/${item.slug}`} className="shrink-0">
                                            <div className="relative w-20 h-28 rounded-lg overflow-hidden shadow-sm bg-neutral-800">
                                                <Image
                                                    src={item.cover}
                                                    alt={item.title}
                                                    fill
                                                    sizes="80px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                {isExpiringSoon && (
                                                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl">
                                                        {daysUntilExpiry}d
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <Link href={`/detail/${item.slug}`}>
                                                <h3 className="font-bold text-sm text-gray-200 line-clamp-2 group-hover:text-blue-500 transition-colors mb-1">
                                                    {item.title}
                                                </h3>
                                            </Link>
                                            <p className="text-xs text-blue-500 font-medium mb-2">
                                                {item.lastChapter}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between">
                                                <span className="text-xs text-gray-400">
                                                    {formatTimeAgo(item.lastRead)}
                                                </span>
                                                <button
                                                    onClick={() => removeItem(item.slug)}
                                                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-neutral-800 rounded-lg transition-all"
                                                    title="Hapus dari library"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expiry Warning */}
                                    {isExpiringSoon && (
                                        <div className="px-4 py-2 bg-orange-900/20 border-t border-orange-900/30">
                                            <p className="text-xs text-orange-600">
                                                ⚠️ Akan kedaluwarsa dalam {daysUntilExpiry} hari
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Info Footer */}
                {!loading && history.length > 0 && (
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-400">
                            📦 Cache riwayat baca disimpan selama 30 hari • Auto-cleanup
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-neutral-900 border-t border-neutral-800 py-8 text-center text-gray-500 text-sm mt-auto">
                <p>© {new Date().getFullYear()} ManhwaKu. Data obtained from various sources.</p>
            </footer>
        </div>
    );
}
