"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
    searchTerm?: string;
    onSearchChange?: (value: string) => void;
    showSearch?: boolean;
}

export default function Navbar({ searchTerm = "", onSearchChange, showSearch = true }: NavbarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/jelajahi", label: "Jelajahi" },
        { href: "/library", label: "Library" },
        { href: "/daftar-manhwa", label: "Daftar Manhwa" },
    ];

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <>
            <nav className="bg-neutral-900 shadow-sm sticky top-0 z-50 border-b border-neutral-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <Link href="/" className="text-2xl font-bold text-blue-500 tracking-tight whitespace-nowrap">
                            Manhwa<span className="text-white">Ku</span>
                        </Link>

                        {/* Navigation Menu - Hidden on mobile */}
                        <div className="hidden md:flex items-center gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-sm font-medium transition-colors ${isActive(link.href)
                                        ? "text-blue-400"
                                        : "text-gray-300 hover:text-blue-400"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Search Bar - Conditional */}
                        {showSearch && onSearchChange && (
                            <div className="hidden sm:block flex-1 max-w-md relative">
                                <input
                                    type="text"
                                    placeholder="Cari manhwa..."
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="w-full py-2 px-4 pr-10 rounded-full text-sm text-white bg-neutral-800 focus:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-blue-400/50 placeholder-gray-400 transition-all"
                                />
                                <span className="absolute right-4 top-2.5 text-gray-400 text-sm">🔍</span>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            {/* API Docs Link */}
                            <Link href="/api" className="hidden lg:block text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors whitespace-nowrap">
                                API Docs
                            </Link>

                            {/* Hamburger Menu Button - Mobile Only */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                                aria-label="Toggle menu"
                            >
                                <div className="w-6 h-5 relative flex flex-col justify-between">
                                    <span className={`block h-0.5 w-6 bg-gray-300 rounded-full transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
                                    <span className={`block h-0.5 w-6 bg-gray-300 rounded-full transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}></span>
                                    <span className={`block h-0.5 w-6 bg-gray-300 rounded-full transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-72 bg-neutral-900 z-50 shadow-2xl md:hidden transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                    <span className="text-lg font-bold text-blue-500">
                        Manhwa<span className="text-white">Ku</span>
                    </span>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                        aria-label="Close menu"
                    >
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Search */}
                {showSearch && onSearchChange && (
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari manhwa..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full py-2.5 px-4 pr-10 rounded-lg text-sm text-white bg-neutral-800 focus:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-blue-400/50 placeholder-gray-400 transition-all"
                            />
                            <span className="absolute right-4 top-3 text-gray-400 text-sm">🔍</span>
                        </div>
                    </div>
                )}

                {/* Mobile Navigation Links */}
                <div className="py-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-6 py-3 text-base font-medium transition-colors ${isActive(link.href)
                                ? "text-blue-400 bg-blue-900/20 border-r-4 border-blue-500"
                                : "text-gray-300 hover:text-blue-400 hover:bg-neutral-800"
                                }`}
                        >
                            {link.label === "Home" && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            )}
                            {link.label === "Jelajahi" && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            )}
                            {link.label === "Library" && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            )}
                            {link.label === "Daftar Manhwa" && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            )}
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Mobile Menu Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800 bg-neutral-900">
                    <Link
                        href="/api"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-gray-400 hover:text-blue-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        API Documentation
                    </Link>
                </div>
            </div>
        </>
    );
}
