<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:game-architecture-rules -->
# Core Game Architecture Rules
When working on this codebase, ALWAYS follow these rules:
1. **Phaser & SSR**: Phaser requires `window`. All Phaser logic MUST be dynamically imported in Next.js using `next/dynamic` with `ssr: false`. Never import Phaser directly into Server Components.
2. **Next.js Custom Server**: The backend uses a Custom Next.js Server (`server.ts` or `server.js`) to attach the **Colyseus WebSocket Server** onto the same HTTP port. Do not use standard Next.js API Routes for real-time game sync.
3. **Database**: Use **MongoDB** (via `mongoose`). The database is used for persistent data (player accounts, stats, inventory).
4. **UI Separation**: The Game Menu, Chat, and Settings are purely React components overlaid on top of the Phaser `<canvas>` via absolute positioning (`z-index`). Communicate between React and Phaser using an `EventBus`.
5. **Testing**: Always ensure test configurations (Jest/Playwright) are preserved and pass.
<!-- END:game-architecture-rules -->
