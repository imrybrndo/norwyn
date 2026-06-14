import { Room, Client } from '@colyseus/core';
import { GameState, PlayerState } from './schema/GameState';
import User from '../db/models/User';

export class GameRoom extends Room<{ state: GameState }> {
    onCreate(options: any) {
        this.setState(new GameState());

        // Handle movement updates
        this.onMessage('move', (client, data: { x: number, y: number, direction: string, isMoving: boolean }) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = data.x;
                player.y = data.y;
                player.direction = data.direction;
                player.isMoving = data.isMoving;
            }
        });

        // Handle chat messages
        this.onMessage('chat', (client, data: { text: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                this.broadcast('chat-message', {
                    senderId: client.sessionId,
                    username: player.username,
                    text: data.text,
                    timestamp: Date.now()
                });
            }
        });
    }

    async onJoin(client: Client, options: { username: string }) {
        console.log(`${client.sessionId} joined!`);

        const username = options.username || `Player_${client.sessionId.substring(0, 5)}`;
        
        let clothesIndex = 1;
        try {
            // Find user in MongoDB, create if not found
            let user = await User.findOne({ username });
            if (!user) {
                user = await User.create({ username, clothesIndex: 1 });
            }
            clothesIndex = user.clothesIndex;
        } catch (e) {
            console.error('Error fetching user from database on join:', e);
        }

        const player = new PlayerState();
        player.id = client.sessionId;
        player.username = username;
        player.x = 240; // Default spawn coordinates
        player.y = 240;
        player.clothesIndex = clothesIndex;

        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client, code?: number) {
        console.log(`${client.sessionId} left!`);
        this.state.players.delete(client.sessionId);
    }

    onDispose() {
        console.log('Room disposed');
    }
}
