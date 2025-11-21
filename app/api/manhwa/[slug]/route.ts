// app/api/manhwa/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// definisikan tipe params sebagai Promise (khusus Next.js 15)
interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    //  menungggu (await) params sebelum menggunakannya
    const params = await context.params;
    const slug = params.slug;
    // ---------------------------------

    const searchParams = request.nextUrl.searchParams;
    const fileType = searchParams.get("type") || "metadata";

    const BUCKET_NAME = "manga-data";
    const FILE_PATH = `${slug}/${fileType}.json`;

    // Debug log
    console.log(`Fetching: ${BUCKET_NAME}/${FILE_PATH}`);

    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(FILE_PATH);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json(
        {
          error: `File ${fileType}.json tidak ditemukan pada folder ${slug}`,
          detail: error.message,
        },
        { status: 404 }
      );
    }

    const fileText = await data.text();
    const jsonData = JSON.parse(fileText);

    return NextResponse.json(jsonData);
  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
