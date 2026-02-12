import { Metadata } from "next";
import { notFound } from "next/navigation";
import ReadContent from "./ReadContent";
import { ChapterJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ManhwaDetail, ChapterDetail } from "@/types/manhwa";

// --- Data Fetching Functions (Server-side) ---
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.manhwaku.biz.id";

async function getManhwaMetadata(slug: string): Promise<ManhwaDetail | null> {
  try {
    const res = await fetch(`${SITE_URL}/api/manhwa/${slug}?type=metadata`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
}

async function getManhwaChapters(slug: string): Promise<ChapterDetail[]> {
  try {
    const res = await fetch(`${SITE_URL}/api/manhwa/${slug}?type=chapters`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const rawData = await res.json();

    // Handle format response: { slug, title, total_chapters, chapters: [...] }
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

// --- Helper: Smart Chapter Matching ---
// Mencocokkan chapter berdasarkan slug, dengan fallback ke nomor chapter
// Contoh: URL slug "chapter-242-end" bisa cocok dengan chapters.json slug "chapter242"
function findChapterBySlug(chapters: ChapterDetail[], chapterSlug: string): ChapterDetail | undefined {
  // 1. Exact match
  const exact = chapters.find((ch) => ch.slug === chapterSlug);
  if (exact) return exact;

  // 2. Extract chapter number from URL slug dan cocokkan
  const urlNumMatch = chapterSlug.match(/(\d+(?:\.\d+)?)/);
  if (urlNumMatch) {
    const urlNum = urlNumMatch[1];
    // Cari chapter yang mengandung nomor yang sama
    const byNumber = chapters.find((ch) => {
      const chNumMatch = ch.slug.match(/(\d+(?:\.\d+)?)/);
      return chNumMatch && chNumMatch[1] === urlNum;
    });
    if (byNumber) return byNumber;
  }

  // 3. Tidak ditemukan
  return undefined;
}

// --- Dynamic Metadata untuk SEO ---
type Props = {
  params: Promise<{ slug: string; chapterSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapterSlug } = await params;

  const [meta, chapters] = await Promise.all([
    getManhwaMetadata(slug),
    getManhwaChapters(slug),
  ]);

  const currentChapter = findChapterBySlug(chapters, chapterSlug);

  if (!meta || !currentChapter) {
    return {
      title: "Chapter Tidak Ditemukan",
      description: "Chapter yang Anda cari tidak tersedia.",
    };
  }

  const type = meta.metadata?.Type || "Manhwa";

  // Extract chapter number for better title
  const chapterMatch = currentChapter.title.match(/(?:chapter|ch\.?)\s*(\d+(?:\.\d+)?)/i);
  const chapterNum = chapterMatch ? chapterMatch[1] : currentChapter.title;

  const title = `${meta.title} Chapter ${chapterNum} Sub Indo - Baca Gratis Online`;
  const description = `Baca ${meta.title} Chapter ${chapterNum} Bahasa Indonesia secara gratis di ManhwaKu. ${meta.synopsis?.slice(0, 100) || `Komik ${type} ${meta.genres?.join(", ") || ""}`}`;

  return {
    title,
    description,
    keywords: [
      meta.title,
      `${meta.title} chapter ${chapterNum}`,
      `${meta.title} sub indo`,
      `baca ${meta.title}`,
      `${meta.title} bahasa indonesia`,
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
      url: `${SITE_URL}/read/${slug}/${chapterSlug}`,
      images: [
        {
          url: meta.cover_url,
          width: 300,
          height: 400,
          alt: `${meta.title} Chapter ${chapterNum}`,
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
      canonical: `${SITE_URL}/read/${slug}/${chapterSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// --- Server Component (Page) ---
export default async function ReadPage({ params }: Props) {
  const { slug, chapterSlug } = await params;

  // Fetch data secara paralel di server
  const [meta, chapters] = await Promise.all([
    getManhwaMetadata(slug),
    getManhwaChapters(slug),
  ]);

  // Handle jika data tidak ditemukan
  if (!meta) {
    notFound();
  }

  // Cari chapter yang sesuai
  const currentChapter = findChapterBySlug(chapters, chapterSlug);

  if (!currentChapter) {
    notFound();
  }

  // Extract chapter number for JSON-LD
  const chapterMatch = currentChapter.title.match(/(?:chapter|ch\.?)\s*(\d+(?:\.\d+)?)/i);
  const chapterNum = chapterMatch ? chapterMatch[1] : currentChapter.title;

  // Render client component dengan data dari server
  return (
    <>
      {/* JSON-LD Structured Data untuk Rich Snippets */}
      <ChapterJsonLd
        manhwaTitle={meta.title}
        chapterTitle={currentChapter.title}
        chapterNumber={chapterNum}
        coverUrl={meta.cover_url}
        url={`${SITE_URL}/read/${slug}/${chapterSlug}`}
        datePublished={currentChapter.waktu_rilis}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE_URL },
          { name: meta.title, url: `${SITE_URL}/detail/${slug}` },
          { name: currentChapter.title, url: `${SITE_URL}/read/${slug}/${chapterSlug}` },
        ]}
      />
      <ReadContent
        manhwaSlug={slug}
        chapterSlug={chapterSlug}
        manhwaTitle={meta.title}
        chapterData={currentChapter}
        allChapters={chapters}
      />
    </>
  );
}
