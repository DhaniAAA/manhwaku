"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface LogEntry {
    message: string;
    time: string;
}

function ScrapePageInner() {
    const searchParams = useSearchParams();
    const [url, setUrl] = useState(searchParams.get("url") ?? "");
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const addLog = (message: string) => {
        setLogs((prev) => [...prev, { message, time: new Date().toLocaleTimeString("id-ID") }]);
    };

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setLoading(true);
        setDone(false);
        setLogs([]);
        addLog(`🚀 Memulai scraping: ${url}`);

        try {
            const response = await fetch("/api/admin/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { done: streamDone, value } = await reader.read();
                if (streamDone) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop() ?? "";

                for (const part of parts) {
                    if (part.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(part.slice(6));
                            if (data.message) addLog(data.message);
                            if (data.success) {
                                addLog("✅ Scraping selesai!");
                                setDone(true);
                            }
                            if (data.error) {
                                addLog(`❌ Error: ${data.error}`);
                            }
                        } catch { }
                    }
                }
            }
        } catch (err: any) {
            addLog(`❌ Connection error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getLogColor = (msg: string) => {
        if (msg.startsWith("✅") || msg.startsWith("✓")) return "text-emerald-400";
        if (msg.startsWith("❌")) return "text-red-400";
        if (msg.startsWith("⚠️")) return "text-amber-400";
        if (msg.startsWith("⚙️")) return "text-indigo-400";
        if (msg.startsWith("🚀")) return "text-blue-400";
        return "text-neutral-300";
    };

    return (
        <div className="p-8 text-gray-200 max-w-5xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-3">
                    <Link href="/admin" className="hover:text-neutral-300 transition-colors">Dashboard</Link>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-neutral-300">Scrape Komik</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Scrape Komik</h1>
                <p className="text-neutral-500 mt-1 text-sm">Ambil chapter terbaru dari komikindo & upload ke Supabase secara otomatis</p>
            </div>

            {/* URL Form */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6">
                <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4">Target URL</h2>
                <form onSubmit={handleScrape} className="flex gap-3">
                    <div className="flex-1 relative">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <input
                            type="url"
                            placeholder="https://komikindo.ch/komik/judul-komik/"
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-600"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center gap-2 shrink-0 ${loading
                                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/25 cursor-pointer"
                            }`}
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Berjalan...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Mulai Scrape
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Info Hint */}
            {done && (
                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="text-emerald-400 font-semibold text-sm">Scraping berhasil!</p>
                        <p className="text-emerald-600 text-xs mt-0.5">Data chapter & metadata telah di-upload ke Supabase. all-manhwa-metadata.json juga sudah diperbarui.</p>
                    </div>
                    <Link
                        href="/admin"
                        className="ml-auto text-xs bg-emerald-700/30 text-emerald-400 border border-emerald-700/30 px-3 py-1.5 rounded-lg hover:bg-emerald-700/50 transition-colors shrink-0"
                    >
                        Lihat Dashboard
                    </Link>
                </div>
            )}

            {/* Terminal */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col" style={{ height: "460px" }}>
                {/* Title bar */}
                <div className="bg-neutral-900 px-4 py-2.5 border-b border-neutral-800 flex items-center gap-3 shrink-0">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs text-neutral-500 font-mono ml-1">scraper — output</span>
                    {loading && (
                        <span className="ml-auto text-[10px] text-blue-400 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            RUNNING
                        </span>
                    )}
                    {done && !loading && (
                        <span className="ml-auto text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            DONE
                        </span>
                    )}
                </div>

                {/* Logs */}
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1">
                    {logs.length === 0 ? (
                        <p className="text-neutral-600 mt-4 text-center">Masukkan URL komik dan tekan "Mulai Scrape"...</p>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className={`flex items-start gap-2 ${getLogColor(log.message)}`}>
                                <span className="text-neutral-600 shrink-0 tabular-nums w-20">[{log.time}]</span>
                                <span>{log.message}</span>
                            </div>
                        ))
                    )}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Usage tips */}
            <div className="mt-6 bg-neutral-900/50 border border-neutral-800/60 rounded-xl p-5">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Panduan Penggunaan</p>
                <ul className="space-y-1.5 text-xs text-neutral-500">
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span> Salin URL halaman detail komik dari komikindo.ch (misal: <span className="font-mono text-neutral-400">https://komikindo.ch/komik/solo-leveling/</span>)</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span> Klik tombol <b className="text-neutral-300">Mulai Scrape</b> dan tunggu prosesnya selesai — log akan tampil secara real-time</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span> Chapter yang sudah ada di Supabase akan otomatis di-skip, hanya chapter baru yang akan di-scrape</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span> Setelah selesai, <span className="font-mono text-neutral-400">all-manhwa-metadata.json</span> akan langsung diperbarui dan live di website</li>
                </ul>
            </div>
        </div>
    );
}

export default function ScrapePage() {
    return (
        <Suspense>
            <ScrapePageInner />
        </Suspense>
    );
}
