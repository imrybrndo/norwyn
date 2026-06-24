'use client';

import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { Sparkles, Gamepad2, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { Button } from './button';

interface LandingHeroProps {
    userData: any;
    isLoading: boolean;
    onStartOnboarding: () => void;
    onEnterGame: () => void;
    onEnterGameAsGuest: () => void;
}

export default function LandingHero({
    userData,
    isLoading,
    onStartOnboarding,
    onEnterGame,
    onEnterGameAsGuest,
}: LandingHeroProps) {
    const { connection } = useConnection();
    const { connected, publicKey } = useWallet();
    const { setVisible } = useWalletModal();
    const [mounted, setMounted] = useState(false);
    const [onlinePlayers, setOnlinePlayers] = useState(0);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [tokenBalance, setTokenBalance] = useState<number | null>(null);
    const [isCheckingToken, setIsCheckingToken] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchOnlinePlayers = async () => {
            try {
                const res = await fetch('/api/online-count');
                const data = await res.json();
                setOnlinePlayers(data.online ?? 0);
                setTotalPlayers(data.total ?? 0);
            } catch (err) {
                console.error('Error fetching online count:', err);
            }
        };

        fetchOnlinePlayers();
        const interval = setInterval(fetchOnlinePlayers, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const checkBalance = async () => {
            if (!connected || !publicKey) {
                setTokenBalance(null);
                return;
            }

            const tokenCA = process.env.NEXT_PUBLIC_TOKEN_CA;
            if (!tokenCA) {
                // If no CA is configured, we can assume balance is sufficient or ignore check
                setTokenBalance(Infinity);
                return;
            }

            setIsCheckingToken(true);
            try {
                const mintPubKey = new PublicKey(tokenCA);
                const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
                    mint: mintPubKey,
                });

                let totalAmount = 0;
                for (const accountInfo of response.value) {
                    const amountStr = accountInfo.account.data.parsed.info.tokenAmount.uiAmountString;
                    totalAmount += parseFloat(amountStr) || 0;
                }

                setTokenBalance(totalAmount);
            } catch (error) {
                console.error('Error checking token balance:', error);
                setTokenBalance(0);
            } finally {
                setIsCheckingToken(false);
            }
        };

        checkBalance();
    }, [connected, publicKey, connection]);

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
        <div className="relative flex-1 flex flex-col items-center justify-center text-center px-4 overflow-hidden select-none py-2 md:py-4">
            {/* Ambient Background Decorative Grid has been moved to BackgroundSlider or omitted, leaving transparent to let BackgroundSlider show */}

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-2xl z-10 flex flex-col items-center gap-4 md:gap-5"
            >
                <div className="justify-center items-center gap-3">


                    {/* Online Players Badge */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 border border-slate-700 rounded-full text-white text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_0_#000]"
                    >
                        <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </div>
                        {onlinePlayers} Online | {totalPlayers} Total Players
                    </motion.div>
                </div>

                {/* Game Title & Headings */}
                <div className="space-y-2 md:space-y-3">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-pixel text-white leading-tight tracking-tight mt-1 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                        Build Your <br />
                        <span className="text-emerald-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">Cozy Empire</span>
                    </h1>

                    <p className="text-slate-250 text-white text-xs md:text-sm font-bold max-w-lg mx-auto font-sans leading-relaxed drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                        Plant crops 🌾 catch fish 🎣 and start your Web3 farming adventure on Solana!
                    </p>
                </div>

                {/* Pixel Art Styled Floating Logo Icon */}
                {/* <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="my-1 md:my-2"
                >
                    <div className="relative w-14 h-14 md:w-16 md:h-16 bg-slate-900/80 border-2 border-slate-700 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_0_#000]">
                        <Gamepad2 className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-800 animate-ping" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-800" />
                    </div>
                </motion.div> */}

                {/* Main CTA & Wallet Controls */}
                <div className="flex flex-col items-center gap-3 w-full max-w-xs md:max-w-sm">
                    {!mounted ? (
                        <div className="w-full h-24 bg-slate-900/40 rounded-2xl animate-pulse border-2 border-slate-800" />
                    ) : !connected ? (
                        <div className="flex flex-col items-center gap-3 w-full">
                            <button
                                onClick={handlePlayNow}
                                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-pixel text-xs rounded-2xl border-2 border-slate-955 shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] transition-all cursor-pointer font-bold tracking-wider"
                            >
                                PLAY NOW
                            </button>
                            <button
                                onClick={onEnterGameAsGuest}
                                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-pixel text-xs rounded-2xl border-2 border-slate-950 shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] transition-all cursor-pointer font-bold tracking-wider"
                            >
                                PLAY AS GUEST
                            </button>
                            <p className="text-slate-300 text-[10px] md:text-xs font-semibold mt-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                                Connect wallet to save progress, or play as guest (Level 1 limit)
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 w-full">
                            {/* Connected Wallet Info */}
                            <div className="px-4 py-1.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2 shadow-[2px_2px_0_0_#000]">
                                <ShieldCheck className="w-4 h-4 text-emerald-450" />
                                <span>
                                    {publicKey?.toBase58().substring(0, 6)}...{publicKey?.toBase58().substring(publicKey.toBase58().length - 6)}
                                </span>
                            </div>

                            {isCheckingToken ? (
                                <div className="text-emerald-400 font-pixel text-[9px] md:text-[10px] animate-pulse py-4">
                                    Checking Token Balance...
                                </div>
                            ) : tokenBalance !== null && tokenBalance < Number(process.env.NEXT_PUBLIC_REQUIRED_TOKEN_AMOUNT || 400000) ? (
                                <div className="flex flex-col items-center gap-3 w-full bg-red-950/40 border border-red-500/40 rounded-xl p-4">
                                    <AlertTriangle className="w-8 h-8 text-red-500 mb-1" />
                                    <p className="text-red-400 font-bold text-xs text-center">
                                        Access Denied
                                    </p>
                                    <p className="text-slate-300 text-[10px] text-center">
                                        You need at least {Number(process.env.NEXT_PUBLIC_REQUIRED_TOKEN_AMOUNT || 400000).toLocaleString()} Helge tokens to play.
                                        <br />
                                        Your balance: {tokenBalance.toLocaleString()}
                                    </p>
                                </div>
                            ) : isLoading ? (
                                <div className="text-emerald-400 font-pixel text-[9px] md:text-[10px] animate-pulse">
                                    Loading Character Profile...
                                </div>
                            ) : userData ? (
                                <div className="flex flex-col items-center gap-3 w-full">
                                    <div className="text-slate-200 text-xs md:text-sm font-bold bg-emerald-950/60 border border-emerald-500/40 rounded-xl py-2 px-3 shadow-[2px_2px_0_0_#000]">
                                        Welcome Back, <span className="text-emerald-400 underline font-black">{userData.username}</span>!
                                        <div className="text-[10px] text-slate-400 font-semibold mt-1">
                                            Role: {userData.role} | Gold: {userData.gold} 💰
                                        </div>
                                    </div>

                                    <button
                                        onClick={onEnterGame}
                                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-pixel text-[11px] md:text-xs rounded-2xl border-2 border-slate-950 shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] transition-all cursor-pointer flex items-center justify-center gap-2 font-bold"
                                    >
                                        Enter Helge Village <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 w-full">
                                    <p className="text-amber-400 font-bold text-xs drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                                        No character found on this wallet.
                                    </p>
                                    <button
                                        onClick={onStartOnboarding}
                                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-pixel text-[11px] md:text-xs rounded-2xl border-2 border-slate-955 shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] transition-all cursor-pointer flex items-center justify-center gap-2 font-bold"
                                    >
                                        Create Character <Sparkles className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Disconnect helper */}
                            {mounted && (
                                <WalletMultiButton className="!bg-transparent hover:!bg-slate-800/40 !text-slate-300 hover:!text-white !font-sans !text-xs !font-bold !h-9 !px-4 !border-2 !border-slate-700 !rounded-xl !mt-1 !shadow-[2px_2px_0_0_#000] active:!translate-y-[1px] active:!shadow-none !transition-all" />
                            )}
                        </div>
                    )}
                </div>        
            </motion.div>
        </div>
    );
}
