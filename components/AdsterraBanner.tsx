'use client';

import { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
    /**
     * Ukuran Banner: "728x90", "300x250", "320x50", "468x60", "160x600"
     */
    size: string;
    /**
     * Key dari Adsterra (String panjang 32 karakter)
     */
    adKey: string;
    className?: string;
}

export default function AdsterraBanner({ size, adKey, className = '' }: AdsterraBannerProps) {
    const bannerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const [width, height] = size.split('x').map(Number);

        if (bannerRef.current && adKey) {
            // Bersihkan konten lama agar tidak duplikat saat re-render
            bannerRef.current.innerHTML = '';

            // Buat elemen konfigurasi script
            const confScript = document.createElement('script');
            confScript.type = 'text/javascript';
            confScript.innerHTML = `
                atOptions = {
                    'key' : '${adKey}',
                    'format' : 'iframe',
                    'height' : ${height},
                    'width' : ${width},
                    'params' : {}
                };
            `;

            // Buat elemen pemanggil script invoke.js
            const invokeScript = document.createElement('script');
            invokeScript.type = 'text/javascript';
            invokeScript.src = `//www.highperformanceformat.com/${adKey}/invoke.js`;

            // Masukkan ke dalam container
            bannerRef.current.appendChild(confScript);
            bannerRef.current.appendChild(invokeScript);
        }
    }, [adKey, size]);

    return (
        <div
            className={`flex justify-center items-center overflow-hidden my-4 ${className}`}
            style={{ minHeight: size.split('x')[1] + 'px' }}
        >
            <div ref={bannerRef} />
        </div>
    );
}