"use client";

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
    const handlePageChange = (page: number) => {
        onPageChange(page);
        trackPagination(page, totalPages);
    };

    return (
        <div className="mt-12 flex flex-col items-center gap-4">
            {/* Page Info */}
            <p className="text-sm text-gray-600">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} manhwa
            </p>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    ← Prev
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                            // Show first page, last page, current page, and pages around current
                            return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                        })
                        .map((page, index, array) => (
                            <div key={page} className="flex items-center gap-1">
                                {/* Show ellipsis if there's a gap */}
                                {index > 0 && page - array[index - 1] > 1 && <span className="px-2 text-gray-400">...</span>}
                                <button
                                    onClick={() => handlePageChange(page)}
                                    className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === page
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    {page}
                                </button>
                            </div>
                        ))}
                </div>

                {/* Next Button */}
                <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
