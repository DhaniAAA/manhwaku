/**
 * Custom Hook: useManhwaData
 *
 * Hook ini menangani fetching data manhwa dari API.
 * Memisahkan logic data fetching dari component membuat code lebih clean dan reusable.
 *
 * @returns {Object} Object dengan properties:
 *   - manhwas: Array<Manhwa> - Data manhwa yang sudah di-fetch
 *   - loading: boolean - Status loading (true saat fetching, false setelah selesai)
 *
 * @example
 * ```tsx
 * const { manhwas, loading } = useManhwaData();
 *
 * if (loading) return <LoadingSpinner />;
 * return <ManhwaList data={manhwas} />;
 * ```
 */

"use client";

import { useState, useEffect } from "react";
import { Manhwa } from "@/types/manhwa";
import { trackError } from "@/lib/gtm";

export function useManhwaData() {
    // State untuk menyimpan data manhwa
    const [manhwas, setManhwas] = useState<Manhwa[]>([]);

    // State untuk tracking status loading
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        /**
         * Fungsi async untuk fetch data dari API
         * Menggunakan try-catch untuk error handling
         */
        const fetchData = async () => {
            try {
                // Fetch data dari endpoint API
                const res = await fetch("/api/all_manhwa");

                // Cek apakah response OK (status 200-299)
                if (!res.ok) throw new Error("Gagal mengambil data");

                // Parse response JSON
                const data = await res.json();

                // Validasi bahwa data adalah array
                if (Array.isArray(data)) {
                    setManhwas(data);
                } else {
                    console.error("Format data salah:", data);
                }
            } catch (error) {
                // Log error ke console
                console.error(error);

                // Track error ke Google Analytics untuk monitoring
                trackError(
                    "api_fetch",
                    error instanceof Error ? error.message : "Failed to fetch manhwa data"
                );
            } finally {
                // Set loading false baik success maupun error
                setLoading(false);
            }
        };

        // Panggil fungsi fetch saat component mount
        fetchData();
    }, []); // Empty dependency array = hanya run sekali saat mount

    // Return data dan loading state
    return { manhwas, loading };
}
