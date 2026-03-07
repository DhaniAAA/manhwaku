import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
// 🚀 EGRESS OPTIMIZATION:
// Menggunakan Next.js ISR Cache (5 menit) agar Vercel CDN yang menanggung beban fetch.
// Sebelumnya: 'force-dynamic' (no cache) + redirect 307 → User langsung sedot GBs egress Supabase.
// Sekarang: Vercel cache response-nya, 1 jam cuma butuh minta 12 kali ke Supabase per file.
export const revalidate = 300;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = "manga-data";
const PATH = "all-manhwa-metadata.json";

export async function GET() {
    try {
        // Fetch ke Supabase (Next.js Edge Cache akan simpan hasil fetch ini selama 5 menit)
        const { data, error } = await supabase.storage.from(BUCKET).download(PATH);

        if (error || !data) {
            console.error("[Supabase] Data fetch error:", error?.message);
            return NextResponse.json({ error: "File not found or inaccessible" }, { status: 404 });
        }

        let json;
        try {
            json = JSON.parse(await data.text());
        } catch (e) {
            return NextResponse.json({ error: "Failed to parse JSON data" }, { status: 500 });
        }

        // Return kontennya langsung dengan Cache-Control untuk browser client
        return NextResponse.json(json, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=59"
            }
        });

    } catch (err) {
        console.error("[API] Unexpected error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}