import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ⚠️ Sengaja TIDAK pakai Edge Runtime karena:
// - Edge Runtime timeout pendek (~30 detik)
// - In-memory cache tidak shared antar invokasi di Edge
// - Node.js runtime lebih stabil untuk operasi batch
export const dynamic = "force-dynamic";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: { persistSession: false },
        global: {
            fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
        },
    }
);

const BUCKET = "manga-data";

// In-memory cache (persisten di Node.js runtime)
let cachedData: Record<string, string> | null = null;
let cachedUntil = 0;

// Cache duration: 5 menit
const CACHE_DURATION_MS = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
    try {
        const now = Date.now();

        // Cek apakah force refresh diminta (dari Realtime hook)
        const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";

        // Return cached data jika masih valid DAN bukan force refresh
        if (!forceRefresh && cachedData && now < cachedUntil) {
            return NextResponse.json(cachedData, {
                headers: {
                    "X-Cache": "HIT",
                    "X-Cache-Expires": new Date(cachedUntil).toISOString(),
                },
            });
        }

        // === STRATEGI: Panggil RPC function get_chapters_update_times ===
        // Fungsi ini SECURITY DEFINER → berjalan sebagai postgres (punya akses ke storage.objects)
        // Tidak perlu RLS policy pada storage.objects.
        // Satu call RPC menggantikan N+1 listing calls.
        const { data: rows, error: rpcError } = await supabase
            .rpc("get_chapters_update_times");

        if (rpcError) {
            console.error("[API] RPC get_chapters_update_times failed:", rpcError.message);

            // FALLBACK: pakai cara lama (listing folders) jika RPC belum dibuat
            console.log("[API] Falling back to folder listing method...");
            const updateTimes = await fallbackListFolders();

            if (updateTimes) {
                cachedData = updateTimes;
                cachedUntil = now + CACHE_DURATION_MS;
                return NextResponse.json(updateTimes, {
                    headers: { "X-Cache": "MISS", "X-Method": "fallback" },
                });
            }

            return NextResponse.json(
                { error: "Failed to query storage objects" },
                { status: 500 }
            );
        }

        // Parse hasil RPC: [{slug: "solo-leveling", updated_at: "..."}]
        const updateTimes: Record<string, string> = {};
        if (rows) {
            for (const row of rows) {
                updateTimes[row.slug] = row.updated_at;
            }
        }

        // Cache result
        cachedData = updateTimes;
        cachedUntil = now + CACHE_DURATION_MS;

        console.log(`[API] chapters_update_times: ${Object.keys(updateTimes).length} entries (RPC)`);

        return NextResponse.json(updateTimes, {
            headers: { "X-Cache": "MISS", "X-Method": "rpc" },
        });

    } catch (err) {
        console.error("[API] Unexpected error:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

/**
 * Fallback: cara lama listing tiap folder
 * Dipakai jika query langsung ke storage.objects gagal (RLS issue)
 */
async function fallbackListFolders(): Promise<Record<string, string> | null> {
    try {
        // 1. List semua folder di root bucket
        const { data: folders, error: listError } = await supabase.storage
            .from(BUCKET)
            .list("", {
                limit: 1000,
                sortBy: { column: "name", order: "asc" },
            });

        if (listError || !folders) return null;

        // 2. Filter hanya folder
        const slugFolders = folders.filter(
            (item) => item.id === null && item.name !== ".emptyFolderPlaceholder"
        );

        // 3. Ambil updated_at dari chapters.json — batch 10 concurrent (lebih kecil = lebih aman)
        const updateTimes: Record<string, string> = {};
        const batchSize = 10;

        for (let i = 0; i < slugFolders.length; i += batchSize) {
            const batch = slugFolders.slice(i, i + batchSize);

            const results = await Promise.allSettled(
                batch.map(async (folder) => {
                    const { data: files, error } = await supabase.storage
                        .from(BUCKET)
                        .list(folder.name, {
                            limit: 10,
                            search: "chapters.json",
                        });

                    if (error || !files) return null;

                    const chaptersFile = files.find((f) => f.name === "chapters.json");
                    if (chaptersFile) {
                        return { slug: folder.name, updatedAt: chaptersFile.updated_at };
                    }
                    return null;
                })
            );

            for (const result of results) {
                if (result.status === "fulfilled" && result.value) {
                    updateTimes[result.value.slug] = result.value.updatedAt;
                }
            }
        }

        console.log(`[API] chapters_update_times: ${Object.keys(updateTimes).length} entries (fallback)`);
        return updateTimes;

    } catch (err) {
        console.error("[API] Fallback listing error:", err);
        return null;
    }
}
