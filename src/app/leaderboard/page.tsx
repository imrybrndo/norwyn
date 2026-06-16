'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Coins, Award, Timer, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface LeaderboardEntry {
    rank: number;
    address: string;
    username: string;
    level: number;
    gold: number;
}

export default function LeaderboardPage() {
    const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 11, minutes: 48, seconds: 20 });

    // Dummy Countdown logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                } else if (prev.hours > 0) {
                    return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                } else if (prev.days > 0) {
                    return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
                }
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const mockStandings: LeaderboardEntry[] = [
        { rank: 1, address: 'FvKz...8d2A', username: 'Alice.sol', level: 42, gold: 9820 },
        { rank: 2, address: '6jHn...pQ3S', username: 'Bob.sol', level: 38, gold: 7450 },
        { rank: 3, address: '9KLm...R90x', username: 'SolFarmNode', level: 35, gold: 6100 },
        { rank: 4, address: '3vYt...1a9B', username: 'DeFiFarming', level: 31, gold: 5420 },
        { rank: 5, address: 'Ar5T...L8sK', username: '0xSeedMaster', level: 28, gold: 4950 },
        { rank: 6, address: '7nGh...6yUt', username: 'SolanaMaxi', level: 25, gold: 4200 },
        { rank: 7, address: '8hJn...oP02', username: 'CozyPlayer1', level: 22, gold: 3850 },
        { rank: 8, address: 'K2lP...r5Ty', username: 'HelgeVillager', level: 19, gold: 3120 },
    ];

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-amber-400 text-slate-800 border-slate-800 shadow-[1px_1px_0_0_#1e293b] font-bold';
            case 2:
                return 'bg-slate-300 text-slate-800 border-slate-800 shadow-[1px_1px_0_0_#1e293b] font-bold';
            case 3:
                return 'bg-amber-600 text-white border-slate-800 shadow-[1px_1px_0_0_#1e293b] font-bold';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#eaf6ec] text-slate-850 font-sans select-none pb-12">
            <Navbar />

            {/* Back Button & Main Header */}
            <main className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-10 flex-grow">
                <div className="mb-8 flex flex-col items-center text-center">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-800 shadow-[2px_2px_0_0_#1e293b] hover:translate-y-px hover:shadow-[1px_1px_0_0_#1e293b] mb-6"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                    </Link>

                    <div className="w-16 h-16 bg-amber-100 border-2 border-slate-800 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_0_#1e293b] mb-4">
                        <Trophy className="w-8 h-8 text-amber-500" />
                    </div>

                    <h1 className="text-2xl md:text-4xl font-pixel text-slate-800 tracking-tight">
                        Leaderboard & Rewards
                    </h1>
                    <p className="text-slate-600 text-sm md:text-base font-semibold mt-2 max-w-md">
                        Compete with other villagers, grow your farm, and secure your place on the Helge hall of fame!
                    </p>
                </div>

                {/* Grid Layout: Rewards Card & Standings Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    
                    {/* Left Column: Reward Info & Countdown (1/3 width) */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-2 border-slate-800 bg-amber-50 shadow-[4px_4px_0_0_#1e293b] rounded-3xl p-6">
                            <CardHeader className="p-0 pb-4 border-b border-amber-200">
                                <CardTitle className="font-pixel text-xs md:text-sm text-slate-850 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-600" />
                                    Reward Round 1
                                </CardTitle>
                                <CardDescription className="text-slate-600 font-semibold text-xs mt-1">
                                    Top players will share a pool of in-game goodies & tokens!
                                </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="p-0 py-6 flex flex-col items-center gap-4">
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <Timer className="w-3.5 h-3.5 text-slate-400" />
                                    Round ends in:
                                </div>
                                <div className="flex gap-2">
                                    {[
                                        { val: timeLeft.days, label: 'd' },
                                        { val: timeLeft.hours, label: 'h' },
                                        { val: timeLeft.minutes, label: 'm' },
                                        { val: timeLeft.seconds, label: 's' }
                                    ].map((t, idx) => (
                                        <div key={idx} className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-white border border-slate-800 rounded-xl flex items-center justify-center font-pixel text-xs md:text-sm text-slate-850 shadow-[2px_2px_0_0_#1e293b]">
                                                {String(t.val).padStart(2, '0')}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-500 mt-1">{t.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter className="p-0 border-t border-amber-250 pt-4 flex flex-col gap-2.5 bg-transparent">
                                <div className="text-xs font-semibold text-slate-650 leading-relaxed">
                                    💰 <strong className="text-slate-800">50,000 Gold Pool</strong> will be distributed to the Top 10 players based on gold holdings and level multipliers.
                                </div>
                                <div className="w-full py-2 bg-amber-100 border border-slate-800 rounded-xl text-[9px] font-bold text-amber-800 flex items-center gap-1.5 px-3">
                                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                    Free F2P round. No deposit needed.
                                </div>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Right Column: Standings Table (2/3 width) */}
                    <div className="md:col-span-2">
                        <Card className="border-2 border-slate-800 bg-white shadow-[6px_6px_0_0_#1e293b] rounded-3xl p-6">
                            <CardHeader className="p-0 pb-4 border-b border-slate-100 mb-4">
                                <CardTitle className="font-pixel text-xs md:text-sm text-slate-855">
                                    Current Standings
                                </CardTitle>
                                <CardDescription className="text-slate-500 font-semibold text-xs mt-1">
                                    Real-time snapshot of the highest rank farmers.
                                </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                            <TableHead className="font-bold text-slate-500 w-16">Rank</TableHead>
                                            <TableHead className="font-bold text-slate-500">Villager</TableHead>
                                            <TableHead className="font-bold text-slate-500 text-center w-24">Level</TableHead>
                                            <TableHead className="font-bold text-slate-500 text-right w-32">Gold Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockStandings.map((user) => (
                                            <TableRow key={user.rank} className="border-b border-slate-50 hover:bg-slate-55/50">
                                                <TableCell className="font-pixel text-[10px] md:text-xs">
                                                    <Badge className={`px-2.5 py-1 text-[10px] border ${getRankStyle(user.rank)}`}>
                                                        #{user.rank}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 text-sm">{user.username}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium font-mono">{user.address}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-slate-700 text-sm">
                                                    Lv. {user.level}
                                                </TableCell>
                                                <TableCell className="text-right font-pixel text-[10px] text-amber-600 font-bold">
                                                    {user.gold.toLocaleString()}💰
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>

            {/* Simple Footer */}
            <footer className="w-full max-w-5xl mx-auto border-t border-slate-200 mt-12 py-8 text-center text-xs text-slate-450 font-bold px-4">
                &copy; {new Date().getFullYear()} Helge Village. All Rights Reserved. Built on Solana.
            </footer>
        </div>
    );
}
