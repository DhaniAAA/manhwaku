import MonetagBanner from './MonetagBanner';
import MonetagInPage from './MonetagInPage';

// --- ZONE ID MONETAG (GANTI DENGAN ZONE ID DARI DASHBOARD MONETAG) ---
// Dapatkan Zone ID dari: https://publishers.monetag.com/
// Buat zone baru untuk setiap format iklan yang diinginkan
const ZONES = {
    // Banner Ads - Buat zone "Display Banner" di Monetag dashboard
    BANNER_DESKTOP: 0,    // TODO: Ganti dengan Zone ID asli untuk banner desktop
    BANNER_MOBILE: 0,     // TODO: Ganti dengan Zone ID asli untuk banner mobile

    // In-Page Push / Vignette - Format iklan overlay
    IN_PAGE_PUSH: 0,      // TODO: Ganti dengan Zone ID asli untuk in-page push

    // Social Bar / Smart Link (diload via sw.js)
    SOCIAL_BAR: 10602470, // Sudah ada di sw.js
};

/**
 * 1. Banner Besar (Desktop Only)
 * Cocok untuk Header atau di atas konten utama.
 */
export function BannerAd({ className = '' }: { className?: string }) {
    if (!ZONES.BANNER_DESKTOP) return null;
    return (
        <div className={`hidden md:block ${className}`}>
            <MonetagBanner zoneId={ZONES.BANNER_DESKTOP} />
        </div>
    );
}

/**
 * 2. Responsive Banner Ad
 * Menampilkan banner yang sesuai untuk Desktop dan Mobile.
 */
export function ResponsiveAd({ className = '' }: { className?: string }) {
    // Jika belum ada zone ID, tampilkan placeholder
    if (!ZONES.BANNER_DESKTOP && !ZONES.BANNER_MOBILE) {
        return (
            <div className={`w-full flex justify-center ${className}`}>
                <div className="w-full max-w-[728px] h-[90px] md:h-[90px] bg-neutral-900/50 rounded-lg border border-dashed border-neutral-800 flex items-center justify-center text-gray-600 text-xs">
                    Monetag Ad Zone (Belum dikonfigurasi)
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full flex justify-center ${className}`}>
            {/* Mobile Banner */}
            {ZONES.BANNER_MOBILE > 0 && (
                <div className="block md:hidden w-full">
                    <MonetagBanner zoneId={ZONES.BANNER_MOBILE} />
                </div>
            )}

            {/* Desktop Banner */}
            {ZONES.BANNER_DESKTOP > 0 && (
                <div className="hidden md:block w-full">
                    <MonetagBanner zoneId={ZONES.BANNER_DESKTOP} />
                </div>
            )}
        </div>
    );
}

/**
 * 3. In-Page Push Ad
 * Iklan overlay/vignette yang muncul di halaman.
 * Tidak perlu container visual, script akan menampilkan iklan sendiri.
 */
export function FloatingAd({ className = '' }: { className?: string }) {
    if (!ZONES.IN_PAGE_PUSH) return null;
    return <MonetagInPage zoneId={ZONES.IN_PAGE_PUSH} className={className} />;
}