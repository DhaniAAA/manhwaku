import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Jelajahi Manhwa - ManhwaKu',
    description: 'Cari dan filter manhwa, manhua, dan manga favorit Anda berdasarkan genre, status, dan rating di ManhwaKu.',
    alternates: {
        canonical: '/jelajahi',
    },
    openGraph: {
        title: 'Jelajahi Manhwa - ManhwaKu',
        description: 'Cari dan filter manhwa, manhua, dan manga favorit Anda berdasarkan genre, status, dan rating di ManhwaKu.',
        url: '/jelajahi',
    },
};

export default function JelajahiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
