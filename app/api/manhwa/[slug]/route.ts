// app/api/manga/[slug]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 3600; // optional: ISR fallback

// Client sekali saja (module scope → reused antar invocation di Edge)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false },
    global: { fetch }, // gunakan native fetch (paling cepat)
  }
);

const BUCKET = "manga-data";

// Simple in-memory cache untuk signed URL (valid ~55 menit)
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

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

    // Kunci cache unik per file
    const cacheKey = `${slug}:${type}`;
    const now = Date.now();
    const cached = signedUrlCache.get(cacheKey);

    let signedUrl: string;

    if (cached && now < cached.expiresAt) {
      signedUrl = cached.url;
    } else {
      // Generate signed URL (hanya 1 request ke Supabase tiap ~55 menit per file)
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, 3600); // 1 jam (bisa sampai 7 hari pakai service key)

      if (error || !data?.signedUrl) {
        console.error(`[Supabase] Signed URL failed for ${filePath}:`, error?.message);
        return NextResponse.json(
          { error: "File not found or inaccessible" },
          { status: 404 }
        );
      }

      signedUrl = data.signedUrl;
      signedUrlCache.set(cacheKey, {
        url: signedUrl,
        expiresAt: now + 55 * 60 * 1000, // 55 menit (safe margin)
      });
    }

    // Langsung redirect ke Supabase CDN (edge global!)
    return NextResponse.redirect(signedUrl, 307);

  } catch (err) {
    console.error("[API/manga/[slug]] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}