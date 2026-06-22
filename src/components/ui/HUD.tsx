'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EventBus } from '../../game/EventBus';
import { 
    Coins, 
    Flame, 
    Utensils, 
    Backpack, 
    Settings, 
    X, 
    Send, 
    Volume2, 
    VolumeX, 
    Keyboard, 
    Award,
    CheckCircle,
    User,
    HelpCircle
} from 'lucide-react';
import PlaytimeRankingModal from './PlaytimeRankingModal';

interface InventoryItem {
    itemType: string;
    count: number;
}

interface PlayerStats {
    gold: number;
    energy: number;
    hunger: number;
    level: number;
    exp: number;
    wateringCanLevel: number;
    wateringCanDurability: number;
    fishingRodLevel?: number;
    fishingRodDurability?: number;
    inventory: InventoryItem[];
    lastClaimedQuests?: Record<string, number>;
    username?: string;
    isSleeping?: boolean;
}

interface ChatMessage {
    senderId: string;
    username: string;
    text: string;
    timestamp: number;
}

// Map item types to metadata (names, emojis/images, descriptions)
const getItemMetadata = (itemType: string) => {
    switch (itemType) {
        case 'seed_rice':
            return { name: 'Rice Seed', image: '/padi.png', desc: 'Plant to grow fresh rice.' };
        case 'seed_vegetable':
            return { name: 'Vegy Seed', emoji: '🥬', desc: 'Plant to grow crunchy vegetables.' };
        case 'seed_fruit':
            return { name: 'Apple Seed', emoji: '🍎', desc: 'Plant to grow sweet apples.' };
        case 'seed_golden_tree':
            return { name: 'Golden Seed', emoji: '⭐', desc: 'A rare seed that grows golden wood.' };
        case 'crop_rice':
            return { name: 'Rice Crop', image: '/padi.png', desc: 'Harvested rice. Sell at the shop.' };
        case 'crop_vegetable':
            return { name: 'Fresh Vegy', emoji: '🥬', desc: 'Harvested vegetable. Sell at the shop.' };
        case 'crop_fruit':
            return { name: 'Apple Crop', emoji: '🍎', desc: 'Harvested apple. Sell at the shop.' };
        case 'crop_golden_tree':
            return { name: 'Golden Wood', emoji: '⭐', desc: 'Extremely rare wood. Worth a lot of gold.' };
        case 'food_bread':
            return { name: 'Fresh Bread', emoji: '🍞', desc: 'Restores 10 Energy and 20 Hunger.', type: 'food' };
        case 'food_rice_bowl':
            return { name: 'Rice Bowl', emoji: '🍚', desc: 'Restores 30 Energy and 50 Hunger.', type: 'food' };
        case 'fishing_rod':
            return { name: 'Fishing Rod', emoji: '🎣', desc: 'Used to catch fish at water spots.' };
        case 'fish_common':
            return { name: 'Common Fish', emoji: '🐟', desc: 'A common fish. Sell at the shop.' };
        case 'fish_uncommon':
            return { name: 'Uncommon Fish', emoji: '🐠', desc: 'An uncommon fish. Sell at the shop.' };
        case 'fish_rare':
            return { name: 'Rare Fish', emoji: '🐡', desc: 'A rare fish. Sell at the shop.' };
        default:
            return { name: itemType.replace('_', ' '), emoji: '📦', desc: 'A pixel item.' };
    }
};

