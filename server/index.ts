import './env';
import express from 'express';
import http from 'http';
import next from 'next';
import cors from 'cors';

// Prevent WebSocket frame errors or HMR disconnects from crashing the server
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
import { Server, matchMaker } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GameRoom } from './rooms/GameRoom';
import prisma from './db/prisma';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
    // Prisma connects lazily via its driver adapter; no explicit connect needed.

    const app = express();
    app.use(cors());
    app.use((req, res, nextMiddleware) => {
        if (req.url && (req.url.startsWith('/colyseus') || req.url.startsWith('/matchmake'))) {
            express.json()(req, res, nextMiddleware);
        } else {
            nextMiddleware();
        }
    });

    const server = http.createServer(app);

    // Initialize Colyseus Server with noServer and manually attach with a path filter to prevent HMR issues
    const transport = new WebSocketTransport({
        noServer: true,
        pingInterval: 5000,
        pingMaxRetries: 3
    });

    const gameServer = new Server({
        transport
    });

    transport.attachToServer(server, {
        filter: (req) => {
            if (!req.url) return false;
            const pathname = req.url.split('?')[0];
            return pathname === '/colyseus' || pathname.startsWith('/colyseus/');
        }
    });

    // Define room
    gameServer.define('game_room', GameRoom);

    // Online players route
    app.get('/api/online-count', async (req, res) => {
        try {
            const rooms = await matchMaker.query({});
            const count = rooms.reduce((acc, room) => acc + (room.clients || 0), 0);
            const total = await prisma.user.count();
            // Add +2 to count representing the 2 permanently online guest NPCs (Guest_Ed and Guest_Rey)
            res.json({ online: count + 2, total });
        } catch (e) {
            res.json({ online: 2, total: 0 }); // Fallback to at least 2 online (our NPCs)
        }
    });

    // Let Next.js handle all other routes
    app.use((req, res) => {
        return handle(req, res);
    });

    await gameServer.listen(port, '0.0.0.0');

    // Prepend request listener to rewrite matchmaking URL for compatibility
    server.prependListener('request', (req, res) => {
        if (req.url && req.url.startsWith('/colyseus/matchmake')) {
            req.url = req.url.replace('/colyseus', '');
        }
    });

    console.log(`> Server ready on http://localhost:${port}`);
}).catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});
