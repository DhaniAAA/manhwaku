"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Manhwa } from "@/types/manhwa";
import { SLIDER_AUTOPLAY_INTERVAL, RECOMMENDED_MANHWA_COUNT } from "@/constants/app";

interface HeroSliderProps {
    manhwas: Manhwa[];
}

export default function HeroSlider({ manhwas }: HeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [sliderManhwas, setSliderManhwas] = useState<Manhwa[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    // Pick top-rated manhwas for display
    useEffect(() => {
        if (manhwas.length > 0) {
            const sorted = [...manhwas]
                .filter(m => m.cover_url && m.rating)
                .sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));
            const topRated = sorted.slice(0, 30);
            const shuffled = [...topRated].sort(() => 0.5 - Math.random());
            setSliderManhwas(shuffled.slice(0, RECOMMENDED_MANHWA_COUNT));
        }
    }, [manhwas]);

    const goToSlide = useCallback((index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentSlide(index);
        setTimeout(() => setIsTransitioning(false), 700);
    }, [isTransitioning]);

    const nextSlide = useCallback(() => {
        if (sliderManhwas.length === 0) return;
        goToSlide((currentSlide + 1) % sliderManhwas.length);
    }, [currentSlide, sliderManhwas.length, goToSlide]);

    const prevSlide = useCallback(() => {
        if (sliderManhwas.length === 0) return;
        goToSlide((currentSlide - 1 + sliderManhwas.length) % sliderManhwas.length);
    }, [currentSlide, sliderManhwas.length, goToSlide]);

    // Auto-slide
    useEffect(() => {
        if (sliderManhwas.length === 0 || isPaused) return;
        const interval = setInterval(nextSlide, SLIDER_AUTOPLAY_INTERVAL);
        return () => clearInterval(interval);
    }, [sliderManhwas.length, isPaused, nextSlide]);

    // Touch swipe
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };
    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (Math.abs(distance) >= 50) {
            distance > 0 ? nextSlide() : prevSlide();
        }
    };

    const formatTimeAgo = (dateStr: string): string => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffHours < 1) return "Baru saja";
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    };

    if (sliderManhwas.length === 0) {
        return (
            <div className="relative overflow-hidden bg-neutral-950 h-[280px] md:h-[480px] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-12 h-12 mx-auto mb-3">
                        <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping"></div>
                        <div className="absolute inset-2 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-500 text-xs font-medium tracking-wider uppercase">Memuat...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative overflow-hidden bg-neutral-950"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* ============ SLIDER ============ */}
            <div className="relative h-[520px] sm:h-[560px] md:h-[480px]">
                {sliderManhwas.map((manhwa, index) => (
                    <div
                        key={manhwa.slug}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentSlide
                            ? "opacity-100 z-10"
                            : "opacity-0 z-0"
                            }`}
                    >
                        {/* ---- BG: Blurred cover ---- */}
                        <div className="absolute inset-0">
                            <img
                                src={manhwa.cover_url}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover blur-2xl scale-110 opacity-25 md:opacity-25"
                            />
                            {/* Mobile: gradient from bottom for text readability */}
                            <div className="absolute inset-0 md:hidden bg-linear-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/30"></div>
                            {/* Desktop gradients */}
                            <div className="absolute inset-0 hidden md:block bg-linear-to-t from-neutral-950 via-neutral-950/90 to-neutral-950/70"></div>
                            <div className="absolute inset-0 hidden md:block bg-linear-to-t from-neutral-950 via-neutral-950/40 to-neutral-950/70"></div>
                        </div>

                        {/* ---- CONTENT ---- */}
                        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                            {/* === MOBILE LAYOUT: Full-bleed cover + overlay text === */}
                            <div className="flex md:hidden flex-col h-full relative">
                                {/* Cover Image - Big & Centered */}
                                <div className="flex-1 flex items-center justify-center pt-4 pb-2">
                                    <Link href={`/detail/${manhwa.slug}`} className="relative">
                                        <div className="relative w-40 sm:w-[180px] rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/30 ring-1 ring-white/15">
                                            <img
                                                src={manhwa.cover_url}
                                                alt={manhwa.title}
                                                referrerPolicy="no-referrer"
                                                className="w-full aspect-3/4 object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "https://placehold.co/300x400?text=No+Image";
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent"></div>
                                            {/* Chapter badge on cover */}
                                            {manhwa.latestChapters?.[0] && (
                                                <div className="absolute top-2 left-2 bg-blue-600/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-md">
                                                    {manhwa.latestChapters[0].title}
                                                </div>
                                            )}
                                        </div>
                                        {/* Decorative cards behind */}
                                        <div className="absolute -z-10 top-2 -right-2 w-full h-full rounded-2xl bg-blue-600/10 ring-1 ring-white/5"></div>
                                        <div className="absolute -z-20 top-4 -right-4 w-full h-full rounded-2xl bg-blue-600/5 ring-1 ring-white/3"></div>
                                    </Link>
                                </div>

                                {/* Text Content - Bottom overlay */}
                                <div className="pb-12 px-1">
                                    {/* Badges */}
                                    <div className="flex items-center justify-center gap-1.5 mb-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1 bg-linear-to-r from-red-600 to-rose-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-red-900/20">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                            Hot
                                        </span>
                                        {manhwa.rating && parseFloat(manhwa.rating) > 0 && (
                                            <span className="inline-flex items-center gap-0.5 bg-amber-500/15 text-amber-400 text-[9px] font-bold px-2.5 py-1 rounded-full border border-amber-500/20">
                                                ★ {manhwa.rating}
                                            </span>
                                        )}
                                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${manhwa.status === "Berjalan"
                                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                            : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                                            }`}>
                                            {manhwa.status}
                                        </span>
                                    </div>

                                    {/* Title - centered */}
                                    <h2 className="text-lg sm:text-xl font-black text-white leading-tight mb-2 text-center line-clamp-2">
                                        {manhwa.title.replace(" Bahasa Indonesia", "")}
                                    </h2>

                                    {/* Genres - centered */}
                                    <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                                        {manhwa.genres.slice(0, 3).map((genre, i) => (
                                            <span key={i} className="text-gray-400 text-[10px] bg-white/5 px-2.5 py-0.5 rounded-full border border-white/8">
                                                {genre}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Latest Chapter + Time */}
                                    {manhwa.latestChapters?.[0] && (
                                        <p className="text-[11px] text-gray-400 mb-3 text-center">
                                            <span className="text-blue-400 font-semibold">{manhwa.latestChapters[0].title}</span>
                                            <span className="text-gray-600 ml-1">• {formatTimeAgo(manhwa.latestChapters[0].waktu_rilis)}</span>
                                        </p>
                                    )}

                                    {/* CTA Buttons - centered */}
                                    <div className="flex justify-center gap-2.5">
                                        <Link
                                            href={`/detail/${manhwa.slug}`}
                                            className="inline-flex items-center gap-1.5 bg-linear-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/25"
                                        >
                                            Baca →
                                        </Link>
                                        {manhwa.latestChapters?.[0] && (
                                            <Link
                                                href={`/read/${manhwa.slug}/${manhwa.latestChapters[0].slug}`}
                                                className="inline-flex items-center gap-1.5 bg-white/8 text-gray-300 text-xs font-medium px-4 py-2.5 rounded-xl transition-all active:scale-95 border border-white/10 backdrop-blur-sm"
                                            >
                                                ▶ Ch. Terbaru
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Navigation Arrows */}
                            {sliderManhwas.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                                        className="absolute left-1 top-1/2 -translate-y-1/2 z-20 md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 active:scale-90 transition-transform"
                                        aria-label="Slide sebelumnya"
                                    >
                                        <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 z-20 md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 active:scale-90 transition-transform"
                                        aria-label="Slide berikutnya"
                                    >
                                        <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}

                            {/* === DESKTOP LAYOUT: Text kiri + Cover besar kanan === */}
                            <div className="hidden md:grid md:grid-cols-5 gap-8 lg:gap-12 h-full items-center">
                                {/* Left: Text (3 cols) */}
                                <div className="col-span-3 text-white">
                                    {/* Badges */}
                                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 bg-linear-to-r from-red-600 to-rose-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-900/20 uppercase tracking-wider">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                            Rekomendasi
                                        </span>
                                        {manhwa.rating && parseFloat(manhwa.rating) > 0 && (
                                            <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 text-[11px] font-bold px-3 py-1.5 rounded-full border border-amber-500/20">
                                                <svg className="w-3 h-3 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                {manhwa.rating}
                                            </span>
                                        )}
                                        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${manhwa.status === "Berjalan"
                                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                            : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                                            }`}>
                                            {manhwa.status}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-3xl lg:text-5xl font-black mb-3 leading-[1.1] tracking-tight">
                                        <span className="bg-linear-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                                            {manhwa.title.replace(" Bahasa Indonesia", "")}
                                        </span>
                                    </h2>

                                    {/* Meta */}
                                    <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
                                        {manhwa.type && (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2m0 2v2m0-2H5.5A1.5 1.5 0 004 5.5v13A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V5.5A1.5 1.5 0 0018.5 4H17m-5-2v2m-5 4h10" /></svg>
                                                {manhwa.type}
                                            </span>
                                        )}
                                        {manhwa.total_chapters > 0 && (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                {manhwa.total_chapters} Ch
                                            </span>
                                        )}
                                        {manhwa.pengarang && (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                {manhwa.pengarang.length > 30 ? manhwa.pengarang.slice(0, 30) + "…" : manhwa.pengarang}
                                            </span>
                                        )}
                                    </div>

                                    {/* Genres */}
                                    <div className="flex flex-wrap gap-1.5 mb-5">
                                        {manhwa.genres.slice(0, 4).map((genre, i) => (
                                            <span key={i} className="bg-white/5 text-gray-300 text-[11px] px-3 py-1 rounded-full border border-white/8 font-medium backdrop-blur-sm">
                                                {genre}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Latest Chapter Card */}
                                    {manhwa.latestChapters?.[0] && (
                                        <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 mb-5 border border-white/8 max-w-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-semibold text-sm">{manhwa.latestChapters[0].title}</p>
                                                        <p className="text-gray-500 text-[10px]">{formatTimeAgo(manhwa.latestChapters[0].waktu_rilis)}</p>
                                                    </div>
                                                </div>
                                                <span className="text-blue-400 text-[10px] font-medium bg-blue-500/10 px-2 py-0.5 rounded-full">Terbaru</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* CTA Buttons */}
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/detail/${manhwa.slug}`}
                                            className="group inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/25 active:scale-95"
                                        >
                                            Baca Sekarang
                                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </Link>
                                        {manhwa.latestChapters?.[0] && (
                                            <Link
                                                href={`/read/${manhwa.slug}/${manhwa.latestChapters[0].slug}`}
                                                className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 text-gray-300 hover:text-white font-medium px-5 py-3.5 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 backdrop-blur-sm"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                                Ch. Terbaru
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Cover (2 cols) */}
                                <div className="col-span-2 flex items-center justify-center">
                                    <div className="relative w-52 lg:w-64">
                                        <div className="absolute -inset-4 bg-blue-600/8 rounded-3xl blur-2xl"></div>
                                        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
                                            <img
                                                src={manhwa.cover_url}
                                                alt={manhwa.title}
                                                referrerPolicy="no-referrer"
                                                className="w-full aspect-3/4 object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "https://placehold.co/300x400?text=No+Image";
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent"></div>
                                            <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent"></div>
                                        </div>
                                        <div className="absolute -z-10 top-3 -right-3 w-full h-full rounded-2xl bg-blue-600/15 ring-1 ring-white/5"></div>
                                        <div className="absolute -z-20 top-6 -right-6 w-full h-full rounded-2xl bg-blue-600/8 ring-1 ring-white/3"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Navigation Arrows */}
            {sliderManhwas.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all backdrop-blur-md"
                        aria-label="Slide sebelumnya"
                    >
                        <svg className="w-5 h-5 text-white/70 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all backdrop-blur-md"
                        aria-label="Slide berikutnya"
                    >
                        <svg className="w-5 h-5 text-white/70 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}

            {/* Bottom Indicators */}
            {sliderManhwas.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 z-20">
                    <div className="flex items-center justify-center gap-1.5 py-3 md:py-4 bg-linear-to-t from-neutral-950/90 to-transparent">
                        {sliderManhwas.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className="p-1"
                                aria-label={`Slide ${index + 1}`}
                            >
                                <div className={`transition-all duration-500 rounded-full ${index === currentSlide
                                    ? "w-6 h-1.5 bg-blue-500 shadow-md shadow-blue-500/40"
                                    : "w-1.5 h-1.5 bg-white/25 hover:bg-white/40"
                                    }`}></div>
                            </button>
                        ))}
                        <span className="ml-2 text-[9px] text-gray-600 font-mono tabular-nums">
                            {String(currentSlide + 1).padStart(2, "0")}/{String(sliderManhwas.length).padStart(2, "0")}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
