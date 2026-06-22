'use client';

import React, { useState, useEffect } from 'react';
import { EventBus } from '../../game/EventBus';

interface InventoryItem {
    itemType: string;
    count: number;
}

interface PlayerStats {
    gold: number;
    energy: number;
    hunger: number;
    wateringCanLevel: number;
    wateringCanDurability: number;
    fishingRodLevel?: number;
    fishingRodDurability?: number;
    inventory: InventoryItem[];
    isSleeping?: boolean;
}

export default function FacilitiesModal() {
    const [stats, setStats] = useState<PlayerStats>({
        gold: 100,
        energy: 100,
        hunger: 100,
        wateringCanLevel: 1,
        wateringCanDurability: 100,
        fishingRodLevel: 1,
        fishingRodDurability: 100,
        inventory: [],
        isSleeping: false
    });

    const [activeFacility, setActiveFacility] = useState<string | null>(null);
    const [shopTab, setShopTab] = useState<'buy' | 'sell'>('buy');
    const [selectedRepairTool, setSelectedRepairTool] = useState<'watering_can' | 'fishing_rod'>('watering_can');
    const [confirmSell, setConfirmSell] = useState<{
        cropType: string;
        name: string;
        emoji?: string;
        image?: string;
        price: number;
        count: number;
    } | null>(null);

    useEffect(() => {
        // Sync stats
        const onStatsChanged = (newStats: PlayerStats) => {
            setStats(newStats);
        };

        // Listen for open menu trigger
        const onOpenMenu = (facility: string) => {
            setActiveFacility(facility);
            setShopTab('buy'); // reset shop tab on open
            setConfirmSell(null);
        };

        EventBus.on('player-stats-changed', onStatsChanged);
        EventBus.on('open-facility-menu', onOpenMenu);

        return () => {
            EventBus.off('player-stats-changed', onStatsChanged);
            EventBus.off('open-facility-menu', onOpenMenu);
        };
    }, []);

    useEffect(() => {
        if (stats.isSleeping) {
            setActiveFacility(null);
            setConfirmSell(null);
        }
    }, [stats.isSleeping]);

    if (!activeFacility) return null;

    const close = () => {
        setActiveFacility(null);
        setConfirmSell(null);
    };

    // Actions
    const buySeedPack = () => {
        EventBus.emit('send-room-message', { type: 'buySeed' });
    };

    const sellCrop = (cropType: string, count: number) => {
        EventBus.emit('send-room-message', { type: 'sellCrop', payload: { cropType, count } });
    };

    const buyFood = (foodType: string) => {
        EventBus.emit('send-room-message', { type: 'buyFood', payload: { foodType } });
    };

    const sleep = () => {
        EventBus.emit('send-room-message', { type: 'sleep' });
    };

    const repairTool = (option: 'dur_25' | 'dur_50' | 'dur_full', toolType: string = 'watering_can') => {
        EventBus.emit('send-room-message', { type: 'repairTool', payload: { option, toolType } });
    };

    const upgradeTool = (toolType: string = 'watering_can') => {
        EventBus.emit('send-room-message', { type: 'upgradeTool', payload: { toolType } });
    };

    const buyFishingRod = () => {
        EventBus.emit('send-room-message', { type: 'buyFishingRod' });
    };

    // Helpers
    const getInventoryCount = (itemType: string) => {
        return stats.inventory.find(i => i.itemType === itemType)?.count ?? 0;
    };

    return (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border-2 border-amber-600 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh] relative text-white">
                
                {/* Header */}
                <div className="bg-amber-600 px-6 py-4 flex justify-between items-center shadow-lg">
                    <h2 className="font-bold text-xl uppercase tracking-wider text-gray-950 flex items-center gap-2">
                        {activeFacility === 'shop' && '🛒 Shop'}
                        {activeFacility === 'food_house' && '🍛 Food House'}
                        {activeFacility === 'sleep_house' && '🛏️ Sleep House / Inn'}
                        {activeFacility === 'tool_repair' && '🔧 Tool Repair & Upgrade'}
                        {activeFacility === 'marketplace' && '🛍️ Marketplace'}
                    </h2>
                    <button 
                        onClick={close}
                        className="bg-gray-950/40 text-gray-950 hover:bg-gray-950/70 hover:text-white transition-all w-8 h-8 rounded-full font-bold flex items-center justify-center cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                    {/* --- 1. SEED SHOP --- */}
                    {activeFacility === 'shop' && (
                        <div>
                            {/* Tab Select */}
                            <div className="flex bg-gray-950 p-1.5 rounded-xl border border-gray-800 mb-6">
                                <button 
                                    onClick={() => { setShopTab('buy'); setConfirmSell(null); }}
                                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${shopTab === 'buy' ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Buy Pack
                                </button>
                                <button 
                                    onClick={() => { setShopTab('sell'); setConfirmSell(null); }}
                                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${shopTab === 'sell' ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Sell
                                </button>
                            </div>

                            {shopTab === 'buy' ? (
                                <div className="flex flex-col items-center gap-4 py-4">
                                    <div className="text-5xl">🎁</div>
                                    <div className="text-center">
                                        <h3 className="font-extrabold text-lg text-amber-400">Random Seed Pack</h3>
                                        <p className="text-xs text-gray-400 mt-1">Get 1 random seed package</p>
                                    </div>
                                    <div className="bg-gray-950 px-4 py-2.5 rounded-xl border border-gray-800 font-mono text-amber-300 font-bold">
                                        Price: 20 Gold
                                    </div>
                                    <button 
                                        onClick={buySeedPack}
                                        disabled={stats.gold < 20}
                                        className={`w-full py-3.5 rounded-xl font-extrabold text-base transition-all uppercase shadow-lg cursor-pointer ${
                                            stats.gold >= 20 ? 'bg-amber-500 hover:bg-amber-400 text-gray-950 active:scale-95' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        Buy & Open Pack
                                    </button>
                                    {/* Rates */}
                                    <div className="w-full bg-gray-950/40 p-4 rounded-xl border border-gray-800/50 mt-2 text-xs text-gray-400">
                                        <div className="font-bold mb-2 text-gray-300 uppercase tracking-wide">Pack Probabilities:</div>
                                        <div className="grid grid-cols-2 gap-2 font-mono">
                                            <div className="flex justify-between items-center">
                                                <span className="flex items-center gap-1.5">
                                                    <img src="/padi.png" className="w-4 h-4 object-contain inline-block" alt="Rice" />
                                                    Rice:
                                                </span>
                                                <span className="text-green-400">50%</span>
                                            </div>
                                            <div className="flex justify-between"><span>🥬 Vegy:</span><span className="text-green-400">34%</span></div>
                                            <div className="flex justify-between"><span>🍎 Apple:</span><span className="text-green-400">15%</span></div>
                                            <div className="flex justify-between"><span>⭐ Golden Tree:</span><span className="text-green-400">1%</span></div>
                                        </div>
                                        {stats.wateringCanLevel >= 3 && (
                                            <div className="mt-3 text-[10px] text-amber-500 border-t border-gray-800 pt-2 font-semibold">
                                                👍 Level 3 Tool Upgrade active! High-tier seed rates increased.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {[
                                        { type: 'rice', name: 'Rice', image: '/padi.png', price: 2 },
                                        { type: 'vegetable', name: 'Vegy', emoji: '🥬', price: 50 },
                                        { type: 'fruit', name: 'Apple', emoji: '🍎', price: 100 },
                                        { type: 'golden_tree', name: 'Golden Tree Wood', emoji: '⭐', price: 200 },
                                        { type: 'fish_common', name: 'Common Fish', emoji: '🐟', price: 25 },
                                        { type: 'fish_uncommon', name: 'Uncommon Fish', emoji: '🐠', price: 60 },
                                        { type: 'fish_rare', name: 'Rare Fish', emoji: '🐡', price: 150 }
                                    ].map(crop => {
                                        const count = getInventoryCount(crop.type.startsWith('fish_') ? crop.type : `crop_${crop.type}`);
                                        return (
                                            <div key={crop.type} className="flex items-center justify-between bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                                                <div className="flex items-center gap-3">
                                                    {crop.image ? (
                                                        <img src={crop.image} className="w-8 h-8 object-contain" alt={crop.name} />
                                                    ) : (
                                                        <span className="text-2xl">{crop.emoji}</span>
                                                    )}
                                                    <div>
                                                        <h4 className="font-bold">{crop.name}</h4>
                                                        <p className="text-xs text-gray-400">Sell: {crop.price} Gold each</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-gray-400 mr-2">Owned: {count}</span>
                                                    <button 
                                                        onClick={() => setConfirmSell({
                                                            cropType: crop.type,
                                                            name: crop.name,
                                                            emoji: crop.emoji,
                                                            image: crop.image,
                                                            price: crop.price,
                                                            count: 1
                                                        })}
                                                        disabled={count < 1}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                                                            count >= 1 ? 'bg-amber-500 text-gray-950 hover:bg-amber-400' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        Sell 1
                                                    </button>
                                                    <button 
                                                        onClick={() => setConfirmSell({
                                                            cropType: crop.type,
                                                            name: crop.name,
                                                            emoji: crop.emoji,
                                                            image: crop.image,
                                                            price: crop.price,
                                                            count: count
                                                        })}
                                                        disabled={count < 1}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                                                            count >= 1 ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        Sell All
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- 2. FOOD HOUSE --- */}
                    {activeFacility === 'food_house' && (
                        <div className="flex flex-col gap-4 py-2">
                            <p className="text-xs text-gray-400 text-center mb-2">Buy nutrition to replenish your Energy and Hunger levels</p>
                            
                            {[
                                { type: 'food_bread', name: 'Fresh Bread', emoji: '🍞', price: 10, bonus: '+10 Energy, +20 Hunger' },
                                { type: 'food_rice_bowl', name: 'Fresh Rice Bowl', emoji: '🍚', price: 25, bonus: '+30 Energy, +50 Hunger' }
                            ].map(food => (
                                <div key={food.type} className="flex items-center justify-between bg-gray-950 p-4 rounded-xl border border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{food.emoji}</span>
                                        <div>
                                            <h4 className="font-bold text-base">{food.name}</h4>
                                            <p className="text-xs text-amber-500 font-semibold">{food.bonus}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => buyFood(food.type)}
                                        disabled={stats.gold < food.price}
                                        className={`px-4 py-2 rounded-xl text-sm font-extrabold cursor-pointer transition-all ${
                                            stats.gold >= food.price ? 'bg-amber-500 text-gray-950 hover:bg-amber-400 active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                        }`}
                                    >
                                        Buy ({food.price} G)
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* --- 3. SLEEP HOUSE --- */}
                    {activeFacility === 'sleep_house' && (
                        <div className="flex flex-col items-center gap-6 py-6 text-center">
                            <div className="text-6xl animate-pulse">💤</div>
                            <div>
                                <h3 className="font-extrabold text-lg text-amber-400">Sleep & Rest</h3>
                                <p className="text-sm text-gray-300 mt-2 max-w-sm">
                                    Pay a room fee to sleep. This will completely restore your Energy bar to 100%. Hunger will not change.
                                </p>
                            </div>
                            <div className="bg-gray-950 px-5 py-3 rounded-xl border border-gray-800 text-amber-300 font-bold font-mono">
                                Rent Fee: 40 Gold
                            </div>
                            <button 
                                onClick={sleep}
                                disabled={stats.gold < 40}
                                className={`w-full py-4 rounded-xl font-extrabold text-base transition-all uppercase shadow-lg cursor-pointer ${
                                    stats.gold >= 40 ? 'bg-amber-500 hover:bg-amber-400 text-gray-950 active:scale-95' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Pay & Sleep
                            </button>
                        </div>
                    )}

                    {/* --- 4. TOOL REPAIR & UPGRADE --- */}
                    {activeFacility === 'tool_repair' && (
                        <div className="flex flex-col gap-5">
                            {/* Tool Tabs */}
                            <div className="flex gap-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800">
                                <button
                                    onClick={() => setSelectedRepairTool('watering_can')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        selectedRepairTool === 'watering_can' ? 'bg-amber-500 text-gray-950 font-extrabold' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    💧 Watering Can
                                </button>
                                <button
                                    onClick={() => setSelectedRepairTool('fishing_rod')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        selectedRepairTool === 'fishing_rod' ? 'bg-amber-500 text-gray-950 font-extrabold' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    🎣 Fishing Rod
                                </button>
                            </div>

                            {/* Durability Repair section */}
                            <div>
                                <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-1.5">
                                    <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider">Durability Repair</h3>
                                    <span className="text-xs text-gray-400 font-mono">
                                        Current: {selectedRepairTool === 'watering_can' ? stats.wateringCanDurability : (stats.fishingRodDurability ?? 100)} / 100
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    {[
                                        { id: 'dur_25', text: '+25 Durability', price: 15 },
                                        { id: 'dur_50', text: '+50 Durability', price: 25 },
                                        { id: 'dur_full', text: 'Full Durability Repair', price: 40 }
                                    ].map(opt => {
                                        const dur = selectedRepairTool === 'watering_can' ? stats.wateringCanDurability : (stats.fishingRodDurability ?? 100);
                                        return (
                                            <div key={opt.id} className="flex justify-between items-center bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                                                <span className="font-semibold text-xs">{opt.text}</span>
                                                <button 
                                                    onClick={() => repairTool(opt.id as any, selectedRepairTool)}
                                                    disabled={stats.gold < opt.price || dur >= 100}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                                                        stats.gold >= opt.price && dur < 100 ? 'bg-amber-500 text-gray-950 hover:bg-amber-400' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {dur >= 100 ? 'Full' : `Fix (${opt.price} G)`}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Upgrade level section */}
                            <div>
                                <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-2.5 border-b border-gray-800 pb-1.5">
                                    {selectedRepairTool === 'watering_can' ? 'Watering Can Upgrade' : 'Fishing Rod Upgrade'}
                                </h3>
                                
                                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                                    {selectedRepairTool === 'watering_can' ? (
                                        <>
                                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                                                <span>Current Level:</span>
                                                <span className="text-white font-bold font-mono">Level {stats.wateringCanLevel} / 4</span>
                                            </div>
                                            
                                            {stats.wateringCanLevel >= 4 ? (
                                                <div className="text-center text-green-400 text-xs font-bold py-2">
                                                    🌟 Max Tool Level Reached! (20% energy cost discount)
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3 mt-1">
                                                    <div className="text-xs border-t border-gray-850 pt-2.5">
                                                        <span className="font-bold text-amber-500">Next Upgrade Benefits:</span>
                                                        <ul className="list-disc list-inside mt-1 text-gray-300 flex flex-col gap-1 text-[11px]">
                                                            {stats.wateringCanLevel === 1 && <li>Plant Growth Speed +10%</li>}
                                                            {stats.wateringCanLevel === 2 && <li>Higher chance for good seeds from shop</li>}
                                                            {stats.wateringCanLevel === 3 && <li>Farming energy consumption reduced by 20%</li>}
                                                        </ul>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between border-t border-gray-855 pt-2.5">
                                                        <span className="text-xs font-bold">Cost to Upgrade:</span>
                                                        <span className="text-amber-300 font-mono font-bold text-xs">
                                                            {stats.wateringCanLevel === 1 && '300 Gold'}
                                                            {stats.wateringCanLevel === 2 && '700 Gold'}
                                                            {stats.wateringCanLevel === 3 && '1500 Gold'}
                                                        </span>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={() => upgradeTool('watering_can')}
                                                        disabled={
                                                            (stats.wateringCanLevel === 1 && stats.gold < 300) ||
                                                            (stats.wateringCanLevel === 2 && stats.gold < 700) ||
                                                            (stats.wateringCanLevel === 3 && stats.gold < 1500)
                                                        }
                                                        className={`w-full py-2 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer ${
                                                            ((stats.wateringCanLevel === 1 && stats.gold >= 300) ||
                                                             (stats.wateringCanLevel === 2 && stats.gold >= 700) ||
                                                             (stats.wateringCanLevel === 3 && stats.gold >= 1500)) ? 'bg-amber-500 hover:bg-amber-400 text-gray-950 active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        Upgrade Watering Can
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                                                <span>Current Level:</span>
                                                <span className="text-white font-bold font-mono">Level {stats.fishingRodLevel || 1} / 2</span>
                                            </div>
                                            
                                            {(stats.fishingRodLevel || 1) >= 2 ? (
                                                <div className="text-center text-green-400 text-xs font-bold py-2">
                                                    🌟 Max Tool Level Reached! (Higher chances for Rare & Uncommon fish)
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3 mt-1">
                                                    <div className="text-xs border-t border-gray-850 pt-2.5">
                                                        <span className="font-bold text-amber-500">Next Upgrade Benefits:</span>
                                                        <ul className="list-disc list-inside mt-1 text-gray-300 flex flex-col gap-1 text-[11px]">
                                                            <li>Significantly higher chance of catching Uncommon and Rare fish</li>
                                                            <li>Resets durability to 100</li>
                                                        </ul>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between border-t border-gray-855 pt-2.5">
                                                        <span className="text-xs font-bold">Cost to Upgrade:</span>
                                                        <span className="text-amber-300 font-mono font-bold text-xs">
                                                            {(stats.fishingRodLevel || 1) === 1 && '500 Gold'}
                                                        </span>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={() => upgradeTool('fishing_rod')}
                                                        disabled={stats.gold < 500}
                                                        className={`w-full py-2 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer ${
                                                            stats.gold >= 500 ? 'bg-amber-500 hover:bg-amber-400 text-gray-950 active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        Upgrade Fishing Rod
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- 5. MARKETPLACE --- */}
                    {activeFacility === 'marketplace' && (
                        <div className="flex flex-col gap-4 py-2">
                            <p className="text-xs text-gray-400 text-center mb-2">Buy useful tools and items at the village marketplace</p>
                            
                            <div className="flex items-center justify-between bg-gray-950 p-4 rounded-xl border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <span className="text-3.5xl">🎣</span>
                                    <div>
                                        <h4 className="font-bold text-base">Fishing Rod</h4>
                                        <p className="text-xs text-amber-500 font-semibold">Allows you to fish at water sources</p>
                                    </div>
                                </div>
                                {getInventoryCount('fishing_rod') > 0 ? (
                                    <span className="px-4 py-2 bg-gray-800 text-gray-500 rounded-xl text-sm font-extrabold border border-gray-700">
                                        Owned
                                    </span>
                                ) : (
                                    <button 
                                        onClick={buyFishingRod}
                                        disabled={stats.gold < 1000}
                                        className={`px-4 py-2 rounded-xl text-sm font-extrabold cursor-pointer transition-all ${
                                            stats.gold >= 1000 ? 'bg-amber-500 text-gray-950 hover:bg-amber-400 active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                        }`}
                                    >
                                        Buy (1000 G)
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer status bar summary */}
                <div className="bg-gray-950 border-t border-gray-800 px-6 py-3.5 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Authoritative Server Sync
                    </span>
                    <span className="font-mono">Your Gold: {stats.gold} G</span>
                </div>
            </div>

            {/* Sell Confirmation Modal */}
            {confirmSell && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
                    <div className="bg-gray-900 border-2 border-amber-600 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center flex flex-col gap-4 animate-scale-in text-white">
                        <h3 className="font-extrabold text-lg text-amber-400 uppercase tracking-wide">Confirm Sale</h3>
                        <div className="flex flex-col items-center gap-2 py-2">
                            {confirmSell.image ? (
                                <img src={confirmSell.image} className="w-16 h-16 object-contain" alt={confirmSell.name} />
                            ) : (
                                <span className="text-5xl">{confirmSell.emoji}</span>
                            )}
                            <p className="text-sm font-semibold mt-2">
                                Are you sure you want to sell <span className="text-amber-300 font-bold">{confirmSell.count}x {confirmSell.name}</span>?
                            </p>
                            <p className="text-xs text-gray-400 font-mono">
                                Total Value: <span className="text-amber-400 font-bold">{(confirmSell.price * confirmSell.count)} Gold</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmSell(null)}
                                className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    sellCrop(confirmSell.cropType, confirmSell.count);
                                    setConfirmSell(null);
                                }}
                                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold transition-all cursor-pointer shadow-md"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
