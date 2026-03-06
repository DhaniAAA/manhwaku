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
type ScrapeMode = "metadata_only" | "chapters_only" | "all";

const SCRAPE_MODES: { value: ScrapeMode; label: string; desc: string; speed: string; color: string; icon: React.ReactNode }[] = [
    {
        value: "metadata_only",
        label: "Metadata Saja",
        desc: "Scrape info komik: judul, cover, genre, sinopsis, status. Tidak menyentuh chapter.",
        speed: "⚡ Sangat Cepat",
        color: "sky",
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
    {
        value: "chapters_only",
        label: "Chapters Saja",
        desc: "Scrape daftar chapter (judul, link, tanggal rilis). Tanpa mengunduh gambar per chapter.",
        speed: "🚀 Cepat",
        color: "violet",
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h6" /></svg>,
    },
    {
        value: "all",
        label: "Semua (Lengkap)",
        desc: "Scrape metadata + daftar chapter + gambar per chapter. Paling lengkap tapi paling lambat.",
        speed: "🐢 Lambat",
        color: "orange",
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
];

function ScrapeModal({ comic, onClose, onDone }: { comic: ComicEntry; onClose: () => void; onDone: () => void }) {
    const { logs, running, done, logsEndRef, runStream } = useStreamingLogs();
    const [ackCloudflare, setAckCloudflare] = useState(false);
    const [started, setStarted] = useState(false);
    const [scrapeMode, setScrapeMode] = useState<ScrapeMode>("chapters_only");

    // Detect production
    const isProduction = typeof window !== "undefined" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1");

    const handleStart = () => {
        setStarted(true);
        runStream("/api/admin/scrape", { url: comic.link, scrapeMode }, () => setTimeout(onDone, 2000));
    };

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !running) onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [running, onClose]);

    const colorMap: Record<string, string> = {
        sky: "border-sky-500/60 bg-sky-500/10 text-sky-400",
        violet: "border-violet-500/60 bg-violet-500/10 text-violet-400",
        orange: "border-orange-500/60 bg-orange-500/10 text-orange-400",
    };
    const colorMapIdle: Record<string, string> = {
        sky: "border-neutral-700 hover:border-sky-600/40 hover:bg-sky-500/5",
        violet: "border-neutral-700 hover:border-violet-600/40 hover:bg-violet-500/5",
        orange: "border-neutral-700 hover:border-orange-600/40 hover:bg-orange-500/5",
    };

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
                <div className="p-4 flex-1 overflow-auto space-y-3">
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

                    {/* Mode Selector — hidden once started */}
                    {!started && (
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Pilih Mode Scrape</p>
                            <div className="grid grid-cols-3 gap-2">
                                {SCRAPE_MODES.map((m) => {
                                    const isSelected = scrapeMode === m.value;
                                    return (
                                        <button
                                            key={m.value}
                                            onClick={() => setScrapeMode(m.value)}
                                            className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${isSelected ? colorMap[m.color] : `bg-neutral-800/50 text-neutral-400 ${colorMapIdle[m.color]}`}`}
                                        >
                                            {isSelected && (
                                                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                                                    <span className="w-2 h-2 rounded-full bg-current" />
                                                </span>
                                            )}
                                            <span className={`${isSelected ? "" : "text-neutral-500"}`}>{m.icon}</span>
                                            <span className="font-semibold text-xs leading-tight text-white">{m.label}</span>
                                            <span className="text-[10px] leading-snug text-neutral-500">{m.desc}</span>
                                            <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? "" : "text-neutral-600"}`}>{m.speed}</span>
                                        </button>
                                    );
                                })}
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
                        <span className="text-neutral-500 text-xs">
                            {running ? "Sedang berjalan..." : started ? "" : (
                                <>Mode: <span className="text-white font-medium">{SCRAPE_MODES.find(m => m.value === scrapeMode)?.label}</span></>
                            )}
                        </span>
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
    const [delayMs, setDelayMs] = useState(1500);
    const [concurrency, setConcurrency] = useState(3);
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
                body: JSON.stringify({ mode, maxPerRun, delayMs, scrapeImages, concurrency }),
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
                        if (data.progress) setProgress(data.progress);
                        if (data.success) setSummary(data.summary);
                    } catch { }
                }
            }
        })();

        // Use the shared hook for logs
        runStream("/api/admin/scrape-all", { mode, maxPerRun, delayMs, scrapeImages, concurrency }, () => setTimeout(onDone, 3000));
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
                                    <option value="not_synced">⚠️ Belum Ada Chapter (prioritas)</option>
                                    <option value="all">🔄 Semua komik (update chapter baru)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">Maks. Komik per Sesi</label>
                                <input type="number" min={1} max={500} value={maxPerRun} onChange={e => setMaxPerRun(+e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                                    Concurrency <span className="text-emerald-500 font-mono">(paralel)</span>
                                </label>
                                <input type="number" min={1} max={6} value={concurrency} onChange={e => setConcurrency(+e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                                <p className="text-neutral-600 text-xs mt-1">1–6 komik diproses sekaligus. Default 3 (aman)</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">Delay Antar Batch (ms)</label>
                                <input type="number" min={500} max={10000} step={500} value={delayMs} onChange={e => setDelayMs(+e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                                <p className="text-neutral-600 text-xs mt-1">Jeda setelah tiap batch selesai. Min 500ms</p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">Scrape Gambar Chapter</label>
                                <button
                                    onClick={() => setScrapeImages(p => !p)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${scrapeImages ? "bg-orange-600/20 border-orange-600/40 text-orange-400" : "bg-neutral-800 border-neutral-700 text-neutral-400"
                                        }`}
                                >
                                    <span>{scrapeImages ? "✅ Ya — Scrape gambar" : "⚡ Tidak — Chapter list saja (cepat)"}</span>
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
