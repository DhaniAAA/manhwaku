import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
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

// In-memory cache
let cachedData: Record<string, string> | null = null;
let cachedUntil = 0;

export async function GET() {
    try {
        const now = Date.now();

        // Return cached data if still valid (cache 10 menit)
        if (cachedData && now < cachedUntil) {
            return NextResponse.json(cachedData);
        }

        // 1. List semua folder di root bucket
        const { data: folders, error: listError } = await supabase.storage
            .from(BUCKET)
            .list("", {
                limit: 1000,
                sortBy: { column: "name", order: "asc" },
            });

        if (listError || !folders) {
            console.error("[API] Failed to list folders:", listError?.message);
            return NextResponse.json(
                { error: "Failed to list storage folders" },
                { status: 500 }
            );
        }

        // 2. Filter hanya folder (bukan file di root seperti all-manhwa-metadata.json)
        const slugFolders = folders.filter(
            (item) => item.id === null && item.name !== ".emptyFolderPlaceholder"
        );

        // 3. Ambil updated_at dari chapters.json di setiap folder
        //    Batch requests (parallel, max 20 concurrent)
        const updateTimes: Record<string, string> = {};
        const batchSize = 20;

        for (let i = 0; i < slugFolders.length; i += batchSize) {
            const batch = slugFolders.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async (folder) => {
                    const { data: files, error } = await supabase.storage
                        .from(BUCKET)
                        .list(folder.name, {
                            limit: 10,
                            search: "chapters.json",
                        });

                    if (error || !files) return null;

                    const chaptersFile = files.find(
                        (f) => f.name === "chapters.json"
                    );

                    if (chaptersFile) {
                        return {
                            slug: folder.name,
                            updatedAt: chaptersFile.updated_at,
                        };
                    }
                    return null;
                })
            );

            for (const result of results) {
                if (result) {
                    updateTimes[result.slug] = result.updatedAt;
                }
            }
        }

        // 4. Cache the result
        cachedData = updateTimes;
        cachedUntil = now + 10 * 60 * 1000; // 10 menit

        return NextResponse.json(updateTimes);
    } catch (err) {
        console.error("[API] Unexpected error:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
