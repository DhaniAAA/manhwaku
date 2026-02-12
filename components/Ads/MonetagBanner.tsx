'use client';

import { useEffect, useRef } from 'react';

interface MonetagBannerProps {
    /**
     * Zone ID dari Monetag dashboard
     */
    zoneId: number;
    /**
     * Tipe format iklan
     */
    format?: 'banner' | 'native';
    className?: string;
}

/**
 * Monetag Banner Ad Component
 * Menampilkan iklan banner/native dari Monetag
 */
export default function MonetagBanner({ zoneId, format = 'banner', className = '' }: MonetagBannerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptLoadedRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current || scriptLoadedRef.current) return;

        try {
            // Bersihkan konten lama
            containerRef.current.innerHTML = '';

            // Buat script container
            const script = document.createElement('script');
            script.async = true;
            script.setAttribute('data-cfasync', 'false');
            script.src = `//pl${zoneId}.profitablegatecpm.com/${zoneId}.js`;

            containerRef.current.appendChild(script);
            scriptLoadedRef.current = true;
        } catch (error) {
            console.error('Monetag banner error:', error);
        }

        return () => {
            scriptLoadedRef.current = false;
        };
    }, [zoneId]);

    return (
        <div
            className={`monetag-banner flex justify-center items-center overflow-hidden my-2 ${className}`}
            ref={containerRef}
        />
    );
}
