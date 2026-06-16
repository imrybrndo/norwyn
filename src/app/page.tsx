'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import GameLoader from '../components/GameLoader';
import HUD from '../components/ui/HUD';
import FacilitiesModal from '../components/ui/FacilitiesModal';
import LandingHero from '../components/ui/LandingHero';
import OnboardingFlow from '../components/ui/OnboardingFlow';
import Navbar from '../components/ui/Navbar';
import FeaturesBento from '../components/ui/FeaturesBento';

export default function Home() {
    const { connected, publicKey } = useWallet();
    const [gameState, setGameState] = useState<{
        inGame: boolean;
        username: string;
        clothesIndex: number;
        walletAddress: string;
        isOnline: boolean;
    }>({
        inGame: false,
        username: '',
        clothesIndex: 1,
        walletAddress: '',
        isOnline: false
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
            clothesIndex: userData.clothesIndex,
            walletAddress: publicKey.toBase58(),
            isOnline: true
        });
    };

    return (
        <main className="relative w-screen h-screen bg-gray-950 overflow-hidden text-slate-850 font-sans">
            {!gameState.inGame ? (
                <div className="absolute inset-0 z-20 cozy-pasture-gradient overflow-y-auto">
                    {showOnboarding ? (
                        <div className="min-h-screen flex items-center justify-center py-12 px-4">
                            <OnboardingFlow 
                                onBack={handleCancelOnboarding}
                                onSubmit={handleRegisterOnboarding}
                                isSubmitting={isSubmittingOnboarding}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col min-h-screen">
                            <Navbar />
                            <LandingHero 
                                userData={userData}
                                isLoading={isLoadingUser}
                                onStartOnboarding={handleStartOnboarding}
                                onEnterGame={handleEnterGame}
                            />
                            <FeaturesBento />
                            <footer className="w-full border-t border-slate-200 py-8 text-center text-xs text-slate-450 font-bold mt-auto">
                                &copy; {new Date().getFullYear()} Helge Village. All Rights Reserved. Built on Solana.
                            </footer>
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
