"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────
interface ComicEntry {
    title: string;
    link: string;
    slug: string;
    image: string;
    type: string;
    inSupabase: boolean;
    totalChapters: number;
    lastUpdated: string | null;
    latestChapter: string | null;
}
interface ListResponse {
    total: number;
    synced: number;
    notSynced: number;
    comics: ComicEntry[];
}
interface LogEntry {
    message: string;
    time: string;
}

const PAGE_SIZE = 25;

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "baru saja";
    if (mins < 60) return `${mins} mnt lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 30) return `${days} hari lalu`;
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getLogColor(msg: string) {
    if (msg.startsWith("✅") || msg.startsWith("✓")) return "text-emerald-400";
    if (msg.startsWith("❌")) return "text-red-400";
    if (msg.startsWith("⚠️")) return "text-amber-400";
    if (msg.startsWith("⚙️")) return "text-indigo-400";
    if (msg.startsWith("🚀") || msg.startsWith("🌐") || msg.startsWith("📂") || msg.startsWith("📝")) return "text-blue-400";
    if (msg.startsWith("ℹ️")) return "text-sky-400";
    return "text-neutral-300";
}

// ─── Streaming terminal hook ──────────────────────────────────
function useStreamingLogs() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const addLog = (message: string) =>
        setLogs((p) => [...p, { message, time: new Date().toLocaleTimeString("id-ID") }]);

    const reset = () => { setLogs([]); setDone(false); };

    const runStream = async (url: string, body: object, onSuccess?: () => void) => {
        setRunning(true);
        setDone(false);
        setLogs([]);
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            while (true) {
                const { done: d, value } = await reader.read();
                if (d) break;
                buf += decoder.decode(value, { stream: true });
                const parts = buf.split("\n\n");
                buf = parts.pop() ?? "";
                for (const part of parts) {
                    if (!part.startsWith("data: ")) continue;
                    try {
                        const data = JSON.parse(part.slice(6));
                        if (data.message) addLog(data.message);
                        if (data.success) { addLog("✅ Selesai!"); setDone(true); onSuccess?.(); }
                        if (data.error) { addLog(`❌ Error: ${data.error}`); }
                    } catch { }
                }
            }
        } catch (e: any) {
            addLog(`❌ Connection error: ${e.message}`);
        } finally {
            setRunning(false);
        }
    };

    return { logs, running, done, logsEndRef, addLog, reset, runStream };
}

// ─── Terminal UI ──────────────────────────────────────────────
function Terminal({ logs, running, done, logsEndRef }: {
    logs: LogEntry[];
    running: boolean;
    done: boolean;
    logsEndRef: React.RefObject<HTMLDivElement | null>;
}) {
    return (
        <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden flex flex-col" style={{ height: 340 }}>
            <div className="bg-neutral-900/80 px-4 py-2 border-b border-neutral-800 flex items-center gap-2 shrink-0">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <span className="text-xs text-neutral-500 font-mono ml-1">output</span>
                <div className="ml-auto">
                    {running && <span className="text-[10px] font-mono text-blue-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />RUNNING</span>}
                    {done && !running && <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />DONE</span>}
                </div>
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-0.5">
                {logs.length === 0 ? (
                    <p className="text-neutral-600 mt-2">Menunggu...</p>
                ) : logs.map((log, i) => (
                    <div key={i} className={`flex items-start gap-2 ${getLogColor(log.message)}`}>
                        <span className="text-neutral-600 shrink-0 w-16">[{log.time}]</span>
                        <span className="break-all">{log.message}</span>
                    </div>
                ))}
                {running && <div className="flex gap-0.5 mt-1 pl-18"><span className="w-1 h-1 rounded-full bg-neutral-600 animate-bounce" style={{ animationDelay: "0ms" }} /><span className="w-1 h-1 rounded-full bg-neutral-600 animate-bounce" style={{ animationDelay: "150ms" }} /><span className="w-1 h-1 rounded-full bg-neutral-600 animate-bounce" style={{ animationDelay: "300ms" }} /></div>}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}

// ─── Scrape Modal ───────────────────────────────────────────
function ScrapeModal({ comic, onClose, onDone }: { comic: ComicEntry; onClose: () => void; onDone: () => void }) {
    const { logs, running, done, logsEndRef, runStream } = useStreamingLogs();
    const [ackCloudflare, setAckCloudflare] = useState(false);
    const [started, setStarted] = useState(false);

    // Detect production
    const isProduction = typeof window !== "undefined" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1");

    const handleStart = () => {
        setStarted(true);
        runStream("/api/admin/scrape", { url: comic.link }, () => setTimeout(onDone, 2000));
    };

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !running) onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [running, onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-800 shrink-0">
                    <img src={comic.image} alt={comic.title} className="w-10 h-14 object-cover rounded-lg bg-neutral-800 shrink-0" onError={(e) => ((e.target as HTMLImageElement).src = "https://placehold.co/80x112?text=N/A")} />
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold truncate">{comic.title}</p>
                        <p className="text-neutral-500 text-xs font-mono truncate mt-0.5">{comic.link}</p>
                    </div>
                    <button onClick={onClose} disabled={running} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${running ? "text-neutral-700 cursor-not-allowed" : "text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 space-y-3">
                    {/* Cloudflare Warning */}
                    {isProduction && !started && (
                        <div className="rounded-xl border border-red-700/50 bg-red-950/40 p-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <div className="flex-1">
                                    <p className="text-red-400 font-semibold text-sm">Scraping dari production akan gagal (403)</p>
                                    <p className="text-red-300/70 text-xs mt-1 leading-relaxed">
                                        Komikindo.ch diproteksi Cloudflare. Gunakan <span className="font-mono bg-red-900/40 px-1 rounded">localhost:3000/admin</span> untuk scrape lewat IP lokal Anda.
                                    </p>
                                    <label className="flex items-center gap-2 mt-3 cursor-pointer group">
                                        <input type="checkbox" checked={ackCloudflare} onChange={e => setAckCloudflare(e.target.checked)} className="w-4 h-4 accent-red-500 cursor-pointer" />
                                        <span className="text-xs text-red-300/80 group-hover:text-red-300">Saya mengerti, tetap lanjutkan</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <Terminal logs={logs} running={running} done={done} logsEndRef={logsEndRef} />
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-neutral-800 flex items-center justify-between gap-3 shrink-0 bg-neutral-900/50">
                    {done ? (
                        <span className="text-emerald-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Berhasil! Data diperbarui.
                        </span>
                    ) : (
                        <span className="text-neutral-500 text-xs">{running ? "Sedang berjalan..." : started ? "" : "Klik Mulai Scrape untuk memulai."}</span>
                    )}
                    <div className="flex gap-2">
                        {!running && !done && (
                            <button
                                onClick={handleStart}
                                disabled={isProduction && !ackCloudflare}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isProduction && !ackCloudflare
                                    ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                                    }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Mulai Scrape
                            </button>
                        )}
                        <button onClick={onClose} disabled={running} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${running ? "bg-neutral-800 text-neutral-600 cursor-not-allowed" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 cursor-pointer"}`}>
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Generate List Modal ──────────────────────────────────────
function GenerateListModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
    const { logs, running, done, logsEndRef, runStream } = useStreamingLogs();
    const [searchUrl, setSearchUrl] = useState("");

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !running) onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [running, onClose]);

    const handleGenerate = () => {
        runStream("/api/admin/generate-list", { searchUrl: searchUrl.trim() || undefined }, () => setTimeout(onDone, 1000));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-800 shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-bold">Generate / Update Daftar Komik</p>
                        <p className="text-neutral-500 text-xs mt-0.5">Sync daftar lokal dengan folder Supabase + scrape halaman komikindo (opsional)</p>
                    </div>
                    <button onClick={onClose} disabled={running} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${running ? "text-neutral-700 cursor-not-allowed" : "text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-5 flex-1 space-y-4">
                    {/* Optional URL input */}
                    <div>
                        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                            URL Halaman Daftar Komikindo <span className="text-neutral-600 font-normal">(opsional)</span>
                        </label>
                        <input
                            type="url"
                            placeholder="https://komikindo.ch/komik-list/ atau halaman genre tertentu"
                            value={searchUrl}
                            onChange={(e) => setSearchUrl(e.target.value)}
                            disabled={running}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors placeholder:text-neutral-600 disabled:opacity-50"
                        />
                        <p className="text-neutral-600 text-xs mt-1.5">Kosongkan jika hanya ingin sync dari folder Supabase yang sudah ada.</p>
                    </div>

                    <Terminal logs={logs} running={running} done={done} logsEndRef={logsEndRef} />
                </div>

                <div className="px-5 py-3 border-t border-neutral-800 flex items-center justify-between gap-3 shrink-0 bg-neutral-900/50">
                    {done ? (
                        <span className="text-emerald-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Daftar komik berhasil diperbarui!
                        </span>
                    ) : (
                        <span className="text-neutral-500 text-xs">{running ? "Sedang berjalan..." : "Tekan Generate untuk memulai."}</span>
                    )}
                    <div className="flex gap-2">
                        {!running && (
                            <button onClick={handleGenerate} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors cursor-pointer flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                {done ? "Generate Ulang" : "Generate"}
                            </button>
                        )}
                        <button onClick={onClose} disabled={running} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${running ? "bg-neutral-800 text-neutral-600 cursor-not-allowed" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 cursor-pointer"}`}>
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Scrape All Modal ───────────────────────────────────────
interface ScrapeProgress {
    current: number;
    total: number;
    slug: string;
    status: "running" | "done" | "skip" | "error";
}

function ScrapeAllModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
    const { logs, running, done, logsEndRef, runStream } = useStreamingLogs();
    const [mode, setMode] = useState<"not_synced" | "all">("not_synced");
    const [maxPerRun, setMaxPerRun] = useState(30);
    const [delayMs, setDelayMs] = useState(2000);
    const [scrapeImages, setScrapeImages] = useState(false);
    const [progress, setProgress] = useState<ScrapeProgress | null>(null);
    const [summary, setSummary] = useState<{ successCount: number; skipCount: number; errorCount: number; total: number } | null>(null);
    const [ackCloudflare, setAckCloudflare] = useState(false);

    // Detect if running on production server (not localhost)
    const isProduction = typeof window !== "undefined" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1");

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !running) onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [running, onClose]);

    const handleStart = () => {
        setProgress(null);
        setSummary(null);

        // Custom runner to intercept progress events
        (async () => {
            const res = await fetch("/api/admin/scrape-all", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode, maxPerRun, delayMs, scrapeImages }),
            });
            if (!res.body) return;
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            while (true) {
                const { done: d, value } = await reader.read();
                if (d) break;
                buf += decoder.decode(value, { stream: true });
                const parts = buf.split("\n\n");
                buf = parts.pop() ?? "";
                for (const part of parts) {
                    if (!part.startsWith("data: ")) continue;
                    try {
                        const data = JSON.parse(part.slice(6));
                        if (data.message) {
                            // add to logs via runStream — but we bypass by calling addLog
                        }
                        if (data.progress) setProgress(data.progress);
                        if (data.success) setSummary(data.summary);
                    } catch { }
                }
            }
        })();

        // Use the shared hook for logs
        runStream("/api/admin/scrape-all", { mode, maxPerRun, delayMs, scrapeImages }, () => setTimeout(onDone, 3000));
    };

    const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
            <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "92vh" }}>
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-800 shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-orange-600/20 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-bold">Scrape Semua Otomatis</p>
                        <p className="text-neutral-500 text-xs mt-0.5">Scrape semua komik secara berurutan dengan delay antar request</p>
                    </div>
                    <button onClick={onClose} disabled={running} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${running ? "text-neutral-700 cursor-not-allowed" : "text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-5 space-y-4">
                    {/* Cloudflare Warning */}
                    {isProduction && (
                        <div className="rounded-xl border border-red-700/50 bg-red-950/40 p-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <div className="flex-1">
                                    <p className="text-red-400 font-semibold text-sm">Scraping dari production akan gagal (403)</p>
                                    <p className="text-red-300/70 text-xs mt-1 leading-relaxed">
                                        Komikindo.ch menggunakan Cloudflare yang memblokir request dari server/datacenter (Vercel).
                                        Gunakan <span className="font-mono bg-red-900/40 px-1 rounded">localhost:3000/admin</span> di komputer lokal agar scraping berjalan lewat IP browser Anda.
                                    </p>
                                    <label className="flex items-center gap-2 mt-3 cursor-pointer group">
                                        <input type="checkbox" checked={ackCloudflare} onChange={e => setAckCloudflare(e.target.checked)} className="w-4 h-4 accent-red-500 cursor-pointer" />
                                        <span className="text-xs text-red-300/80 group-hover:text-red-300">Saya mengerti, tetap lanjutkan (mungkin sebagian besar akan error)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Config */}
                    {!running && !done && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">Mode</label>
                                <select value={mode} onChange={e => setMode(e.target.value as any)} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 cursor-pointer">
                                    <option value="not_synced">⚠️ Belum Sync saja ({"prioritas"})</option>
                                    <option value="all">🔄 Semua komik (update chapter baru)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">Maks. Komik per Sesi</label>
                                <input type="number" min={1} max={500} value={maxPerRun} onChange={e => setMaxPerRun(+e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">Delay Antar Komik (ms)</label>
                                <input type="number" min={500} max={10000} step={500} value={delayMs} onChange={e => setDelayMs(+e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                                <p className="text-neutral-600 text-xs mt-1">Min 500ms, disarankan 2000ms</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">Scrape Gambar Chapter</label>
                                <button
                                    onClick={() => setScrapeImages(p => !p)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${scrapeImages ? "bg-orange-600/20 border-orange-600/40 text-orange-400" : "bg-neutral-800 border-neutral-700 text-neutral-400"
                                        }`}
                                >
                                    <span>{scrapeImages ? "✅ Ya — Scrape gambar" : "⚡ Tidak — Metadata saja (cepat)"}</span>
                                    <div className={`w-9 h-5 rounded-full transition-all ${scrapeImages ? "bg-orange-500" : "bg-neutral-600"} relative`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${scrapeImages ? "left-4" : "left-0.5"}`} />
                                    </div>
                                </button>
                                <p className="text-neutral-600 text-xs mt-1">{scrapeImages ? "Lebih lambat, scrape URL gambar per chapter" : "Hanya simpan daftar chapter, tanpa gambar"}</p>
                            </div>
                        </div>
                    )}

                    {/* Progress bar */}
                    {(running || done) && progress && (
                        <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-white">Progress</p>
                                <span className="text-xs font-mono text-neutral-400">{progress.current}/{progress.total} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: "linear-gradient(to right, #f97316, #eab308)" }} />
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${progress.status === "done" ? "bg-emerald-900/50 text-emerald-400" :
                                    progress.status === "skip" ? "bg-blue-900/50 text-blue-400" :
                                        progress.status === "error" ? "bg-red-900/50 text-red-400" :
                                            "bg-orange-900/50 text-orange-400"
                                    }`}>{progress.status.toUpperCase()}</span>
                                <span className="text-xs text-neutral-400 font-mono truncate">{progress.slug}</span>
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    {summary && (
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "Berhasil", value: summary.successCount, color: "emerald" },
                                { label: "Skip (sudah ada)", value: summary.skipCount, color: "blue" },
                                { label: "Error", value: summary.errorCount, color: "red" },
                            ].map(({ label, value, color }) => (
                                <div key={label} className={`bg-${color}-900/20 border border-${color}-800/30 rounded-xl p-3 text-center`}>
                                    <p className={`text-2xl font-black text-${color}-400`}>{value}</p>
                                    <p className="text-xs text-neutral-500 mt-1">{label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Terminal */}
                    <Terminal logs={logs} running={running} done={done} logsEndRef={logsEndRef} />
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-neutral-800 flex items-center justify-between gap-3 shrink-0 bg-neutral-900/50">
                    {done ? (
                        <span className="text-emerald-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Selesai! Dashboard akan diperbarui.
                        </span>
                    ) : running ? (
                        <span className="text-orange-400 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block" />
                            Scraping berjalan… jangan tutup halaman ini.
                        </span>
                    ) : (
                        <span className="text-neutral-500 text-xs">Konfigurasi di atas lalu tekan Mulai.</span>
                    )}
                    <div className="flex gap-2">
                        {!running && (
                            <button
                                onClick={handleStart}
                                disabled={isProduction && !ackCloudflare}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isProduction && !ackCloudflare
                                    ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                                    : "bg-orange-600 text-white hover:bg-orange-500 cursor-pointer"
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                {done ? "Mulai Ulang" : "Mulai Scrape"}
                            </button>
                        )}
                        <button onClick={onClose} disabled={running} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${running ? "bg-neutral-800 text-neutral-600 cursor-not-allowed" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 cursor-pointer"}`}>
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── GitHub Actions Panel ─────────────────────────────────
interface GHRun {
    id: number;
    status: "queued" | "in_progress" | "completed";
    conclusion: "success" | "failure" | "cancelled" | null;
    created_at: string;
    html_url: string;
    name: string;
}

function GitHubActionsPanel() {
    const [mode, setMode] = useState<"not_synced" | "all">("not_synced");
    const [maxPerRun, setMaxPerRun] = useState("30");
    const [delayMs, setDelayMs] = useState("3000");
    const [scrapeImages, setScrapeImages] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const [triggerMsg, setTriggerMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [runs, setRuns] = useState<GHRun[]>([]);
    const [runsLoading, setRunsLoading] = useState(false);

    const fetchRuns = async () => {
        setRunsLoading(true);
        try {
            const res = await fetch("/api/admin/trigger-github", { cache: "no-store" });
            const d = await res.json();
            setRuns(d.runs ?? []);
        } catch { }
        finally { setRunsLoading(false); }
    };

    useEffect(() => { fetchRuns(); }, []);

    const handleTrigger = async () => {
        setTriggering(true);
        setTriggerMsg(null);
        try {
            const res = await fetch("/api/admin/trigger-github", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode, max_per_run: maxPerRun, delay_ms: delayMs, scrape_images: String(scrapeImages) }),
            });
            const d = await res.json();
            if (d.success) {
                setTriggerMsg({ ok: true, text: "✅ Workflow triggered! Cek tab Actions di GitHub." });
                setTimeout(fetchRuns, 5000);
            } else {
                setTriggerMsg({ ok: false, text: `❌ ${d.error}` });
            }
        } catch (e: any) {
            setTriggerMsg({ ok: false, text: `❌ ${e.message}` });
        } finally {
            setTriggering(false);
        }
    };

    const statusBadge = (run: GHRun) => {
        if (run.status === "in_progress") return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-700/30 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />Running</span>;
        if (run.status === "queued") return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-700/30 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />Queued</span>;
        if (run.conclusion === "success") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-700/30 font-medium">✓ Success</span>;
        if (run.conclusion === "failure") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-700/30 font-medium">✗ Failed</span>;
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500 font-medium">{run.conclusion ?? run.status}</span>;
    };

    const timeAgoShort = (dateStr: string) => {
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden mb-6">
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center">
                        <svg className="w-4 h-4 text-neutral-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">GitHub Actions</p>
                        <p className="text-neutral-500 text-[10px]">Scrape otomatis via GitHub — bypass IP lokal</p>
                    </div>
                </div>
                <button onClick={fetchRuns} disabled={runsLoading} className="text-xs text-neutral-500 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
                    <svg className={`w-3.5 h-3.5 ${runsLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh
                </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trigger form */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Trigger Manual</p>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-neutral-500 block mb-1">Mode</label>
                            <select value={mode} onChange={e => setMode(e.target.value as any)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-green-500 cursor-pointer">
                                <option value="not_synced">⚠️ Belum Sync</option>
                                <option value="all">🔄 Semua</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-neutral-500 block mb-1">Maks. Komik</label>
                            <input type="number" min={1} max={200} value={maxPerRun} onChange={e => setMaxPerRun(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-green-500" />
                        </div>
                        <div>
                            <label className="text-[10px] text-neutral-500 block mb-1">Delay (ms)</label>
                            <input type="number" min={500} max={10000} step={500} value={delayMs} onChange={e => setDelayMs(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-green-500" />
                        </div>
                        <div>
                            <label className="text-[10px] text-neutral-500 block mb-1">Gambar Chapter</label>
                            <button onClick={() => setScrapeImages(p => !p)} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${scrapeImages ? "bg-green-900/20 border-green-700/30 text-green-400" : "bg-neutral-800 border-neutral-700 text-neutral-500"}`}>
                                <span>{scrapeImages ? "Ya" : "Tidak"}</span>
                                <div className={`w-7 h-4 rounded-full relative transition-all ${scrapeImages ? "bg-green-500" : "bg-neutral-600"}`}>
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${scrapeImages ? "left-3.5" : "left-0.5"}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                    {triggerMsg && (
                        <p className={`text-xs rounded-lg p-2 ${triggerMsg.ok ? "bg-emerald-900/20 text-emerald-400" : "bg-red-900/20 text-red-400"}`}>{triggerMsg.text}</p>
                    )}
                    <button
                        onClick={handleTrigger}
                        disabled={triggering}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${triggering ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-500 text-white"
                            }`}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                        {triggering ? "Memicu workflow..." : "Jalankan via GitHub Actions"}
                    </button>
                    <p className="text-[10px] text-neutral-600">⏰ Juga berjalan otomatis setiap hari jam 02:00 WIB</p>
                </div>

                {/* Recent runs */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Run Terbaru</p>
                    {runsLoading ? (
                        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-neutral-800 rounded-lg animate-pulse" />)}</div>
                    ) : runs.length === 0 ? (
                        <div className="py-6 text-center">
                            <p className="text-neutral-600 text-xs">Belum ada run. Pastikan GITHUB_PAT & GITHUB_REPO sudah diset di .env.local</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {runs.map(run => (
                                <a key={run.id} href={run.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition-colors group">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {statusBadge(run)}
                                        <span className="text-xs text-neutral-400 truncate">{timeAgoShort(run.created_at)}</span>
                                    </div>
                                    <svg className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function AdminDashboard() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "synced" | "not_synced">("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [scrapeTarget, setScrapeTarget] = useState<ComicEntry | null>(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showScrapeAll, setShowScrapeAll] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/comics-list", { cache: "no-store" });
            setData(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // Reset to page 1 when filters change
    useEffect(() => { setPage(1); }, [search, filter, typeFilter]);

    const filtered = data?.comics.filter((c) => {
        const q = search.toLowerCase();
        const matchSearch = c.title.toLowerCase().includes(q) || c.slug.includes(q);
        const matchFilter = filter === "all" ? true : filter === "synced" ? c.inSupabase : !c.inSupabase;
        const matchType = typeFilter === "all" ? true : c.type === typeFilter;
        return matchSearch && matchFilter && matchType;
    }) ?? [];

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="p-4 md:p-8 text-gray-200">
            {/* Modals */}
            {scrapeTarget && (
                <ScrapeModal
                    comic={scrapeTarget}
                    onClose={() => setScrapeTarget(null)}
                    onDone={() => { setScrapeTarget(null); fetchData(); }}
                />
            )}
            {showGenerateModal && (
                <GenerateListModal
                    onClose={() => setShowGenerateModal(false)}
                    onDone={() => { setShowGenerateModal(false); fetchData(); }}
                />
            )}
            {showScrapeAll && (
                <ScrapeAllModal
                    onClose={() => setShowScrapeAll(false)}
                    onDone={() => { setShowScrapeAll(false); fetchData(); }}
                />
            )}

            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Dashboard Admin</h1>
                    <p className="text-neutral-500 mt-1 text-xs md:text-sm">Manajemen konten & scraping ManhwaKu</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowScrapeAll(true)}
                        className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-orange-600/15 border border-orange-600/25 text-orange-400 rounded-xl text-xs md:text-sm font-medium hover:bg-orange-600/25 hover:border-orange-500/40 transition-all cursor-pointer"
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <span className="hidden sm:inline">Scrape Semua</span>
                    </button>
                    <button
                        onClick={() => setShowGenerateModal(true)}
                        className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-purple-600/15 border border-purple-600/25 text-purple-400 rounded-xl text-xs md:text-sm font-medium hover:bg-purple-600/25 hover:border-purple-500/40 transition-all cursor-pointer"
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span className="hidden sm:inline">Generate Daftar</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 md:p-6 animate-pulse">
                            <div className="h-3 bg-neutral-800 rounded w-20 mb-3" /><div className="h-7 bg-neutral-800 rounded w-12" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {[
                        { label: "Total Komik", value: data?.total ?? 0, color: "blue", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
                        { label: "Sudah Sync", value: data?.synced ?? 0, color: "emerald", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                        { label: "Belum Sync", value: data?.notSynced ?? 0, color: "amber", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
                    ].map(({ label, value, color, icon }) => (
                        <div key={label} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 flex items-center gap-3 hover:border-neutral-700 transition-colors">
                            <div className={`w-10 h-10 rounded-xl bg-${color}-600/15 flex items-center justify-center shrink-0`}>
                                <svg className={`w-5 h-5 text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                            </div>
                            <div>
                                <p className="text-neutral-500 text-[10px] font-medium uppercase tracking-wider mb-0.5">{label}</p>
                                <p className={`text-2xl font-black text-${color}-400`}>{value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* GitHub Actions Panel */}
            <GitHubActionsPanel />

            {/* Progress Bar */}
            {data && (
                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-white">Progress Sync</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-neutral-400"><span className="text-emerald-400 font-bold">{data.synced}</span> / {data.total}</p>
                            <button onClick={fetchData} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(data.synced / data.total) * 100}%`, background: "linear-gradient(to right, #3b82f6, #10b981)" }} />
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">{Math.round((data.synced / data.total) * 100)}% tersinkronisasi</p>
                </div>
            )}

            {/* Table */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-neutral-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-white">Daftar Komik</h2>
                            <p className="text-neutral-500 text-xs mt-0.5">{filtered.length} komik · hal. {page}/{totalPages}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative flex-1 min-w-[140px]">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input type="text" placeholder="Cari judul..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                        </div>
                        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 cursor-pointer flex-1 min-w-[120px]">
                            <option value="all">Semua Status</option>
                            <option value="synced">✅ Sudah Sync</option>
                            <option value="not_synced">⚠️ Belum Sync</option>
                        </select>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 cursor-pointer flex-1 min-w-[100px]">
                            <option value="all">Semua Tipe</option>
                            <option value="Manhwa">Manhwa</option>
                            <option value="Manhua">Manhua</option>
                            <option value="Manga">Manga</option>
                        </select>
                    </div>
                </div>

                {/* ── Mobile Card List (< md) ── */}
                <div className="md:hidden divide-y divide-neutral-800/60">
                    {loading ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
                                <div className="w-10 h-14 bg-neutral-800 rounded-lg shrink-0" />
                                <div className="flex-1">
                                    <div className="h-3 bg-neutral-800 rounded w-3/4 mb-2" />
                                    <div className="h-2.5 bg-neutral-800 rounded w-1/2 mb-3" />
                                    <div className="h-7 bg-neutral-800 rounded-lg w-20" />
                                </div>
                            </div>
                        ))
                    ) : paginated.length === 0 ? (
                        <div className="py-16 text-center text-neutral-500 text-sm">Tidak ada komik yang cocok</div>
                    ) : (
                        paginated.map((comic, idx) => (
                            <div key={`${comic.slug}-${idx}`} className="p-4 flex items-start gap-3 hover:bg-neutral-800/30 transition-colors">
                                <img
                                    src={comic.image || "https://placehold.co/80x112?text=N/A"}
                                    alt={comic.title}
                                    className="w-10 h-14 object-cover rounded-lg shrink-0 bg-neutral-800"
                                    onError={(e) => ((e.target as HTMLImageElement).src = "https://placehold.co/80x112?text=N/A")}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-sm leading-tight truncate">{comic.title}</p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${comic.type === "Manhwa" ? "bg-blue-900/30 text-blue-400" : comic.type === "Manhua" ? "bg-purple-900/30 text-purple-400" : "bg-orange-900/30 text-orange-400"}`}>{comic.type}</span>
                                        {comic.inSupabase ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-700/30 font-medium">
                                                <span className="w-1 h-1 rounded-full bg-emerald-400" />Synced · {comic.totalChapters} ch
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/20 text-amber-400 border border-amber-700/30 font-medium">
                                                <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />Belum Sync
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-2.5">
                                        <span className="text-neutral-600 text-xs">{timeAgo(comic.lastUpdated)}</span>
                                        <button
                                            onClick={() => setScrapeTarget(comic)}
                                            className="inline-flex items-center gap-1 bg-blue-600/15 text-blue-400 border border-blue-600/20 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-pointer"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            Scrape
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ── Desktop Table (≥ md) ── */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-800">
                                <th className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider w-8">#</th>
                                <th className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Komik</th>
                                <th className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Tipe</th>
                                <th className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Chapter</th>
                                <th className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Update</th>
                                <th className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(8)].map((_, i) => (
                                    <tr key={i} className="border-b border-neutral-800/50 animate-pulse">
                                        <td className="px-5 py-4"><div className="h-3 bg-neutral-800 rounded w-4" /></td>
                                        <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-10 h-14 bg-neutral-800 rounded-lg shrink-0" /><div><div className="h-3 bg-neutral-800 rounded w-32 mb-2" /><div className="h-2 bg-neutral-800 rounded w-20" /></div></div></td>
                                        <td className="px-5 py-4"><div className="h-3 bg-neutral-800 rounded w-14" /></td>
                                        <td className="px-5 py-4"><div className="h-5 bg-neutral-800 rounded-full w-20" /></td>
                                        <td className="px-5 py-4"><div className="h-3 bg-neutral-800 rounded w-8" /></td>
                                        <td className="px-5 py-4"><div className="h-3 bg-neutral-800 rounded w-24" /></td>
                                        <td className="px-5 py-4"><div className="h-8 bg-neutral-800 rounded-lg w-20" /></td>
                                    </tr>
                                ))
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-16 text-neutral-500">Tidak ada komik yang cocok</td></tr>
                            ) : (
                                paginated.map((comic, idx) => {
                                    const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                                    return (
                                        <tr key={`${comic.slug}-${idx}`} className="border-b border-neutral-800/40 hover:bg-neutral-800/25 transition-colors">
                                            <td className="px-5 py-3 text-neutral-600 text-xs tabular-nums">{rowNum}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={comic.image || "https://placehold.co/80x112?text=N/A"} alt={comic.title} className="w-10 h-14 object-cover rounded-lg shrink-0 bg-neutral-800" onError={(e) => ((e.target as HTMLImageElement).src = "https://placehold.co/80x112?text=N/A")} />
                                                    <div className="min-w-0">
                                                        <p className="text-white font-semibold truncate max-w-[200px]">{comic.title}</p>
                                                        <p className="text-neutral-600 text-xs font-mono mt-0.5 truncate max-w-[200px]">{comic.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${comic.type === "Manhwa" ? "bg-blue-900/30 text-blue-400" : comic.type === "Manhua" ? "bg-purple-900/30 text-purple-400" : "bg-orange-900/30 text-orange-400"}`}>{comic.type}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {comic.inSupabase ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-700/30 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Synced</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-900/20 text-amber-400 border border-amber-700/30 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Belum Sync</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                {comic.inSupabase ? (
                                                    <div><p className="text-white font-bold">{comic.totalChapters}</p>{comic.latestChapter && <p className="text-neutral-500 text-xs mt-0.5">{comic.latestChapter}</p>}</div>
                                                ) : <span className="text-neutral-600">—</span>}
                                            </td>
                                            <td className="px-5 py-3"><span className="text-neutral-400 text-xs">{timeAgo(comic.lastUpdated)}</span></td>
                                            <td className="px-5 py-3">
                                                <button onClick={() => setScrapeTarget(comic)} className="inline-flex items-center gap-1.5 bg-blue-600/15 text-blue-400 border border-blue-600/20 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-pointer">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                    Scrape
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-4 border-t border-neutral-800 flex items-center justify-between gap-3">
                        <p className="text-neutral-500 text-xs hidden sm:block">
                            Menampilkan <span className="text-white font-medium">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> dari <span className="text-white font-medium">{filtered.length}</span>
                        </p>
                        <p className="text-neutral-500 text-xs sm:hidden">Hal. {page}/{totalPages}</p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(1)} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>

                            {/* Page numbers — truncated on mobile */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                                .reduce<(number | "...")[]>((acc, n, i, arr) => {
                                    if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("...");
                                    acc.push(n);
                                    return acc;
                                }, [])
                                .map((n, i) =>
                                    n === "..." ? (
                                        <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-neutral-600 text-xs">…</span>
                                    ) : (
                                        <button key={n} onClick={() => setPage(n as number)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-pointer ${page === n ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}>
                                            {n}
                                        </button>
                                    )
                                )}

                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
