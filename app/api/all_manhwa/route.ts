import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 3600;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: { persistSession: false },
        global: {
            // Optimasi fetch di Edge Runtime
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
        // 1. Gunakan signed URL + redirect (paling cepat!)
        const now = Date.now();

        if (!cachedSignedUrl || now > cachedUntil) {
            const { data, error } = await supabase.storage
                .from(BUCKET)
                .createSignedUrl(PATH, 3300); // 55 menit (max 1 jam untuk anon key)

            if (error || !data?.signedUrl) {
                console.error("[Supabase] Signed URL error:", error?.message);
                return NextResponse.json(
                    { error: "Failed to generate signed URL" },
                    { status: 500 }
                );
            }

            cachedSignedUrl = data.signedUrl;
            cachedUntil = now + 55 * 60 * 1000;
        }
        return NextResponse.redirect(cachedSignedUrl, 307);


    } catch (err) {
        console.error("[API] Unexpected error:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}