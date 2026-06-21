'use client';

import React, { useState, useEffect } from 'react';
import { 
    Wallet, Sprout, Coins, Wrench, Trophy, ArrowLeft, 
    BookOpen, Map, Heart, Swords, Award, Menu, X, Keyboard
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';

// Subcategory Item type definitions
interface DocSubItem {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    content: React.ReactNode;
}

// Category type definitions
interface DocCategory {
    name: string;
    items: DocSubItem[];
}

export default function DocsPage() {
    const [activeSub, setActiveSub] = useState<string>('intro');
    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

    const docsData: DocCategory[] = [
        {
            name: 'Getting Started',
            items: [
                {
                    id: 'intro',
                    title: 'Introduction',
                    icon: BookOpen,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Welcome to Helge Village</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                <strong>Helge Village</strong> is a browser-based, multiplayer 2D Top-Down Farming RPG built with Next.js, React, Tailwind CSS, Phaser, and Colyseus. Players can plant crops, raise their levels, buy food, repair tools, and explore a shared persistent world in real-time.
                            </p>
                            <div className="bg-emerald-50 border-2 border-emerald-600/30 p-4 rounded-2xl text-slate-700 text-xs md:text-sm shadow-[2px_2px_0_0_#10b98122]">
                                <h4 className="font-bold text-emerald-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                    <Sprout className="w-4 h-4" /> Authoritative & Synced State
                                </h4>
                                This game is designed with an authoritative Colyseus server. All player actions are synchronized directly to a MongoDB database to save your gold, level, energy, and inventory progress securely.
                            </div>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Start your farming journey, socialize with other villagers through chat bubbles, complete daily quests to collect EXP, and compete for the top spot on the leaderboard!
                            </p>
                        </div>
                    )
                },
                {
                    id: 'wallet',
                    title: 'Wallet Connection',
                    icon: Wallet,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Solana Wallet Connection</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Helge Village integrates Web3 wallets (such as <strong>Phantom</strong> or <strong>Solflare</strong>) using standard Solana adapters. Connect your wallet to start playing.
                            </p>
                            <div className="bg-amber-50 border-2 border-amber-600/30 p-4 rounded-2xl text-slate-700 text-xs md:text-sm">
                                <h4 className="font-bold text-amber-800 uppercase tracking-wide mb-1">💡 Your Wallet Security</h4>
                                The wallet connection is strictly **Read-Only**. The game will never ask for your seed phrase or private keys. The wallet is only used as a unique profile identifier to save your game progress permanently.
                            </div>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                If you don&apos;t have a Web3 wallet, you can still play using the local simulator with default initial stats to test the game offline.
                            </p>
                        </div>
                    )
                },
                {
                    id: 'character',
                    title: 'Character Creation',
                    icon: Trophy,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Character Onboarding</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                When you first register with a connected wallet, you will be prompted to complete the character creation process:
                            </p>
                            <ul className="list-disc list-inside text-slate-655 space-y-2 text-sm pl-2">
                                <li><strong>Username Tag</strong>: Define a unique username for your character (maximum 15 characters).</li>
                                <li><strong>Visual Clothes Style</strong>: Choose an initial clothes set (Style 1, 2, or 3) that will immediately show on your player sprite.</li>
                                <li><strong>Character Role</strong>: Choose your starting role (such as Farmer) to begin the adventure.</li>
                            </ul>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Once confirmed, your character data is saved in the MongoDB database and your character will immediately spawn in the center of the village!
                            </p>
                        </div>
                    )
                }
            ]
        },
        {
            name: 'Game World',
            items: [
                {
                    id: 'map',
                    title: 'The Village Map',
                    icon: Map,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Helge Village (Main Town)</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                The main game map is designed in a retro 2D pixel art style. Players spawn at the center coordinates `(240, 240)`. The village is surrounded by paths, trees, freshwater ponds for fishing, and essential facilities.
                            </p>
                            <div className="bg-slate-50 border-2 border-slate-800 p-4 rounded-2xl text-slate-700 text-xs md:text-sm">
                                <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-1">🌲 Map Layer Details:</h4>
                                <ul className="list-disc list-inside mt-2 text-slate-650 space-y-1">
                                    <li><strong>Ground & Ground Detail</strong>: Grass path layers decorated with small wild flowers.</li>
                                    <li><strong>Above Layer</strong>: Thick tree canopies and rooftops that cover your character when walking underneath, providing visual depth.</li>
                                    <li><strong>Interactables Layer</strong>: A special object layer containing farm plots and interaction hotspots for facilities.</li>
                                </ul>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'plots',
                    title: 'Farm Plots',
                    icon: Sprout,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Farming Plots</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Farming plots are fertile soil patches where seeds can be planted. You can only plant seeds on designated farming plots defined on the map.
                            </p>
                            <ul className="list-decimal list-inside text-slate-655 space-y-2 text-sm pl-2">
                                <li>Approach a fertile soil plot.</li>
                                <li>Select a seed package from your hotbar.</li>
                                <li>Left-click on the soil to plant it (consumes tool durability & energy).</li>
                                <li>Water the soil to keep it damp so the crop can grow to maturity!</li>
                            </ul>
                        </div>
                    )
                },
                {
                    id: 'facilities',
                    title: 'Facilities & Buildings',
                    icon: Wrench,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Village Facilities</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Helge Village provides 4 main facilities that you can interact with by pressing **[E]** when standing nearby:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border-2 border-slate-800 p-4 rounded-2xl bg-white shadow-[2px_2px_0_0_#1e293b]">
                                    <h4 className="font-pixel text-[8px] text-emerald-700">🛒 Shop</h4>
                                    <p className="text-slate-605 text-[10px] mt-1">A marketplace to purchase random seed packs for 20 Gold, and sell your harvested crops and fish for gold coins.</p>
                                </div>
                                <div className="border-2 border-slate-800 p-4 rounded-2xl bg-white shadow-[2px_2px_0_0_#1e293b]">
                                    <h4 className="font-pixel text-[8px] text-amber-600">🍛 Food House</h4>
                                    <p className="text-slate-605 text-[10px] mt-1">The village kitchen where you can buy Fresh Bread (10 Gold) or Rice Bowls (25 Gold) to replenish energy and hunger levels.</p>
                                </div>
                                <div className="border-2 border-slate-800 p-4 rounded-2xl bg-white shadow-[2px_2px_0_0_#1e293b]">
                                    <h4 className="font-pixel text-[8px] text-blue-600">🛏️ Sleep Inn</h4>
                                    <p className="text-slate-605 text-[10px] mt-1">The village inn to fully restore your energy to 100% for a fee of 40 Gold with a 30-second sleep duration.</p>
                                </div>
                                <div className="border-2 border-slate-800 p-4 rounded-2xl bg-white shadow-[2px_2px_0_0_#1e293b]">
                                    <h4 className="font-pixel text-[8px] text-purple-600">🔧 Tool Repair</h4>
                                    <p className="text-slate-605 text-[10px] mt-1">The blacksmith workshop to repair your watering can durability and upgrade its level for better farming perks.</p>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        {
            name: 'Core Systems',
            items: [
                {
                    id: 'loop',
                    title: 'Gameplay Loop',
                    icon: Sprout,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Core Gameplay Loop</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                The core gameplay loop of Helge Village is cozy yet tactical:
                            </p>
                            <div className="relative border-l-4 border-emerald-500 pl-6 space-y-4 my-2 text-sm text-slate-655">
                                <div>
                                    <span className="absolute -left-[10px] bg-emerald-500 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">1</span>
                                    <strong>Buy & Plant Seeds</strong>: Purchase seed packs from the shop, then plant them on empty soil plots using energy.
                                </div>
                                <div>
                                    <span className="absolute -left-[10px] bg-emerald-500 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">2</span>
                                    <strong>Water & Nurture</strong>: Use the watering can to moisten the soil. Crops only grow when watered!
                                </div>
                                <div>
                                    <span className="absolute -left-[10px] bg-emerald-500 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">3</span>
                                    <strong>Harvest & Sell</strong>: Once the growth timer completes, harvest the crops and sell them at the Shop to earn Gold.
                                </div>
                                <div>
                                    <span className="absolute -left-[10px] bg-emerald-500 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">4</span>
                                    <strong>Upgrade & Compete</strong>: Use your Gold to upgrade your watering can (reducing energy, cutting growth time, increasing gacha rates) and complete daily quests.
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'energy',
                    title: 'Energy & Hunger',
                    icon: Heart,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Character Stats</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Your farming activity and survival are governed by two main stats in the top-left HUD:
                            </p>
                            <ul className="space-y-3 text-sm text-slate-655">
                                <li className="flex items-start gap-2.5">
                                    <div className="w-5 h-5 rounded bg-yellow-400 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-900 mt-0.5 shrink-0">⚡</div>
                                    <div>
                                        <strong>Energy (Yellow)</strong>: Required to plant seeds and water crops. If your energy reaches 0, you cannot perform farming actions until it is restored.
                                    </div>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <div className="w-5 h-5 rounded bg-green-500 border border-slate-800 flex items-center justify-center text-xs font-bold text-white mt-0.5 shrink-0">🍗</div>
                                    <div>
                                        <strong>Hunger (Green)</strong>: Represents your character&apos;s fullness. Hunger slowly decreases over time as you play.
                                    </div>
                                </li>
                            </ul>
                            <p className="text-slate-600 leading-relaxed text-sm border-t border-slate-200 pt-3">
                                Replenish hunger and energy by eating Bread or Rice Bowls from the Food House, or rent a room at the Sleep House to fully restore your energy to 100%.
                            </p>
                        </div>
                    )
                },
                {
                    id: 'leveling',
                    title: 'Level & Experience',
                    icon: Award,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Character Leveling System</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Each time you harvest a mature crop, you gain Experience Points (EXP):
                            </p>
                            <ul className="list-disc list-inside text-slate-655 space-y-2 text-sm pl-2">
                                <li>🌾 Harvesting Rice: rewards <strong>+10 EXP</strong></li>
                                <li>🥬 Harvesting Vegetables: rewards <strong>+25 EXP</strong></li>
                                <li>🍎 Harvesting Apple: rewards <strong>+50 EXP</strong></li>
                                <li>⭐ Harvesting Golden Tree: rewards <strong>+100 EXP</strong></li>
                            </ul>
                            <p className="text-slate-655 text-sm">
                                The EXP threshold to level up is calculated as `Current Level * 100 EXP`. Upon leveling up, you will see a level-up notification and your new level will be displayed publicly above your character.
                            </p>
                        </div>
                    )
                }
            ]
        },
        {
            name: 'Gameplay Controls',
            items: [
                {
                    id: 'keys',
                    title: 'Keyboard & Movement',
                    icon: Keyboard,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Keyboard Controls & Movement</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Control your character&apos;s movement and actions using standard keys:
                            </p>
                            <div className="bg-slate-950 border-4 border-slate-800 p-4 rounded-xl font-mono text-xs text-white max-w-md">
                                <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
                                    <span className="text-gray-400">Walk Keys:</span>
                                    <span className="font-bold text-amber-400">WASD / Arrow Keys</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
                                    <span className="text-gray-400">Select Hotbar:</span>
                                    <span className="font-bold text-amber-400">Keys 1 - 9</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
                                    <span className="text-gray-400">Open Facility Menu:</span>
                                    <span className="font-bold text-amber-400">Key [E]</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Start Typing Chat:</span>
                                    <span className="font-bold text-amber-400">Key [Enter]</span>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'hotbar',
                    title: 'Tool Selection',
                    icon: Wrench,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Tool Selection (Hotbar)</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                The hotbar at the bottom of the HUD contains 9 slots representing active farming tools or edible foods:
                            </p>
                            <ul className="list-disc list-inside text-slate-655 text-sm space-y-2 pl-2">
                                <li><strong>Slot 1 (Harvest/Empty Hand)</strong>: Used to harvest mature crops.</li>
                                <li><strong>Slot 2 (Watering Can)</strong>: Used to water dry soil tiles.</li>
                                <li><strong>Slot 3 - 6 (Crop Seeds)</strong>: Used to plant rice, vegetable, apple, or golden tree seeds.</li>
                                <li><strong>Slot 7 - 8 (Food)</strong>: Used to eat food items from your inventory to instantly recover stats.</li>
                            </ul>
                        </div>
                    )
                },
                {
                    id: 'chat',
                    title: 'Multiplayer Chat',
                    icon: Swords,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Multiplayer Chat & Bubbles</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Since this is a real-time multiplayer game, you can chat with all online players in the same room.
                            </p>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Press **[Enter]** to focus the chat input bar in the bottom-left, type your message, and press **[Enter]** again to broadcast it. 
                            </p>
                            <div className="bg-emerald-50 border-2 border-emerald-600/30 p-4 rounded-2xl text-slate-700 text-xs md:text-sm">
                                💬 **Chat Bubble Feature**:<br />
                                Every time you send a message, the chat text floats in a bubble above your player sprite for **5 seconds**, making local conversations intuitive and lively!
                            </div>
                        </div>
                    )
                }
            ]
        },
        {
            name: 'Game Economy',
            items: [
                {
                    id: 'crops_table',
                    title: 'Crop Pricing & Timer',
                    icon: Coins,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Crop Statistics & Maturation</h2>
                            <p className="text-slate-655 leading-relaxed text-sm mb-2">
                                Full details of planting energy costs, maturation timers, EXP gains, and crop sell values:
                            </p>
                            <div className="overflow-x-auto border-2 border-slate-800 rounded-2xl shadow-[2px_2px_0_0_#1e293b] bg-white">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-100 border-b-2 border-slate-850">
                                            <th className="p-3 font-pixel text-[8px] text-slate-700">Crop</th>
                                            <th className="p-3 font-pixel text-[8px] text-slate-700">Planting Energy</th>
                                            <th className="p-3 font-pixel text-[8px] text-slate-700">Growth Time</th>
                                            <th className="p-3 font-pixel text-[8px] text-slate-700">Harvest EXP</th>
                                            <th className="p-3 font-pixel text-[8px] text-slate-700">Sell Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-slate-200">
                                            <td className="p-3 font-semibold">🌾 Rice</td>
                                            <td className="p-3 font-mono">2 Energy</td>
                                            <td className="p-3 font-mono">10 Seconds</td>
                                            <td className="p-3 font-mono text-blue-600">+10 EXP</td>
                                            <td className="p-3 font-mono text-amber-600 font-bold">2 Gold</td>
                                        </tr>
                                        <tr className="border-b border-slate-200">
                                            <td className="p-3 font-semibold">🥬 Vegy</td>
                                            <td className="p-3 font-mono">8 Energy</td>
                                            <td className="p-3 font-mono">60 Seconds</td>
                                            <td className="p-3 font-mono text-blue-600">+25 EXP</td>
                                            <td className="p-3 font-mono text-amber-600 font-bold">50 Gold</td>
                                        </tr>
                                        <tr className="border-b border-slate-200">
                                            <td className="p-3 font-semibold">🍎 Apple</td>
                                            <td className="p-3 font-mono">15 Energy</td>
                                            <td className="p-3 font-mono">90 Seconds</td>
                                            <td className="p-3 font-mono text-blue-600">+50 EXP</td>
                                            <td className="p-3 font-mono text-amber-600 font-bold">100 Gold</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold">⭐ Golden Tree</td>
                                            <td className="p-3 font-mono">20 Energy</td>
                                            <td className="p-3 font-mono">120 Seconds</td>
                                            <td className="p-3 font-mono text-blue-600">+100 EXP</td>
                                            <td className="p-3 font-mono text-amber-600 font-bold">200 Gold</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'gacha_rates',
                    title: 'Shop Gacha Rates',
                    icon: Coins,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Seed Pack Probability</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Buying random seed packs for **20 Gold** at the Shop draws from a gacha system. Rates improve significantly once your watering can is upgraded to Level 3 or higher:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border-2 border-slate-800 p-4 rounded-2xl bg-white shadow-[2px_2px_0_0_#1e293b]">
                                    <h4 className="font-pixel text-[8px] text-slate-700 mb-2">Standard Rates (Lv. 1 - 2)</h4>
                                    <ul className="font-mono text-xs space-y-1.5 text-slate-655">
                                        <li className="flex justify-between"><span>🌾 Rice Seed:</span><span className="font-bold text-slate-800">50%</span></li>
                                        <li className="flex justify-between"><span>🥬 Vegetable Seed:</span><span className="font-bold text-slate-800">34%</span></li>
                                        <li className="flex justify-between"><span>🍎 Fruit Seed:</span><span className="font-bold text-slate-800">15%</span></li>
                                        <li className="flex justify-between"><span>⭐ Golden Tree Seed:</span><span className="font-bold text-emerald-600">1%</span></li>
                                    </ul>
                                </div>
                                <div className="border-2 border-slate-855 p-4 rounded-2xl bg-emerald-50/50 border-emerald-600/30 shadow-[2px_2px_0_0_#1e293b]">
                                    <h4 className="font-pixel text-[8px] text-emerald-800 mb-2">Premium Rates (Upgrade Lv. 3+)</h4>
                                    <ul className="font-mono text-xs space-y-1.5 text-slate-655">
                                        <li className="flex justify-between"><span>🌾 Rice Seed:</span><span className="font-bold text-slate-800">30%</span></li>
                                        <li className="flex justify-between"><span>🥬 Vegetable Seed:</span><span className="font-bold text-slate-800">44%</span></li>
                                        <li className="flex justify-between"><span>🍎 Fruit Seed:</span><span className="font-bold text-slate-800">23%</span></li>
                                        <li className="flex justify-between"><span>⭐ Golden Tree Seed:</span><span className="font-bold text-emerald-600">3%</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'upgrades_perks',
                    title: 'Tool Upgrades & Perks',
                    icon: Wrench,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Watering Can Upgrades & Perks</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Upgrade your watering can at the village workshop (Tool Repair) to unlock permanent passive farming perks:
                            </p>
                            <div className="space-y-3">
                                <div className="border-2 border-slate-800 p-3.5 rounded-xl bg-white flex justify-between items-center text-xs">
                                    <div>
                                        <h4 className="font-bold text-slate-850">Watering Can Level 2</h4>
                                        <p className="text-slate-500 text-[10px] mt-0.5">Speeds up crop maturation time by 10%.</p>
                                    </div>
                                    <span className="font-mono bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-full text-slate-700">Cost: 300 Gold</span>
                                </div>
                                <div className="border-2 border-slate-800 p-3.5 rounded-xl bg-white flex justify-between items-center text-xs">
                                    <div>
                                        <h4 className="font-bold text-slate-850">Watering Can Level 3</h4>
                                        <p className="text-slate-500 text-[10px] mt-0.5">Increases rates for high-tier seeds in the Shop.</p>
                                    </div>
                                    <span className="font-mono bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-full text-slate-700">Cost: 700 Gold</span>
                                </div>
                                <div className="border-2 border-slate-800 p-3.5 rounded-xl bg-white flex justify-between items-center text-xs">
                                    <div>
                                        <h4 className="font-bold text-slate-855">Watering Can Level 4</h4>
                                        <p className="text-slate-500 text-[10px] mt-0.5">Reduces planting energy cost by 20% and cuts watering energy cost to 0.</p>
                                    </div>
                                    <span className="font-mono bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-full text-slate-700">Cost: 1500 Gold</span>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'quests_data',
                    title: 'Daily Quests reset',
                    icon: Award,
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">Daily Quests & 24h Reset</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Daily quests can be completed by holding the required crops or gold. Claiming quests rewards you with EXP. Quests reset 24 hours after your last claim.
                            </p>
                            <div className="space-y-3 font-mono text-xs text-slate-655">
                                <div className="border-2 border-slate-800 p-3 rounded-xl bg-white flex justify-between items-center">
                                    <span>🌾 **Plant Rice**: Harvest 1 Rice</span>
                                    <span className="text-emerald-655 font-bold font-pixel text-[8px]">+50 EXP</span>
                                </div>
                                <div className="border-2 border-slate-800 p-3 rounded-xl bg-white flex justify-between items-center">
                                    <span>🥬 **Eat your Vegy**: Harvest 1 Vegetable</span>
                                    <span className="text-emerald-655 font-bold font-pixel text-[8px]">+100 EXP</span>
                                </div>
                                <div className="border-2 border-slate-800 p-3 rounded-xl bg-white flex justify-between items-center">
                                    <span>🍎 **Apple Season**: Harvest 1 Apple</span>
                                    <span className="text-emerald-655 font-bold font-pixel text-[8px]">+200 EXP</span>
                                </div>
                                <div className="border-2 border-slate-800 p-3 rounded-xl bg-white flex justify-between items-center">
                                    <span>💰 **Wealth Accumulator**: Hold 500 Gold</span>
                                    <span className="text-emerald-655 font-bold font-pixel text-[8px]">+150 EXP</span>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        }
    ];

    // Scrollspy setup via IntersectionObserver
    useEffect(() => {
        const observerOptions = {
            root: null, // use viewport
            rootMargin: '-10% 0px -75% 0px', // trigger when heading enters upper viewport area
            threshold: 0
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSub(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const sections = document.querySelectorAll('.doc-section');
        sections.forEach(sec => observer.observe(sec));

        return () => {
            sections.forEach(sec => observer.unobserve(sec));
        };
    }, []);

    // Smooth scroll handler
    const scrollToSection = (id: string) => {
        setActiveSub(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#eaf6ec] text-slate-855 font-sans select-none pb-12">
            <Navbar />

            <main className="w-full max-w-6xl mx-auto px-4 md:px-6 pt-8 flex-grow flex flex-col">
                {/* Back to Home Link */}
                <div className="mb-6 flex justify-start">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-855 transition-colors bg-white px-3.5 py-2 rounded-full border-2 border-slate-800 shadow-[2px_2px_0_0_#1e293b] hover:translate-y-px hover:shadow-[1px_1px_0_0_#1e293b]"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>

                {/* Mobile Menu Dropdown Selector */}
                <div className="md:hidden mb-4 sticky top-20 z-30">
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="w-full flex items-center justify-between bg-white border-2 border-slate-855 px-4 py-3 rounded-xl font-pixel text-[10px] text-slate-855 shadow-[2px_2px_0_0_#1e293b]"
                    >
                        <span>Topic: {docsData.flatMap(c => c.items).find(i => i.id === activeSub)?.title || 'Menu'}</span>
                        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                    {mobileMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border-4 border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col gap-4 max-h-[60vh] overflow-y-auto z-40">
                            {docsData.map((category, catIdx) => (
                                <div key={catIdx} className="flex flex-col gap-1.5">
                                    <h3 className="font-pixel text-[8px] text-slate-400 tracking-wider uppercase pl-2">
                                        {category.name}
                                    </h3>
                                    <div className="flex flex-col gap-1">
                                        {category.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    scrollToSection(item.id);
                                                    setMobileMenuOpen(false);
                                                }}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-bold transition-all border
                                                    ${activeSub === item.id 
                                                        ? 'bg-emerald-500 text-white border-slate-855' 
                                                        : 'text-slate-600 bg-transparent border-transparent'
                                                    }
                                                `}
                                            >
                                                <span>{item.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Docs Section Wrapper */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start flex-1">
                    
                    {/* Left Pane - Sticky Sidebar Navigation (Desktop) */}
                    <aside className="hidden md:flex md:col-span-4 md:sticky md:top-28 bg-white border-4 border-slate-800 p-4 rounded-3xl shadow-[4px_4px_0_0_#1e293b] flex-col gap-5 max-h-[calc(100vh-160px)] overflow-y-auto">
                        {docsData.map((category, catIdx) => (
                            <div key={catIdx} className="flex flex-col gap-1.5">
                                <h3 className="font-pixel text-[8px] text-slate-400 tracking-wider uppercase pl-2 select-none">
                                    {category.name}
                                </h3>
                                <div className="flex flex-col gap-1">
                                    {category.items.map((item) => {
                                        const ItemIcon = item.icon;
                                        const isSelected = activeSub === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => scrollToSection(item.id)}
                                                className={`
                                                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border-2
                                                    ${isSelected 
                                                        ? 'bg-emerald-500 text-white border-slate-855 shadow-[2px_2px_0_0_#1e293b]' 
                                                        : 'text-slate-600 bg-transparent border-transparent hover:bg-slate-100 hover:text-slate-900'
                                                    }
                                                `}
                                            >
                                                <ItemIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-405'}`} />
                                                <span>{item.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {catIdx < docsData.length - 1 && <div className="border-t border-slate-200/60 my-2" />}
                            </div>
                        ))}
                    </aside>

                    {/* Right Pane - Sequential Scrollable Content */}
                    <section className="md:col-span-8 flex flex-col gap-8">
                        {docsData.map((category) => (
                            <div key={category.name} className="flex flex-col gap-6">
                                <h3 className="font-pixel text-slate-400 text-[8px] uppercase tracking-widest pl-2">
                                    {category.name}
                                </h3>
                                
                                {category.items.map((item) => (
                                    <div 
                                        key={item.id} 
                                        id={item.id}
                                        className="doc-section scroll-mt-28 bg-white border-4 border-slate-800 p-6 md:p-8 rounded-3xl shadow-[4px_4px_0_0_#1e293b]"
                                    >
                                        {item.content}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-6xl mx-auto border-t border-slate-200 mt-12 py-8 text-center text-xs text-slate-450 font-bold px-4">
                &copy; {new Date().getFullYear()} Helge Village. All Rights Reserved. Built on Solana.
            </footer>
        </div>
    );
}
