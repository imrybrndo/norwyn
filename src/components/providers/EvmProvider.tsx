'use client';

import React, { FC, useState } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, walletConnectWallet, rainbowWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { robinhoodChain } from '../../lib/chains';

export const EvmProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config] = useState(() =>
        getDefaultConfig({
            appName: 'Norwyn Village',
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
            chains: [robinhoodChain],
            ssr: true,
            // Deliberately excludes RainbowKit's default Coinbase/Base wallet
            // connector — it drags in @base-org/account -> @coinbase/cdp-sdk's
            // x402 payment module, which imports optional packages
            // (@x402/evm, @x402/svm) that aren't installed and break the build.
            wallets: [
                {
                    groupName: 'Popular',
                    wallets: [metaMaskWallet, rainbowWallet, walletConnectWallet, injectedWallet],
                },
            ],
        })
    );
    const [queryClient] = useState(() => new QueryClient());

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
