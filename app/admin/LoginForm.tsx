"use client";

import Link from "next/link";
import { useState } from "react";
import { verifyAdminPin } from "./actions";
import { useRouter } from "next/navigation";

export default function LoginForm() {
    const [accessCode, setAccessCode] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await verifyAdminPin(accessCode);
            if (res.success) {
                // Berhasil login, refresh untuk merender layout utama
                router.refresh();
            } else {
                setError(res.error || "Kode akses salah!");
            }
        } catch (err) {
            setError("Terjadi kesalahan sistem");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Admin Panel Access</h2>
                    <p className="text-sm text-neutral-400 mt-1">Menggunakan proteksi server-side</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            placeholder="Kode Akses..."
                            className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-50"
                            autoFocus
                            disabled={isLoading}
                        />
                        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-4 py-3 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? "Memverifikasi..." : "Masuk"}
                        {!isLoading && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
                        &larr; Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}
