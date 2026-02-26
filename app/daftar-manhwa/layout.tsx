import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Daftar Manhwa - ManhwaKu',
    description: 'Jelajahi koleksi daftar manhwa, manhua, dan manga lengkap Bahasa Indonesia terbaru dan terupdate di ManhwaKu.',
    alternates: {
        canonical: '/daftar-manhwa',
    },
    openGraph: {
        title: 'Daftar Manhwa - ManhwaKu',
        description: 'Jelajahi koleksi daftar manhwa, manhua, dan manga lengkap Bahasa Indonesia terbaru dan terupdate di ManhwaKu.',
        url: '/daftar-manhwa',
    },
};

export default function DaftarManhwaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
