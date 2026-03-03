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
const PATH = "all-manhwa-metadata.json";

let cachedSignedUrl: string | null = null;
let cachedUntil = 0;

export async function GET() {
    try {
        const now = Date.now();

        // Gunakan cache singkat (1 menit)
        if (!cachedSignedUrl || now > cachedUntil) {
            const { data, error } = await supabase.storage
                .from(BUCKET)
                .createSignedUrl(PATH, 3600); // Token valid 1 jam

            if (error || !data?.signedUrl) {
                console.error("[Supabase] Signed URL error:", error?.message);
                return NextResponse.json(
                    { error: "Failed to generate signed URL" },
                    { status: 500 }
                );
            }

            cachedSignedUrl = data.signedUrl;
            cachedUntil = now + 1 * 60 * 1000; // Cache 1 menit
        }

        // Redirect tanpa browser caching dengan nambah timestamp ke hash atau di redirect header
        // Kita tidak nambah querystring ke signedUrl karena Supabase akan menganggap signature invalid
        return NextResponse.redirect(cachedSignedUrl, 307);

    } catch (err) {
        console.error("[API] Unexpected error:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}