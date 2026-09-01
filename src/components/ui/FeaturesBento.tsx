'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Axe, Palette, Coins, Info } from 'lucide-react';
import { Card, CardContent } from './card';

export default function FeaturesBento() {
    const cards = [
        {
            icon: Sprout,
            title: 'Plant & Harvest',
            description: 'Grow 11 different types of crops through 5 detailed growth stages. Water daily and harvest fresh produce to sell or use.',
            badge: 'Farming',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600 bg-emerald-100',
        },
        {
            icon: Axe,
            title: 'Action & Professions',
            description: 'Engage in fishing, woodcutting, or mining. Master over 20 unique character actions to gather valuable resources.',
            badge: 'Gathering',
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600 bg-amber-100',
        },
        {
            icon: Palette,
            title: 'Customize Character',
            description: 'Express yourself with 7 animated hairstyles and infinite color adjustments to make your villager truly unique.',
            badge: 'Cosmetics',
            bgColor: 'bg-pink-50',
            iconColor: 'text-pink-600 bg-pink-100',
        },
    ];

    return (
        <section id="features" className="w-full max-w-5xl mx-auto px-4 md:px-6 py-12 relative select-none">
            {/* Heading */}
            <div className="text-center mb-10 relative z-10">
                <h2 className="text-xl md:text-3xl font-pixel text-slate-800 tracking-tight">
                    Discover Norwyn Village
                </h2>
                <p className="text-slate-600 max-w-xl mx-auto text-xs md:text-sm mt-3 font-semibold">
                    A cozy, gamified pasture where retro pixel art meets secure EVM Web3 technology.
                </p>
            </div>

            {/* Features Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
                {cards.map((card, i) => {
                    const CardIcon = card.icon;
                    return (
                        <motion.div
                            key={i}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="border-2 border-slate-800 bg-white shadow-[4px_4px_0_0_#1e293b] rounded-3xl p-6 h-full flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-3 rounded-2xl border border-slate-800 ${card.iconColor} shadow-[2px_2px_0_0_#1e293b]`}>
                                            <CardIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[9px] uppercase font-black tracking-widest text-slate-550 bg-slate-100 px-3 py-1 rounded-full border border-slate-800 shadow-[1px_1px_0_0_#1e293b]">
                                            {card.badge}
                                        </span>
                                    </div>

                                    <h3 className="font-pixel text-[11px] md:text-xs text-slate-800 leading-tight pt-2">
                                        {card.title}
                                    </h3>
                                    <p className="font-sans text-xs md:text-sm font-semibold text-slate-600 leading-relaxed">
                                        {card.description}
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Web3 & Tokenomics Disclaimer Section */}
            <Card className="border-2 border-slate-800 bg-white shadow-[6px_6px_0_0_#1e293b] rounded-3xl p-6 md:p-8 relative z-10">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="p-4 bg-orange-50 border border-slate-800 rounded-2xl text-orange-600 shrink-0 shadow-[2px_2px_0_0_#1e293b]">
                        <Coins className="w-7 h-7" />
                    </div>
                    
                    <div className="space-y-4 w-full">
                        <h3 className="font-pixel text-[11px] md:text-xs text-slate-800 flex items-center gap-2">
                            Web3 & Tokenomics Integration
                        </h3>
                        
                        <div className="space-y-3 font-sans text-xs md:text-sm font-semibold text-slate-600 leading-relaxed">
                            <p>
                                Norwyn Village features an active Web3 economy utilizing crypto assets (ERC-20 tokens on Robinhood Chain) to coordinate in-game progression and reward systems.
                            </p>
                            {/* <p className="border-l-4 border-orange-400 pl-4 py-1.5 bg-orange-50/50 rounded-r-xl border-r border-t border-b border-slate-200">
                                <strong className="text-slate-800">Important:</strong> In compliance with our creator assets license, there are absolutely <span className="text-orange-650 underline font-bold">NO sales of visual assets, character skins, or environment designs as NFTs</span>. Everything is earned through gameplay!
                            </p> */}
                            
                            <div className="pt-4 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-505 font-bold">
                                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <p>
                                    Norwyn Village is entirely free to play. Content in this game is Not Financial Advice (NFA). We encourage all players to prioritize relaxing and casual gameplay.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </section>
    );
}
