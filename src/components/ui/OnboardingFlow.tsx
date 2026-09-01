'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sprout, ArrowLeft, ArrowRight, ShieldCheck, User, UserCheck } from 'lucide-react';

interface OnboardingFlowProps {
    onBack: () => void;
    onSubmit: (data: { username: string; role: string; clothesIndex: number; gender: string; avatarStyle: number }) => void;
    isSubmitting: boolean;
}

// Animated in-game character preview: the same two sprite layers Phaser renders
// (base body + clothes overlay), cropped to the figure and played with a CSS
// steps() animation over the 9 idle frames.
const SPRITE_SHEET_W = 864; // 9 frames x 96px
const SPRITE_SHEET_H = 64;
const SPRITE_CROP = { x: 36, y: 14, w: 24, h: 28 }; // window around the figure in frame 0
const SPRITE_SCALE = 4;

function CharacterSprite({ styleId, scale = SPRITE_SCALE }: { styleId: number; scale?: number }) {
    const w = SPRITE_CROP.w * scale;
    const h = SPRITE_CROP.h * scale;

    const layer = (url: string): React.CSSProperties => ({
        position: 'absolute',
        top: 0,
        left: 0,
        width: w,
        height: h,
        backgroundImage: `url(${url})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${SPRITE_SHEET_W * scale}px ${SPRITE_SHEET_H * scale}px`,
        backgroundPositionX: `-${SPRITE_CROP.x * scale}px`,
        backgroundPositionY: `-${SPRITE_CROP.y * scale}px`,
        imageRendering: 'pixelated',
        animation: `onboarding-idle-${scale} 1.5s steps(9) infinite`,
    });
    return (
        <div style={{ position: 'relative', width: w, height: h }}>
            <div style={layer('/assets/sprites/characters/base_idle.png')} />
            <div style={layer(`/assets/sprites/characters/clothes_idle_${styleId}.png`)} />
            <style>{`@keyframes onboarding-idle-${scale} {
                from { background-position-x: -${SPRITE_CROP.x * scale}px; }
                to { background-position-x: -${(SPRITE_SHEET_W + SPRITE_CROP.x) * scale}px; }
            }`}</style>
        </div>
    );
}

