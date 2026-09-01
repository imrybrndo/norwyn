import { type Chain } from 'viem';

// Robinhood Chain — env-driven so the exact chain ID / RPC / explorer can be
// corrected without a code change. Defaults below are best-effort from public
// sources at the time of writing and should be confirmed against Robinhood's
// own developer docs before production use.
export const robinhoodChain: Chain = {
    id: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 4663),
    name: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Robinhood Chain',
    nativeCurrency: {
        name: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'ETH',
        symbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Explorer',
            url: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://robinhoodchain.blockscout.com',
        },
    },
};
