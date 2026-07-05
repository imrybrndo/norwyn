'use client';

import React from 'react';
import Image from 'next/image';

// Static game-art backdrop for the landing/title screen (no carousel).
export default function BackgroundSlider() {
    return (
        <div className="fixed inset-0 z-0 bg-gray-950 overflow-hidden pointer-events-none">
            {/* Pixel art: serve the original file (no re-compression) and upscale with
                crisp nearest-neighbor rendering so it never looks blurry/broken. */}
            <Image
                src="/assets/background_game.png"
                alt=""
                fill
                priority
                unoptimized
                sizes="100vw"
                className="object-cover object-center select-none [image-rendering:pixelated]"
            />
            {/* Soft dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-gray-950/25 to-gray-950/60 z-10" />
            {/* Radial vignette to focus attention on the hero content */}
            <div className="absolute inset-0 z-10 [background:radial-gradient(ellipse_at_center,transparent_40%,rgba(3,7,18,0.45)_100%)]" />
        </div>
    );
}
