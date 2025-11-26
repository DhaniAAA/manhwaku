import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Gunakan Edge Runtime untuk respon yang jauh lebih cepat (low latency)
export const runtime = "edge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
    },
});

export async function GET() {
    try {
        const BUCKET_NAME = "manga-data";
        const FILE_PATH = "all-manhwa-metadata.json";

        const { data, error } = await supabase.storage.from(BUCKET_NAME).download(FILE_PATH);

        if (error) {
            console.error(`[Error] ${FILE_PATH}:`, error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return new NextResponse(data, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=59",
            },
        });
    } catch (err) {
        console.error("Server Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
