import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import SnowEffect from "@/components/ui/SnowEffect";
import { WebsiteJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ManhwaKu - Baca Manhwa Subtile Indonesia Online Gratis Terlengkap",
    template: "%s | ManhwaKu",
  },
  description: "Baca manhwa online gratis terlengkap dengan update chapter terbaru setiap hari. Koleksi manhwa action, romance, fantasy, dan genre lainnya.",
  keywords: [
    "manhwa",
    "baca manhwa",
    "manhwa online",
    "manhwa gratis",
    "manhwa indonesia",
    "komik korea",
    "webtoon",
    "manhwa terbaru",
    "baca komik online",
    "komikcast",
    "komiku",
    "komikindo",
    "komikid",
    "manhwaindo",
    "kiryuu",
    "shinigami",
  ],
  authors: [{ name: "ManhwaKu" }],
  creator: "ManhwaKu",
  publisher: "ManhwaKu",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.manhwaku.biz.id"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    title: "ManhwaKu - Baca Manhwa Subtile Indonesia Online Gratis Terlengkap",
    description: "Baca manhwa online gratis terlengkap dengan update chapter terbaru setiap hari.",
    siteName: "ManhwaKu",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ManhwaKu - Baca Manhwa Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ManhwaKu - Baca Manhwa Subtile Indonesia Online Gratis Terlengkap",
    description: "Baca manhwa online gratis terlengkap dengan update chapter terbaru setiap hari.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "8Gs5Kg6Lk4O_FUqCcK0lzf4jkX8Kh7owXC7uh_ko2a0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* Monetag Verification Meta Tag */}
        <meta name="monetag" content="92d3f15e8778cc11dee26360b46235c1" />



        {/* Structured Data untuk SEO - Website Schema */}
        <WebsiteJsonLd
          name="ManhwaKu"
          url="https://www.manhwaku.biz.id"
          searchUrl="https://www.manhwaku.biz.id/?search={search_term_string}"
        />
        {/* Structured Data untuk SEO - Organization Schema */}
        <OrganizationJsonLd
          name="ManhwaKu"
          url="https://www.manhwaku.biz.id"
          logo="https://www.manhwaku.biz.id/icon.png"
          description="Baca manhwa online gratis terlengkap dengan update chapter terbaru setiap hari. Koleksi manhwa action, romance, fantasy, dan genre lainnya."
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        {/* Google tag (gtag.js) */}
        <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-HYLTNXFC1F" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-HYLTNXFC1F');
          `}
        </Script>

        {/* Monetag Service Worker Registration (untuk Social Bar / Smart Link) */}
        <Script id="monetag-sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js')
                .then(function(reg) {
                  console.log('Monetag SW registered');
                })
                .catch(function(err) {
                  console.log('Monetag SW registration failed:', err);
                });
            }
          `}
        </Script>

        {/* Monetag OnClick / Popunder (Zone: 10602561) */}
        {/* <Script id="monetag-onclick" strategy="afterInteractive">
          {`
            (function(s){
              s.dataset.zone='10602561';
              s.src='https://al5sm.com/tag.min.js';
            })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));
          `}
        </Script> */}

        {/* Monetag Vignette (Zone: 10602569) */}
        <Script id="monetag-vignette" strategy="afterInteractive">
          {`
            (function(s){
              s.dataset.zone = '10602569';
              s.src = 'https://gizokraijaw.net/vignette.min.js';
            })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))
          `}
        </Script>



        {/* Efek Salju */}
        {/* <SnowEffect /> */}

        {children}
      </body>
    </html>
  );
}