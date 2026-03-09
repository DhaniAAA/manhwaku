"use client";

import Link from "next/link";
import { Manhwa } from "@/types/manhwa";
import { trackManhwaClick } from "@/lib/gtm";
import { addToReadingHistory } from "@/lib/readingHistory";

interface ManhwaCardProps {
    manhwa: Manhwa;
    position: number;
}

export default function ManhwaCard({ manhwa, position }: ManhwaCardProps) {
    const handleClick = () => {
        // Track analytics
        trackManhwaClick({
            title: manhwa.title,
            slug: manhwa.slug,
            position
        });

        // Add to reading history
        addToReadingHistory({
            slug: manhwa.slug,
            title: manhwa.title,
            cover: manhwa.cover_url,
            lastChapter: manhwa.latestChapters && manhwa.latestChapters.length > 0
                ? manhwa.latestChapters[0].title
                : 'Chapter 1',
        });
    };

    return (
        <Link
            href={`/detail/${manhwa.slug}`}
            onClick={handleClick}
            className="group flex flex-col gap-2.5 sm:gap-3"
        >
            {/* Image Container with 3:4 Aspect Ratio */}
            <div className="relative aspect-3/4 rounded-2xl overflow-hidden shadow-lg border border-white/5 bg-neutral-900 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-violet-500/20 group-hover:border-violet-500/30">

                {/* Overlay Gradient (Darken bottom for text readability) */}
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent z-10 opacity-70 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none"></div>

                {/* Purple Glow Effect on Hover */}
                <div className="absolute inset-0 bg-violet-600/20 opacity-0 group-hover:opacity-100 mix-blend-overlay transition-opacity duration-500 z-10 pointer-events-none"></div>

                {/* Cover Image */}
                <img
                    src={manhwa.cover_url || "https://placehold.co/300x400?text=No+Image"}
                    alt={manhwa.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/300x400?text=No+Image";
                    }}
                />

                {/* Rating Badge (Top Left) */}
                <div className="absolute top-2 left-2 z-20">
                    <span className="px-2 py-[3px] rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-yellow-400 flex items-center gap-1 shadow-sm">
                        ★ {manhwa.rating || "N/A"}
                    </span>
                </div>

                {/* Country/Type Flag (Top Right) */}
                {manhwa.type && (
                    <div className="absolute top-2 right-2 z-20" title={manhwa.type}>
                        <img
                            src={
                                manhwa.type.toLowerCase() === "manhwa" ? "/assets/bendera/south-korea.png" :
                                    manhwa.type.toLowerCase() === "manhua" ? "/assets/bendera/china.png" :
                                        manhwa.type.toLowerCase() === "manga" ? "/assets/bendera/japan.png" : ""
                            }
                            alt={manhwa.type}
                            className="w-5 h-5 rounded-[3px] shadow-sm drop-shadow-lg"
                        />
                    </div>
                )}

                {/* Bottom Overlay Info (Inside Image) */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex justify-between items-end">
                    {/* Latest Chapter Number */}
                    {manhwa.latestChapters && manhwa.latestChapters.length > 0 && (
                        <span className="px-2 py-1 rounded bg-violet-600/90 text-white text-[10px] font-bold shadow-md uppercase tracking-wider backdrop-blur-sm">
                            {manhwa.latestChapters[0].title.replace("Chapter", "Ch.")}
                        </span>
                    )}

                    {/* Total Chapters Count */}
                    {manhwa.total_chapters > 0 && (
                        <span className="text-[10px] font-medium text-white/90 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 shadow-sm">
                            {manhwa.total_chapters} Ch
                        </span>
                    )}
                </div>
            </div>

            {/* External Info Section */}
            <div className="px-1 flex flex-col gap-1">
                {/* Title */}
                <h3 className="font-extrabold text-white text-sm sm:text-[15px] leading-snug line-clamp-2 group-hover:text-violet-400 transition-colors tracking-tight">
                    {manhwa.title.replace(" Bahasa Indonesia", "")}
                </h3>

                {/* Meta info (Genres & Status) */}
                <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[11px] text-gray-400 font-medium truncate pr-2">
                        {manhwa.genres && manhwa.genres.length > 0 ? manhwa.genres.slice(0, 2).join(", ") : manhwa.type}
                    </p>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold shrink-0 bg-white/5 px-2 py-0.5 rounded backdrop-blur-sm border border-white/5">
                        <span className={`w-1.5 h-1.5 rounded-full ${manhwa.status === "Berjalan" ? "bg-green-500 shadow-[0_0_4px_#22c55e]" : "bg-red-500 shadow-[0_0_4px_#ef4444]"}`}></span>
                        <span className={manhwa.status === "Berjalan" ? "text-green-500" : "text-red-500"}>
                            {manhwa.status === "Berjalan" ? "ON" : "END"}
                        </span>
                    </span>
                </div>
            </div>
        </Link>
    );
}
