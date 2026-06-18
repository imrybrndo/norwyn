'use client';

import React from 'react';
import { X, Award, Clock } from 'lucide-react';

interface RankingEntry {
    rank: number;
    username: string;
    walletAddress: string;
    totalPlaytime: number;
}

interface PlaytimeRankingModalProps {
    isOpen: boolean;
    onClose: () => void;
    rankingData: RankingEntry[];
}

export default function PlaytimeRankingModal({ isOpen, onClose, rankingData }: PlaytimeRankingModalProps) {
    if (!isOpen) return null;

    const formatPlaytime = (seconds: number) => {
        if (!seconds || seconds <= 0) return '0s';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        let parts = [];
        if (hrs > 0) parts.push(`${hrs}h`);
        if (mins > 0) parts.push(`${mins}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
        return parts.join(' ');
    };

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return 'text-amber-400 font-extrabold border-amber-500 bg-amber-500/10';
            case 2:
                return 'text-slate-300 font-bold border-slate-400 bg-slate-400/10';
            case 3:
                return 'text-amber-600 font-bold border-amber-700 bg-amber-700/10';
            default:
                return 'text-gray-400 border-slate-800 bg-slate-800/10';
        }
    };

    const truncateWallet = (address: string) => {
        if (!address) return '';
        if (address.length <= 10) return address;
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto z-50 flex items-center justify-center">
            <div className="bg-gray-900 border-4 border-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 text-white retro-shadow relative animate-scale-in">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <h2 className="text-base font-bold text-amber-400 uppercase tracking-widest mb-4 border-b-4 border-gray-800 pb-2 flex items-center gap-2">
                    <Award className="w-5 h-5" /> Top Played Time
                </h2>

                {/* Leaderboard Table/List */}
                <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
                    {rankingData.length === 0 ? (
                        <p className="text-gray-500 italic text-center py-8">Loading leaderboard data...</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {rankingData.map((player) => {
                                const isTopThree = player.rank <= 3;
                                return (
                                    <div 
                                        key={player.rank}
                                        className={`flex items-center justify-between p-3 border-2 rounded-xl bg-slate-950/80 transition-all ${
                                            isTopThree ? 'border-slate-800' : 'border-slate-900/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Rank Badge */}
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border-2 ${getRankStyle(player.rank)}`}>
                                                {player.rank}
                                            </div>

                                            {/* User Details */}
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs">
                                                    {player.username}
                                                </span>
                                                {player.walletAddress && (
                                                    <span className="text-[8px] text-gray-500 font-mono">
                                                        {truncateWallet(player.walletAddress)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Playtime */}
                                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                                            <span>{formatPlaytime(player.totalPlaytime)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer description pane */}
                <div className="bg-slate-955 border-4 border-slate-800 p-3 rounded-xl mt-4 text-[9px] text-gray-400 flex items-start gap-2">
                    <span className="text-base mt-0.5">ℹ️</span>
                    <div>
                        <h4 className="font-bold text-slate-300 text-[10px] mb-0.5">Playtime Tracking</h4>
                        <p>Total time spent playing in multiplayer matches. Leaderboard updates when users exit the session.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
