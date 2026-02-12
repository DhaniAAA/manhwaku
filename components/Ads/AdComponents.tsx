import AdsterraBanner from './AdsterraBanner';

// --- KEY IKLAN ADSTERRA (untuk Banner) ---
const ADSTERRA_KEYS = {
    BANNER_728: "2b9a10a1176b4933d587c8973a6b7ceb", // Banner 728x90 (Desktop)
    BANNER_300: "f94af59154f1ae4d546801e871fcc67e", // Banner 300x250 (Mobile)
};

/**
 * 1. Banner Besar (Desktop Only - 728x90)
 * Cocok untuk Header atau di atas konten utama.
 */
export function BannerAd({ className = '' }: { className?: string }) {
    return (
        <div className={`hidden md:block ${className}`}>
            <AdsterraBanner size="728x90" adKey={ADSTERRA_KEYS.BANNER_728} />
        </div>
    );
}

/**
 * 2. Responsive Banner Ad
 * Menampilkan 728x90 di Desktop dan 300x250 di Mobile.
 * Menggunakan Adsterra Banner.
 */
export function ResponsiveAd({ className = '' }: { className?: string }) {
    return (
        <div className={`w-full flex justify-center ${className}`}>
            {/* Mobile: Banner 300x250 */}
            <div className="block md:hidden">
                <AdsterraBanner size="300x250" adKey={ADSTERRA_KEYS.BANNER_300} />
            </div>

            {/* Desktop: Banner 728x90 */}
            <div className="hidden md:block">
                <AdsterraBanner size="728x90" adKey={ADSTERRA_KEYS.BANNER_728} />
            </div>
        </div>
    );
}

/**
 * 3. Floating Ad
 * Monetag OnClick & Vignette sudah di-handle via layout.tsx.
 * Komponen ini return null.
 */
export function FloatingAd({ className = '' }: { className?: string }) {
    return null;
}