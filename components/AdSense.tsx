'use client';

import { useEffect } from 'react';

interface AdSenseProps {
    adSlot: string;
    adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
    fullWidthResponsive?: boolean;
    style?: React.CSSProperties;
    className?: string;
}

declare global {
    interface Window {
        adsbygoogle: unknown[];
    }
}

/**
 * Google AdSense Component
 *
 * @param adSlot - Your AdSense ad slot ID (e.g., "1234567890")
 * @param adFormat - Ad format type (default: "auto")
 * @param fullWidthResponsive - Enable full width responsive ads (default: true)
 * @param style - Custom inline styles
 * @param className - Custom CSS classes
 */
export default function AdSense({
    adSlot,
    adFormat = 'auto',
    fullWidthResponsive = true,
    style,
    className = '',
}: AdSenseProps) {
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (error) {
            console.error('AdSense error:', error);
        }
    }, []);

    const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

    if (!clientId) {
        console.warn('NEXT_PUBLIC_ADSENSE_CLIENT_ID is not set in environment variables');
        return null;
    }

    return (
        <div className={`adsense-container ${className}`} style={style}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block', ...style }}
                data-ad-client={clientId}
                data-ad-slot={adSlot}
                data-ad-format={adFormat}
                data-full-width-responsive={fullWidthResponsive.toString()}
            />
        </div>
    );
}
