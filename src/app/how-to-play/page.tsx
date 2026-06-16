'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Wallet, 
    Sprout, 
    Coins, 
    Wrench, 
    Axe, 
    Trophy, 
    ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import { Card, CardContent } from '@/components/ui/card';

export default function HowToPlayPage() {
    const steps = [
        {
            icon: Wallet,
            stepNum: '1',
            title: 'Connect & register',
            description: 'Connect Phantom or Solflare wallet. The game checks (read-only) that your wallet is verified. Register your character name, select clothes, and you are ready!',
            iconBg: 'bg-emerald-100 text-emerald-600',
        },
        {
            icon: Sprout,
            stepNum: '2',
            title: 'Plant your field',
            description: 'Buy seeds at the Market. Plant them on the soil. Planting costs 1 seed and a tiny bit of character energy. Water them to keep them growing!',
            iconBg: 'bg-emerald-100 text-emerald-600',
        },
        {
            icon: Coins,
            stepNum: '3',
            title: 'Harvest & sell',
            description: 'When crops mature and sparkle ✨, harvest them! Place crops in your bag and sell them to the local shopkeeper to earn shiny Gold coins.',
            iconBg: 'bg-emerald-100 text-emerald-600',
        },
        {
            icon: Wrench,
            stepNum: '4',
            title: 'Invest your gold',
            description: 'Use your Gold to buy better farming equipment, upgrade tools (watering can, sprinkler), or purchase fertilizers at the market to speed up growth.',
            iconBg: 'bg-emerald-100 text-emerald-600',
        },
        {
            icon: Axe,
            stepNum: '5',
            title: 'Gather & Craft',
            description: 'Explore the village to chop trees 🌲, mine rocks 🪨, or fish 🎣. Use these raw materials to craft materials, decor, and unlock special buildings.',
            iconBg: 'bg-emerald-100 text-emerald-600',
        },
        {
            icon: Trophy,
            stepNum: '6',
            title: 'Level up & compete',
            description: 'Defeat wild slimes in the adventure zone, earn XP to level up your character skills, upgrade your village tier, and climb to the top of the Leaderboard!',
            iconBg: 'bg-emerald-100 text-emerald-600',
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#eaf6ec] text-slate-850 font-sans select-none pb-12">
            <Navbar />

            {/* Back Button & Main Header */}
            <main className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-10 flex-grow">
                <div className="mb-10 flex flex-col items-center text-center">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-800 shadow-[2px_2px_0_0_#1e293b] hover:translate-y-px hover:shadow-[1px_1px_0_0_#1e293b] mb-6 animate-pulse"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                    </Link>

                    <h1 className="text-2xl md:text-4xl font-pixel text-slate-800 tracking-tight">
                        How to Play
                    </h1>
                    <p className="text-slate-600 text-xs md:text-sm font-bold mt-3 max-w-lg leading-relaxed">
                        Helge Village is meant to be slow and cozy. The full loop: <br />
                        <span className="text-emerald-700 underline decoration-2 font-black">plant → wait → harvest → sell → upgrade → repeat.</span>
                    </p>
                </div>

                {/* Steps Grid (2-column layout matching Agriland style) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {steps.map((step, i) => {
                        const StepIcon = step.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                whileHover={{ y: -3 }}
                            >
                                <Card className="border-2 border-slate-800 bg-white shadow-[4px_4px_0_0_#1e293b] rounded-3xl p-6 h-full flex flex-col justify-between">
                                    <div className="space-y-4">
                                        {/* Icon Container */}
                                        <div className={`w-9 h-9 rounded-full border border-slate-800 flex items-center justify-center ${step.iconBg} shadow-[1px_1px_0_0_#1e293b]`}>
                                            <StepIcon className="w-4 h-4" />
                                        </div>

                                        {/* Step Title (Pixel Font) */}
                                        <h3 className="font-pixel text-[10px] md:text-xs text-slate-800 leading-tight pt-1">
                                            {step.stepNum} . {step.title}
                                        </h3>

                                        {/* Step Description */}
                                        <p className="font-sans text-xs md:text-sm font-semibold text-slate-600 leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="w-full max-w-5xl mx-auto border-t border-slate-200 mt-12 py-8 text-center text-xs text-slate-450 font-bold px-4">
                &copy; {new Date().getFullYear()} Helge Village. All Rights Reserved. Built on Solana.
            </footer>
        </div>
    );
}
