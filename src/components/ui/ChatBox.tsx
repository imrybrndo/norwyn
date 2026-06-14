'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EventBus } from '../../game/EventBus';

interface ChatMessage {
    senderId: string;
    username: string;
    text: string;
    timestamp: number;
}

export default function ChatBox() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Listen to incoming chat messages from Phaser Colyseus bridge
        const handleChatReceived = (msg: ChatMessage) => {
            setMessages((prev) => [...prev.slice(-49), msg]); // Keep last 50 messages
        };

        EventBus.on('chat-received', handleChatReceived);

        return () => {
            EventBus.off('chat-received', handleChatReceived);
        };
    }, []);

    useEffect(() => {
        // Scroll to bottom when new message arrives
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const handleFocus = () => {
        setIsFocused(true);
        // Tell Phaser to disable movement key listening
        EventBus.emit('disable-player-input');
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Tell Phaser to re-enable movement key listening
        EventBus.emit('enable-player-input');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        // Emit outgoing chat to Phaser scene
        EventBus.emit('send-chat', inputText.trim());
        setInputText('');
    };

    return (
        <div className="absolute bottom-4 left-4 w-80 h-60 bg-gray-900/80 border-2 border-gray-700 rounded-lg p-3 flex flex-col gap-2 z-10 font-mono text-white select-none">
            {/* Message list */}
            <div 
                ref={listRef}
                className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1 text-xs select-text scrollbar-thin scrollbar-thumb-gray-700"
            >
                {messages.length === 0 ? (
                    <div className="text-gray-500 italic mt-auto">Welcome to Chat! Type below...</div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className="leading-relaxed">
                            <span className="text-emerald-400 font-bold">{msg.username}: </span>
                            <span>{msg.text}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Press enter to chat..."
                    className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button 
                    type="submit"
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-xs font-bold rounded"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
