import Adsterra from './Adsterra';

/**
 * Banner Ad - Horizontal banner ad
 * Best placed at the top or bottom of pages
 */
export function BannerAd({ className = '' }: { className?: string }) {
    return (
        <Adsterra
            adKey="65679c1ac45211d8dfb1ac2bf487ebbe"
            adType="social-bar"
            className={className}
            style={{ minHeight: '90px' }}
        />
    );
}

/**
 * Sidebar Ad - Vertical ad for sidebars
 * Best placed in sidebar areas
 */
export function SidebarAd({ className = '' }: { className?: string }) {
    return (
        <Adsterra
            adKey="65679c1ac45211d8dfb1ac2bf487ebbe"
            adType="social-bar"
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
        <Adsterra
            adKey="65679c1ac45211d8dfb1ac2bf487ebbe"
            adType="social-bar"
            className={className}
            style={{ minHeight: '250px' }}
        />
    );
}

/**
 * Rectangle Ad - Medium rectangle ad
 * Versatile ad unit that works well in various positions
 */
export function RectangleAd({ className = '' }: { className?: string }) {
    return (
        <Adsterra
            adKey="65679c1ac45211d8dfb1ac2bf487ebbe"
            adType="social-bar"
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
        <Adsterra
            adKey="65679c1ac45211d8dfb1ac2bf487ebbe"
            adType="social-bar"
            className={className}
            style={{ minHeight: '100px' }}
        />
    );
}

/**
 * Native Banner Ad - Native ad that looks like content recommendations
 * Best placed below navigation buttons or within content flow
 */
export function NativeBannerAd({ className = '' }: { className?: string }) {
    return (
        <Adsterra
            adKey="65679c1ac45211d8dfb1ac2bf487ebbe"
            adType="banner"
            className={className}
            style={{ minHeight: '280px', width: '100%' }}
        />
    );
}
