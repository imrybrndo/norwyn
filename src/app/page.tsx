'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Volume2, VolumeX } from 'lucide-react';
import GameLoader from '../components/GameLoader';
import HUD from '../components/ui/HUD';
import FacilitiesModal from '../components/ui/FacilitiesModal';
import LandingHero from '../components/ui/LandingHero';
import OnboardingFlow from '../components/ui/OnboardingFlow';
import BackgroundSlider from '../components/ui/BackgroundSlider';

export default function Home() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isSoundActive, setIsSoundActive] = useState(false);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.3;
            if (isSoundActive) {
                audioRef.current.play().catch(e => console.log("Audio play blocked", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isSoundActive]);

    const toggleSound = () => setIsSoundActive(prev => !prev);

    const { connected, publicKey } = useWallet();
    const [gameState, setGameState] = useState<{
        inGame: boolean;
        username: string;
        clothesIndex: number;
        walletAddress: string;
        isOnline: boolean;
        isGuest: boolean;
    }>({
        inGame: false,
        username: '',
        clothesIndex: 1,
        walletAddress: '',
        isOnline: false,
        isGuest: false
    });

    const [userData, setUserData] = useState<any>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);

    // Fetch user profile whenever wallet is connected
    useEffect(() => {
        if (connected && publicKey) {
            fetchUserProfile(publicKey.toBase58());
        } else {
            setUserData(null);
            setShowOnboarding(false);
        }
    }, [connected, publicKey]);

    const fetchUserProfile = async (address: string) => {
        setIsLoadingUser(true);
        try {
            const res = await fetch(`/api/user?walletAddress=${address}`);
            if (res.ok) {
                const data = await res.json();
                setUserData(data);
                setShowOnboarding(false);
            } else if (res.status === 404) {
                // User not found, trigger onboarding
                setUserData(null);
            } else {
                console.error('Failed to fetch user profile:', res.statusText);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setIsLoadingUser(false);
        }
    };

    const handleStartOnboarding = () => {
        setShowOnboarding(true);
    };

    const handleCancelOnboarding = () => {
        setShowOnboarding(false);
    };

    const handleRegisterOnboarding = async (data: { 
        username: string; 
        role: string; 
        clothesIndex: number;
        gender: string;
        avatarStyle: number;
    }) => {
        if (!publicKey) return;
        setIsSubmittingOnboarding(true);
        try {
            const res = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: publicKey.toBase58(),
                    username: data.username,
                    role: data.role,
                    clothesIndex: data.clothesIndex,
                    gender: data.gender,
                    avatarStyle: data.avatarStyle
                })
            });

            if (res.ok) {
                const newUser = await res.json();
                setUserData(newUser);
                setShowOnboarding(false);
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'Failed to create character'}`);
            }
        } catch (error) {
            console.error('Error registering character:', error);
            alert('Failed to register character due to network error');
        } finally {
            setIsSubmittingOnboarding(false);
        }
    };

    const handleEnterGame = () => {
        if (!userData || !publicKey) return;
        setGameState({
            inGame: true,
            username: userData.username,
            // The API returns the Prisma user, whose field is avatarStyle
            clothesIndex: userData.avatarStyle ?? 1,
            walletAddress: publicKey.toBase58(),
            isOnline: true,
            isGuest: false
        });
    };

    const handleEnterGameAsGuest = () => {
        const randomId = Math.floor(Math.random() * 9000) + 1000;
        setGameState({
            inGame: true,
            username: `Guest_${randomId}`,
            clothesIndex: 1,
            walletAddress: '',
            isOnline: true,
            isGuest: true
        });
    };

    return (
        <main className="relative w-screen h-screen bg-gray-950 overflow-hidden text-slate-850 font-sans">
            {!gameState.inGame ? (
                <div className={`absolute inset-0 z-20 flex flex-col ${showOnboarding ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                    <BackgroundSlider />
                    {showOnboarding ? (
                        <div className="min-h-screen flex items-center justify-center py-12 px-4 w-full">
                            <OnboardingFlow 
                                onBack={handleCancelOnboarding}
                                onSubmit={handleRegisterOnboarding}
                                isSubmitting={isSubmittingOnboarding}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col h-full w-full justify-between overflow-hidden">
                            <LandingHero
                                userData={userData}
                                isLoading={isLoadingUser}
                                onStartOnboarding={handleStartOnboarding}
                                onEnterGame={handleEnterGame}
                                onEnterGameAsGuest={handleEnterGameAsGuest}
                            />
                            <footer className="w-full border-t border-white/10 py-3.5 text-center text-[11px] text-slate-300 font-bold bg-slate-950/40 backdrop-blur-sm relative flex items-center justify-center gap-2">
                                <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                                    &copy; {new Date().getFullYear()} Helge Village
                                    <span className="hidden sm:inline text-slate-500"> · </span>
                                    <span className="hidden sm:inline">All Rights Reserved</span>
                                    <span className="text-slate-500"> · </span>
                                    <span className="text-emerald-400">Built on Solana</span>
                                </span>

                                <button
                                    onClick={toggleSound}
                                    className={`absolute right-4 p-2 rounded-full border-2 border-slate-900 transition-all shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:shadow-none ${
                                        isSoundActive
                                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                                            : 'bg-slate-800/90 hover:bg-slate-700 text-amber-400'
                                    }`}
                                    title={isSoundActive ? "Mute Sound" : "Play Sound"}
                                >
                                    {isSoundActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                </button>
                            </footer>
                            <audio ref={audioRef} src="/music.mp3" loop />
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="w-full h-full">
                        <GameLoader 
                            username={gameState.username}
                            clothesIndex={gameState.clothesIndex}
                            walletAddress={gameState.walletAddress}
                            isOnline={gameState.isOnline}
                            isGuest={gameState.isGuest}
                        />
                    </div>
                    {/* Overlay React UI HUD and Facilities Shop */}
                    <HUD />
                    <FacilitiesModal />
                </>
            )}
        </main>
    );
}
