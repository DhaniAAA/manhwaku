import { Metadata } from "next";
import { notFound } from "next/navigation";
import GenreContent from "./GenreContent";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

// --- Data Fetching Functions (Server-side) ---
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.manhwaku.biz.id";

// Helper to format genre slug to Title Case
function formatGenreSlug(slug: string): string {
    return slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

async function getManhwasByGenre(genreSlug: string) {
    try {
        const res = await fetch(`${SITE_URL}/api/all_manhwa`, {
            next: { revalidate: 3600 }, // Cache 1 jam untuk list semua manhwa
        });

        if (!res.ok) return [];

        const rawData = await res.json();

        // Filter out duplicates
        const seen = new Set<string>();
        const uniqueManhwas = rawData.filter((item: any) => {
            if (!item.slug || seen.has(item.slug)) return false;
            seen.add(item.slug);
            return true;
        });

        // Filter by genre
        const targetGenre = formatGenreSlug(genreSlug);
        const filtered = uniqueManhwas.filter((manhwa: any) =>
            manhwa.genres?.some((g: string) => g.toLowerCase() === targetGenre.toLowerCase())
        );

        return filtered;
    } catch (error) {
        console.error("Error fetching manhwas by genre:", error);
        return [];
    }
}

// --- Dynamic Metadata untuk SEO ---
type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const genreName = formatGenreSlug(slug);

    const title = `Rekomendasi Manhwa ${genreName} Terbaik - Baca Gratis | ManhwaKu`;
    const description = `Daftar rekomendasi manhwa genre ${genreName} terbaik bahasa Indonesia pilihan. Baca komik action, romance, isekai, dan overpower favoritmu secara gratis hanya di ManhwaKu.`;

    return {
        title,
        description,
        keywords: [
            `manhwa ${genreName}`,
            `rekomendasi manhwa ${genreName}`,
            `manhwa ${genreName} terbaik`,
            `baca manhwa ${genreName}`,
            `komik ${genreName}`,
            `manhwa ${genreName} bahasa indonesia`,
            "manhwa", "baca manhwa"
        ],
        openGraph: {
            title,
            description,
            type: "website",
            url: `${SITE_URL}/genre/${slug}`,
            siteName: "ManhwaKu",
            locale: "id_ID",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
        alternates: {
            canonical: `${SITE_URL}/genre/${slug}`,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

// --- Server Component (Page) ---
export default async function GenrePage({ params }: Props) {
    const { slug } = await params;
    const genreName = formatGenreSlug(slug);

    const manhwas = await getManhwasByGenre(slug);

    // Jika tidak ada data atau genre tidak ada, boleh kita biarkan dengan array kosong
    // atau NotFound jika kita ingin strict
    if (!manhwas || manhwas.length === 0) {
        // Kita render saja "Kategori belum ada manhwa"
        // karena membuat notFound() untuk semua typo di URL mungkin berbahaya untuk SEO
        // Tapi untuk kebersihan SEO Google, lebih baik notFound() jika genre nya benar-benar 0 hasil
        if (manhwas.length === 0) notFound();
    }

    return (
        <>
            {/* Menggunakan Breadcrumb Schema untuk SEO */}
            <BreadcrumbJsonLd
                items={[
                    { name: "Home", url: SITE_URL },
                    { name: "Genre", url: `${SITE_URL}/jelajahi` },
                    { name: genreName, url: `${SITE_URL}/genre/${slug}` },
                ]}
            />
            <GenreContent
                genreName={genreName}
                manhwas={manhwas}
            />
        </>
    );
}
