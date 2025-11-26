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

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Ekstrak search params segera (tidak perlu await params dulu)
    const { searchParams } = request.nextUrl;
    const fileType = searchParams.get("type") || "metadata";

    // 2. Await params (Next.js 15 Requirement)
    const { slug } = await context.params;

    const BUCKET_NAME = "manga-data";
    const FILE_PATH = `${slug}/${fileType}.json`;

    // 3. Download file
    // Catatan: Menggunakan .download() akan mengembalikan Blob
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(FILE_PATH);

    if (error) {
      console.error(`[Error] ${slug}/${fileType}:`, error.message);
      return NextResponse.json(
        { error: "File not found", detail: error.message },
        { status: 404 }
      );
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // public: boleh dicache siapa saja
        // max-age=3600: browser cache selama 1 jam
        // s-maxage=3600: CDN/Vercel cache selama 1 jam
        // stale-while-revalidate=59: sajikan cache lama sambil update background
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=59",
      },
    });

  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}