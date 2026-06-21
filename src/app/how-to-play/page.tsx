'use client';

import React, { useState, useEffect } from 'react';
import { 
    Wallet, Sprout, Coins, Wrench, Trophy, ArrowLeft, 
    Heart, Swords, Award, Menu, X, Keyboard, MessageSquare,
    Fish
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';

interface HowToPlaySubItem {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    screenshotDesc: string;
    imagePath: string;
    content: React.ReactNode;
}

interface HowToPlayCategory {
    name: string;
    items: HowToPlaySubItem[];
}

export default function HowToPlayPage() {
    const [activeSub, setActiveSub] = useState<string>('wallet-connect');
    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

    const howToPlayData: HowToPlayCategory[] = [
        {
            name: 'Getting Started',
            items: [
                {
                    id: 'wallet-connect',
                    title: 'Wallet Connection',
                    icon: Wallet,
                    imagePath: '/img/img1.png',
                    screenshotDesc: 'Connect your Phantom or Solflare wallet to start your farming adventure.',
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">1. Connect Your Wallet</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                To enter the world of <strong>Helge Village</strong>, you need a Solana Web3 wallet like <strong>Phantom</strong> or <strong>Solflare</strong>.
                            </p>
                            <div className="bg-emerald-50 border-2 border-emerald-600/30 p-4 rounded-2xl text-slate-700 text-xs md:text-sm">
                                <h4 className="font-bold text-emerald-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                    <Wallet className="w-4 h-4" /> Secure & Read-Only
                                </h4>
                                We only request read-only access to verify your wallet address. This functions as a unique profile key to securely save your game progress (Gold, Level, Items) to our database.
                            </div>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                If you do not have a Web3 wallet, you can still test the game layout in offline mode with simulated initial states.
                            </p>
                        </div>
                    )
                },
                {
                    id: 'char-register',
                    title: 'Character Creation',
                    icon: Trophy,
                    imagePath: '/img/img2.png',
                    screenshotDesc: 'Customize your villager and pick your username tag.',
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">2. Create Your Character</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Once connected, you will be prompted to register your villager:
                            </p>
                            <ul className="list-disc list-inside text-slate-655 space-y-2 text-sm pl-2">
                                <li><strong>Username</strong>: A unique moniker displayed above your head (up to 15 characters).</li>
                                <li><strong>Clothing Style</strong>: Customize your starting character appearance.</li>
                                <li><strong>Spawn Town</strong>: Spawns you directly at the coordinates `(240, 240)` in the village center.</li>
                            </ul>
                        </div>
                    )
                }
            ]
        },
        {
            name: 'Farming & Fishing',
            items: [
                {
                    id: 'buy-seeds',
                    title: 'Buying Seeds',
                    icon: Coins,
                    imagePath: '/img/img3.png',
                    screenshotDesc: 'Market interface to buy random seed packs.',
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">3. Purchase Seed Packs</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Head over to the <strong>Shop</strong> in the market area (press [E] when standing near the shopkeeper). 
                            </p>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Each random seed pack costs <strong>20 Gold</strong>. Seeds are drawn using a gacha mechanic. Improving your tools increases the chance of drawing high-tier seeds like Apple or Golden Tree!
                            </p>
                        </div>
                    )
                },
                {
                    id: 'plant-water',
                    title: 'Planting & Watering',
                    icon: Sprout,
                    imagePath: '/img/img4.png',
                    screenshotDesc: 'Equip seeds or your watering can to interact with the soil.',
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">4. Cultivate the Soil</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Find a vacant brown tile on the farming grids.
                            </p>
                            <ul className="list-decimal list-inside text-slate-655 space-y-2 text-sm pl-2">
                                <li>Select seeds from your hotbar (keys 3-6).</li>
                                <li>Left-click a dry soil plot to plant (consumes seed and energy).</li>
                                <li>Select the Watering Can (key 2) and left-click the dry plot to moisten the soil. <strong>Crops only grow when the soil is wet!</strong></li>
                            </ul>
                        </div>
                    )
                },
                {
                    id: 'fishing-basics',
                    title: 'Catching Fish',
                    icon: Fish,
                    imagePath: '/img/fishing_tutorial.png',
                    screenshotDesc: 'Equip your Fishing Rod and interact near water spots to fish.',
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">5. Catching Fish</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Besides farming, you can catch fish from the ocean or lakes around the village:
                            </p>
                            <ul className="list-decimal list-inside text-slate-655 space-y-2 text-sm pl-2">
                                <li>Ensure the <strong>Fishing Rod</strong> is in your inventory.</li>
                                <li>Stand next to any ocean or lake water spot.</li>
                                <li>Click the water to cast your line. You will enter the <span className="font-semibold text-blue-600">WAITING</span> state.</li>
                                <li>Wait for a fish to bite. When a flashing red <span className="font-bold text-rose-600 font-pixel text-[8px]">❗️ BITE!</span> indicator pops up, quickly click the spot again within <strong>2 seconds</strong> to reel it in!</li>
                                <li>If successful, you will collect a fish and gain valuable EXP!</li>
                            </ul>
                        </div>
                    )
                },
                {
                    id: 'harvest-sell',
                    title: 'Harvesting & Selling',
                    icon: Award,
                    imagePath: '/img/img5.png',
                    screenshotDesc: 'Harvest mature crops and sell them back to the market for gold profit.',
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">6. Harvest and Reap Profits</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                When crops mature, they sparkle! Equip Slot 1 (empty hand/sickle) and click to harvest. You receive the crop item in your bag and gain character EXP!
                            </p>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Return to the Shop to sell your harvested crops and fish for a higher Gold price:
                            </p>
                            <ul className="list-disc list-inside text-slate-655 space-y-1 text-sm pl-2">
                                <li>🌾 Rice: Sell for <strong>2 Gold</strong></li>
                                <li>🥬 Vegetable: Sell for <strong>50 Gold</strong></li>
                                <li>🍎 Apple: Sell for <strong>100 Gold</strong></li>
                                <li>⭐ Golden Tree: Sell for <strong>200 Gold</strong></li>
                                <li>🐟 Common Fish: Sell for <strong>25 Gold</strong></li>
                                <li>🐠 Uncommon Fish: Sell for <strong>60 Gold</strong></li>
                                <li>🐡 Rare Fish: Sell for <strong>150 Gold</strong></li>
                            </ul>
                        </div>
                    )
                }
            ]
        },
        {
            name: 'Town Features',
            items: [
                {
                    id: 'hud-stats',
                    title: 'HUD, Levels & Sleep',
                    icon: Heart,
                    imagePath: '/img/img6.png',
                    screenshotDesc: 'Track your level progress and energy. Use the Sleep Inn to fully recover.',
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">7. Maintaining Your Stats</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Watch your top-left HUD panel. It displays crucial stats:
                            </p>
                            <ul className="space-y-2 text-sm text-slate-655">
                                <li>⚡ <strong>Energy</strong>: Decreases when planting or watering. Restore to 100% at the <strong>Sleep Inn</strong> (costs 40 Gold, takes 30 seconds).</li>
                                <li>🍗 <strong>Hunger</strong>: Slowly drops over time. Replenish by buying and eating food at the <strong>Food House</strong>.</li>
                                <li>⭐ <strong>Level</strong>: Rises as you gain EXP from harvests. Leveling up displays your level above your character!</li>
                            </ul>
                        </div>
                    )
                },
                {
                    id: 'tool-upgrades',
                    title: 'Tool Upgrades',
                    icon: Wrench,
                    imagePath: '/img/img7.png',
                    screenshotDesc: 'Upgrade your tools at the Blacksmith workshop to earn special perks.',
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">8. Blacksmith Upgrades</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Visit the blacksmith workshop (Tool Repair). You can repair your tools or pay Gold to upgrade them:
                            </p>
                            <div className="text-slate-655 text-sm space-y-2 pl-2">
                                <div>
                                    <strong className="text-slate-800">💧 Watering Can Upgrades:</strong>
                                    <ul className="list-disc list-inside mt-0.5 space-y-1">
                                        <li><strong>Level 2 (300 Gold)</strong>: Speeds up crop growth time by 10%.</li>
                                        <li><strong>Level 3 (700 Gold)</strong>: Boosts gacha draw rates for high-tier seeds in the shop.</li>
                                        <li><strong>Level 4 (1500 Gold)</strong>: Reduces seed planting cost and eliminates water energy usage.</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong className="text-slate-800">🎣 Fishing Rod Upgrades:</strong>
                                    <ul className="list-disc list-inside mt-0.5 space-y-1">
                                        <li><strong>Level 2 (500 Gold)</strong>: Significantly increases the chance of catching Uncommon and Rare fish.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        {
            name: 'Social & Quests',
            items: [
                {
                    id: 'chat-bubbles',
                    title: 'Multiplayer Chat Bubbles',
                    icon: MessageSquare,
                    imagePath: '/img/img8.png',
                    screenshotDesc: 'Chat messages will float above your character for 5 seconds.',
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">9. Chatting & Interaction</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Press [Enter] to focus the chat input bar in the bottom-left. Write your message and hit [Enter] again.
                            </p>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Your message floats inside a chat bubble above your head for <strong>5 seconds</strong> so nearby players can easily follow the conversation. The bottom-left menu also lists the current count of online villagers.
                            </p>
                        </div>
                    )
                },
                {
                    id: 'quests-system',
                    title: 'Daily Quests & Reset',
                    icon: Award,
                    imagePath: '/img/img9.png',
                    screenshotDesc: 'Complete quests for daily EXP and claim them before they reset.',
                    content: (
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-pixel text-slate-800">10. Daily Quests</h2>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Open the Quest Log to view available daily assignments (e.g., harvesting specific crops or holding gold).
                            </p>
                            <p className="text-slate-655 leading-relaxed text-sm">
                                Claiming quests awards huge EXP boosts to accelerate character leveling. Quests are reset <strong>every 24 hours</strong> after they are claimed.
                            </p>
                        </div>
                    )
                }
            ]
        }
    ];

    // Scrollspy setup via IntersectionObserver
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-10% 0px -75% 0px',
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
        const sections = document.querySelectorAll('.how-to-section');
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
                        <span>Topic: {howToPlayData.flatMap(c => c.items).find(i => i.id === activeSub)?.title || 'Menu'}</span>
                        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                    {mobileMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border-4 border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col gap-4 max-h-[60vh] overflow-y-auto z-40">
                            {howToPlayData.map((category, catIdx) => (
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

                {/* Main Content Wrapper */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start flex-1">
                    
                    {/* Left Pane - Sticky Sidebar Navigation (Desktop) */}
                    <aside className="hidden md:flex md:col-span-4 md:sticky md:top-28 bg-white border-4 border-slate-800 p-4 rounded-3xl shadow-[4px_4px_0_0_#1e293b] flex-col gap-5 max-h-[calc(100vh-160px)] overflow-y-auto">
                        {howToPlayData.map((category, catIdx) => (
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
                                {catIdx < howToPlayData.length - 1 && <div className="border-t border-slate-200/60 my-2" />}
                            </div>
                        ))}
                    </aside>

                    {/* Right Pane - Sequential Scrollable Content */}
                    <section className="md:col-span-8 flex flex-col gap-8">
                        {howToPlayData.map((category) => (
                            <div key={category.name} className="flex flex-col gap-6">
                                <h3 className="font-pixel text-slate-400 text-[8px] uppercase tracking-widest pl-2">
                                    {category.name}
                                </h3>
                                
                                {category.items.map((item) => (
                                    <div 
                                        key={item.id} 
                                        id={item.id}
                                        className="how-to-section scroll-mt-28 bg-white border-4 border-slate-800 p-6 md:p-8 rounded-3xl shadow-[4px_4px_0_0_#1e293b] flex flex-col gap-6"
                                    >
                                        {/* Content Block */}
                                        <div>
                                            {item.content}
                                        </div>

                                        {/* Image screenshot block */}
                                        <div className="border-2 border-slate-800 p-2 rounded-2xl bg-slate-50 flex flex-col gap-2">
                                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-300">
                                                <Image 
                                                    src={item.imagePath} 
                                                    alt={item.title}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    className="select-none"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-semibold px-1 italic">
                                                💡 {item.screenshotDesc}
                                            </p>
                                        </div>
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
