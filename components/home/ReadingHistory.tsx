'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ReadingHistoryItem {
    slug: string;
    title: string;
    cover: string;
    lastChapter: string;
    lastRead: number; // timestamp
    expiresAt: number; // timestamp - cache expiry
}

export default function ReadingHistory() {
    const [history, setHistory] = useState<ReadingHistoryItem[]>([]);

    useEffect(() => {
        // Load reading history from localStorage
        const loadHistory = () => {
            try {
                const stored = localStorage.getItem('manhwa_reading_history');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Sort by lastRead (newest first) and take top 10
                    const sorted = parsed
                        .sort((a: ReadingHistoryItem, b: ReadingHistoryItem) => b.lastRead - a.lastRead)
                        .slice(0, 10);
                    setHistory(sorted);
                }
            } catch (error) {
                console.error('Error loading reading history:', error);
            }
        };

        loadHistory();

        // Listen for storage changes (when user reads a manhwa)
        const handleStorageChange = () => {
            loadHistory();
        };

        window.addEventListener('storage', handleStorageChange);
        // Custom event for same-tab updates
        window.addEventListener('reading-history-updated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('reading-history-updated', handleStorageChange);
        };
    }, []);

    const clearHistory = () => {
        if (confirm('Hapus semua riwayat baca?')) {
            localStorage.removeItem('manhwa_reading_history');
            setHistory([]);
        }
    };

    const removeItem = (slug: string) => {
        try {
            const stored = localStorage.getItem('manhwa_reading_history');
            if (stored) {
                const parsed = JSON.parse(stored);
                const filtered = parsed.filter((item: ReadingHistoryItem) => item.slug !== slug);
                localStorage.setItem('manhwa_reading_history', JSON.stringify(filtered));
                setHistory(filtered.slice(0, 10));
            }
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
        return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    if (history.length === 0) {
        return (
            <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Riwayat Baca
                    </h2>
                </div>
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-neutral-800 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-gray-500 text-sm">Belum ada riwayat baca</p>
                    <p className="text-gray-400 text-xs mt-1">Mulai baca manhwa untuk melihat riwayat</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Riwayat Baca
                </h2>
                <button
                    onClick={clearHistory}
                    className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                    title="Hapus semua riwayat"
                >
                    Hapus Semua
                </button>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
                {history.map((item) => {
                    const now = Date.now();
                    const daysUntilExpiry = Math.floor((item.expiresAt - now) / (24 * 60 * 60 * 1000));
                    const isExpiringSoon = daysUntilExpiry <= 7;

                    return (
                        <div
                            key={item.slug}
                            className="group border-b border-neutral-800 last:border-0 hover:bg-neutral-800 transition-colors"
                        >
                            <div className="p-3 flex gap-3">
                                <Link href={`/detail/${item.slug}`} className="shrink-0">
                                    <div className="relative w-12 h-16 rounded overflow-hidden shadow-sm">
                                        <Image
                                            src={item.cover}
                                            alt={item.title}
                                            fill
                                            sizes="48px"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {isExpiringSoon && (
                                            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] px-1 rounded-bl">
                                                {daysUntilExpiry}d
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                <div className="flex-1 min-w-0">
                                    <Link href={`/detail/${item.slug}`}>
                                        <h3 className="font-semibold text-sm text-gray-200 line-clamp-2 group-hover:text-blue-500 transition-colors mb-1">
                                            {item.title}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-gray-500 mb-1">
                                        {item.lastChapter}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400">
                                            {formatTimeAgo(item.lastRead)}
                                        </span>
                                        <button
                                            onClick={() => removeItem(item.slug)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                                            title="Hapus dari riwayat"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-3 bg-neutral-900 border-t border-neutral-800">
                <p className="text-xs text-gray-500 text-center mb-1">
                    Menampilkan {history.length} riwayat terakhir
                </p>
                <p className="text-xs text-gray-400 text-center">
                    📦 Cache: 30 hari • Auto-cleanup
                </p>
            </div>
        </div>
    );
}