export default function HUD() {
    const [stats, setStats] = useState<PlayerStats>({
        gold: 100,
        energy: 100,
        hunger: 100,
        level: 1,
        exp: 0,
        wateringCanLevel: 1,
        wateringCanDurability: 100,
        fishingRodLevel: 1,
        fishingRodDurability: 100,
        inventory: [],
        lastClaimedQuests: {},
        username: 'Farmer'
    });

    const [activeItem, setActiveItem] = useState<string>('harvest'); // default to hand/harvest
    const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [nearFacility, setNearFacility] = useState<string | null>(null);

    const [fishingState, setFishingState] = useState<'IDLE' | 'CASTING' | 'WAITING' | 'BITE' | 'REELING' | 'CAUGHT'>('IDLE');

    // Modals Visibility
    const [activeModal, setActiveModal] = useState<'inventory' | 'quests' | 'settings' | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const [isRankingOpen, setIsRankingOpen] = useState(false);
    const [rankingData, setRankingData] = useState<any[]>([]);

    // Chat States
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInputText, setChatInputText] = useState('');
    const [isChatFocused, setIsChatFocused] = useState(false);
    const chatListRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);

    // Hover Tooltip State
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    // Online Count
    const [onlineCount, setOnlineCount] = useState(1);

    // Define 9 slots items
    const hotbarSlots = [
        { key: 1, type: 'harvest', name: 'Hand', emoji: '✋' },
        { key: 2, type: 'watering_can', name: 'Water', emoji: '💧' },
        { key: 3, type: 'seed_rice', name: 'Rice Seed', image: '/padi.png' },
        { key: 4, type: 'seed_vegetable', name: 'Vegy Seed', emoji: '🥬' },
        { key: 5, type: 'seed_fruit', name: 'Apple Seed', emoji: '🍎' },
        { key: 6, type: 'seed_golden_tree', name: 'Golden Seed', emoji: '⭐' },
        { key: 7, type: 'food_bread', name: 'Bread', emoji: '🍞', isFood: true },
        { key: 8, type: 'food_rice_bowl', name: 'Rice Bowl', emoji: '🍚', isFood: true },
        { key: 9, type: 'placeholder', name: 'Empty', emoji: '❌', disabled: true }
    ];

    useEffect(() => {
        // Sync stats changes
        const onStatsChanged = (newStats: PlayerStats) => {
            setStats(prev => ({
                ...prev,
                ...newStats,
                // keep username if not specified in newStats
                username: newStats.username || prev.username
            }));
        };

        const onFishingStateChanged = (state: any) => {
            setFishingState(state);
        };

        EventBus.on('player-fishing-state-changed', onFishingStateChanged);

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

        // Listen to incoming chat messages
        const handleChatReceived = (msg: ChatMessage) => {
            setChatMessages((prev) => [...prev.slice(-49), msg]); // Keep last 50
        };

        const handleOnlineCount = (count: number) => {
            setOnlineCount(count);
        };

        const onOpenRanking = () => {
            setIsRankingOpen(true);
        };

        const onRankingData = (data: any[]) => {
            setRankingData(data);
        };

        EventBus.on('player-stats-changed', onStatsChanged);
        EventBus.on('near-facility', onNearFacility);
        EventBus.on('network-toast', onToast);
        EventBus.on('network-error', onError);
        EventBus.on('chat-received', handleChatReceived);
        EventBus.on('online-count-changed', handleOnlineCount);
        EventBus.on('open-playtime-ranking', onOpenRanking);
        EventBus.on('playtime-ranking-data', onRankingData);

        // Set initial Phaser active item
        EventBus.emit('set-active-item', activeItem);

        // Keyboard Listener for Hotbar (1-9) and Enter to Chat
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if sleeping
            if (stats.isSleeping) {
                return;
            }
            // Ignore if user is typing in chat or any other input
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }

            // Number keys 1-9
            const keyNum = parseInt(e.key);
            if (keyNum >= 1 && keyNum <= 9) {
                e.preventDefault();
                const slot = hotbarSlots.find(s => s.key === keyNum);
                if (slot && !slot.disabled) {
                    if (slot.isFood) {
                        const count = getInventoryCount(slot.type);
                        if (count > 0) {
                            handleEatFood(slot.type);
                        }
                    } else {
                        selectItem(slot.type);
                    }
                }
            }

            // Enter key opens chat input
            if (e.key === 'Enter') {
                e.preventDefault();
                chatInputRef.current?.focus();
            }

            // E key interacts if near a facility
            if ((e.key === 'e' || e.key === 'E') && nearFacility) {
                e.preventDefault();
                openFacilityMenu();
            }

            // Tab key toggles backpack inventory
            if (e.key === 'Tab') {
                e.preventDefault();
                setActiveModal(prev => prev === 'inventory' ? null : 'inventory');
            }

            // Escape key closes open modal or toggles settings
            if (e.key === 'Escape') {
                e.preventDefault();
                setActiveModal(prev => prev ? null : 'settings');
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            EventBus.off('player-stats-changed', onStatsChanged);
            EventBus.off('near-facility', onNearFacility);
            EventBus.off('player-fishing-state-changed', onFishingStateChanged);
            EventBus.off('network-toast', onToast);
            EventBus.off('network-error', onError);
            EventBus.off('chat-received', handleChatReceived);
            EventBus.off('online-count-changed', handleOnlineCount);
            EventBus.off('open-playtime-ranking', onOpenRanking);
            EventBus.off('playtime-ranking-data', onRankingData);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeItem, nearFacility, stats.inventory, fishingState]);

    useEffect(() => {
        EventBus.emit('toggle-sound', soundEnabled);

        const handleRequestSoundStatus = () => {
            EventBus.emit('toggle-sound', soundEnabled);
        };

        EventBus.on('request-sound-status', handleRequestSoundStatus);

        return () => {
            EventBus.off('request-sound-status', handleRequestSoundStatus);
        };
    }, [soundEnabled]);

    useEffect(() => {
        // Scroll to bottom of chat
        if (chatListRef.current) {
            chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const selectItem = (itemType: string) => {
        setActiveItem(itemType);
        EventBus.emit('set-active-item', itemType);
    };

    const handleEatFood = (foodType: string) => {
        EventBus.emit('send-room-message', { type: 'eatFood', payload: { foodType } });
    };

    const openFacilityMenu = () => {
        if (nearFacility) {
            if (
                ['Chest', 'Top Ranking', 'Portal 1', 'Portal 2'].includes(nearFacility) ||
                nearFacility.includes('laut') ||
                nearFacility.includes('sungai') ||
                nearFacility.includes('danau')
            ) {
                EventBus.emit('interact-near-object');
            } else {
                EventBus.emit('open-facility-menu', nearFacility);
            }
        }
    };

    const handleChatFocus = () => {
        setIsChatFocused(true);
        EventBus.emit('disable-player-input');
    };

    const handleChatBlur = () => {
        setIsChatFocused(false);
        EventBus.emit('enable-player-input');
    };

    const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            chatInputRef.current?.blur();
        }
    };

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInputText.trim()) {
            chatInputRef.current?.blur();
            return;
        }

        EventBus.emit('send-chat', chatInputText.trim());
        setChatInputText('');
        chatInputRef.current?.blur();
    };

    const getInventoryCount = (itemType: string) => {
        return stats.inventory.find(i => i.itemType === itemType)?.count ?? 0;
    };

    // Quests completion checking
    const getQuestStatus = (questType: string) => {
        const lastClaimed = stats.lastClaimedQuests?.[questType] || 0;
        const ONE_DAY = 24 * 60 * 60 * 1000;
        if (Date.now() - lastClaimed < ONE_DAY) return 'claimed';

        switch (questType) {
            case 'rice':
                return getInventoryCount('crop_rice') >= 1 ? 'ready' : 'active';
            case 'vegy':
                return getInventoryCount('crop_vegetable') >= 1 ? 'ready' : 'active';
            case 'apple':
                return getInventoryCount('crop_fruit') >= 1 ? 'ready' : 'active';
            case 'gold':
                return stats.gold >= 500 ? 'ready' : 'active';
            case 'fish':
                return (getInventoryCount('fish_common') >= 1 || 
                        getInventoryCount('fish_uncommon') >= 1 || 
                        getInventoryCount('fish_rare') >= 1) ? 'ready' : 'active';
            default:
                return 'active';
        }
    };

    const handleClaimQuest = (questType: string) => {
        EventBus.emit('send-room-message', { type: 'claimQuest', payload: { questId: questType } });
    };

    const handleLogout = () => {
        window.location.reload(); // simple logout for now
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-10 font-pixel flex flex-col justify-between p-4 select-none">
            
            {/* ========================================================
                TOP OVERLAY: STATUS BAR & ECONOMY
               ======================================================== */}
            <div className="flex justify-between items-start w-full">
                
                {/* Top-Left: Status Bar */}
                <div className="flex flex-col gap-2 bg-gray-900/90 border-4 border-slate-900 p-4 rounded-xl shadow-2xl pointer-events-auto min-w-[240px] text-white retro-shadow">
                    <div className="flex items-center gap-2 border-b border-gray-700 pb-1.5 mb-1">
                        <User className="w-4 h-4 text-amber-400" />
                        <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase truncate max-w-[150px]">
                            Lv.{stats.level} {stats.username || 'Farmer'}
                        </span>
                    </div>

                    {/* EXP Bar */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-blue-400 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1">⭐ EXP</span>
                            <span>{stats.exp} / {stats.level * 100}</span>
                        </div>
                        <div className="w-full bg-slate-950 h-3 border-2 border-slate-900 rounded overflow-hidden">
                            <div 
                                className="bg-blue-500 h-full transition-all duration-300 border-r border-blue-400"
                                style={{ width: `${Math.min(100, (stats.exp / (stats.level * 100)) * 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Energy Bar */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-amber-300 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1">⚡ Energy</span>
                            <span>{stats.energy} / 100</span>
                        </div>
                        <div className="w-full bg-slate-950 h-5 border-2 border-slate-900 rounded overflow-hidden">
                            <div 
                                className="bg-yellow-400 h-full transition-all duration-300 border-r border-yellow-300"
                                style={{ width: `${stats.energy}%` }}
                            />
                        </div>
                    </div>

                    {/* Hunger Bar */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1">🍖 Hunger</span>
                            <span>{stats.hunger} / 100</span>
                        </div>
                        <div className="w-full bg-slate-950 h-5 border-2 border-slate-900 rounded overflow-hidden">
                            <div 
                                className="bg-emerald-500 h-full transition-all duration-300 border-r border-emerald-400"
                                style={{ width: `${stats.hunger}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Top-Right: Economy */}
                <div className="bg-gray-900/90 border-4 border-slate-900 p-4 rounded-xl shadow-2xl pointer-events-auto text-white retro-shadow flex items-center gap-3">
                   
                        <img src="/assets/h-coin.png" className="w-8 h-8 object-contain" alt="H-Coin" />
                 
                    <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider">Balance</span>
                        <span className="text-sm font-bold text-amber-400 font-mono tracking-wide">
                            {stats.gold.toLocaleString()} G
                        </span>
                    </div>
                </div>
            </div>

            {/* ========================================================
                MIDDLE OVERLAY: PROXIMITY PROMPT
               ======================================================== */}
            {nearFacility && (
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-auto">
                    <div className={`${
                        fishingState === 'BITE' ? 'bg-rose-500 animate-pulse scale-110' : 'bg-amber-500'
                    } border-4 border-slate-900 px-6 py-3 rounded-2xl shadow-2xl animate-bounce flex flex-col items-center gap-1 transition-all duration-200`}>
                        <span className="text-gray-950 font-bold text-xs uppercase tracking-wider text-center">
                            {nearFacility === 'Chest' && "🎁 Daily Chest"}
                            {nearFacility === 'Top Ranking' && "🏆 Playtime Ranking"}
                            {nearFacility === 'Portal 1' && "🌀 Portal to Forest"}
                            {nearFacility === 'Portal 2' && "🌀 Portal to Sea"}
                            {(nearFacility.includes('laut') || nearFacility.includes('sungai') || nearFacility.includes('danau')) && (
                                fishingState === 'IDLE' ? "🎣 Fishing Spot" :
                                fishingState === 'CASTING' ? "🎣 Casting Line..." :
                                fishingState === 'WAITING' ? "⏳ Waiting for a Bite..." :
                                fishingState === 'BITE' ? "❗️ BITE!" :
                                fishingState === 'REELING' ? "🎣 Reeling in..." :
                                "🐠 Caught!"
                            )}
                            {!['Chest', 'Top Ranking', 'Portal 1', 'Portal 2'].includes(nearFacility) && 
                             !nearFacility.includes('laut') && !nearFacility.includes('sungai') && !nearFacility.includes('danau') && 
                             `🏠 ${nearFacility.replace('_', ' ')}`}
                        </span>
                        <span className="text-slate-900 text-[10px] font-bold">
                            {nearFacility === 'Chest' ? "Press [E] to Open" :
                             nearFacility === 'Top Ranking' ? "Press [E] to View" :
                             (nearFacility === 'Portal 1' || nearFacility === 'Portal 2') ? "Press [E] to Enter" :
                             (nearFacility.includes('laut') || nearFacility.includes('sungai') || nearFacility.includes('danau')) ? (
                                 fishingState === 'IDLE' ? "Press [E] to Fish" :
                                 fishingState === 'CASTING' ? "Get ready..." :
                                 fishingState === 'WAITING' ? "Wait for the splash!" :
                                 fishingState === 'BITE' ? "PRESS [E] NOW!" :
                                 "Pulling..."
                             ) :
                             "Press [E] to Open Menu"}
                        </span>
                    </div>
                </div>
            )}

            {/* ========================================================
                BOTTOM OVERLAY: CHAT, HOTBAR, NAVIGATION
               ======================================================== */}
            <div className="grid grid-cols-12 gap-4 items-end w-full">
                
                {/* Bottom-Left: Chat Log */}
                <div className="col-span-3 bg-gray-900/80 border-4 border-slate-900 p-3 rounded-xl shadow-2xl pointer-events-auto flex flex-col gap-2 h-56 text-white retro-shadow">
                    <div className="text-[9px] text-gray-400 uppercase border-b border-gray-800 pb-1 flex items-center justify-between font-bold">
                        <span>💬 Village Chat</span>
                        <span className="text-amber-500 animate-pulse text-[8px]">[ONLINE: {onlineCount}]</span>
                    </div>

                    <div 
                        ref={chatListRef}
                        className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 text-[9px] select-text scrollbar-thin scrollbar-thumb-gray-800"
                    >
                        {chatMessages.length === 0 ? (
                            <div className="text-gray-500 italic mt-auto">Welcome to Chat! Type or press Enter...</div>
                        ) : (
                            chatMessages.map((msg, index) => (
                                <div key={index} className="leading-relaxed break-words">
                                    <span className="text-amber-400 font-bold">{msg.username}: </span>
                                    <span className="text-gray-200">{msg.text}</span>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleChatSubmit} className="flex gap-2 border-t border-gray-800 pt-2">
                        <input
                            ref={chatInputRef}
                            type="text"
                            value={chatInputText}
                            onChange={(e) => setChatInputText(e.target.value)}
                            onFocus={handleChatFocus}
                            onBlur={handleChatBlur}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                handleChatKeyDown(e);
                            }}
                            onKeyUp={(e) => {
                                e.stopPropagation();
                            }}
                            placeholder="Press Enter..."
                            maxLength={80}
                            className="flex-1 px-2 py-1.5 bg-slate-950 border-2 border-slate-800 rounded text-[9px] text-white focus:outline-none focus:border-amber-500 placeholder-gray-600 font-mono"
                        />
                        <button 
                            type="submit"
                            className="p-1.5 bg-amber-600 hover:bg-amber-500 border-2 border-slate-900 text-white rounded cursor-pointer active:translate-y-[2px]"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </form>
                </div>

                {/* Bottom-Center: Hotbar */}
                <div className="col-span-6 flex justify-center">
                    <div className="bg-gray-900/90 border-4 border-slate-900 p-3 rounded-2xl shadow-2xl pointer-events-auto flex items-center gap-2.5 backdrop-blur-md retro-shadow relative">
                        {hotbarSlots.map((slot) => {
                            const count = slot.disabled ? 0 : getInventoryCount(slot.type);
                            const isActive = activeItem === slot.type;
                            const isTool = slot.type === 'harvest' || slot.type === 'watering_can';
                            const hasItem = isTool || count > 0;

                            return (
                                <button
                                    key={slot.key}
                                    onClick={() => {
                                        if (slot.disabled) return;
                                        if (slot.isFood) {
                                            if (count > 0) handleEatFood(slot.type);
                                        } else {
                                            selectItem(slot.type);
                                        }
                                    }}
                                    disabled={!hasItem && !slot.disabled}
                                    className={`relative w-14 h-14 rounded-xl flex flex-col items-center justify-center border-4 transition-all cursor-pointer ${
                                        slot.disabled ? 'border-gray-800 bg-gray-950/30 opacity-30 cursor-not-allowed' :
                                        !hasItem ? 'opacity-40 border-gray-800 bg-gray-950/50 cursor-not-allowed' :
                                        isActive ? 'border-amber-500 bg-amber-500/20 shadow-inner' :
                                        'border-gray-700 bg-gray-950 hover:border-gray-500'
                                    }`}
                                >
                                    {/* Slot Number */}
                                    <span className="absolute top-0.5 left-1 text-[8px] font-bold text-gray-500 font-mono">
                                        {slot.key}
                                    </span>

                                    {/* Item Icon */}
                                    {slot.image ? (
                                        <img src={slot.image} className="w-6 h-6 object-contain [image-rendering:pixelated]" alt={slot.name} />
                                    ) : (
                                        <span className="text-xl">{slot.emoji}</span>
                                    )}

                                    {/* Display label or details */}
                                    {slot.type === 'watering_can' ? (
                                        <div className="absolute bottom-1 left-1.5 right-1.5 h-1 bg-slate-900 rounded overflow-hidden">
                                            <div 
                                                className="bg-blue-400 h-full"
                                                style={{ width: `${stats.wateringCanDurability}%` }}
                                            />
                                        </div>
                                    ) : !slot.disabled && !isTool && count > 0 ? (
                                        <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white border-2 border-slate-700 text-[8px] w-5 h-5 flex items-center justify-center rounded-full font-bold font-mono">
                                            {count}
                                        </span>
                                    ) : null}

                                    {/* Food Eating Indicator */}
                                    {slot.isFood && count > 0 && (
                                        <span className="absolute bottom-0.5 text-[6px] text-amber-500 uppercase tracking-tight font-extrabold">
                                            EAT
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom-Right: Main Navigation */}
                <div className="col-span-3 flex justify-end">
                    <div className="bg-gray-900/90 border-4 border-slate-900 p-2.5 rounded-2xl shadow-2xl pointer-events-auto flex gap-3 retro-shadow">
                        {/* Backpack Button */}
                        <button
                            onClick={() => setActiveModal(activeModal === 'inventory' ? null : 'inventory')}
                            className={`p-3 border-4 border-slate-900 rounded-xl cursor-pointer text-white transition-all active:translate-y-[2px] ${
                                activeModal === 'inventory' ? 'bg-amber-500 border-amber-600' : 'bg-slate-850 hover:bg-slate-800'
                            }`}
                            title="Backpack Inventory"
                        >
                            <Backpack className="w-5 h-5 text-amber-400" />
                        </button>

                        {/* Quests Button */}
                        <button
                            onClick={() => setActiveModal(activeModal === 'quests' ? null : 'quests')}
                            className={`p-3 border-4 border-slate-900 rounded-xl cursor-pointer text-white transition-all active:translate-y-[2px] ${
                                activeModal === 'quests' ? 'bg-amber-500 border-amber-600' : 'bg-slate-850 hover:bg-slate-800'
                            }`}
                            title="Quests Log"
                        >
                            <Award className="w-5 h-5 text-emerald-400" />
                        </button>

                        {/* Settings Button */}
                        <button
                            onClick={() => setActiveModal(activeModal === 'settings' ? null : 'settings')}
                            className={`p-3 border-4 border-slate-900 rounded-xl cursor-pointer text-white transition-all active:translate-y-[2px] ${
                                activeModal === 'settings' ? 'bg-amber-500 border-amber-600' : 'bg-slate-850 hover:bg-slate-800'
                            }`}
                            title="Game Settings"
                        >
                            <Settings className="w-5 h-5 text-blue-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ========================================================
                FLOATING TOASTS / ERROR NOTIFICATION
               ======================================================== */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center pointer-events-auto">
                {errorMsg && (
                    <div className="bg-red-600/90 text-white font-bold px-5 py-2.5 rounded-lg shadow-2xl border-4 border-slate-900 flex items-center gap-2 max-w-md animate-scale-in text-[10px]">
                        <span>❌ {errorMsg}</span>
                    </div>
                )}
                {toast && (
                    <div className="bg-emerald-600/90 text-white font-bold px-5 py-2.5 rounded-lg shadow-2xl border-4 border-slate-900 flex items-center gap-2 max-w-md animate-scale-in text-[10px]">
                        <span>🌿 {toast.message}</span>
                    </div>
                )}
            </div>

            {/* ========================================================
                CENTER MODALS (INVENTORY, QUESTS, SETTINGS)
               ======================================================== */}
            {activeModal && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto z-50 flex items-center justify-center">
                    
                    {/* --- 1. BACKPACK INVENTORY MODAL --- */}
                    {activeModal === 'inventory' && (
                        <div className="bg-gray-900 border-4 border-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 text-white retro-shadow relative animate-scale-in">
                            <button 
                                onClick={() => setActiveModal(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-base font-bold text-amber-400 uppercase tracking-widest mb-4 border-b-4 border-gray-800 pb-2 flex items-center gap-2">
                                <Backpack className="w-5 h-5" /> Backpack Inventory
                            </h2>

                            {/* 24 slots Grid (6 columns x 4 rows) */}
                            <div className="grid grid-cols-6 gap-3 mb-4">
                                {Array.from({ length: 24 }).map((_, index) => {
                                    // Map items to the grid
                                    const item = stats.inventory[index];
                                    const meta = item ? getItemMetadata(item.itemType) : null;
                                    const isFood = meta?.type === 'food';

                                    return (
                                        <div
                                            key={index}
                                            onMouseEnter={() => item && setHoveredItem(item.itemType)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                            onClick={() => {
                                                if (item && isFood) {
                                                    handleEatFood(item.itemType);
                                                }
                                            }}
                                            className={`w-[60px] h-[60px] bg-slate-950 border-4 rounded-xl flex items-center justify-center relative cursor-pointer ${
                                                item ? 'border-slate-800 hover:border-amber-500' : 'border-slate-800/40 cursor-default'
                                            }`}
                                        >
                                            {item && meta && (
                                                <>
                                                    {meta.image ? (
                                                        <img src={meta.image} className="w-8 h-8 object-contain [image-rendering:pixelated]" alt={meta.name} />
                                                    ) : (
                                                        <span className="text-2xl">{meta.emoji}</span>
                                                    )}
                                                    <span className="absolute bottom-0.5 right-1 bg-slate-900 border border-slate-700 text-[8px] px-1 rounded font-bold font-mono">
                                                        {item.count}
                                                    </span>

                                                    {isFood && (
                                                        <span className="absolute top-0.5 right-0.5 text-[5px] text-amber-500 font-extrabold uppercase leading-none">
                                                            EAT
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Hover description pane */}
                            <div className="bg-slate-955 border-4 border-slate-800 p-3 rounded-xl min-h-[70px] text-[10px] text-gray-300">
                                {hoveredItem ? (
                                    <div>
                                        <h4 className="font-bold text-amber-400 text-xs mb-0.5">
                                            {getItemMetadata(hoveredItem).name}
                                        </h4>
                                        <p>{getItemMetadata(hoveredItem).desc}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-550 italic text-center pt-2">Hover over an item for details</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- 2. QUESTS MODAL --- */}
                    {activeModal === 'quests' && (
                        <div className="bg-gray-900 border-4 border-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 text-white retro-shadow relative animate-scale-in">
                            <button 
                                onClick={() => setActiveModal(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-base font-bold text-emerald-400 uppercase tracking-widest mb-4 border-b-4 border-gray-800 pb-2 flex items-center gap-2">
                                <Award className="w-5 h-5" /> Active Quests
                            </h2>

                            <div className="flex flex-col gap-4 max-h-80 overflow-y-auto">
                                {[
                                    { key: 'rice', title: 'Plant Rice', desc: 'Harvest 1 Rice Crop.', iconImg: '/padi.png' },
                                    { key: 'vegy', title: 'Eat your Vegy', desc: 'Harvest 1 Vegetable Crop.', icon: '🥬' },
                                    { key: 'apple', title: 'Apple Season', desc: 'Harvest 1 Apple.', icon: '🍎' },
                                    { key: 'gold', title: 'Wealth Accumulator', desc: 'Acquire 500 gold.', icon: '💰' },
                                    { key: 'fish', title: 'Master Angler', desc: 'Catch 1 Fish (Any).', icon: '🎣' }
                                ].map(quest => {
                                    const status = getQuestStatus(quest.key);
                                    return (
                                        <div key={quest.key} className="bg-slate-950 border-4 border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {quest.iconImg ? (
                                                    <img src={quest.iconImg} alt={quest.title} className="w-8 h-8 object-contain [image-rendering:pixelated]" />
                                                ) : (
                                                    <span className="text-2xl">{quest.icon}</span>
                                                )}
                                                <div className="flex flex-col gap-0.5">
                                                    <h4 className={`text-xs font-bold ${status === 'claimed' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                                        {quest.title}
                                                    </h4>
                                                    <p className="text-[9px] text-gray-450">{quest.desc}</p>
                                                </div>
                                            </div>

                                            {status === 'claimed' ? (
                                                <div className="flex items-center gap-1 bg-gray-500/10 border-2 border-gray-500 text-gray-400 px-2.5 py-1 rounded text-[8px] font-bold">
                                                    <CheckCircle className="w-3 h-3" /> Done Today
                                                </div>
                                            ) : status === 'ready' ? (
                                                <button 
                                                    onClick={() => handleClaimQuest(quest.key)}
                                                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 border-2 border-emerald-600 text-gray-900 px-3 py-1.5 rounded text-[9px] font-extrabold cursor-pointer active:scale-95 transition-transform"
                                                >
                                                    Claim
                                                </button>
                                            ) : (
                                                <div className="bg-amber-500/10 border-2 border-amber-500 text-amber-400 px-2.5 py-1 rounded text-[8px] font-bold">
                                                    Active
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- 3. SETTINGS MODAL --- */}
                    {activeModal === 'settings' && (
                        <div className="bg-gray-900 border-4 border-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 text-white retro-shadow relative animate-scale-in">
                            <button 
                                onClick={() => setActiveModal(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-base font-bold text-blue-400 uppercase tracking-widest mb-4 border-b-4 border-gray-800 pb-2 flex items-center gap-2">
                                <Settings className="w-5 h-5" /> Settings & Controls
                            </h2>

                            <div className="flex flex-col gap-4 text-[10px] text-gray-300">
                                {/* Sound Settings */}
                                <div className="bg-slate-955 border-4 border-slate-800 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col gap-0.5">
                                        <h4 className="font-bold text-xs text-white">Audio Settings</h4>
                                        <p className="text-[8px] text-gray-500">Toggle game music and sounds</p>
                                    </div>
                                    <button
                                        onClick={() => setSoundEnabled(!soundEnabled)}
                                        className="p-2 bg-slate-850 hover:bg-slate-800 border-2 border-slate-700 text-white rounded cursor-pointer"
                                    >
                                        {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-red-500" />}
                                    </button>
                                </div>

                                {/* Controls panel */}
                                <div className="bg-slate-950 border-4 border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                                    <h4 className="font-bold text-xs text-amber-400 border-b border-gray-800 pb-1 flex items-center gap-1.5">
                                        <Keyboard className="w-4 h-4" /> Keyboard Controls
                                    </h4>
                                    
                                    <div className="flex flex-col gap-2 font-mono">
                                        <div className="flex justify-between border-b border-gray-900 pb-1">
                                            <span className="text-gray-450">Movement:</span>
                                            <span className="text-white font-bold">WASD / Arrow Keys</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-900 pb-1">
                                            <span className="text-gray-450">Select Hotbar:</span>
                                            <span className="text-white font-bold">Keys 1 - 8</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-900 pb-1">
                                            <span className="text-gray-450">Interact:</span>
                                            <span className="text-white font-bold">Key [E]</span>
                                        </div>
                                        <div className="flex justify-between pb-1">
                                            <span className="text-gray-450">Open Chat:</span>
                                            <span className="text-white font-bold">Key [Enter]</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={handleLogout}
                                    className="w-full mt-2 py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold uppercase rounded-xl border-4 border-slate-900 transition-all active:scale-95 cursor-pointer"
                                >
                                    Log Out
                                </button>

                                <div className="text-center text-[8px] text-gray-550 border-t border-gray-800 pt-2 font-mono mt-2">
                                    Helge Village Web3 MMO v0.2.0 • Built on Solana
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- 4. SLEEP OVERLAY --- */}
            {stats.isSleeping && (
                <div className="absolute inset-0 bg-black/85 z-[100] flex flex-col items-center justify-center text-white font-mono pointer-events-auto">
                    <div className="bg-slate-900 border-4 border-amber-600 rounded-2xl p-8 max-w-sm w-full text-center flex flex-col items-center gap-6 shadow-2xl retro-shadow animate-scale-in">
                        <div className="text-6xl animate-bounce">💤</div>
                        <h2 className="text-xl font-black text-amber-400 uppercase tracking-widest">Resting...</h2>
                        <p className="text-xs text-slate-400">Your character is sleeping in the Inn to restore energy.</p>
                        
                        <SleepCountdown duration={30} />
                    </div>
                </div>
            )}

            <PlaytimeRankingModal 
                isOpen={isRankingOpen} 
                onClose={() => setIsRankingOpen(false)} 
                rankingData={rankingData} 
            />
        </div>
    );
}

function SleepCountdown({ duration }: { duration: number }) {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        setTimeLeft(duration);
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [duration]);

    const percent = (timeLeft / duration) * 100;

    return (
        <div className="w-full flex flex-col gap-2">
            <div className="w-full bg-slate-950 border-4 border-slate-800 h-6 rounded-md overflow-hidden relative">
                <div 
                    className="bg-emerald-500 h-full transition-all duration-1000"
                    style={{ width: `${100 - percent}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white">
                    {timeLeft}s
                </span>
            </div>
            <div className="text-[10px] text-gray-500 font-semibold">
                Please wait while energy is fully restored.
            </div>
        </div>
    );
}
