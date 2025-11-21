import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        const BUCKET_NAME = "manga-data";
        const FILE_PATH = "all-manhwa-metadata.json";

        const { data, error } = await supabase.storage.from(BUCKET_NAME).download(FILE_PATH);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const fileText = await data.text();
        const jsonData = JSON.parse(fileText);

        return NextResponse.json(jsonData);
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
