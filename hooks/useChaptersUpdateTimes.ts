/**
 * Custom Hook: useChaptersUpdateTimes
 *
 * Hook ini menangani:
 * 1. Fetch awal data update times dari /api/chapters_update_times
 * 2. Polling fallback setiap 5 menit
 * 3. Supabase Realtime subscription pada table `storage.objects`
 *    → Ketika chapters.json berubah di bucket, langsung refetch otomatis
 *
 * Dengan Realtime, tidak perlu lagi "pancing" pakai Postman.
 * Setiap kali scraper upload/update chapters.json di Supabase Storage,
 * hook ini akan langsung detect dan refetch data terbaru.
 *
 * PENTING: Untuk Realtime pada `storage.objects`, kamu perlu enable
 * Realtime pada table `objects` di schema `storage` via Supabase Dashboard:
 *   Database → Replication → Supabase Realtime → Toggle ON `storage.objects`
 *
 * @returns {Object}
 *   - chaptersUpdateTimes: Record<string, string> - slug → last updated timestamp
 *   - isRefreshing: boolean - true saat sedang fetch ulang data
 *
 * @example
 * ```tsx
 * const { chaptersUpdateTimes, isRefreshing } = useChaptersUpdateTimes();
 * ```
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

// Debounce delay (ms) — mencegah terlalu banyak refetch jika banyak file berubah sekaligus
const REALTIME_DEBOUNCE_MS = 3000;

// Polling fallback interval (ms)
const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 menit

export function useChaptersUpdateTimes() {
    const [chaptersUpdateTimes, setChaptersUpdateTimes] = useState<Record<string, string>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Fetch data dari API endpoint
     */
    const fetchUpdateTimes = useCallback(async () => {
        try {
            setIsRefreshing(true);
            const res = await fetch("/api/chapters_update_times", {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache" },
            });
            if (res.ok) {
                const data = await res.json();
                if (data && typeof data === "object" && !data.error) {
                    setChaptersUpdateTimes(data);
                    console.log(
                        "[Realtime] Chapters update times refreshed:",
                        Object.keys(data).length,
                        "entries"
                    );
                }
            }
        } catch (error) {
            console.error("[Realtime] Failed to fetch chapters update times:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    /**
     * Debounced refetch — dipanggil ketika Realtime event diterima.
     * Mencegah spam refetch jika banyak file berubah sekaligus (misal batch upload).
     */
    const debouncedRefetch = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            console.log("[Realtime] Storage change detected → refetching update times...");
            fetchUpdateTimes();
        }, REALTIME_DEBOUNCE_MS);
    }, [fetchUpdateTimes]);

    useEffect(() => {
        // 1. Fetch awal saat mount
        fetchUpdateTimes();

        // 2. Setup Supabase Realtime subscription pada storage.objects
        //    Ini akan mendeteksi INSERT/UPDATE/DELETE pada file di Supabase Storage.
        //    Ketika chapters.json diupdate oleh scraper, event akan ter-trigger.
        const channel = supabase
            .channel("storage-chapters-updates")
            .on(
                "postgres_changes",
                {
                    event: "*", // INSERT, UPDATE, DELETE
                    schema: "storage",
                    table: "objects",
                    filter: "bucket_id=eq.manga-data",
                },
                (payload) => {
                    // Filter hanya event yang terkait chapters.json
                    const record = payload.new as Record<string, unknown> | null;
                    const oldRecord = payload.old as Record<string, unknown> | null;
                    const fileName =
                        (record?.name as string) ||
                        (oldRecord?.name as string) ||
                        "";

                    if (fileName.endsWith("chapters.json")) {
                        console.log(
                            `[Realtime] chapters.json changed (${payload.eventType}):`,
                            fileName
                        );
                        debouncedRefetch();
                    }
                }
            )
            .subscribe((status) => {
                console.log("[Realtime] Subscription status:", status);
            });

        // 3. Polling fallback — kalau Realtime belum di-enable atau terputus
        const pollingInterval = setInterval(fetchUpdateTimes, POLLING_INTERVAL_MS);

        // Cleanup
        return () => {
            // Unsubscribe Realtime
            supabase.removeChannel(channel);

            // Clear polling
            clearInterval(pollingInterval);

            // Clear debounce timer
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [fetchUpdateTimes, debouncedRefetch]);

    return { chaptersUpdateTimes, isRefreshing };
}
