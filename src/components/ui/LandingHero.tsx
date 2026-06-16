'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { Sparkles, Gamepad2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from './card';
import { Button } from './button';

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
    const { setVisible } = useWalletModal();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handlePlayNow = () => {
        if (!connected) {
            setVisible(true);
        } else if (userData) {
            onEnterGame();
        } else {
            onStartOnboarding();
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-[80vh] text-center px-4 overflow-hidden select-none py-12">
            {/* Ambient Background Decorative Grid (Subtle retro detail) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-2xl z-10"
            >
                <Card className="border-2 border-slate-800 bg-white text-slate-800 shadow-[8px_8px_0_0_#1e293b] rounded-3xl p-6 md:p-10 flex flex-col items-center gap-6">
                    {/* Game Badge */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 border border-slate-800 rounded-full text-emerald-800 text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_0_#1e293b]"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Web3 Cozy Farming Sim
                    </motion.div>

                    {/* Game Title & Headings */}
                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-5xl font-pixel text-slate-800 leading-tight tracking-tight mt-2">
                            Build Your <br />
                            <span className="text-emerald-600">Cozy Empire</span>
                        </h1>
                        
                        <p className="text-slate-650 text-sm md:text-base font-bold max-w-xl mx-auto font-sans leading-relaxed">
                            Plant crops 🌾 raise animals 🐮 catch fish 🎣 trade with friends, and start your Web3 farming adventure on Solana!
                        </p>
                    </div>

                    {/* Pixel Art Styled Floating Logo Icon */}
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                        className="my-3"
                    >
                        <div className="relative w-20 h-20 bg-amber-50 border-2 border-slate-800 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_0_#1e293b]">
                            <Gamepad2 className="w-10 h-10 text-amber-500" />
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-slate-800 animate-ping" />
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-slate-800" />
                        </div>
                    </motion.div>

                    {/* Main CTA & Wallet Controls */}
                    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                        {!mounted ? (
                            <div className="w-full h-24 bg-slate-100 rounded-2xl animate-pulse border-2 border-slate-200" />
                        ) : !connected ? (
                            <div className="flex flex-col items-center gap-3 w-full">
                                <button
                                    onClick={handlePlayNow}
                                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-pixel text-xs md:text-sm rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_#1e293b] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#1e293b] transition-all cursor-pointer font-bold tracking-wider"
                                >
                                    PLAY NOW
                                </button>
                                <p className="text-slate-500 text-[10px] md:text-xs font-semibold">
                                    Connect your Solana wallet to begin your journey
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 w-full">
                                {/* Connected Wallet Info */}
                                <div className="px-4 py-2 bg-slate-50 border border-slate-800 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 shadow-[2px_2px_0_0_#1e293b]">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    <span>
                                        {publicKey?.toBase58().substring(0, 6)}...{publicKey?.toBase58().substring(publicKey.toBase58().length - 6)}
                                    </span>
                                </div>

                                {isLoading ? (
                                    <div className="text-emerald-600 font-pixel text-[9px] md:text-[10px] animate-pulse">
                                        Loading Character Profile...
                                    </div>
                                ) : userData ? (
                                    <div className="flex flex-col items-center gap-3.5 w-full">
                                        <div className="text-slate-800 text-xs md:text-sm font-bold bg-emerald-50 border border-slate-800 rounded-xl py-2.5 px-4 shadow-[2px_2px_0_0_#1e293b]">
                                            Welcome Back, <span className="text-emerald-650 underline font-black">{userData.username}</span>!
                                            <div className="text-[10px] text-slate-500 font-semibold mt-1">
                                                Role: {userData.role} | Gold: {userData.gold} 💰
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={onEnterGame}
                                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-pixel text-[11px] md:text-xs rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_#1e293b] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#1e293b] transition-all cursor-pointer flex items-center justify-center gap-2 font-bold"
                                        >
                                            Enter Helge Village <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3.5 w-full">
                                        <p className="text-amber-600 font-bold text-xs">
                                            No character found on this wallet.
                                        </p>
                                        <button
                                            onClick={onStartOnboarding}
                                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-pixel text-[11px] md:text-xs rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_#1e293b] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#1e293b] transition-all cursor-pointer flex items-center justify-center gap-2 font-bold"
                                        >
                                            Create Character <Sparkles className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Disconnect helper */}
                                {mounted && (
                                    <WalletMultiButton className="!bg-transparent hover:!bg-slate-100 !text-slate-500 hover:!text-slate-700 !font-sans !text-xs !font-bold !h-9 !px-4 !border-2 !border-slate-800 !rounded-xl !mt-2 !shadow-[2px_2px_0_0_#1e293b] active:!translate-y-[1px] active:!shadow-none !transition-all" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Specs Footer */}
                    <div className="flex justify-between w-full border-t border-slate-200 pt-6 text-[10px] text-slate-400 font-bold">
                        <span>Solana Devnet</span>
                        <span>v0.2.0</span>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
