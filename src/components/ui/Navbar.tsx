'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { Sprout } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    const navItems = [
        { name: 'How to Play', path: '/how-to-play' },
        { name: 'Leaderboard', path: '/leaderboard' },
        { name: 'Docs', path: '/docs' }
    ];

    return (
        <div className="w-full flex justify-center pt-6 px-4 z-45 sticky top-0 pointer-events-none">
            <motion.nav 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                className="w-full max-w-5xl bg-white border-2 border-slate-800 rounded-full h-16 px-4 md:px-6 flex items-center justify-between shadow-[0_4px_0_0_#1e293b] pointer-events-auto"
            >
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative w-8 h-8 group-hover:scale-105 transition-transform duration-200">
                        <Image 
                            src="/Logo-Transparant.png" 
                            alt="Helge Village Logo" 
                            fill
                            sizes="32px"
                            priority
                            style={{ objectFit: 'contain' }}
                            className="select-none"
                        />
                    </div>
                    <span className="font-pixel text-[10px] md:text-xs tracking-normal text-slate-800 uppercase select-none">
                        Helge Village
                    </span>
                </Link>

                {/* Nav Links - Center Capsule */}
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 border border-slate-800 p-1 rounded-full">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 ${
                                    isActive
                                        ? 'bg-emerald-500 text-white border border-slate-850 shadow-[1px_1px_0_0_#1e293b]'
                                        : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                    <a
                        href="https://x.com/helgevillage"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-605 hover:text-slate-800 transition-colors flex items-center justify-center"
                        title="Follow us on X"
                    >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </a>
                </div>

                {/* Mobile Tab Fallback Link (Only visible on small screens) */}
                <div className="sm:hidden flex items-center gap-2">
                    <Link
                        href="/how-to-play"
                        className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold border ${
                            pathname === '/how-to-play'
                                ? 'bg-emerald-500 text-white border-slate-800'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                        Play
                    </Link>
                    <Link
                        href="/leaderboard"
                        className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold border ${
                            pathname === '/leaderboard'
                                ? 'bg-emerald-500 text-white border-slate-800'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                        Ranks
                    </Link>
                    <a
                        href="https://x.com/helgevillage"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-606 hover:text-slate-800 transition-colors flex items-center justify-center"
                        title="Follow us on X"
                    >
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </a>
                </div>

                {/* Wallet Button - Right Side Capsule */}
                <div className="flex items-center">
                    <div className="transform hover:scale-102 active:scale-98 transition-all">
                        {mounted && (
                            <WalletMultiButton 
                                className="!bg-orange-500 hover:!bg-orange-600 !text-white !border-2 !border-slate-800 !font-sans !text-[11px] md:!text-xs !font-bold !rounded-full !h-9 !px-4 !shadow-[2px_2px_0_0_#1e293b] active:!translate-y-[1px] active:!shadow-[1px_1px_0_0_#1e293b] !transition-all" 
                            />
                        )}
                    </div>
                </div>
            </motion.nav>
        </div>
    );
}
