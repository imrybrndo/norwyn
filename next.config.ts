import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kunci root ke folder project ini agar Turbopack tidak naik ke ~/Documents
  // (ada lockfile nyasar di sana yang tidak bisa dibaca karena proteksi macOS).
  turbopack: {
    root: __dirname,
    // RainbowKit's built-in "Base" wallet definition statically references
    // @wagmi/connectors' baseAccount connector, which lazily `import()`s
    // @base-org/account only when that connector actually attempts to
    // connect. We never offer that wallet (see EvmProvider's `wallets`
    // list), but Turbopack still eagerly resolves the whole dependency
    // subtree at build time — including @base-org/account's onward
    // dependency on @coinbase/cdp-sdk's x402 payment module, which
    // references optional @x402/* packages that aren't installed and break
    // the build. Stubbing the package out is safe since its connect path is
    // never invoked by this app.
    resolveAlias: {
      '@base-org/account': './src/stubs/x402-stub.ts',
    },
  },
};

export default nextConfig;
