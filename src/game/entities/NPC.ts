import Phaser from 'phaser';
import { OtherPlayer } from './OtherPlayer';

export class NPC extends OtherPlayer {
    aiTimer: Phaser.Time.TimerEvent | null = null;
    npcName: string;
    npcState: 'IDLE' | 'WALKING' | 'WALKING_TO_FARM' | 'WATERING' | 'WALKING_TO_FISH' | 'FISHING' = 'IDLE';

    constructor(scene: Phaser.Scene, x: number, y: number, username: string, clothesIndex: number) {
        super(scene, x, y, username, clothesIndex);
        this.npcName = username;

        // Custom styling: gold color for NPC username text to distinguish them beautifully
        this.usernameText.setColor('#fbbf24');
        
        // Enable arcade physics for this container
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(16, 16);
        body.setOffset(-8, -8);
        body.setCollideWorldBounds(true);
        
        // Start the AI Decision Loop
        this.startAILoop();
    }

    startAILoop() {
        // Make initial decision after a short delay
        this.scene.time.delayedCall(Phaser.Math.Between(1000, 3000), () => {
            this.makeAIDecision();
        });

        // Set up recurring timer to make decisions every 8 to 12 seconds
        this.aiTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(8000, 12000),
            callback: this.makeAIDecision,
            callbackScope: this,
            loop: true
        });
    }

    makeAIDecision() {
        if (this.isPerformingAction || this.npcState === 'FISHING') return;

        // Randomly choose an action: 0 = Walk/Wander, 1 = Water crops, 2 = Fish, 3 = Stand Idle
        const actionPool = [0, 0, 0, 1, 2, 3]; // 50% chance to walk/wander
        const choice = Phaser.Utils.Array.GetRandom(actionPool);

        if (choice === 0) {
            // WALK
            this.npcState = 'WALKING';
            
            const mapWidth = (this.scene as any).groundLayer?.widthInPixels || 800;
            const mapHeight = (this.scene as any).groundLayer?.heightInPixels || 800;
            
            this.targetX = Phaser.Math.Between(100, mapWidth - 100);
            this.targetY = Phaser.Math.Between(100, mapHeight - 100);
            this.isMoving = true;
        } else if (choice === 1) {
            // FARMING - Walk to farm plot first
            const farmPlots = (this.scene as any).farmPlots || [];
            if (farmPlots.length > 0) {
                this.npcState = 'WALKING_TO_FARM';
                const plot: any = Phaser.Utils.Array.GetRandom(farmPlots);
                this.targetX = plot.x + plot.width / 2;
                this.targetY = plot.y + plot.height / 2;
                this.isMoving = true;
            } else {
                this.npcState = 'IDLE';
            }
        } else if (choice === 2) {
            // FISHING - Walk to water first
            const interactables = (this.scene as any).customInteractables || [];
            const waterSpots = interactables.filter((obj: any) => obj.type === 'laut' || obj.type === 'danau' || (obj.name && obj.name.includes('laut')));
            if (waterSpots.length > 0) {
                this.npcState = 'WALKING_TO_FISH';
                const spot: any = Phaser.Utils.Array.GetRandom(waterSpots);
                this.targetX = spot.x;
                this.targetY = spot.y - 16; // Stand just above the water
                this.isMoving = true;
            } else {
                this.npcState = 'IDLE';
            }
        } else {
            // IDLE
            this.npcState = 'IDLE';
            this.isMoving = false;
            this.targetX = this.x;
            this.targetY = this.y;
        }
    }

    startFarmingSequence() {
        this.npcState = 'WATERING';
        this.isMoving = false;
        
        this.playWateringAnimation();
        
        this.scene.time.delayedCall(600, () => {
            if (this.npcState === 'WATERING') {
                this.npcState = 'IDLE';
            }
        });
    }

    startFishingSequence() {
        this.npcState = 'FISHING';
        this.isMoving = false;
        // Face down towards the water
        this.currentDirection = 'down';
        
        this.startFishingAnimation();

        this.scene.time.delayedCall(3000, () => {
            if (this.npcState !== 'FISHING') return;
            
            this.playCatchAnimation();

            this.scene.time.delayedCall(2500, () => {
                if (this.npcState !== 'FISHING') return;
                
                this.scene.time.delayedCall(1500, () => {
                    if (this.npcState === 'FISHING') {
                        this.npcState = 'IDLE';
                    }
                });
            });
        });
    }

    update(time?: number, delta?: number) {
        if (this.isPerformingAction) return;

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 4) {
            this.isMoving = true;
            if (Math.abs(dx) > Math.abs(dy)) {
                this.currentDirection = dx > 0 ? 'right' : 'left';
            } else {
                this.currentDirection = dy > 0 ? 'down' : 'up';
            }

            // Fixed speed movement (e.g. 50 pixels per second)
            const speed = 50;
            body.setVelocity((dx / distance) * speed, (dy / distance) * speed);
        } else {
            if (this.isMoving) {
                this.isMoving = false;
                body.setVelocity(0, 0);
                
                // Arrived at destination
                if (this.npcState === 'WALKING_TO_FARM') {
                    this.startFarmingSequence();
                } else if (this.npcState === 'WALKING_TO_FISH') {
                    this.startFishingSequence();
                }
            }
        }

        this.playAnimations();
    }

    destroy(fromScene?: boolean) {
        if (this.aiTimer) {
            this.aiTimer.destroy();
        }
        super.destroy(fromScene);
    }
}
