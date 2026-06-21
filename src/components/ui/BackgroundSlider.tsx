'use client';

import React, { useState, useEffect } from 'react';

const IMAGES = [
    '/img/bg/img1.png',
    '/img/bg/img2.png',
    '/img/bg/img3.png',
    '/img/bg/img4.png',
    '/img/bg/img5.png',
    '/img/bg/img6.png'
];

export default function BackgroundSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % IMAGES.length);
        }, 6000); // Change image every 6 seconds

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-0 bg-gray-950 overflow-hidden pointer-events-none">
            {IMAGES.map((src, index) => (
                <div
                    key={src}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-[2500ms] ease-in-out ${
                        index === currentIndex ? 'opacity-50' : 'opacity-0'
                    }`}
                >
                    <img
                        src={src}
                        alt="Background slide"
                        className={`w-full h-full object-cover transition-transform duration-[12000ms] ease-out ${
                            index === currentIndex ? 'scale-110' : 'scale-100'
                        }`}
                    />
                </div>
            ))}
            {/* Dark/Gradient Overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/40 to-gray-950/80 z-10" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:24px_24px] z-10" />
        </div>
    );
}
