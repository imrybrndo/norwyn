'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Sprout, Axe, Palette, Coins, Info } from 'lucide-react';

export default function HowToPlay() {
    const cards = [
        {
            icon: Sprout,
            title: 'Plant & Harvest',
            description: 'Grow 11 different types of crops through 5 detailed growth stages. Water daily and harvest fresh produce to sell or use.',
            badge: 'Farming',
            gradient: 'from-emerald-100/30 to-transparent',
            border: 'border-emerald-200 hover:border-emerald-400',
            iconColor: 'text-emerald-600 bg-emerald-100',
        },
        {
            icon: Axe,
            title: 'Action & Professions',
            description: 'Engage in fishing, woodcutting, or mining. Master over 20 unique character actions to gather valuable resources.',
            badge: 'Gathering',
            gradient: 'from-amber-100/30 to-transparent',
            border: 'border-amber-200 hover:border-amber-400',
            iconColor: 'text-amber-600 bg-amber-100',
        },
        {
            icon: Palette,
            title: 'Customize Character',
            description: 'Express yourself with 7 animated hairstyles and infinite color adjustments to make your villager truly unique.',
            badge: 'Cosmetics',
            gradient: 'from-pink-100/30 to-transparent',
            border: 'border-pink-200 hover:border-pink-400',
            iconColor: 'text-pink-600 bg-pink-100',
        },
    ];

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const cardVariants: Variants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.6,
                ease: 'easeOut',
            },
        },
    };

    return (
        <section id="features" className="w-full max-w-7xl mx-auto px-6 py-16 relative select-none">
            {/* Heading */}
            <div className="text-center mb-16 relative z-10">
                <motion.h2 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-2xl md:text-4xl font-pixel text-slate-800 tracking-tight"
                >
                    Discover Norwyn Village
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-slate-500 max-w-xl mx-auto text-sm md:text-base mt-4 font-semibold"
                >
                    A cozy, gamified pasture where retro pixel art meets secure EVM Web3 technology.
                </motion.p>
            </div>

            {/* Features Bento Grid */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 mb-12"
            >
                {cards.map((card, i) => {
                    const CardIcon = card.icon;

                    return (
                        <motion.div
                            key={i}
                            variants={cardVariants}
                            whileHover={{ y: -6 }}
                            className={`bg-white/80 backdrop-blur-md border-4 ${card.border} rounded-3xl p-8 flex flex-col justify-between group bento-card-shadow hover:bento-card-shadow-hover transition-all duration-300 relative overflow-hidden`}
                        >
                            {/* Inner Background Glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50 pointer-events-none`} />
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3.5 rounded-2xl border-2 border-slate-100 ${card.iconColor} group-hover:scale-105 transition-transform duration-300`}>
                                        <CardIcon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full border-2 border-slate-100">
                                        {card.badge}
                                    </span>
                                </div>

                                <h3 className="font-pixel text-sm text-slate-800 mb-3 group-hover:text-emerald-700 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="font-sans text-sm font-semibold text-slate-600 leading-relaxed">
                                    {card.description}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Web3 & Tokenomics Disclaimer Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative z-10 bg-white/90 backdrop-blur-md border-4 border-slate-100 rounded-3xl p-8 md:p-10 bento-card-shadow"
            >
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                    <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl text-orange-600 shrink-0">
                        <Coins className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="font-pixel text-sm md:text-base text-slate-800 flex items-center gap-2">
                            Web3 & Tokenomics Integration
                        </h3>
                        
                        <div className="space-y-3 font-sans text-sm font-semibold text-slate-600 leading-relaxed">
                            <p>
                                Norwyn Village features an active Web3 economy utilizing crypto assets (ERC-20 tokens on Robinhood Chain) to coordinate in-game progression and reward systems.
                            </p>
                            {/* <p className="border-l-4 border-orange-400 pl-4 py-1 bg-orange-50/50 rounded-r-xl">
                                <strong className="text-slate-800">Important:</strong> In compliance with our creator assets license, there are absolutely <span className="text-orange-600 underline decoration-2">NO sales of visual assets, character skins, or environment designs as NFTs</span>. Everything is earned through gameplay!
                            </p> */}
                            
                            <div className="pt-4 border-t-2 border-slate-100 flex items-start gap-2 text-xs text-slate-500 font-bold">
                                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <p>
                                    Norwyn Village is entirely free to play. Content in this game is Not Financial Advice (NFA). We encourage all players to prioritize relaxing and casual gameplay.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
