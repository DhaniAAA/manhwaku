import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

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
    default: "ManhwaKu - Baca Manhwa Online Gratis Terlengkap",
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    title: "ManhwaKu - Baca Manhwa Online Gratis Terlengkap",
    description: "Baca manhwa online gratis terlengkap dengan update chapter terbaru setiap hari.",
    siteName: "ManhwaKu",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ManhwaKu - Baca Manhwa Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ManhwaKu - Baca Manhwa Online Gratis Terlengkap",
    description: "Baca manhwa online gratis terlengkap dengan update chapter terbaru setiap hari.",
    images: ["/og-image.jpg"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        {/* Google Tag Manager (Script) */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PQC88CCW');
          `}
        </Script>

        {/* Adsterra Ad Script */}
        <Script
          id="adsterra-social-bar"
          type="text/javascript"
          src="https://pl28143032.effectivegatecpm.com/65/67/9c/65679c1ac45211d8dfb1ac2bf487ebbe.js"
          strategy="afterInteractive"
        />

        {/* Google Tag Manager (NoScript) - Wajib di Body */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PQC88CCW"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {children}
      </body>
    </html>
  );
}