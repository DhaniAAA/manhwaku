"use client";

import Link from "next/link";

interface NavbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

export default function Navbar({ searchTerm, onSearchChange }: NavbarProps) {
    return (
        <nav className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo */}
                    <h1 className="text-2xl font-bold text-blue-600 tracking-tight whitespace-nowrap">
                        Manhwa<span className="text-gray-800">Ku</span>
                    </h1>

                    {/* Navigation Menu - Hidden on mobile */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                            Home
                        </Link>
                        <Link href="/jelajahi" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                            Jelajahi
                        </Link>
                        <Link href="/library" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                            Library
                        </Link>
                        <Link href="/daftar-manhwa" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                            Daftar Manhwa
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-md relative">
                        <input
                            type="text"
                            placeholder="Cari manhwa..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full py-2 px-4 pr-10 rounded-full text-sm text-gray-800 bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 placeholder-gray-400 transition-all"
                        />
                        <span className="absolute right-4 top-2.5 text-gray-400 text-sm">🔍</span>
                    </div>

                    {/* API Docs Link */}
                    <Link href="/api" className="hidden lg:block text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors whitespace-nowrap">
                        API Docs
                    </Link>
                </div>

                {/* Mobile Navigation Menu */}
                <div className="md:hidden flex items-center gap-4 mt-3 overflow-x-auto pb-1">
                    <Link href="/" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap">
                        Home
                    </Link>
                    <Link href="/jelajahi" className="text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap">
                        Jelajahi
                    </Link>
                    <Link href="/library" className="text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap">
                        Library
                    </Link>
                    <Link href="/daftar-manhwa" className="text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap">
                        Daftar Manhwa
                    </Link>
                </div>
            </div>
        </nav>
    );
}
