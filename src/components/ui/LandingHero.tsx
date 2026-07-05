'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion, type Variants } from 'framer-motion';
import {
    Sparkles,
    ArrowRight,
    ShieldCheck,
    AlertTriangle,
    Copy,
    Check,
    UserPlus,
    Sprout,
    Fish,
    Pickaxe,
    Users,
    Coins,
    BookOpen,
    Trophy,
    FileText,
} from 'lucide-react';
import { PublicKey } from '@solana/web3.js';

interface LandingHeroProps {
    userData: any;
    isLoading: boolean;
    onStartOnboarding: () => void;
    onEnterGame: () => void;
    onEnterGameAsGuest: () => void;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.09, delayChildren: 0.15 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 18, scale: 0.97 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 260, damping: 22 },
    },
};

const FEATURE_PILLS = [
    { icon: Sprout, label: 'Farming', iconColor: 'text-emerald-600', shadow: 'shadow-[2px_2px_0_0_#047857]' },
    { icon: Fish, label: 'Fishing', iconColor: 'text-sky-600', shadow: 'shadow-[2px_2px_0_0_#0369a1]' },
    { icon: Pickaxe, label: 'Mining', iconColor: 'text-amber-600', shadow: 'shadow-[2px_2px_0_0_#b45309]' },
    { icon: Users, label: 'Multiplayer', iconColor: 'text-pink-600', shadow: 'shadow-[2px_2px_0_0_#be185d]' },
];

