"use client";

import { useState, useEffect } from "react";
import { trackPagination } from "@/lib/gtm";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
    onPageChange
}: PaginationProps) {
    // State untuk input manual halaman
    const [inputPage, setInputPage] = useState(currentPage.toString());

    // Sinkronisasi input saat currentPage berubah (dari tombol Next/Prev)
    useEffect(() => {
        setInputPage(currentPage.toString());
    }, [currentPage]);

    const handlePageChange = (page: number) => {
        onPageChange(page);
        trackPagination(page, totalPages);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handler saat user menekan Enter atau keluar dari input (blur)
    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const pageNumber = parseInt(inputPage);

        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            if (pageNumber !== currentPage) {
                handlePageChange(pageNumber);
            }
        } else {
            // Reset ke halaman saat ini jika input tidak valid
            setInputPage(currentPage.toString());
        }
    };

    return (
        <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 px-4 w-full">
            {/* Page Info */}
            <p className="text-xs md:text-sm text-gray-400 text-center">
                Menampilkan <span className="font-semibold text-white">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> dari <span className="font-semibold text-white">{totalItems}</span> manhwa
            </p>

            {/* --- TAMPILAN MOBILE (Layar Kecil) --- */}
            <div className="flex md:hidden items-center justify-between w-full max-w-sm gap-3">
                <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-gray-300 text-sm font-bold shadow-sm hover:bg-neutral-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                    ← Prev
                </button>

                {/* Input Halaman Manual */}
                <form
                    onSubmit={handleManualSubmit}
                    className="flex items-center justify-center bg-neutral-800 px-3 py-3 rounded-xl min-w-[100px]"
                >
                    <input
                        type="text"
                        inputMode="numeric"
                        value={inputPage}
                        onChange={(e) => setInputPage(e.target.value)}
                        onBlur={handleManualSubmit}
                        className="w-8 text-center bg-transparent font-bold text-white text-sm focus:outline-none p-0"
                    />
                    <div className="text-gray-400 text-sm font-medium whitespace-nowrap">
                        / {totalPages}
                    </div>
                </form>

                <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-gray-300 text-sm font-bold shadow-sm hover:bg-neutral-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                    Next →
                </button>
            </div>

            {/* --- TAMPILAN DESKTOP (Layar Besar) --- */}
            <div className="hidden md:flex items-center gap-2">
                <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-gray-300 font-medium hover:bg-neutral-800 hover:text-blue-500 hover:border-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                    ← Prev
                </button>

                <div className="flex gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                            return page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2);
                        })
                        .map((page, index, array) => (
                            <div key={page} className="flex items-center gap-1.5">
                                {index > 0 && page - array[index - 1] > 1 && (
                                    <span className="px-1 text-gray-400 font-medium">...</span>
                                )}
                                <button
                                    onClick={() => handlePageChange(page)}
                                    className={`min-w-[40px] h-10 px-2 rounded-lg font-bold text-sm transition-all shadow-sm ${currentPage === page
                                        ? "bg-blue-600 text-white shadow-blue-900/50 ring-2 ring-blue-600 ring-offset-1 ring-offset-neutral-900"
                                        : "bg-neutral-900 border border-neutral-800 text-gray-300 hover:bg-neutral-800 hover:text-blue-500 hover:border-blue-900/50"
                                        }`}
                                >
                                    {page}
                                </button>
                            </div>
                        ))}
                </div>

                <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-gray-300 font-medium hover:bg-neutral-800 hover:text-blue-500 hover:border-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}