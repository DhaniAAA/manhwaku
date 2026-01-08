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
            suppressHydrationWarning
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
            suppressHydrationWarning
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
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

// Website Schema - Untuk Sitelinks Search Box di Google
interface WebsiteJsonLdProps {
    name: string;
    url: string;
    searchUrl?: string;
}

export function WebsiteJsonLd({ name, url, searchUrl }: WebsiteJsonLdProps) {
    const jsonLd: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: name,
        url: url,
        inLanguage: "id",
        publisher: {
            "@type": "Organization",
            name: name,
            url: url,
        },
    };

    // Add search action for Sitelinks Searchbox
    if (searchUrl) {
        jsonLd.potentialAction = {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: searchUrl,
            },
            "query-input": "required name=search_term_string",
        };
    }

    return (
        <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

// Organization Schema - Untuk Knowledge Panel
interface OrganizationJsonLdProps {
    name: string;
    url: string;
    logo: string;
    description?: string;
    sameAs?: string[]; // Social media links
}

export function OrganizationJsonLd({
    name,
    url,
    logo,
    description,
    sameAs,
}: OrganizationJsonLdProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: name,
        url: url,
        logo: {
            "@type": "ImageObject",
            url: logo,
        },
        description: description,
        sameAs: sameAs || [],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            email: "01windsurf@gmail.com",
        },
    };

    return (
        <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

// ItemList Schema - Untuk mendapatkan rich results carousel
interface ItemListJsonLdProps {
    items: {
        name: string;
        url: string;
        image?: string;
        description?: string;
    }[];
    listName: string;
}

export function ItemListJsonLd({ items, listName }: ItemListJsonLdProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: listName,
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
                "@type": "CreativeWork",
                name: item.name,
                url: item.url,
                image: item.image,
                description: item.description,
            },
        })),
    };

    return (
        <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
