import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const BUCKET = "manga-data";

/**
 * Hapus seluruh isi folder (Supabase Storage tidak punya recursive delete,
 * jadi kita list semua file di folder tersebut dulu, lalu hapus semuanya).
 */
async function deleteFolder(slug: string): Promise<{ slug: string; deleted: number; error?: string }> {
    try {
        // List semua file dalam folder (max 1000; cukup untuk metadata.json + chapters.json + images)
        let allFiles: string[] = [];
        let offset = 0;
        while (true) {
            const { data, error } = await supabase.storage.from(BUCKET).list(slug, {
                limit: 1000,
                offset,
            });
            if (error || !data) break;
            data.forEach(f => allFiles.push(`${slug}/${f.name}`));
            if (data.length < 1000) break;
            offset += 1000;
        }

        if (allFiles.length === 0) {
            // Folder mungkin sudah kosong atau tidak ada
            return { slug, deleted: 0 };
        }

        const { error: removeErr } = await supabase.storage.from(BUCKET).remove(allFiles);
        if (removeErr) throw removeErr;

        return { slug, deleted: allFiles.length };
    } catch (e: any) {
        return { slug, deleted: 0, error: e.message };
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const slugs: string[] = body.slugs ?? [];

        if (!Array.isArray(slugs) || slugs.length === 0) {
            return NextResponse.json({ error: "Tidak ada slug yang dikirim." }, { status: 400 });
        }

        // Proses hapus secara paralel (max 5 sekaligus untuk menghindari rate limit)
        const results: Array<{ slug: string; deleted: number; error?: string }> = [];
        const BATCH = 5;
        for (let i = 0; i < slugs.length; i += BATCH) {
            const batch = slugs.slice(i, i + BATCH);
            const batchResults = await Promise.all(batch.map(s => deleteFolder(s)));
            results.push(...batchResults);
        }

        const success = results.filter(r => !r.error);
        const failed = results.filter(r => r.error);

        return NextResponse.json({
            success: true,
            deleted: success.length,
            failed: failed.length,
            results,
        });
    } catch (err: any) {
        console.error("[delete-folders]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
