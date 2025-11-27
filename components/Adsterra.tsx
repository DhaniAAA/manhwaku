'use client';

import { useEffect } from 'react';

interface AdsterraProps {
    adKey: string;
    adType?: 'banner' | 'native' | 'popunder' | 'social-bar';
    style?: React.CSSProperties;
    className?: string;
}

/**
 * Adsterra Ad Component
 *
 * @param adKey - Your Adsterra ad key (e.g., "65679c1ac45211d8dfb1ac2bf487ebbe")
 * @param adType - Ad type (default: "banner")
 * @param style - Custom inline styles
 * @param className - Custom CSS classes
 */
export default function Adsterra({
    adKey,
    adType = 'banner',
    style,
    className = '',
}: AdsterraProps) {
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                // Load Adsterra script dynamically
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = `//pl28143032.effectivegatecpm.com/65/67/9c/${adKey}.js`;
                script.async = true;

                const container = document.getElementById(`adsterra-${adKey}`);
                if (container && !container.querySelector('script')) {
                    container.appendChild(script);
                }
            }
        } catch (error) {
            console.error('Adsterra error:', error);
        }
    }, [adKey]);

    return (
        <div
            id={`adsterra-${adKey}`}
            className={`adsterra-container ${className}`}
            style={style}
        >
            {/* Adsterra ad will be injected here */}
        </div>
    );
}