/* Game-menu style button: "▶" cursor slides in on hover, like a title-screen menu */
function MenuButton({
    onClick,
    color,
    children,
}: {
    onClick: () => void;
    color: 'orange' | 'emerald' | 'amber' | 'white';
    children: React.ReactNode;
}) {
    const colors = {
        orange: 'bg-orange-500 hover:bg-orange-400 text-white',
        emerald: 'bg-emerald-500 hover:bg-emerald-400 text-white',
        amber: 'bg-amber-500 hover:bg-amber-400 text-white',
        white: 'bg-white hover:bg-slate-100 text-slate-900',
    };
    return (
        <button
            onClick={onClick}
            className={`group relative w-full py-3 md:py-3.5 ${colors[color]} font-pixel text-[11px] md:text-xs rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0_0_#1e293b] hover:-translate-y-0.5 hover:shadow-[5px_6px_0_0_#1e293b] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#1e293b] transition-all cursor-pointer font-bold tracking-wider flex items-center justify-center gap-2`}
        >
            <span className="absolute left-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all font-pixel">
                ▶
            </span>
            {children}
        </button>
    );
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
    const [copied, setCopied] = useState(false);

    const contractAddress = process.env.NEXT_PUBLIC_TOKEN_CA || '3XQ3DEkgy8mPe8Sz97degTmtntJWbm7tiDhh1kMupump';

    const handleCopyCA = async () => {
        try {
            await navigator.clipboard.writeText(contractAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Failed to copy contract address:', err);
        }
    };

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
        <div className="relative flex-1 flex items-center px-4 md:px-10 lg:px-16 overflow-hidden select-none py-2 md:py-4">
            {/* Warm radial glow to lift the title screen off the busy background photo */}
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[120%] max-w-4xl aspect-square rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="w-full max-w-5xl mx-auto z-10 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] items-center gap-8 md:gap-10"
            >
                {/* ===== LEFT COLUMN — game identity ===== */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 md:gap-4">
                    {/* Server status */}
                    <motion.div
                        variants={itemVariants}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border-2 border-slate-900 rounded-full text-slate-900 text-[10px] md:text-xs font-black uppercase tracking-wider shadow-[3px_3px_0_0_#047857]"
                    >
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-900"></span>
                        </span>
                        <span className="text-emerald-600">{onlinePlayers} Online</span>
                        <span className="text-slate-300">|</span>
                        {totalPlayers} Players
                    </motion.div>

                    {/* Logo + Title */}
                    <motion.div variants={itemVariants} className="flex flex-col items-center md:items-start gap-2">
                        <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative w-16 h-16 md:w-20 md:h-20 drop-shadow-[0_5px_0_rgba(0,0,0,0.4)]"
                        >
                            <Image
                                src="/Logo-Transparant.png"
                                alt="Helge Village"
                                fill
                                sizes="80px"
                                priority
                                style={{ objectFit: 'contain' }}
                                className="select-none pointer-events-none"
                            />
                        </motion.div>

                        <h1 className="font-pixel leading-none tracking-tight flex flex-col items-center md:items-start">
                            <span className="text-3xl md:text-5xl lg:text-6xl text-amber-300 drop-shadow-[0_4px_0_#1e293b] [-webkit-text-stroke:1.5px_#1e293b]">
                                HELGE
                            </span>
                            <span className="text-3xl md:text-5xl lg:text-6xl text-white drop-shadow-[0_4px_0_#1e293b] [-webkit-text-stroke:1.5px_#1e293b] mt-1 md:mt-2">
                                VILLAGE
                            </span>
                        </h1>

                        <span className="inline-flex items-center gap-1.5 bg-orange-500 text-white border-2 border-slate-900 rounded-lg px-2.5 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_0_#1e293b] mt-1">
                            <Sparkles className="w-3 h-3" /> A Cozy Web3 Farm on Solana
                        </span>
                    </motion.div>

                    <motion.p
                        variants={itemVariants}
                        className="text-white text-xs md:text-sm font-bold max-w-md font-sans leading-relaxed drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]"
                    >
                        Plant crops, catch fish, mine resources, and build your farming empire together with other players.
                    </motion.p>

                    {/* Gameplay feature pills */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-2.5"
                    >
                        {FEATURE_PILLS.map((pill) => {
                            const PillIcon = pill.icon;
                            return (
                                <span
                                    key={pill.label}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 border-2 border-slate-900 rounded-full text-slate-800 text-[9px] md:text-[10px] font-black uppercase tracking-wider ${pill.shadow} hover:-translate-y-0.5 transition-transform cursor-default`}
                                >
                                    <PillIcon className={`w-3.5 h-3.5 ${pill.iconColor}`} />
                                    {pill.label}
                                </span>
                            );
                        })}
                    </motion.div>

                    {/* CA chip + version */}
                    <motion.div variants={itemVariants} className="flex items-center gap-2 max-w-full">
                        <button
                            onClick={handleCopyCA}
                            title="Copy contract address"
                            className="group inline-flex items-center gap-1.5 min-w-0 px-2.5 py-1 bg-white/85 hover:bg-white border border-slate-900/70 rounded-full text-slate-700 shadow-[1px_1px_0_0_rgba(30,41,59,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer backdrop-blur-sm"
                        >
                            <span className="text-emerald-700 border-r border-slate-300 pr-1.5 text-[8px] md:text-[9px] font-black uppercase tracking-wider shrink-0">CA</span>
                            <span className="font-mono text-[9px] md:text-[10px] truncate font-semibold">{contractAddress}</span>
                            {copied ? (
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : (
                                <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-800 shrink-0" />
                            )}
                        </button>
                        <span className="font-pixel text-[8px] md:text-[9px] text-white/70 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] shrink-0">
                            v0.1
                        </span>
                    </motion.div>
                </div>

                {/* ===== RIGHT COLUMN — main menu ===== */}
                <div className="flex flex-col items-center gap-3 w-full">
                    {/* Blinking PRESS START prompt */}
                    <motion.p
                        variants={itemVariants}
                        className="font-pixel text-white text-[10px] md:text-xs tracking-[0.3em] drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]"
                    >
                        <motion.span
                            animate={{ opacity: [1, 0.15, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                            className="inline-block"
                        >
                            - PRESS START -
                        </motion.span>
                    </motion.p>

                    <motion.div variants={itemVariants} className="relative w-full max-w-xs md:max-w-sm">
                        {/* Decorative floating icon badges */}
                        <motion.span
                            animate={{ y: [0, -7, 0] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                            className="hidden md:flex absolute -left-6 -top-4 w-10 h-10 items-center justify-center bg-amber-300 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0_0_#1e293b] z-20 pointer-events-none"
                        >
                            <Sprout className="w-5 h-5 text-slate-900" />
                        </motion.span>
                        <motion.span
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                            className="hidden md:flex absolute -right-5 -bottom-4 w-10 h-10 items-center justify-center bg-sky-300 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0_0_#1e293b] z-20 pointer-events-none"
                        >
                            <Fish className="w-5 h-5 text-slate-900" />
                        </motion.span>

                        <div className="relative bg-[#fdf6ec] border-[3px] border-slate-900 rounded-3xl px-4 pt-6 pb-4 md:px-5 md:pt-7 md:pb-5 shadow-[8px_8px_0_0_#047857] flex flex-col items-center gap-3 w-full">
                            {/* Ribbon header */}
                            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-500 text-white font-pixel border-2 border-slate-900 rounded-full px-4 py-1 text-[8px] md:text-[9px] uppercase tracking-widest shadow-[2px_2px_0_0_#1e293b]">
                                Main Menu
                            </span>

                            {!mounted ? (
                                <div className="flex flex-col items-center gap-3 w-full">
                                    <div className="w-full h-12 bg-orange-200/70 rounded-2xl animate-pulse border-2 border-slate-300" />
                                    <div className="w-full h-10 bg-slate-200/70 rounded-2xl animate-pulse border-2 border-slate-300" />
                                </div>
                            ) : !connected ? (
                                <div className="flex flex-col items-center gap-3 w-full">
                                    <MenuButton onClick={handlePlayNow} color="orange">
                                        START GAME
                                    </MenuButton>
                                    <MenuButton onClick={onEnterGameAsGuest} color="white">
                                        PLAY AS GUEST
                                    </MenuButton>
                                    <p className="text-slate-600 text-[10px] md:text-xs font-bold mt-0.5">
                                        Connect wallet to save progress, or play as guest <span className="text-orange-600">(Level 1 limit)</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 w-full">
                                    {/* Connected Wallet Info */}
                                    <div className="px-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-black text-slate-800 flex items-center gap-2 shadow-[2px_2px_0_0_#1e293b]">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                        <span className="font-mono">
                                            {publicKey?.toBase58().substring(0, 6)}...{publicKey?.toBase58().substring(publicKey.toBase58().length - 6)}
                                        </span>
                                    </div>

                                    {isCheckingToken ? (
                                        <div className="text-emerald-700 font-pixel text-[9px] md:text-[10px] animate-pulse py-4">
                                            Checking Token Balance...
                                        </div>
                                    ) : tokenBalance !== null && tokenBalance < Number(process.env.NEXT_PUBLIC_REQUIRED_TOKEN_AMOUNT || 400000) ? (
                                        <div className="flex flex-col items-center gap-2 w-full bg-red-100 border-2 border-red-500 rounded-2xl p-4 shadow-[3px_3px_0_0_#dc2626]">
                                            <AlertTriangle className="w-8 h-8 text-red-500 mb-0.5" />
                                            <p className="text-red-600 font-black text-xs text-center uppercase tracking-wide">
                                                Access Denied
                                            </p>
                                            <p className="text-slate-700 text-[10px] text-center font-semibold">
                                                You need at least {Number(process.env.NEXT_PUBLIC_REQUIRED_TOKEN_AMOUNT || 400000).toLocaleString()} Helge tokens to play.
                                                <br />
                                                Your balance: <span className="font-bold">{tokenBalance.toLocaleString()}</span>
                                            </p>
                                        </div>
                                    ) : isLoading ? (
                                        <div className="text-emerald-700 font-pixel text-[9px] md:text-[10px] animate-pulse py-2">
                                            Loading Save Data...
                                        </div>
                                    ) : userData ? (
                                        <div className="flex flex-col items-center gap-3 w-full">
                                            {/* Save slot */}
                                            <div className="w-full text-left bg-emerald-100 border-2 border-slate-900 rounded-2xl py-2 px-3 shadow-[3px_3px_0_0_#1e293b]">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-pixel text-emerald-700 uppercase tracking-wider">Save Slot 1</span>
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase">{userData.role}</span>
                                                </div>
                                                <div className="text-slate-800 text-sm font-black mt-0.5">
                                                    {userData.username}
                                                </div>
                                                <div className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                                                    <Coins className="w-3 h-3 text-amber-500" /> {userData.gold} Gold
                                                </div>
                                            </div>

                                            <MenuButton onClick={onEnterGame} color="emerald">
                                                CONTINUE <ArrowRight className="w-4 h-4" />
                                            </MenuButton>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 w-full">
                                            <p className="text-orange-700 font-black text-xs flex items-center gap-1.5">
                                                <UserPlus className="w-4 h-4" /> No save data on this wallet.
                                            </p>
                                            <MenuButton onClick={onStartOnboarding} color="amber">
                                                NEW GAME <Sparkles className="w-4 h-4" />
                                            </MenuButton>
                                        </div>
                                    )}

                                    {/* Disconnect helper */}
                                    {mounted && (
                                        <WalletMultiButton className="!bg-white hover:!bg-slate-100 !text-slate-700 hover:!text-slate-900 !font-sans !text-xs !font-bold !h-9 !px-4 !border-2 !border-slate-900 !rounded-xl !shadow-[2px_2px_0_0_#1e293b] active:!translate-y-[1px] active:!shadow-none !transition-all" />
                                    )}
                                </div>
                            )}

                            {/* Secondary menu — replaces the old navbar links */}
                            <div className="w-full flex items-center gap-3 text-slate-400 mt-1">
                                <span className="flex-1 h-px bg-slate-300" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Menu</span>
                                <span className="flex-1 h-px bg-slate-300" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Link
                                    href="/how-to-play"
                                    className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white border-2 border-slate-900 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wide text-slate-700 shadow-[2px_2px_0_0_#1e293b] hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-[1px] active:shadow-none transition-all"
                                >
                                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> How to Play
                                </Link>
                                <Link
                                    href="/leaderboard"
                                    className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white border-2 border-slate-900 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wide text-slate-700 shadow-[2px_2px_0_0_#1e293b] hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-[1px] active:shadow-none transition-all"
                                >
                                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> Leaderboard
                                </Link>
                                <Link
                                    href="/docs"
                                    className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white border-2 border-slate-900 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wide text-slate-700 shadow-[2px_2px_0_0_#1e293b] hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-[1px] active:shadow-none transition-all"
                                >
                                    <FileText className="w-3.5 h-3.5 text-sky-600" /> Docs
                                </Link>
                                <a
                                    href="https://x.com/helgevillage"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white border-2 border-slate-900 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wide text-slate-700 shadow-[2px_2px_0_0_#1e293b] hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-[1px] active:shadow-none transition-all"
                                >
                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    Follow on X
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
