"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Manhwa } from "@/types/manhwa";
import { SLIDER_AUTOPLAY_INTERVAL, RECOMMENDED_MANHWA_COUNT } from "@/constants/app";

interface HeroSliderProps {
    manhwas: Manhwa[];
}

export default function HeroSlider({ manhwas }: HeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Get recommended manhwa (highest rated)
    const recommendedManhwas = [...manhwas]
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, RECOMMENDED_MANHWA_COUNT);

    // Auto-slide carousel
    useEffect(() => {
        if (recommendedManhwas.length === 0) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % recommendedManhwas.length);
        }, SLIDER_AUTOPLAY_INTERVAL);

        return () => clearInterval(interval);
    }, [recommendedManhwas.length]);

    if (recommendedManhwas.length === 0) {
        return (
            <div className="relative overflow-hidden bg-linear-to-br from-green-200 via-clay-100 to-black h-[500px] md:h-[600px] flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-lg">Memuat rekomendasi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-linear-to-br from-green-200 via-clay-100 to-black">
            {/* Slider Container */}
            <div className="relative h-[500px] md:h-[600px]">
                {recommendedManhwas.map((manhwa, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                            }`}
                    >
                        {/* Background Image for Mobile Only */}
                        <div className="absolute inset-0 md:hidden">
                            <img
                                src={manhwa.cover_url}
                                alt={manhwa.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-black/50"></div>
                        </div>

                        {/* Content Container - Responsive Layout */}
                        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                            <div className="grid md:grid-cols-2 gap-8 h-full items-center">
                                {/* Left Side - Text Content */}
                                <div className="text-white py-8 md:py-0">
                                    {/* Badge */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            🔥 REKOMENDASI
                                        </span>
                                        <span className="bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                            ★ {manhwa.rating}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight drop-shadow-lg">
                                        {manhwa.title.replace(" Bahasa Indonesia", "")}
                                    </h2>

                                    {/* Genres */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {manhwa.genres.slice(0, 4).map((genre, i) => (
                                            <span
                                                key={i}
                                                className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full border border-white/30"
                                            >
                                                {genre}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Latest Chapter */}
                                    {manhwa.latestChapters && manhwa.latestChapters.length > 0 && (
                                        <p className="text-blue-200 text-lg mb-6">
                                            Chapter Terbaru: <span className="font-bold text-white">{manhwa.latestChapters[0].title}</span>
                                        </p>
                                    )}

                                    {/* CTA Button */}
                                    <Link
                                        href={`/detail/${manhwa.slug}`}
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-xl"
                                    >
                                        <span>Baca Sekarang</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                </div>

                                {/* Right Side - Cover Image (Desktop Only) */}
                                <div className="hidden md:flex items-center justify-center h-full py-8">
                                    <div className="relative w-full max-w-sm lg:max-w-md">
                                        {/* Image with shadow and border */}
                                        <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                                            <img
                                                src={manhwa.cover_url}
                                                alt={manhwa.title}
                                                className="w-full h-auto aspect-3/4 object-cover"
                                            />
                                            {/* Subtle overlay */}
                                            <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent"></div>

                                            {/* Status badge on image */}
                                            <div className="absolute top-4 right-4">
                                                <span className={`text-xs px-3 py-1 rounded-full font-bold ${manhwa.status === "Ongoing"
                                                    ? "bg-green-500 text-white"
                                                    : "bg-red-500 text-white"
                                                    }`}>
                                                    {manhwa.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Decorative elements */}
                                        <div className="absolute -z-10 top-4 -right-4 w-full h-full bg-blue-600/20 rounded-2xl"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {recommendedManhwas.length > 1 && (
                <>
                    <button
                        onClick={() => setCurrentSlide((prev) => (prev - 1 + recommendedManhwas.length) % recommendedManhwas.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                        aria-label="Previous slide"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setCurrentSlide((prev) => (prev + 1) % recommendedManhwas.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                        aria-label="Next slide"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}

            {/* Dots Navigation */}
            {recommendedManhwas.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {recommendedManhwas.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`transition-all duration-300 rounded-full ${index === currentSlide
                                ? "bg-white w-8 h-3"
                                : "bg-white/50 w-3 h-3 hover:bg-white/70"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
