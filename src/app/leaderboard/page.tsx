'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft } from 'lucide-react';
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
    playtime: number;
}

export default function LeaderboardPage() {
    const [standings, setStandings] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch('/api/leaderboard');
                const data = await res.json();
                if (Array.isArray(data)) {
                    const mapped: LeaderboardEntry[] = data.map((user: any, index: number) => ({
                        rank: index + 1,
                        address: user.walletAddress ? `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 6)}` : 'Guest',
                        username: user.username || 'Anonymous',
                        level: user.level || 1,
                        gold: user.gold || 0,
                        playtime: user.totalPlaytime || 0
                    }));
                    setStandings(mapped);
                }
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

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

    const formatPlaytime = (ms: number) => {
        if (!ms) return '0m';
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
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
                        Leaderboard
                    </h1>
                    <p className="text-slate-600 text-sm md:text-base font-semibold mt-2 max-w-md">
                        Compete with other villagers, grow your farm, and secure your place on the Helge hall of fame!
                    </p>
                </div>

                {/* Standings Table Card (Centered & Max 3xl) */}
                <div className="w-full max-w-3xl mx-auto">
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
                                            <TableHead className="font-bold text-slate-500 text-center w-32">Playtime</TableHead>
                                            <TableHead className="font-bold text-slate-500 text-right w-32">Gold Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 font-semibold text-slate-500">
                                                    Loading Leaderboard...
                                                </TableCell>
                                            </TableRow>
                                        ) : standings.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 font-semibold text-slate-500">
                                                    No players found. Start playing to rank up!
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            standings.map((user) => (
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
                                                    <TableCell className="text-center font-bold text-slate-500 text-xs">
                                                        {formatPlaytime(user.playtime || 0)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-pixel text-[10px] text-amber-600 font-bold">
                                                        {user.gold.toLocaleString()}💰
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="w-full max-w-5xl mx-auto border-t border-slate-200 mt-12 py-8 text-center text-xs text-slate-450 font-bold px-4">
                &copy; {new Date().getFullYear()} Helge Village. All Rights Reserved. Built on Solana.
            </footer>
        </div>
    );
}
