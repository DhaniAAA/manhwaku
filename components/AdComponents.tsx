import AdsterraBanner from './AdsterraBanner';
import Adsterra from './Adsterra';
// --- KEY IKLAN (GANTI DENGAN KEY ASLI DARI DASHBOARD ADSTERRA) ---
const KEYS = {
    BANNER_728: "2b9a10a1176b4933d587c8973a6b7ceb", // Banner 728x90
    BANNER_300: "f94af59154f1ae4d546801e871fcc67e", // Banner 300x250
    SOCIAL_BAR: "65679c1ac45211d8dfb1ac2bf487ebbe",
};

/**
 * 1. Banner Besar (Horizontal 728x90)
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
 * 2. Responsive Banner Ad
 * Menampilkan 728x90 di Desktop dan 300x250 di Mobile.
 */
export function ResponsiveAd({ className = '' }: { className?: string }) {
    return (
        <div className={`w-full flex justify-center ${className}`}>
            {/* Tampilan Mobile: Pakai Iklan Kotak 300x250 */}
            <div className="block md:hidden">
                <AdsterraBanner size="300x250" adKey={KEYS.BANNER_300} />
            </div>

            {/* Tampilan Desktop: Jika belum ada key 728x90, pakai 300x250 */}
            <div className="hidden md:block">
                {KEYS.BANNER_728 ? (
                    <AdsterraBanner size="728x90" adKey={KEYS.BANNER_728} />
                ) : (
                    <AdsterraBanner size="300x250" adKey={KEYS.BANNER_300} />
                )}
            </div>
        </div>
    );
}

/**
 * 3. Floating Ad
 * Iklan yang tetap terlihat saat user meng-scroll.
 */
export function FloatingAd({ className = '' }: { className?: string }) {
    return (
        <div className={className}>
            <Adsterra adKey={KEYS.SOCIAL_BAR} />
        </div>
    );
}