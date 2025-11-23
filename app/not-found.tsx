export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-lg mt-2">Halaman yang kamu cari tidak ditemukan.</p>
            <a
                href="/"
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
                Kembali ke Beranda
            </a>
        </div>
    );
}
