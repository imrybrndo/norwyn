'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const PhaserGame = dynamic(() => import('./PhaserGame'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[600px] flex items-center justify-center bg-gray-900 text-white font-mono text-xl">
            Initializing Game Canvas...
        </div>
    )
});

interface GameLoaderProps {
    username: string;
    clothesIndex: number;
    isOnline: boolean;
    walletAddress?: string;
    isGuest?: boolean;
}

export default function GameLoader(props: GameLoaderProps) {
    return <PhaserGame {...props} />;
}

