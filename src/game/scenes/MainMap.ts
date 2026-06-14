import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { OtherPlayer } from '../entities/OtherPlayer';
import { createAnimations } from '../managers/AnimationManager';
import { colyseusClient } from '../../network/colyseus';
import { EventBus } from '../EventBus';
import { Room, Callbacks } from '@colyseus/sdk';
import { GameState } from '../../../server/rooms/schema/GameState';

export class MainMap extends Phaser.Scene {
    player!: Player;
    environmentLayer!: Phaser.Tilemaps.TilemapLayer;
    groundLayer!: Phaser.Tilemaps.TilemapLayer;
    
    room: Room<GameState> | null = null;
    otherPlayers: Map<string, OtherPlayer> = new Map();

    // Store last sent movement packet to avoid redundant network floods
    lastSentData: { x: number; y: number; direction: string; isMoving: boolean } | null = null;

    constructor() {
        super('MainMap');
    }

    create() {
        // 1. Get registry settings
        const username = this.registry.get('username') || 'Farmer';
        const clothesIndex = this.registry.get('clothesIndex') || 1;
        const isOnline = this.registry.get('isOnline') || false;

        // 2. Generate animations
        createAnimations(this);

        // 3. Create tilemap and add tileset
        const map = this.make.tilemap({ key: 'farm_map' });
        const tileset = map.addTilesetImage('spr_tileset_sunnysideworld', 'sunnyside_tileset');

        if (!tileset) {
            console.error('Failed to load tileset image in MainMap');
            return;
        }

        // 4. Create map layers
        this.groundLayer = map.createLayer('Ground', tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer;
        this.environmentLayer = map.createLayer('Envirotment', tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer;
        this.environmentLayer.setCollisionByExclusion([-1]);

        // 5. Spawn local player
        this.player = new Player(this, 240, 240, username, clothesIndex);
        this.physics.add.collider(this.player, this.environmentLayer);

        // 6. Camera and World Boundaries
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(2.5);

        // 7. Setup online multiplayer if selected
        if (isOnline) {
            this.connectToRoom(username, clothesIndex);
        }

        // Listen for outgoing chat from React UI overlay
        EventBus.on('send-chat', (text: string) => {
            if (this.room) {
                this.room.send('chat', { text });
            }
        });

        // Clean up EventBus listener when scene is shut down
        this.events.once('shutdown', () => {
            EventBus.off('send-chat');
            if (this.room) {
                this.room.leave();
            }
        });
    }

    connectToRoom(username: string, clothesIndex: number) {
        colyseusClient.joinOrCreate('game_room', { username, clothesIndex }, GameState).then(room => {
            this.room = room;
            console.log('Joined room:', room.roomId);

            // Notify UI about successful connection
            EventBus.emit('connection-status', { connected: true, sessionId: room.sessionId });
            console.log('Room joined. State:', room.state);

            const callbacks = Callbacks.get(room);

            // Handle new players joining
            callbacks.onAdd("players", (player: any, sessionId: string) => {
                if (sessionId === room.sessionId) return; // Skip self

                const otherPlayer = new OtherPlayer(this, player.x, player.y, player.username, player.clothesIndex);
                this.otherPlayers.set(sessionId, otherPlayer);

                // Listen to changes in other player's properties
                callbacks.onChange(player, () => {
                    otherPlayer.targetX = player.x;
                    otherPlayer.targetY = player.y;
                    otherPlayer.currentDirection = player.direction;
                    otherPlayer.isMoving = player.isMoving;
                });
            });

            // Handle players leaving
            callbacks.onRemove("players", (player: any, sessionId: string) => {
                const other = this.otherPlayers.get(sessionId);
                if (other) {
                    other.destroy();
                    this.otherPlayers.delete(sessionId);
                }
            });

            // Listen to chat message broadcasts
            room.onMessage('chat-message', (data: any) => {
                EventBus.emit('chat-received', data);
            });

        }).catch(err => {
            console.error('Failed to connect to Colyseus server room:', err);
            EventBus.emit('connection-status', { connected: false, error: err.message });
        });
    }

    update() {
        if (this.player) {
            this.player.update();

            // Sync position to server if online
            if (this.room) {
                const currentData = {
                    x: this.player.x,
                    y: this.player.y,
                    direction: this.player.currentDirection,
                    isMoving: this.player.isMoving
                };

                // Only send updates if player coordinates or state changed
                if (!this.lastSentData || 
                    this.lastSentData.x !== currentData.x || 
                    this.lastSentData.y !== currentData.y || 
                    this.lastSentData.direction !== currentData.direction || 
                    this.lastSentData.isMoving !== currentData.isMoving) {
                    
                    this.room.send('move', currentData);
                    this.lastSentData = currentData;
                }
            }
        }

        // Interpolate other players
        this.otherPlayers.forEach(other => other.update());
    }
}
