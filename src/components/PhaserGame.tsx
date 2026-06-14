'use client';

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameConfig } from '../game/config';
import { EventBus } from '../game/EventBus';

interface PhaserGameProps {
    username: string;
    clothesIndex: number;
    isOnline: boolean;
}

export default function PhaserGame({ username, clothesIndex, isOnline }: PhaserGameProps) {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && !gameRef.current) {
            const game = new Phaser.Game({
                ...GameConfig,
                parent: 'game-container'
            });

            // Set variables in registry so they are accessible to all scenes
            game.registry.set('username', username);
            game.registry.set('clothesIndex', clothesIndex);
            game.registry.set('isOnline', isOnline);

            gameRef.current = game;

            EventBus.emit('game-ready', game);
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [username, clothesIndex, isOnline]);

    return (
        <div 
            id="game-container" 
            className="w-full h-full flex items-center justify-center bg-gray-900 overflow-hidden"
        />
    );
}
