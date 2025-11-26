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
            className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
        >
            {/* Image Cover */}
            <div className="aspect-3/4 overflow-hidden bg-gray-200 relative">
                {/* Label Chapter Terbaru di Pojok Kiri Atas */}
                {manhwa.latestChapters && manhwa.latestChapters.length > 0 && (
                    <div className="absolute top-2 left-2 z-10">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">
                            {manhwa.latestChapters[0].title.replace("Chapter", "Ch.")}
                        </span>
                    </div>
                )}

                <img
                    src={manhwa.cover_url}
                    alt={manhwa.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/300x400?text=No+Image";
                    }}
                />

                {/* Rating Badge di Pojok Kanan Bawah Image */}
                <div className="absolute bottom-0 right-0 bg-linear-to-t from-black/80 to-transparent w-full p-2 flex justify-end">
                    <div className="flex items-center text-white text-xs font-bold">
                        <span className="text-yellow-400 mr-1">★</span>
                        {manhwa.rating}
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-3 flex flex-col grow">
                {/* Genres (Tampilkan 1 saja biar rapi) */}
                <div className="text-[10px] text-blue-600 font-semibold mb-1 uppercase tracking-wide">
                    {manhwa.genres && manhwa.genres.length > 0 ? manhwa.genres[0] : manhwa.type}
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-blue-700 transition-colors">
                    {manhwa.title.replace(" Bahasa Indonesia", "")}
                </h3>

                {/* Last Chapter Info */}
                {manhwa.latestChapters && manhwa.latestChapters.length > 0 && (
                    <div className="text-[10px] text-gray-500 mb-2">
                        <span className="font-medium">Last: </span>
                        {manhwa.latestChapters[manhwa.latestChapters.length - 1].title.replace("Chapter", "Ch.")}
                    </div>
                )}

                {/* Status Badge (Footer Card) */}
                <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${manhwa.status === "Ongoing" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                        {manhwa.status}
                    </span>
                </div>
            </div>
        </Link>
    );
}
