/**
 * Custom Hook: useChaptersUpdateTimes
 *
 * Hook ini menangani:
 * 1. Fetch awal data update times dari /api/chapters_update_times
 * 2. Polling fallback setiap 5 menit
 * 3. Supabase Realtime subscription pada table `storage.objects`
 *    → Ketika chapters.json berubah di bucket, langsung refetch otomatis
 *
 * PENTING: Untuk Realtime pada `storage.objects`, kamu perlu enable
 * Realtime pada table `objects` di schema `storage` via Supabase Dashboard:
 *   Database → Replication → Supabase Realtime → Toggle ON `storage.objects`
 *
 * Jika Realtime belum di-enable, hook tetap bekerja via polling fallback.
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
    const isMounted = useRef(true);

    /**
     * Fetch data dari API endpoint
     * @param forceRefresh - true untuk bypass server-side cache (dipanggil saat Realtime event)
     */
    const fetchUpdateTimes = useCallback(async (forceRefresh = false) => {
        try {
            setIsRefreshing(true);

            const url = forceRefresh
                ? "/api/chapters_update_times?refresh=true"
                : "/api/chapters_update_times";

            // Timeout 30 detik agar tidak stuck pending selamanya
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);

            const res = await fetch(url, {
                cache: "no-store",
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (res.ok && isMounted.current) {
                const data = await res.json();
                if (data && typeof data === "object" && !data.error) {
                    setChaptersUpdateTimes(data);
                    console.log(
                        `[UpdateTimes] Refreshed: ${Object.keys(data).length} entries`,
                        forceRefresh ? "(force)" : "(cached)",
                        `| X-Cache: ${res.headers.get("X-Cache") || "N/A"}`
                    );
                }
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                console.warn("[UpdateTimes] Request timed out after 30s");
            } else {
                console.error("[UpdateTimes] Failed to fetch:", error);
            }
        } finally {
            if (isMounted.current) {
                setIsRefreshing(false);
            }
        }
    }, []);

    /**
     * Debounced refetch — dipanggil ketika Realtime event diterima.
     * Menggunakan forceRefresh=true untuk bypass server cache.
     */
    const debouncedRefetch = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            console.log("[Realtime] Storage change detected → force refetching...");
            fetchUpdateTimes(true); // force refresh!
        }, REALTIME_DEBOUNCE_MS);
    }, [fetchUpdateTimes]);

    useEffect(() => {
        isMounted.current = true;

        // 1. Fetch awal saat mount (pakai cache)
        fetchUpdateTimes(false);

        // 2. Setup Supabase Realtime subscription pada storage.objects
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

        // 3. Polling fallback (pakai cache — tidak force)
        const pollingInterval = setInterval(() => fetchUpdateTimes(false), POLLING_INTERVAL_MS);

        // Cleanup
        return () => {
            isMounted.current = false;
            supabase.removeChannel(channel);
            clearInterval(pollingInterval);

            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [fetchUpdateTimes, debouncedRefetch]);

    return { chaptersUpdateTimes, isRefreshing };
}
