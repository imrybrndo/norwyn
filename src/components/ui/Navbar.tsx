'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { Sprout } from 'lucide-react';

export default function Navbar() {
    const { connected } = useWallet();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <motion.nav 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-30 relative"
        >
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="w-10 h-10 bg-amber-500/10 border-2 border-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-transform">
                    <Sprout className="w-6 h-6 text-amber-400" />
                </div>
                <span className="font-mono font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 uppercase">
                    Helge Village
                </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-mono text-gray-400">
                <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                    className="hover:text-amber-400 transition-colors cursor-pointer relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-amber-400 hover:after:w-full after:transition-all"
                >
                    Home
                </button>
                <button 
                    onClick={() => scrollToSection('how-to-play')} 
                    className="hover:text-amber-400 transition-colors cursor-pointer relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-amber-400 hover:after:w-full after:transition-all"
                >
                    How to Play
                </button>
                <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="hover:text-amber-400 transition-colors cursor-pointer relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-amber-400 hover:after:w-full after:transition-all"
                >
                    Whitepaper
                </a>
            </div>

            {/* Wallet Button in Navbar */}
            <div className="flex items-center gap-4">
                <div className="transform hover:scale-102 transition-all active:scale-98">
                    {mounted && (
                        <WalletMultiButton className="!bg-amber-950/40 hover:!bg-amber-900/60 !border !border-amber-500/30 !text-amber-400 !font-mono !font-semibold !rounded-xl !h-10 !px-4 !text-xs !shadow-md" />
                    )}
                </div>
            </div>
        </motion.nav>
    );
}
