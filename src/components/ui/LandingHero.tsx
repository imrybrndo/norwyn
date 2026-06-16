'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { Sparkles, Gamepad2, ArrowRight } from 'lucide-react';

interface LandingHeroProps {
    userData: any;
    isLoading: boolean;
    onStartOnboarding: () => void;
    onEnterGame: () => void;
}

export default function LandingHero({
    userData,
    isLoading,
    onStartOnboarding,
    onEnterGame,
}: LandingHeroProps) {
    const { connected, publicKey } = useWallet();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 overflow-hidden select-none">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse delay-700" />

            {/* Content Container */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative z-10 max-w-2xl bg-gray-905/70 backdrop-blur-md border-2 border-amber-600/30 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(217,119,6,0.15)] flex flex-col items-center gap-6"
            >
                {/* Game Badge */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Web3 Multiplayer RPG
                </motion.div>

                {/* Game Title */}
                <div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-300 uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-mono">
                        Helge Village
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base mt-3 font-mono">
                        Cultivate your farm, gather resources, fish in deep waters, and build your legacy on Solana.
                    </p>
                </div>

                {/* Pixel Art Styled Floating Element */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="my-4"
                >
                    <div className="relative w-24 h-24 bg-amber-650/20 border-2 border-dashed border-amber-500/50 rounded-full flex items-center justify-center">
                        <Gamepad2 className="w-12 h-12 text-amber-500" />
                        {/* Mini floating particles */}
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                </motion.div>

                {/* Web3 Solana Wallet Connections */}
                <div className="flex flex-col items-center gap-4 w-full">
                    {!connected ? (
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-gray-400 text-xs font-mono">Connect your Solana wallet to begin your journey</p>
                            <div className="transform hover:scale-105 transition-all duration-250">
                                {mounted && (
                                    <WalletMultiButton className="!bg-gradient-to-r !from-amber-650 !to-amber-500 !hover:from-amber-500 !hover:to-amber-400 !font-mono !font-bold !rounded-xl !border-b-4 !border-amber-800 !h-12 !px-6 !text-sm !shadow-lg" />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs font-mono text-gray-300 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                {publicKey?.toBase58().substring(0, 6)}...{publicKey?.toBase58().substring(publicKey.toBase58().length - 6)}
                            </div>

                            {isLoading ? (
                                <div className="text-amber-500 font-mono text-xs animate-pulse">Loading Character Profile...</div>
                            ) : userData ? (
                                <div className="flex flex-col items-center gap-3 w-full">
                                    <p className="text-emerald-400 font-semibold font-mono text-sm">
                                        Welcome Back, <span className="underline">{userData.username}</span>!
                                    </p>
                                    <p className="text-gray-400 font-mono text-xs">Role: {userData.role} | Gold: {userData.gold}💰</p>
                                    <button
                                        onClick={onEnterGame}
                                        className="w-full max-w-xs py-3.5 bg-emerald-650 hover:bg-emerald-555 border-b-4 border-emerald-800 active:border-b-0 rounded-xl font-mono font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-955/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                                    >
                                        Enter Helge Village <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 w-full">
                                    <p className="text-amber-400 font-semibold font-mono text-xs">No character found on this wallet.</p>
                                    <button
                                        onClick={onStartOnboarding}
                                        className="w-full max-w-xs py-3.5 bg-amber-600 hover:bg-amber-500 border-b-4 border-amber-800 active:border-b-0 rounded-xl font-mono font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-955/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                                    >
                                        Create Character <Sparkles className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Disconnect helper */}
                            {mounted && (
                                <WalletMultiButton className="!bg-transparent !hover:bg-gray-900/50 !text-gray-500 !hover:text-gray-400 !font-mono !text-xs !font-normal !h-8 !px-4 !border !border-gray-800 !rounded-lg !mt-2" />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer specs */}
                <div className="flex justify-between w-full border-t border-gray-800 pt-6 text-[10px] text-gray-500 font-mono">
                    <span>Solana Devnet</span>
                    <span>v0.2.0</span>
                </div>
            </motion.div>
        </div>
    );
}
