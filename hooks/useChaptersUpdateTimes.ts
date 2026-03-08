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
    const isMounted = useRef(true);

    const fetchUpdateTimes = useCallback(async () => {
        try {
            setIsRefreshing(true);
            const url = "/api/chapters_update_times";

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const res = await fetch(url, {
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (res.ok && isMounted.current) {
                const data = await res.json();
                if (data && typeof data === "object" && !data.error) {
                    setChaptersUpdateTimes(data);
                }
            }
        } catch (error) {
            // ignore
        } finally {
            if (isMounted.current) {
                setIsRefreshing(false);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;

        // 1. Fetch awal saat mount (pakai CDN Cache)
        fetchUpdateTimes();

        // 2. Polling interval (setiap 5 menit), di-cache oleh Vercel CDN
        const pollingInterval = setInterval(() => fetchUpdateTimes(), POLLING_INTERVAL_MS);

        // Cleanup
        return () => {
            isMounted.current = false;
            clearInterval(pollingInterval);
        };
    }, [fetchUpdateTimes]);

    return { chaptersUpdateTimes, isRefreshing };
}
