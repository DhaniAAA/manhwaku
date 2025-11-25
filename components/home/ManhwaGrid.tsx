"use client";

import { Manhwa } from "@/types/manhwa";
import ManhwaCard from "./ManhwaCard";

interface ManhwaGridProps {
    manhwas: Manhwa[];
    startIndex: number;
}

export default function ManhwaGrid({ manhwas, startIndex }: ManhwaGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
            {manhwas.map((manhwa, index) => (
                <ManhwaCard
                    key={manhwa.slug}
                    manhwa={manhwa}
                    position={startIndex + index + 1}
                />
            ))}
        </div>
    );
}
