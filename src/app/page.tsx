'use client';

import React, { useState } from 'react';
import GameLoader from '../components/GameLoader';
import MainMenu from '../components/ui/MainMenu';
import ChatBox from '../components/ui/ChatBox';
import HUD from '../components/ui/HUD';
import FacilitiesModal from '../components/ui/FacilitiesModal';

export default function Home() {
    const [gameState, setGameState] = useState<{
        inGame: boolean;
        username: string;
        clothesIndex: number;
        isOnline: boolean;
    }>({
        inGame: false,
        username: '',
        clothesIndex: 1,
        isOnline: false
    });

    const handlePlayOffline = (data: { username: string; clothesIndex: number }) => {
        setGameState({
            inGame: true,
            username: data.username,
            clothesIndex: data.clothesIndex,
            isOnline: false
        });
    };

    const handlePlayOnline = (data: { username: string; clothesIndex: number }) => {
        setGameState({
            inGame: true,
            username: data.username,
            clothesIndex: data.clothesIndex,
            isOnline: true
        });
    };

    return (
        <main className="relative w-screen h-screen bg-gray-950 overflow-hidden">
            {!gameState.inGame ? (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <MainMenu 
                        onPlayOffline={handlePlayOffline} 
                        onPlayOnline={handlePlayOnline} 
                    />
                </div>
            ) : (
                <>
                    <div className="w-full h-full">
                        <GameLoader 
                            username={gameState.username}
                            clothesIndex={gameState.clothesIndex}
                            isOnline={gameState.isOnline}
                        />
                    </div>
                    {/* Overlay React UI HUD, Facilities Shop and ChatBox */}
                    <HUD />
                    <FacilitiesModal />
                    <ChatBox />

                    {/* Floating Instructions Panel */}
                    <div className="absolute top-4 right-4 bg-gray-900/85 border-2 border-amber-600 rounded-lg p-4 shadow-2xl z-10 font-mono text-white text-xs max-w-xs select-none">
                        <h3 className="text-amber-400 font-bold uppercase mb-2 border-b border-gray-700 pb-1">Petunjuk Kontrol</h3>
                        <ul className="flex flex-col gap-1.5 text-gray-300">
                            <li><span className="text-amber-500 font-bold">Bergerak:</span> WASD / Tombol Panah</li>
                            <li><span className="text-amber-500 font-bold">Chat:</span> Tekan Enter untuk mengetik</li>
                            <li><span className="text-amber-500 font-bold">Offline:</span> Eksplorasi peta sendiri</li>
                            <li><span className="text-amber-500 font-bold">Online:</span> Bermain & chat bersama</li>
                        </ul>
                    </div>
                </>
            )}
        </main>
    );
}
