import Adsterra from './Adsterra';
import AdsterraBanner from './AdsterraBanner';

// --- KEY IKLAN (GANTI DENGAN KEY ASLI DARI DASHBOARD ADSTERRA) ---
const KEYS = {
    SOCIAL_BAR: "65679c1ac45211d8dfb1ac2bf487ebbe", // Key Social Bar Anda yang sekarang
    BANNER_728: "2b9a10a1176b4933d587c8973a6b7ceb",      // Buat di Adsterra: Banner 728x90
    BANNER_300: "f94af59154f1ae4d546801e871fcc67e",     // Buat di Adsterra: Banner 300x250
    NATIVE: "96d583e5ddc3a39d4b247362e990b8f7",          // Buat di Adsterra: Native Banner
};

/**
 * 1. Floating Ad (Social Bar)
 * ditaruh sekali saja di Layout atau Footer.
 */
export function FloatingAd() {
    return (
        <Adsterra
            adKey={KEYS.SOCIAL_BAR}
            adType="social-bar"
        />
    );
}

/**
 * 2. Banner Besar (Horizontal)
 * Cocok untuk Header atau di atas konten utama.
 * Hanya muncul di Desktop.
 */
export function BannerAd({ className = '' }: { className?: string }) {
    return (
        <div className={`hidden md:block ${className}`}>
            <AdsterraBanner
                size="728x90"
                adKey={KEYS.BANNER_728}
            />
        </div>
    );
}

/**
 * 3. Banner Kotak (Rectangle)
 * Cocok untuk di dalam Grid Manhwa atau Sidebar.
 * Cocok untuk Mobile.
 */
export function RectangleAd({ className = '' }: { className?: string }) {
    return (
        <AdsterraBanner
            size="300x250"
            adKey={KEYS.BANNER_300}
            className={className}
        />
    );
}

/**
 * 4. Responsive Ad
 * Menampilkan 728x90 di Desktop dan 300x250 di Mobile.
 */
export function ResponsiveAd({ className = '' }: { className?: string }) {
    return (
        <div className={className}>
            {/* Mobile View */}
            <div className="block md:hidden">
                <AdsterraBanner size="300x250" adKey={KEYS.BANNER_300} />
            </div>
            {/* Desktop View */}
            <div className="hidden md:block">
                <AdsterraBanner size="728x90" adKey={KEYS.BANNER_728} />
            </div>
        </div>
    );
}

/**
 * 5. Native Ad
 * Iklan yang rekomendasi konten.
 */
export function NativeBannerAd({ className = '' }: { className?: string }) {
    return (
        <Adsterra
            adKey={KEYS.NATIVE}
            adType="banner" // Native di Adsterra biasanya script src biasa, bukan iframe
            className={className}
            style={{ minHeight: '200px', width: '100%' }}
        />
    );
}