export default function OnboardingFlow({ onBack, onSubmit, isSubmitting }: OnboardingFlowProps) {
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<'Farmer'>('Farmer');
    const [gender, setGender] = useState<'Male' | 'Female'>('Male');
    const [avatarStyle, setAvatarStyle] = useState(1);
    const [step, setStep] = useState(1);

    const handleNextStep = () => {
        if (!username.trim() && step === 1) return;
        setStep((prev) => prev + 1);
    };

    const handlePrevStep = () => {
        setStep((prev) => prev - 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;
        onSubmit({
            username: username.trim(),
            role,
            clothesIndex: avatarStyle,
            gender,
            avatarStyle,
        });
    };

    const roleDetails = {
        Farmer: {
            title: 'Farmer',
            description: 'Start with a Watering Can. Specialize in planting crops, managing soil, harvesting food, and generating steady income.',
            icon: Sprout,
            colorClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
        },
    };

    const styleDetails = [
        { id: 1, name: 'Bowl Hair' },
        { id: 2, name: 'Curly Hair' },
        { id: 3, name: 'Long Hair' },
    ];

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 overflow-hidden select-none w-full">
            {/* Background glows */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-lg bg-gray-900/90 backdrop-blur-md border-2 border-amber-600/30 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_rgba(217,119,6,0.15)] font-mono text-white flex flex-col gap-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <button
                        onClick={step === 1 ? onBack : handlePrevStep}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <span className="text-xs text-gray-500 font-bold uppercase">Step {step} of 3</span>
                </div>

                {/* STEP 1: Enter Username */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col gap-5 text-left"
                    >
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-amber-500 uppercase">Choose Name</h2>
                            <p className="text-gray-400 text-xs mt-1">What will other villagers call you in Norwyn Village?</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-amber-400 uppercase font-semibold">Character Name</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username..."
                                maxLength={15}
                                autoFocus
                                className="w-full px-4 py-3 bg-gray-950 border-2 border-gray-800 rounded-xl focus:outline-none focus:border-amber-500 text-white font-mono text-sm transition-colors"
                            />
                        </div>

                        <button
                            disabled={!username.trim()}
                            onClick={handleNextStep}
                            className={`w-full py-3.5 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-all mt-2 cursor-pointer ${
                                username.trim()
                                    ? 'bg-amber-600 hover:bg-amber-500 border-b-4 border-amber-800 active:border-b-0 text-white shadow-lg shadow-amber-950/20'
                                    : 'bg-gray-800 border-gray-850 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Next Step <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}

                {/* STEP 2: Select Gender & Appearance */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col gap-5 text-left"
                    >
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-amber-500 uppercase">Appearance</h2>
                            <p className="text-gray-400 text-xs mt-1">Select your gender and starting outfit style.</p>
                        </div>

                        {/* Gender selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-amber-400 uppercase font-semibold">Gender</label>
                            <div className="grid grid-cols-2 gap-4">
                                {(['Male', 'Female'] as const).map((g) => {
                                    const isSelected = gender === g;
                                    return (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setGender(g)}
                                            className={`p-3 border-2 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                                    : 'bg-gray-950 border-gray-800 hover:border-amber-500/40 text-gray-400'
                                            }`}
                                        >
                                            {isSelected ? <UserCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            {g}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Outfit / Sprite selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-amber-400 uppercase font-semibold">Starting Clothes Style</label>
                            <div className="grid grid-cols-3 gap-3">
                                {styleDetails.map((style) => (
                                    <button
                                        key={style.id}
                                        type="button"
                                        onClick={() => setAvatarStyle(style.id)}
                                        className={`py-3 px-1 border-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center gap-2 ${
                                            avatarStyle === style.id
                                                ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-lg'
                                                : 'bg-gray-950 border-gray-800 hover:border-amber-500/40 text-gray-400'
                                        }`}
                                    >
                                        <span
                                            className={`rounded-lg p-1 transition-all ${
                                                avatarStyle === style.id ? 'bg-amber-500/10 ring-1 ring-amber-500/40' : 'bg-gray-900'
                                            }`}
                                        >
                                            <CharacterSprite styleId={style.id} />
                                        </span>
                                        {style.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleNextStep}
                            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 border-b-4 border-amber-800 active:border-b-0 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-all mt-2 cursor-pointer text-white shadow-lg shadow-amber-950/20"
                        >
                            Next Step <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}

                {/* STEP 3: Select Profession & Confirm */}
                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col gap-4 text-left"
                    >
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-amber-500 uppercase">Profession</h2>
                            <p className="text-gray-400 text-xs mt-1">Select your starting profession and toolkit.</p>
                        </div>

                        <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                            {(['Farmer'] as const).map((r) => {
                                const ItemIcon = roleDetails[r].icon;
                                const isSelected = role === r;
                                return (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`w-full p-3.5 border-2 rounded-xl text-left flex items-start gap-4 transition-all duration-200 cursor-pointer ${
                                            isSelected
                                                ? roleDetails[r].colorClass
                                                : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-gray-300'
                                        }`}
                                    >
                                        <div className="p-2 bg-gray-900 rounded-lg">
                                            <ItemIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xs">{roleDetails[r].title}</h3>
                                            <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                                                {roleDetails[r].description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Confirmation summary box */}
                        <div className="mt-1 p-3 bg-gray-950 border border-gray-800 rounded-xl flex items-center gap-3">
                            <div className="p-1 bg-amber-500/10 rounded-lg">
                                <CharacterSprite styleId={avatarStyle} scale={2} />
                            </div>
                            <div className="flex flex-col gap-0.5 text-[10px] text-gray-400">
                                <span className="font-bold text-white text-xs uppercase">{username}</span>
                                <span>Gender: {gender} | Style: {styleDetails.find(s => s.id === avatarStyle)?.name ?? `Outfit ${avatarStyle}`}</span>
                                <span>Profession: <strong className="text-amber-400">{role}</strong></span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-1">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3.5 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    isSubmitting
                                        ? 'bg-gray-800 border-gray-850 text-gray-500 cursor-not-allowed animate-pulse'
                                        : 'bg-emerald-650 hover:bg-emerald-555 border-b-4 border-emerald-800 active:border-b-0 text-white shadow-lg'
                                }`}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                {isSubmitting ? 'Registering Character...' : 'Create & Spawn Character'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
