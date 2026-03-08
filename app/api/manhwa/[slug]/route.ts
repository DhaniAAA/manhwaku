// app/api/manhwa/[slug]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
// 🚀 EGRESS OPTIMIZATION:
// Menggunakan Next.js ISR Cache (5 menit) agar Vercel CDN menanggung beban fetch,
// bukan meredirect user langsung ke Supabase (yang memakan kuota Egress GBs).
export const revalidate = 300;

// Client sekali saja (module scope → reused antar invocation di Edge)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = "manga-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "metadata";
    const slug = (await params).slug;

    if (!slug || !/^[a-z0-9\-]+$/.test(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const filePath = `${slug}/${type}.json`;

    // Fetch konten langsung dari Supabase
    // Karena ada "revalidate = 300", Next.js/Vercel hanya akan execute ini max 1x per 5 menit per file
    const { data, error } = await supabase.storage.from(BUCKET).download(filePath);

    if (error || !data) {
      console.error(`[Supabase] Download failed for ${filePath}:`, error?.message);
      return NextResponse.json(
        { error: "File not found or inaccessible" },
        { status: 404 }
      );
    }

    let json;
    try {
      json = JSON.parse(await data.text());
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse JSON" }, { status: 500 });
    }

    // Return kontennya langsung dan instruksikan browser untuk ikut melakukan caching
    return NextResponse.json(json, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=59"
      }
    });

  } catch (err) {
    console.error("[API/manhwa/[slug]] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}