'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Sprout, Axe, Fish, Wallet, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function HowToPlay() {
    const cards = [
        {
            icon: Sprout,
            title: 'Agriculture (Pertanian)',
            description: 'Plant seeds, water your crops daily, and watch them grow. Harvest ripe crops to earn gold or consume them for energy and health.',
            badge: 'Farmer Special',
            gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
            border: 'border-emerald-500/30 hover:border-emerald-500/60',
            iconColor: 'text-emerald-400',
        },
        {
            icon: Axe,
            title: 'Forestry (Kehutanan)',
            description: 'Use your Axe to clear trees around the map. Collect wood, craft materials, and complete high-value contracts.',
            badge: 'Woodcutter Special',
            gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
            border: 'border-amber-500/30 hover:border-amber-500/60',
            iconColor: 'text-amber-400',
        },
        {
            icon: Fish,
            title: 'Deep Water Fishing',
            description: 'Cast your line in local waters. Catch different fish species ranging from common mackerels to legendary golden koi.',
            badge: 'Fisher Special',
            gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
            border: 'border-blue-500/30 hover:border-blue-500/60',
            iconColor: 'text-blue-400',
        },
        {
            icon: Wallet,
            title: 'Web3 Economy Integration',
            description: 'Connect your Solana wallet to synchronize inventory, profile details, and save progress directly to the blockchain securely.',
            badge: 'Solana Web3',
            gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
            border: 'border-purple-500/30 hover:border-purple-500/60',
            iconColor: 'text-purple-400',
        },
        {
            icon: TrendingUp,
            title: 'Dynamic Local Shop',
            description: 'Buy seeds and sell harvested resources. Shop prices fluctuate dynamically based on total supply and active players.',
            badge: 'Marketplace',
            gradient: 'from-pink-500/10 via-pink-500/5 to-transparent',
            border: 'border-pink-500/30 hover:border-pink-500/60',
            iconColor: 'text-pink-400',
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
        <section id="how-to-play" className="w-full max-w-7xl mx-auto px-6 py-24 relative select-none">
            {/* Heading */}
            <div className="text-center mb-16 relative z-10">
                <motion.h2 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl md:text-5xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-mono"
                >
                    Discover Helge Village
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-gray-400 max-w-lg mx-auto text-xs md:text-sm mt-3 font-mono"
                >
                    A beautiful, gamified world where retro 2D farming simulator meets secure Solana Web3 technology.
                </motion.p>
            </div>

            {/* Bento Grid */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                className="grid grid-cols-1 md:grid-cols-6 gap-6 relative z-10"
            >
                {cards.map((card, i) => {
                    const CardIcon = card.icon;
                    // Make some cards wider to create the Bento Grid effect
                    const colSpan = i === 3 || i === 4 ? 'md:col-span-3' : 'md:col-span-2';

                    return (
                        <motion.div
                            key={i}
                            variants={cardVariants}
                            whileHover={{ y: -8, scale: 1.01 }}
                            className={`${colSpan} bg-gray-900/40 backdrop-blur-sm border-2 ${card.border} rounded-2xl p-6 flex flex-col justify-between group shadow-xl hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] transition-all duration-300 relative overflow-hidden`}
                        >
                            {/* Inner Background Glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-40 pointer-events-none group-hover:opacity-60 transition-opacity`} />
                            
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3 bg-gray-950/80 rounded-xl border border-gray-800 ${card.iconColor} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                                        <CardIcon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                        {card.badge}
                                    </span>
                                </div>

                                <h3 className="font-mono font-bold text-lg text-white mb-2 group-hover:text-amber-300 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="font-mono text-xs text-gray-400 leading-relaxed">
                                    {card.description}
                                </p>
                            </div>

                            <div className="mt-8 flex items-center justify-between text-gray-500 group-hover:text-amber-400 transition-colors text-xs font-mono">
                                <span>Learn more</span>
                                <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
}
