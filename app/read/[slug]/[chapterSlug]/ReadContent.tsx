"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ResponsiveAd } from "@/components/Ads/AdComponents";

// --- Interface Data ---
interface ChapterItem {
    slug: string;
    title: string;
    url: string;
    images: string[];
}

interface ReadContentProps {
    manhwaSlug: string;
    chapterSlug: string;
    manhwaTitle: string;
    chapterData: ChapterItem;
    allChapters: ChapterItem[];
}

export default function ReadContent({
    manhwaSlug,
    chapterSlug,
    manhwaTitle,
    chapterData,
    allChapters,
}: ReadContentProps) {
    // Scroll ke atas saat component mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [chapterSlug]);

    // Helper function to extract chapter number from title
    const extractChapterNumber = (title: string): number => {
        const match = title.match(/(?:chapter|ch\.?)\s*(\d+(?:\.\d+)?)/i);
        return match ? parseFloat(match[1]) : 0;
    };

    // Sort chapters by chapter number (ascending: Ch 1, Ch 2, Ch 3, ...)
    const sortedChapters = useMemo(() => {
        return [...allChapters].sort((a, b) => {
            const numA = extractChapterNumber(a.title);
            const numB = extractChapterNumber(b.title);
            return numA - numB;
        });
    }, [allChapters]);

    const currentIndex = sortedChapters.findIndex((ch) => ch.slug === chapterSlug);

    // Prev Chapter = Chapter dengan nomor lebih kecil
    const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;

    // Next Chapter = Chapter dengan nomor lebih besar
    const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

    return (
        <div className="min-h-screen bg-neutral-900 text-gray-200 font-sans">
            {/* HEADER/NAVBAR Sticky */}
            <div className="sticky top-0 z-50 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 shadow-lg transition-all duration-300">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    {/* Tombol Kembali ke Daftar Chapter */}
                    <Link href={`/detail/${manhwaSlug}`} className="flex items-center text-sm font-medium hover:text-blue-400 transition">
                        <span className="mr-1">←</span> Daftar
                    </Link>

                    {/* Judul Chapter (Tengah) */}
                    <h1 className="text-sm md:text-base font-bold truncate max-w-[200px] md:max-w-md text-center text-white">{chapterData.title}</h1>

                    {/* Navigasi Cepat Header */}
                    <div className="flex gap-2">
                        {/* Tombol Prev */}
                        <Link
                            href={prevChapter ? `/read/${manhwaSlug}/${prevChapter.slug}` : "#"}
                            className={`px-3 py-1 rounded text-xs font-bold border ${prevChapter ? "border-netural-600 hover:bg-neutral-800 text-white" : "border-neutral-800 text-gray-600 cursor-not-allowed"}`}
                            aria-disabled={!prevChapter}
                        >
                            ← Prev
                        </Link>

                        {/* Tombol Next */}
                        <Link
                            href={nextChapter ? `/read/${manhwaSlug}/${nextChapter.slug}` : "#"}
                            className={`px-3 py-1 rounded text-xs font-bold border ${nextChapter ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700" : "border-neutral-800 text-gray-600 cursor-not-allowed"}`}
                            aria-disabled={!nextChapter}
                        >
                            Next →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Ad Iklan Di bawah Prev dan Next */}
            <div className="max-w-3xl mx-auto mt-4 mb-2">
                <ResponsiveAd className="bg-neutral-800 rounded-lg" />
            </div>

            {/* AREA BACA (GAMBAR) */}
            <main className="max-w-3xl mx-auto bg-black min-h-screen shadow-2xl">
                {chapterData.images && chapterData.images.length > 0 ? (
                    chapterData.images.map((imgUrl, idx) => (
                        <img
                            key={idx}
                            src={imgUrl}
                            alt={`${manhwaTitle} ${chapterData.title} - Page ${idx + 1}`}
                            loading="lazy"
                            className="w-full h-auto block"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                            }}
                        />
                    ))
                ) : (
                    <div className="py-20 text-center text-gray-500">Tidak ada gambar untuk ditampilkan.</div>
                )}
            </main>

            {/* FOOTER NAVIGASI */}
            <div className="max-w-3xl mx-auto p-8 bg-neutral-900 text-center space-y-6 border-t border-neutral-800 mt-4">
                <p className="text-gray-400 text-sm">Kamu baru saja selesai membaca:</p>
                <h2 className="text-xl font-bold text-white">{chapterData.title}</h2>

                <div className="flex justify-center gap-4 mt-4">
                    {prevChapter && (
                        <Link href={`/read/${manhwaSlug}/${prevChapter.slug}`} className="px-6 py-3 rounded-full border border-neutral-600 hover:bg-neutral-800 transition font-semibold">
                            ← {prevChapter.title}
                        </Link>
                    )}

                    {nextChapter ? (
                        <Link href={`/read/${manhwaSlug}/${nextChapter.slug}`} className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition font-semibold shadow-lg shadow-blue-900/20">
                            {nextChapter.title} →
                        </Link>
                    ) : (
                        <div className="px-6 py-3 rounded-full bg-neutral-800 text-gray-500 cursor-not-allowed">Sudah Chapter Terakhir</div>
                    )}
                </div>
            </div>
        </div>
    );
}
