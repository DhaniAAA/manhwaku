'use client';

import { useEffect, useRef } from 'react';

interface MonetagInPageProps {
    /**
     * Zone ID dari Monetag dashboard untuk In-Page Push atau Vignette
     */
    zoneId: number;
    className?: string;
}

/**
 * Monetag In-Page Push / Vignette Component
 * Iklan interstitial/overlay yang muncul saat user berinteraksi
 */
export default function MonetagInPage({ zoneId, className = '' }: MonetagInPageProps) {
    const scriptLoadedRef = useRef(false);

    useEffect(() => {
        if (scriptLoadedRef.current) return;

        try {
            const script = document.createElement('script');
            script.async = true;
            script.setAttribute('data-cfasync', 'false');
            script.src = `//pl${zoneId}.profitablegatecpm.com/${zoneId}.js`;
            document.head.appendChild(script);
            scriptLoadedRef.current = true;
        } catch (error) {
            console.error('Monetag in-page error:', error);
        }

        return () => {
            scriptLoadedRef.current = false;
        };
    }, [zoneId]);

    return <div className={className} />;
}
