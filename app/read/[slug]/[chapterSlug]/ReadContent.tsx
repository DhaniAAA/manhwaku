"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ResponsiveAd } from "@/components/Ads/AdComponents";
import { ChapterDetail } from "@/types/manhwa";

// --- Props Interface ---
interface ReadContentProps {
    manhwaSlug: string;
    chapterSlug: string;
    manhwaTitle: string;
    manhwaCover: string;
    chapterData: ChapterDetail;
    allChapters: ChapterDetail[];
}

export default function ReadContent({
    manhwaSlug,
    chapterSlug,
    manhwaTitle,
    manhwaCover,
    chapterData,
    allChapters,
}: ReadContentProps) {
    const [displayedChapters, setDisplayedChapters] = useState<ChapterDetail[]>([chapterData]);
    const [activeChapterSlug, setActiveChapterSlug] = useState<string>(chapterSlug);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Sort chapters by chapter number (ascending: Ch 1, Ch 2, Ch 3, ...)
    const sortedChapters = useMemo(() => {
        const extractChapterNumber = (title: string): number => {
            const match = title.match(/(?:chapter|ch\.?)\s*(\d+(?:\.\d+)?)/i);
            return match ? parseFloat(match[1]) : 0;
        };
        return [...allChapters].sort((a, b) => {
            const numA = extractChapterNumber(a.title);
            const numB = extractChapterNumber(b.title);
            return numA - numB;
        });
    }, [allChapters]);

    // Active chapter info
    const activeIndex = sortedChapters.findIndex((ch) => ch.slug === activeChapterSlug);
    const activeChapterData = displayedChapters.find((ch) => ch.slug === activeChapterSlug) || chapterData;
    const prevChapter = activeIndex > 0 ? sortedChapters[activeIndex - 1] : null;
    const nextNavChapter = activeIndex < sortedChapters.length - 1 ? sortedChapters[activeIndex + 1] : null;

    // Last loaded chapter for infinite scroll check
    const lastLoadedChapter = displayedChapters[displayedChapters.length - 1];
    const lastLoadedIndex = sortedChapters.findIndex(ch => ch.slug === lastLoadedChapter.slug);
    const hasNextToLoad = lastLoadedIndex >= 0 && lastLoadedIndex < sortedChapters.length - 1;

    // Track Reading History based on Active Chapter
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('manhwa_reading_history');
            let history: any[] = storedHistory ? JSON.parse(storedHistory) : [];

            history = history.filter((item) => item.slug !== manhwaSlug);
            history.unshift({
                slug: manhwaSlug,
                title: manhwaTitle,
                cover: manhwaCover,
                lastChapter: activeChapterData.title,
                lastChapterSlug: activeChapterSlug,
                lastRead: Date.now(),
                expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
            });

            if (history.length > 30) {
                history = history.slice(0, 30);
            }

            localStorage.setItem('manhwa_reading_history', JSON.stringify(history));
            window.dispatchEvent(new Event('reading-history-updated'));
        } catch (error) {
            console.error('Error saving reading history:', error);
        }

        // Silent URL Update for active chapter
        if (activeChapterSlug !== chapterSlug) {
            window.history.replaceState(null, '', `/read/${manhwaSlug}/${activeChapterSlug}`);
        }
    }, [activeChapterSlug, manhwaSlug, manhwaTitle, manhwaCover, activeChapterData.title, chapterSlug]);

    // Infinite Scroll Loader
    useEffect(() => {
        if (!bottomRef.current || !hasNextToLoad) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                // Load next chapter if user hits the bottom
                setDisplayedChapters(prev => {
                    const lastIdx = sortedChapters.findIndex(ch => ch.slug === prev[prev.length - 1].slug);
                    if (lastIdx >= 0 && lastIdx < sortedChapters.length - 1) {
                        return [...prev, sortedChapters[lastIdx + 1]];
                    }
                    return prev;
                });
            }
        }, { rootMargin: '800px' }); // Muat chapter selanjutnya ketika scroll <800px dari bawah

        observer.observe(bottomRef.current);
        return () => observer.disconnect();
    }, [hasNextToLoad, sortedChapters]);

    // Preload Next Chapter Images
    useEffect(() => {
        if (hasNextToLoad) {
            const nextChapterToLoad = sortedChapters[lastLoadedIndex + 1];
            if (nextChapterToLoad && nextChapterToLoad.images) {
                // Preload seluruh gambar chapter selanjutnya di background agar transisinya instant
                nextChapterToLoad.images.forEach(imgUrl => {
                    const img = new Image();
                    img.src = imgUrl;
                });
            }
        }
    }, [lastLoadedIndex, hasNextToLoad, sortedChapters]);

    // Active Chapter Spy (Detects which chapter is currently being read)
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const slug = entry.target.getAttribute('data-chapter-slug');
                    if (slug) {
                        setActiveChapterSlug(slug);
                    }
                }
            });
        }, { rootMargin: '-10% 0px -80% 0px' });

        document.querySelectorAll('.chapter-spy-marker').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [displayedChapters]);

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
                    <h1 className="text-sm md:text-base font-bold truncate max-w-[200px] md:max-w-md text-center text-white">{activeChapterData.title}</h1>

                    {/* Navigasi Cepat Header */}
                    <div className="flex gap-2">
                        {/* Tombol Prev */}
                        <Link
                            href={prevChapter ? `/read/${manhwaSlug}/${prevChapter.slug}` : "#"}
                            className={`px-3 py-1 rounded text-xs font-bold border ${prevChapter ? "border-netural-600 hover:bg-neutral-800 text-white" : "border-neutral-800 text-gray-600 cursor-not-allowed pointer-events-none"}`}
                            aria-disabled={!prevChapter}
                        >
                            ← Prev
                        </Link>

                        {/* Tombol Next */}
                        <Link
                            href={nextNavChapter ? `/read/${manhwaSlug}/${nextNavChapter.slug}` : "#"}
                            className={`px-3 py-1 rounded text-xs font-bold border ${nextNavChapter ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700" : "border-neutral-800 text-gray-600 cursor-not-allowed pointer-events-none"}`}
                            aria-disabled={!nextNavChapter}
                        >
                            Next →
                        </Link>
                    </div>
                </div>
            </div>

            {/* AREA BACA (GAMBAR) */}
            <div className="pb-8">
                {displayedChapters.map((chapterInfo, index) => (
                    <div key={chapterInfo.slug} className="relative">
                        {/* Chapter Spy Marker (invisible border for IntersectionObserver) */}
                        <div className="chapter-spy-marker absolute top-0 left-0 w-full h-1" data-chapter-slug={chapterInfo.slug}></div>

                        {/* Chapter Separator Title for Infinite Load */}
                        {index > 0 && (
                            <div className="max-w-3xl mx-auto py-10 mt-6 md:mt-12 text-center bg-neutral-900 border-y border-neutral-800 shadow-md">
                                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{chapterInfo.title}</h2>
                                <p className="text-sm text-gray-400">Scroll ke bawah untuk lanjut membaca</p>
                            </div>
                        )}

                        {/* Ad Iklan Di antara chapters */}
                        {index === 0 && (
                            <div className="max-w-3xl mx-auto mt-4 mb-2">
                                <ResponsiveAd className="bg-neutral-800 rounded-lg" />
                            </div>
                        )}

                        <main className="max-w-3xl mx-auto bg-black min-h-screen shadow-2xl">
                            {chapterInfo.images && chapterInfo.images.length > 0 ? (
                                chapterInfo.images.map((imgUrl, idx) => (
                                    <img
                                        key={idx}
                                        src={imgUrl}
                                        alt={`${manhwaTitle} ${chapterInfo.title} - Page ${idx + 1}`}
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
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
                    </div>
                ))}
            </div>

            {/* Infinite Scroll Loader */}
            {hasNextToLoad && (
                <div ref={bottomRef} className="max-w-3xl mx-auto py-12 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 font-medium">Memuat chapter selanjutnya...</p>
                </div>
            )}

            {/* FOOTER NAVIGASI (Hanya jika benar-benar habis di seluruh komik) */}
            {!hasNextToLoad && (
                <div className="max-w-3xl mx-auto p-8 bg-neutral-900 text-center space-y-6 border-t border-neutral-800 mt-4 rounded-b-xl shadow-lg mb-12">
                    <p className="text-gray-400 text-sm">Kamu baru saja selesai membaca:</p>
                    <h2 className="text-2xl font-bold text-white">{activeChapterData.title}</h2>

                    <div className="flex justify-center gap-4 mt-8">
                        {prevChapter && (
                            <Link href={`/read/${manhwaSlug}/${prevChapter.slug}`} className="px-6 py-3 rounded-full border border-neutral-600 hover:bg-neutral-800 transition font-semibold">
                                ← Kembali
                            </Link>
                        )}
                        <div className="px-8 py-3 rounded-full bg-neutral-800 text-gray-400 font-semibold cursor-not-allowed">
                            Sudah Mentok! 🎉
                        </div>
                    </div>
                    <Link href={`/detail/${manhwaSlug}`} className="inline-block mt-4 text-sm font-medium text-blue-500 hover:text-blue-400 underline underline-offset-4">
                        Kembali ke Halaman Detail Manhwa
                    </Link>
                </div>
            )}
        </div>
    );
}
