"use client";

import { useState } from "react";

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
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
            <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-blue-700 p-6 text-white">
                    <h1 className="text-3xl font-bold">📚 Manhwa API Docs</h1>
                    <p className="opacity-90 mt-2">Dokumentasi resmi untuk mengakses data Manhwa dari Supabase Storage.</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b">
                    <button
                        onClick={() => handleTabChange("list")}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "list" ? "border-b-4 border-blue-600 text-blue-700 bg-blue-50" : "text-gray-500 hover:text-blue-500"}`}
                    >
                        📂 Get All Manhwa
                    </button>
                    <button
                        onClick={() => handleTabChange("single")}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "single" ? "border-b-4 border-blue-600 text-blue-700 bg-blue-50" : "text-gray-500 hover:text-blue-500"}`}
                    >
                        📖 Get Single Manhwa
                    </button>
                </div>

                <div className="p-6">
                    {/* KONTEN DOKUMENTASI BERDASARKAN TAB */}
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold border-b pb-2 mb-4">Endpoint Details</h2>

                        {activeTab === "list" ? (
                            /* DOKUMENTASI ALL MANHWA */
                            <div>
                                <div className="bg-gray-100 p-4 rounded-md font-mono text-sm mb-4 flex items-center">
                                    <span className="bg-green-600 text-white px-2 py-1 rounded mr-3 font-bold">GET</span>
                                    <span>/api/all-manhwa</span>
                                </div>
                                <p className="text-gray-600 mb-4">
                                    Mengambil file <code>all-manhwa-metadata.json</code> yang berisi daftar ringkas semua komik yang tersedia.
                                </p>
                                <p className="text-sm text-gray-500">Tidak memerlukan parameter.</p>
                            </div>
                        ) : (
                            /* DOKUMENTASI SINGLE MANHWA */
                            <div>
                                <div className="bg-gray-100 p-4 rounded-md font-mono text-sm mb-4 flex items-center">
                                    <span className="bg-green-600 text-white px-2 py-1 rounded mr-3 font-bold">GET</span>
                                    <span className="break-all">
                                        /api/manhwa/<span className="text-blue-600">{"{slug}"}</span>?type=<span className="text-blue-600">{"{type}"}</span>
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-4">Mengambil detail metadata atau daftar chapter untuk satu judul komik tertentu.</p>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-gray-100 border-b">
                                                <th className="p-2 border">Name</th>
                                                <th className="p-2 border">In</th>
                                                <th className="p-2 border">Required</th>
                                                <th className="p-2 border">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="p-2 font-mono text-blue-600">slug</td>
                                                <td className="p-2">URL</td>
                                                <td className="p-2 text-red-500 font-bold">Yes</td>
                                                <td className="p-2">
                                                    Judul folder komik (contoh: <code>a-bad-person</code>)
                                                </td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2 font-mono text-blue-600">type</td>
                                                <td className="p-2">Query</td>
                                                <td className="p-2 text-gray-500">No</td>
                                                <td className="p-2">
                                                    <code>metadata</code> (default) atau <code>chapters</code>.
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* API PLAYGROUND */}
                    <section className="bg-slate-50 border rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center gap-2">
                            ⚡ API Playground
                            <span className="text-xs font-normal text-gray-500 bg-white px-2 py-1 rounded border">Mode: {activeTab === "list" ? "All Manhwa" : "Single Manhwa"}</span>
                        </h2>

                        {/* INPUT FIELD (Hanya muncul jika tab Single Manhwa) */}
                        {activeTab === "single" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Manhwa Slug</label>
                                    <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. a-bad-person" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">File Type</label>
                                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
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
                        <div className="mt-6">
                            <h3 className="text-sm font-bold text-gray-500 mb-2">Response JSON:</h3>

                            {error && (
                                <div className="bg-red-100 text-red-700 p-4 rounded border border-red-200 text-sm">
                                    ❌ <strong>Error:</strong> {error}
                                </div>
                            )}

                            {result && !error && (
                                <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono shadow-inner">
                                    <pre>{JSON.stringify(result, null, 2)}</pre>
                                </div>
                            )}

                            {!result && !error && !loading && <div className="text-gray-400 italic text-sm border border-dashed p-8 rounded text-center bg-white">Klik tombol Test untuk melihat data.</div>}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
