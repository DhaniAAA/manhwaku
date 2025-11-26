import AdSense from './AdSense';

/**
 * Banner Ad - Horizontal banner ad (typically 728x90 or responsive)
 * Best placed at the top or bottom of pages
 */
export function BannerAd({ className = '' }: { className?: string }) {
    return (
        <AdSense
            adSlot={process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT || ''}
            adFormat="horizontal"
            className={className}
            style={{ minHeight: '90px' }}
        />
    );
}

/**
 * Sidebar Ad - Vertical ad for sidebars (typically 300x600 or 160x600)
 * Best placed in sidebar areas
 */
export function SidebarAd({ className = '' }: { className?: string }) {
    return (
        <AdSense
            adSlot={process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT || ''}
            adFormat="vertical"
            className={className}
            style={{ minHeight: '600px' }}
        />
    );
}

/**
 * In-Article Ad - Responsive ad for within content
 * Best placed between paragraphs or content sections
 */
export function InArticleAd({ className = '' }: { className?: string }) {
    return (
        <AdSense
            adSlot={process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT || ''}
            adFormat="fluid"
            className={className}
            style={{ minHeight: '250px' }}
        />
    );
}

/**
 * Rectangle Ad - Medium rectangle ad (typically 300x250)
 * Versatile ad unit that works well in various positions
 */
export function RectangleAd({ className = '' }: { className?: string }) {
    return (
        <AdSense
            adSlot={process.env.NEXT_PUBLIC_ADSENSE_RECTANGLE_SLOT || ''}
            adFormat="rectangle"
            className={className}
            style={{ minHeight: '250px', minWidth: '300px' }}
        />
    );
}

/**
 * Responsive Ad - Fully responsive ad that adapts to container
 * Best for flexible layouts
 */
export function ResponsiveAd({ className = '' }: { className?: string }) {
    return (
        <AdSense
            adSlot={process.env.NEXT_PUBLIC_ADSENSE_RESPONSIVE_SLOT || ''}
            adFormat="auto"
            fullWidthResponsive={true}
            className={className}
            style={{ minHeight: '100px' }}
        />
    );
}
