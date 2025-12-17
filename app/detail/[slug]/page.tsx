import { Metadata } from "next";
import { notFound } from "next/navigation";
import DetailContent from "./DetailContent";
import { ManhwaJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

// --- Interfaces ---
interface ManhwaMetadata {
  title: string;
  cover_url: string;
  author?: string;
  status: string;
  rating: string;
  genres: string[];
  synopsis?: string;
  type?: string;
}

interface ChapterItem {
  slug: string;
  title: string;
  waktu_rilis: string;
  url: string;
  images: string[];
}

interface ChapterResponse {
  slug: string;
  title: string;
  total_chapters: number;
  chapters: ChapterItem[];
}

// --- Data Fetching Functions (Server-side) ---
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.manhwaku.biz.id";

async function getManhwaMetadata(slug: string): Promise<ManhwaMetadata | null> {
  try {
    const res = await fetch(`${SITE_URL}/api/manhwa/${slug}?type=metadata`, {
      next: { revalidate: 3600 }, // Cache selama 1 jam
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
}

async function getManhwaChapters(slug: string): Promise<ChapterItem[]> {
  try {
    const res = await fetch(`${SITE_URL}/api/manhwa/${slug}?type=chapters`, {
      next: { revalidate: 3600 }, // Cache selama 1 jam
    });

    if (!res.ok) return [];

    const rawData = await res.json();

    // Handle berbagai format response
    if (rawData.chapters && Array.isArray(rawData.chapters)) {
      return rawData.chapters;
    } else if (Array.isArray(rawData)) {
      return rawData;
    }

    return [];
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }
}

// --- Dynamic Metadata untuk SEO ---
type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getManhwaMetadata(slug);

  if (!meta) {
    return {
      title: "Manhwa Tidak Ditemukan",
      description: "Manhwa yang Anda cari tidak tersedia.",
    };
  }

  const title = `Baca ${meta.title} Bahasa Indonesia - Gratis & Lengkap`;
  const description = meta.synopsis
    ? `${meta.synopsis.slice(0, 155)}...`
    : `Baca komik ${meta.title} Bahasa Indonesia secara gratis di ManhwaKu. Genre: ${meta.genres?.join(", ") || "Manhwa"}. Status: ${meta.status}.`;

  return {
    title,
    description,
    keywords: [
      meta.title,
      `baca ${meta.title}`,
      `${meta.title} bahasa indonesia`,
      `${meta.title} sub indo`,
      ...(meta.genres || []),
      "manhwa",
      "baca manhwa",
      "manhwa online",
      "manhwa gratis",
      "manhwa indonesia",
      "komik korea",
      "webtoon",
      "manhwa terbaru",
      "baca komik online",
      "komikcast",
      "komiku",
      "komikindo",
      "komikid",
      "manhwaindo",
      "kiryuu",
      "shinigami",
    ],
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_URL}/detail/${slug}`,
      images: [
        {
          url: meta.cover_url,
          width: 300,
          height: 400,
          alt: meta.title,
        },
      ],
      siteName: "ManhwaKu",
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [meta.cover_url],
    },
    alternates: {
      canonical: `${SITE_URL}/detail/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// --- Server Component (Page) ---
export default async function ManhwaDetailPage({ params }: Props) {
  const { slug } = await params;

  // Fetch data secara paralel di server
  const [meta, chapters] = await Promise.all([
    getManhwaMetadata(slug),
    getManhwaChapters(slug),
  ]);

  // Handle jika manhwa tidak ditemukan
  if (!meta) {
    notFound();
  }

  // Render client component dengan data dari server
  return (
    <>
      {/* JSON-LD Structured Data untuk Rich Snippets */}
      <ManhwaJsonLd
        title={meta.title}
        description={meta.synopsis || `Baca ${meta.title} Bahasa Indonesia di ManhwaKu`}
        coverUrl={meta.cover_url}
        author={meta.author}
        genres={meta.genres}
        status={meta.status}
        rating={meta.rating}
        url={`${SITE_URL}/detail/${slug}`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE_URL },
          { name: meta.title, url: `${SITE_URL}/detail/${slug}` },
        ]}
      />
      <DetailContent meta={meta} chapters={chapters} slug={slug} />
    </>
  );
}
