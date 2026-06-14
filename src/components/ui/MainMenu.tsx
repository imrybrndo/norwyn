'use client';

import React, { useState } from 'react';

interface MainMenuProps {
    onPlayOffline: (data: { username: string; clothesIndex: number }) => void;
    onPlayOnline: (data: { username: string; clothesIndex: number }) => void;
}

export default function MainMenu({ onPlayOffline, onPlayOnline }: MainMenuProps) {
    const [username, setUsername] = useState('');
    const [clothesIndex, setClothesIndex] = useState(1);
    const [showSettings, setShowSettings] = useState(false);

    const handlePlayOffline = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('React: handlePlayOffline clicked');
        onPlayOffline({ username: username.trim() || 'Player_Offline', clothesIndex });
    };

    const handlePlayOnline = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('React: handlePlayOnline clicked');
        onPlayOnline({ username: username.trim() || 'Player_Online', clothesIndex });
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/90 z-20 font-mono text-white p-6">
            {!showSettings ? (
                <div className="w-full max-w-md bg-gray-900 border-4 border-amber-600 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-amber-500 uppercase tracking-widest drop-shadow-md">
                            Valley Life 2D
                        </h1>
                        <p className="text-gray-400 text-xs mt-1">Multiplayer Farming Game</p>
                    </div>

                    <form className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-amber-400">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your name..."
                                maxLength={15}
                                className="px-4 py-2 bg-gray-800 border-2 border-gray-700 rounded focus:outline-none focus:border-amber-500 text-white"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-amber-400">Pilih Pakaian (Baju)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3].map((index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setClothesIndex(index)}
                                        className={`py-2 border-2 rounded text-sm font-bold transition-all ${
                                            clothesIndex === index
                                                ? 'bg-amber-600 border-amber-400 text-white'
                                                : 'bg-gray-850 border-gray-700 hover:border-amber-600 text-gray-300'
                                        }`}
                                    >
                                        Baju {index}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                            <button
                                type="button"
                                onClick={handlePlayOffline}
                                className="w-full py-3 bg-amber-600 hover:bg-amber-500 border-b-4 border-amber-800 active:border-b-0 rounded font-bold uppercase transition-all"
                            >
                                Play Offline (Testing)
                            </button>
                            <button
                                type="button"
                                onClick={handlePlayOnline}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 border-b-4 border-emerald-800 active:border-b-0 rounded font-bold uppercase transition-all"
                            >
                                Play Online
                            </button>
                        </div>
                    </form>

                    <div className="flex justify-between border-t border-gray-800 pt-4 text-xs text-gray-500">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="hover:text-amber-400 transition-colors"
                        >
                            [ Pengaturan ]
                        </button>
                        <span>v0.1.0</span>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-md bg-gray-900 border-4 border-amber-600 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-amber-400 uppercase">Pengaturan</h2>
                    </div>

                    <div className="flex flex-col gap-4 text-sm text-gray-300">
                        <div className="border-b border-gray-800 pb-2">
                            <p className="font-bold text-amber-500">Kontrol Pergerakan:</p>
                            <p className="mt-1">- WASD atau Tombol Panah untuk Bergerak</p>
                        </div>
                        <div className="border-b border-gray-800 pb-2">
                            <p className="font-bold text-amber-500">Fitur Kustomisasi:</p>
                            <p className="mt-1">- Baju digambar berlapis di atas base body</p>
                        </div>
                        <div className="pb-2">
                            <p className="font-bold text-amber-500">Sistem Chat:</p>
                            <p className="mt-1">- Tekan Enter untuk mengetik di chat (Online)</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowSettings(false)}
                        className="w-full py-2 bg-gray-850 hover:bg-gray-800 border-2 border-gray-700 rounded font-bold transition-all text-sm"
                    >
                        Kembali Ke Menu
                    </button>
                </div>
            )}
        </div>
    );
}
