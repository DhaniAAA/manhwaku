// JSON-LD Structured Data Components for SEO

interface ManhwaJsonLdProps {
    title: string;
    description: string;
    coverUrl: string;
    author?: string;
    genres?: string[];
    status?: string;
    rating?: string;
    url: string;
}

export function ManhwaJsonLd({
    title,
    description,
    coverUrl,
    author,
    genres,
    status,
    rating,
    url,
}: ManhwaJsonLdProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ComicSeries",
        name: title,
        description: description,
        image: coverUrl,
        author: author ? { "@type": "Person", name: author } : undefined,
        genre: genres,
        url: url,
        publisher: {
            "@type": "Organization",
            name: "ManhwaKu",
            url: "https://www.manhwaku.biz.id",
        },
        inLanguage: "id",
        ...(rating && {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: parseFloat(rating) || 0,
                bestRating: 10,
                worstRating: 0,
            },
        }),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

interface ChapterJsonLdProps {
    manhwaTitle: string;
    chapterTitle: string;
    chapterNumber: string;
    coverUrl: string;
    url: string;
    datePublished?: string;
}

export function ChapterJsonLd({
    manhwaTitle,
    chapterTitle,
    chapterNumber,
    coverUrl,
    url,
    datePublished,
}: ChapterJsonLdProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `${manhwaTitle} ${chapterTitle} Bahasa Indonesia`,
        name: `${manhwaTitle} Chapter ${chapterNumber}`,
        image: coverUrl,
        url: url,
        datePublished: datePublished || new Date().toISOString(),
        publisher: {
            "@type": "Organization",
            name: "ManhwaKu",
            url: "https://www.manhwaku.biz.id",
            logo: {
                "@type": "ImageObject",
                url: "https://www.manhwaku.biz.id/icon.png",
            },
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": url,
        },
        inLanguage: "id",
        isPartOf: {
            "@type": "ComicSeries",
            name: manhwaTitle,
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

// BreadcrumbList for better navigation in search results
interface BreadcrumbJsonLdProps {
    items: { name: string; url: string }[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
