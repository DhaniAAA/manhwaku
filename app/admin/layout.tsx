"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
    {
        href: "/admin",
        label: "Dashboard",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const NavLinks = () => (
        <>
            {navItems.map((item) => {
                const isActive = item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                            ? "bg-blue-600/15 text-blue-400 border border-blue-600/20"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                            }`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                );
            })}
        </>
    );

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col md:flex-row">

            {/* ── Mobile Top Bar ── */}
            <header className="md:hidden flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800 shrink-0 z-30 sticky top-0">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow shadow-blue-600/30">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm leading-none">ManhwaKu</p>
                        <p className="text-neutral-500 text-[10px]">Admin Panel</p>
                    </div>
                </Link>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </header>

            {/* ── Mobile Drawer ── */}
            {mobileOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="md:hidden fixed inset-0 z-20 bg-black/60"
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Drawer panel */}
                    <div className="md:hidden fixed top-[52px] left-0 right-0 z-30 bg-neutral-900 border-b border-neutral-800 p-3 space-y-1 shadow-xl">
                        <NavLinks />
                        <div className="pt-2 border-t border-neutral-800 mt-2">
                            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-3 py-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Kembali ke Situs
                            </Link>
                        </div>
                    </div>
                </>
            )}

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex w-60 shrink-0 bg-neutral-900 border-r border-neutral-800 flex-col min-h-screen">
                {/* Logo */}
                <div className="px-6 py-5 border-b border-neutral-800">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-none">ManhwaKu</p>
                            <p className="text-neutral-500 text-[10px] mt-0.5">Admin Panel</p>
                        </div>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    <NavLinks />
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-800">
                    <Link href="/" className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Situs
                    </Link>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 overflow-auto min-w-0">
                {children}
            </main>
        </div>
    );
}
