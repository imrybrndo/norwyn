'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletButton({ className }: { className?: string }) {
    return (
        <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                    <div style={!ready ? { opacity: 0, pointerEvents: 'none', userSelect: 'none' } : undefined}>
                        {!connected ? (
                            <button type="button" onClick={openConnectModal} className={className}>
                                Connect Wallet
                            </button>
                        ) : chain.unsupported ? (
                            <button type="button" onClick={openChainModal} className={className}>
                                Wrong Network
                            </button>
                        ) : (
                            <button type="button" onClick={openAccountModal} className={className}>
                                {account.displayName}
                            </button>
                        )}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
}
