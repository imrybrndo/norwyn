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
    inventory: InventoryItem[];
}

export default function HUD() {
    const [stats, setStats] = useState<PlayerStats>({
        gold: 100,
        energy: 100,
        hunger: 100,
        wateringCanLevel: 1,
        wateringCanDurability: 100,
        inventory: []
    });

    const [activeItem, setActiveItem] = useState<string>('harvest'); // default to hand/harvest
    const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [nearFacility, setNearFacility] = useState<string | null>(null);

    useEffect(() => {
        // Listen to stats changes from Colyseus
        const onStatsChanged = (newStats: PlayerStats) => {
            setStats(newStats);
        };

        // Listen for proximity check
        const onNearFacility = (facility: string | null) => {
            setNearFacility(facility);
        };

        // Listen for toast messages
        const onToast = (data: { type: string; message: string }) => {
            setToast({ message: data.message, type: data.type });
            setTimeout(() => setToast(null), 3000);
        };

        // Listen for errors
        const onError = (msg: string) => {
            setErrorMsg(msg);
            setTimeout(() => setErrorMsg(null), 3000);
        };

        EventBus.on('player-stats-changed', onStatsChanged);
        EventBus.on('near-facility', onNearFacility);
        EventBus.on('network-toast', onToast);
        EventBus.on('network-error', onError);

        // Set initial Phaser active item
        EventBus.emit('set-active-item', activeItem);

        return () => {
            EventBus.off('player-stats-changed', onStatsChanged);
            EventBus.off('near-facility', onNearFacility);
            EventBus.off('network-toast', onToast);
            EventBus.off('network-error', onError);
        };
    }, [activeItem]);

    const selectItem = (itemType: string) => {
        setActiveItem(itemType);
        EventBus.emit('set-active-item', itemType);
    };

    const handleEatFood = (foodType: string) => {
        EventBus.emit('send-room-message', { type: 'eatFood', payload: { foodType } });
    };

    const openFacilityMenu = () => {
        if (nearFacility) {
            EventBus.emit('open-facility-menu', nearFacility);
        }
    };

    // Helper to count inventory items
    const getInventoryCount = (itemType: string) => {
        return stats.inventory.find(i => i.itemType === itemType)?.count ?? 0;
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-10 font-sans">
            {/* Top-Left: Stats Bars */}
            <div className="absolute top-4 left-4 bg-gray-900/90 border border-gray-700/50 p-4 rounded-xl shadow-2xl flex flex-col gap-3 pointer-events-auto min-w-[200px] backdrop-blur-md">
                <div className="flex items-center justify-between text-white font-bold text-sm">
                    <span className="text-amber-400">💰 Gold</span>
                    <span className="text-amber-300 font-mono text-base">{stats.gold} G</span>
                </div>

                {/* Energy Bar */}
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-green-400 font-bold">
                        <span>⚡ Energy</span>
                        <span>{stats.energy} / 100</span>
                    </div>
                    <div className="w-full bg-gray-950 h-3.5 rounded-full overflow-hidden border border-gray-800">
                        <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-400 h-full transition-all duration-300"
                            style={{ width: `${stats.energy}%` }}
                        />
                    </div>
                </div>

                {/* Hunger Bar */}
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-orange-400 font-bold">
                        <span>🍖 Hunger</span>
                        <span>{stats.hunger} / 100</span>
                    </div>
                    <div className="w-full bg-gray-950 h-3.5 rounded-full overflow-hidden border border-gray-800">
                        <div 
                            className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-300"
                            style={{ width: `${stats.hunger}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom-Center: Hotbar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/95 border-2 border-gray-800/80 p-3 rounded-2xl shadow-2xl pointer-events-auto flex items-center gap-3 backdrop-blur-md">
                {/* Hand/Harvest Slot */}
                <button
                    onClick={() => selectItem('harvest')}
                    className={`relative w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                        activeItem === 'harvest' ? 'border-amber-500 bg-amber-500/20 text-white' : 'border-gray-700 bg-gray-950/60 text-gray-400 hover:border-gray-500'
                    }`}
                >
                    <span className="text-lg">✋</span>
                    <span className="text-[9px] font-bold mt-1">Harvest</span>
                </button>

                {/* Watering Can Slot */}
                <button
                    onClick={() => selectItem('watering_can')}
                    className={`relative w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                        activeItem === 'watering_can' ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-gray-700 bg-gray-950/60 text-gray-400 hover:border-gray-500'
                    }`}
                >
                    <span className="text-lg">💧</span>
                    <span className="text-[9px] font-bold mt-0.5">Water Lvl {stats.wateringCanLevel}</span>
                    <div className="absolute bottom-1 left-2 right-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="bg-blue-400 h-full"
                            style={{ width: `${stats.wateringCanDurability}%` }}
                        />
                    </div>
                </button>

                <div className="w-[1px] bg-gray-800 h-10 self-center" />

                {/* Seeds Slots */}
                <div className="flex gap-2">
                    {[
                        { type: 'seed_rice', name: 'Rice', emoji: '🌾' },
                        { type: 'seed_vegetable', name: 'Veg', emoji: '🥬' },
                        { type: 'seed_fruit', name: 'Fruit', emoji: '🍎' },
                        { type: 'seed_golden_tree', name: 'Golden', emoji: '⭐' }
                    ].map(seed => {
                        const count = getInventoryCount(seed.type);
                        return (
                            <button
                                key={seed.type}
                                onClick={() => selectItem(seed.type)}
                                disabled={count === 0}
                                className={`relative w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                                    count === 0 ? 'opacity-50 border-gray-800/80 bg-gray-950/50 cursor-not-allowed text-gray-400' :
                                    activeItem === seed.type ? 'border-emerald-500 bg-emerald-500/20 text-white' : 'border-gray-700 bg-gray-950/60 text-gray-300 hover:border-gray-500'
                                }`}
                            >
                                <span className="text-lg">{seed.emoji}</span>
                                <span className="text-[9px] font-semibold mt-0.5">{seed.name}</span>
                                <span className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white border border-gray-600 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="w-[1px] bg-gray-800 h-10 self-center" />

                {/* Food Items (Interactable to eat) */}
                <div className="flex gap-2">
                    {[
                        { type: 'food_bread', name: 'Bread', emoji: '🍞' },
                        { type: 'food_rice_bowl', name: 'Bowl', emoji: '🍚' }
                    ].map(food => {
                        const count = getInventoryCount(food.type);
                        return (
                            <button
                                key={food.type}
                                onClick={() => count > 0 && handleEatFood(food.type)}
                                disabled={count === 0}
                                className={`relative w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                                    count === 0 ? 'opacity-50 border-gray-800/80 bg-gray-950/50 cursor-not-allowed text-gray-400' :
                                    'border-amber-600 bg-amber-600/10 hover:bg-amber-600/30 text-gray-200'
                                }`}
                                title="Click to Eat!"
                            >
                                <span className="text-lg">{food.emoji}</span>
                                <span className="text-[8px] font-bold text-amber-500 uppercase">Eat</span>
                                <span className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white border border-gray-600 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Middle Proximity Popup Prompt */}
            {nearFacility && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-amber-500 text-gray-950 font-bold px-6 py-2.5 rounded-full shadow-2xl animate-bounce pointer-events-auto border border-amber-300 flex items-center gap-3">
                    <span>🏢 Proximity: {nearFacility.replace('_', ' ').toUpperCase()}</span>
                    <button
                        onClick={openFacilityMenu}
                        className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                    >
                        Open Menu
                    </button>
                </div>
            )}

            {/* Error notifications */}
            {errorMsg && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-600/90 text-white font-bold px-6 py-3 rounded-lg shadow-2xl border border-red-500 flex items-center gap-2 max-w-md">
                    <span>❌ {errorMsg}</span>
                </div>
            )}

            {/* Success toasts */}
            {toast && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-emerald-600/90 text-white font-bold px-6 py-3 rounded-lg shadow-2xl border border-emerald-500 flex items-center gap-2 max-w-md">
                    <span>🌿 {toast.message}</span>
                </div>
            )}
        </div>
    );
}
