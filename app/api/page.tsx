"use client";

import { useState } from "react";
import Link from "next/link";

export default function ApiDocs() {
    // State untuk Tab Navigasi
    const [activeTab, setActiveTab] = useState<"list" | "single">("list");

    // State untuk Playground
    const [slug, setSlug] = useState("a-bad-person");
    const [type, setType] = useState("metadata");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fungsi untuk mengetes API
    const testApi = async () => {
        setLoading(true);
        setError("");
        setResult(null);

        try {
            let url = "";

            // Tentukan URL berdasarkan Tab yang aktif
            if (activeTab === "list") {
                url = "/api/all_manhwa";
            } else {
                url = `/api/manhwa/${slug}?type=${type}`;
            }

            const res = await fetch(url);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `Error ${res.status}`);
            }

            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Reset hasil jika tab berubah
    const handleTabChange = (tab: "list" | "single") => {
        setActiveTab(tab);
        setResult(null);
        setError("");
    };

    return (
        <div className="min-h-screen bg-neutral-950 p-8 font-sans text-gray-200">
            <div className="max-w-5xl mx-auto bg-neutral-900 shadow-lg rounded-lg overflow-hidden border border-neutral-800">
                {/* Header */}
                <div className="bg-blue-900/40 p-6 text-white border-b border-blue-900/50 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">📚 Manhwa API Docs</h1>
                        <p className="opacity-90 mt-2 text-gray-300">Dokumentasi resmi untuk mengakses data Manhwa dari Supabase Storage.</p>
                    </div>
                    <Link href="/" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        ← Kembali ke Home
                    </Link>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-neutral-800">
                    <button
                        onClick={() => handleTabChange("list")}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "list" ? "border-b-4 border-blue-600 text-blue-400 bg-blue-900/10" : "text-gray-400 hover:text-blue-400"}`}
                    >
                        📂 Get All Manhwa
                    </button>
                    <button
                        onClick={() => handleTabChange("single")}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "single" ? "border-b-4 border-blue-600 text-blue-400 bg-blue-900/10" : "text-gray-400 hover:text-blue-400"}`}
                    >
                        📖 Get Single Manhwa
                    </button>
                </div>

                <div className="p-6">
                    {/* KONTEN DOKUMENTASI BERDASARKAN TAB */}
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold border-b border-neutral-700 pb-2 mb-4 text-white">Endpoint Details</h2>

                        {activeTab === "list" ? (
                            /* DOKUMENTASI ALL MANHWA */
                            <div>
                                <div className="bg-neutral-800 p-4 rounded-md font-mono text-sm mb-4 flex items-center justify-between group">
                                    <div className="flex items-center overflow-hidden">
                                        <span className="bg-green-700 text-white px-2 py-1 rounded mr-3 font-bold shrink-0">GET</span>
                                        <span className="truncate text-gray-300">https://www.manhwaku.biz.id/api/all_manhwa</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText("https://www.manhwaku.biz.id/api/all_manhwa");
                                            alert("URL Copied!");
                                        }}
                                        className="ml-4 p-2 text-gray-400 hover:text-blue-400 hover:bg-neutral-700 rounded transition-colors"
                                        title="Copy URL"
                                    >
                                        📋
                                    </button>
                                </div>
                                <p className="text-gray-400 mb-4">
                                    Mengambil file <code className="bg-neutral-800 px-1 py-0.5 rounded text-gray-300">all-manhwa-metadata.json</code> yang berisi daftar ringkas semua komik yang tersedia. Gunakan untuk di halaman Utama kalina sepaya tidak Lag ketika pertama kali Load.
                                </p>
                                <p className="text-sm text-gray-500">Tidak memerlukan parameter.</p>
                            </div>
                        ) : (
                            /* DOKUMENTASI SINGLE MANHWA */
                            <div>
                                <div className="bg-neutral-800 p-4 rounded-md font-mono text-sm mb-4 flex items-center justify-between group">
                                    <div className="flex items-center overflow-hidden">
                                        <span className="bg-green-700 text-white px-2 py-1 rounded mr-3 font-bold shrink-0">GET</span>
                                        <span className="truncate text-gray-300">
                                            https://www.manhwaku.biz.id/api/manhwa/<span className="text-blue-400">{"{slug}"}</span>?type=<span className="text-blue-400">{"{type}"}</span>
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText("https://www.manhwaku.biz.id/api/manhwa/{slug}?type={type}");
                                            alert("URL Copied!");
                                        }}
                                        className="ml-4 p-2 text-gray-400 hover:text-blue-400 hover:bg-neutral-700 rounded transition-colors"
                                        title="Copy URL"
                                    >
                                        📋
                                    </button>
                                </div>
                                <p className="text-gray-400 mb-4">Mengambil detail metadata atau daftar chapter untuk satu judul komik tertentu. Ganti <code className="bg-neutral-800 px-1 py-0.5 rounded text-gray-300">Slug</code> dengan judul manhwa/komik berdasarkan Slug dari API <b>all_manhwa</b>. Untuk Type ganti dengan Type atau chapters.</p>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-neutral-800 border-b border-neutral-700">
                                                <th className="p-2 border border-neutral-700 text-gray-300">Name</th>
                                                <th className="p-2 border border-neutral-700 text-gray-300">In</th>
                                                <th className="p-2 border border-neutral-700 text-gray-300">Required</th>
                                                <th className="p-2 border border-neutral-700 text-gray-300">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-neutral-800">
                                                <td className="p-2 font-mono text-blue-400 border border-neutral-800">slug</td>
                                                <td className="p-2 border border-neutral-800 text-gray-400">URL</td>
                                                <td className="p-2 text-red-500 font-bold border border-neutral-800">Yes</td>
                                                <td className="p-2 border border-neutral-800 text-gray-400">
                                                    Judul folder komik (contoh: <code className="bg-neutral-800 px-1 py-0.5 rounded">a-bad-person</code>)
                                                </td>
                                            </tr>
                                            <tr className="border-b border-neutral-800">
                                                <td className="p-2 font-mono text-blue-400 border border-neutral-800">type</td>
                                                <td className="p-2 border border-neutral-800 text-gray-400">Query</td>
                                                <td className="p-2 text-gray-500 border border-neutral-800">No</td>
                                                <td className="p-2 border border-neutral-800 text-gray-400">
                                                    <code className="bg-neutral-800 px-1 py-0.5 rounded">metadata</code> (default) atau <code className="bg-neutral-800 px-1 py-0.5 rounded">chapters</code>.
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* API PLAYGROUND */}
                    <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-blue-400 flex items-center gap-2">
                            ⚡ API Playground
                            <span className="text-xs font-normal text-gray-400 bg-neutral-800 px-2 py-1 rounded border border-neutral-700">Mode: {activeTab === "list" ? "All Manhwa" : "Single Manhwa"}</span>
                        </h2>

                        {/* INPUT FIELD (Hanya muncul jika tab Single Manhwa) */}
                        {activeTab === "single" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-300">Manhwa Slug</label>
                                    <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border border-neutral-700 bg-neutral-800 text-gray-200 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. a-bad-person" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-300">File Type</label>
                                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-neutral-700 bg-neutral-800 text-gray-200 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="metadata">Metadata</option>
                                        <option value="chapters">Chapters</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* TOMBOL TEST */}
                        <button onClick={testApi} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:bg-blue-300 w-full md:w-auto">
                            {loading ? "Mengambil Data..." : `Test ${activeTab === "list" ? "All Manhwa" : "Single"} API`}
                        </button>

                        {/* HASIL JSON */}
                        <div className="mt-6 relative">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-gray-400">Response JSON:</h3>
                                {result && !error && (
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                                            alert("JSON Berhasil di Copy!");
                                        }}
                                        className="text-xs bg-neutral-800 hover:bg-neutral-700 text-gray-300 px-2 py-1 rounded transition-colors"
                                    >
                                        📋 Copy JSON
                                    </button>
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-900/20 text-red-500 p-4 rounded border border-red-900/50 text-sm">
                                    ❌ <strong>Error:</strong> {error}
                                </div>
                            )}

                            {result && !error && (
                                <div className="bg-black text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono shadow-inner border border-neutral-800">
                                    <pre>{JSON.stringify(result, null, 2)}</pre>
                                </div>
                            )}

                            {!result && !error && !loading && <div className="text-gray-500 italic text-sm border border-dashed border-neutral-700 p-8 rounded text-center bg-neutral-800/50">Klik tombol Test untuk melihat data.</div>}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
