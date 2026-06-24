import Phaser from 'phaser';

export class OtherPlayer extends Phaser.GameObjects.Container {
    bodySprite: Phaser.GameObjects.Sprite;
    clothesSprite: Phaser.GameObjects.Sprite;
    toolSprite: Phaser.GameObjects.Sprite;
    usernameText: Phaser.GameObjects.Text;
    chatBubble: Phaser.GameObjects.Text;
    chatTimer: Phaser.Time.TimerEvent | null = null;
    
    targetX: number;
    targetY: number;
    currentDirection: string = 'down';
    isMoving: boolean = false;
    isPerformingAction: boolean = false;
    clothesIndex: number = 1;

    constructor(scene: Phaser.Scene, x: number, y: number, username: string, clothesIndex: number) {
        super(scene, x, y);
        this.targetX = x;
        this.targetY = y;
        this.clothesIndex = clothesIndex;

        // Base Body Layer
        this.bodySprite = scene.add.sprite(0, 0, 'player_base_idle', 0);
        this.bodySprite.setOrigin(0.5, 0.5);

        // Clothes Layer
        this.clothesSprite = scene.add.sprite(0, 0, `player_clothes_idle_${clothesIndex}`, 0);
        this.clothesSprite.setOrigin(0.5, 0.5);

        // Tool Layer
        this.toolSprite = scene.add.sprite(0, 0, 'player_tools_watering', 0);
        this.toolSprite.setOrigin(0.5, 0.5);
        this.toolSprite.setVisible(false);

        // Username Tag with green tint (high resolution & crisp)
        this.usernameText = scene.add.text(0, -14, username, {
            fontFamily: 'monospace',
            fontSize: '32px',
            color: '#a7f3d0',
            backgroundColor: '#00000088',
            padding: { x: 12, y: 4 }
        }).setOrigin(0.5, 0.5).setScale(0.25);

        this.add(this.bodySprite);
        this.add(this.clothesSprite);
        this.add(this.toolSprite);
        this.add(this.usernameText);

        // Chat Bubble
        this.chatBubble = scene.add.text(0, -25, '', {
            fontFamily: 'monospace',
            fontSize: '28px',
            color: '#000000',
            backgroundColor: '#ffffffdd',
            padding: { x: 8, y: 4 },
            align: 'center',
            wordWrap: { width: 400, useAdvancedWrap: true }
        }).setOrigin(0.5, 1).setScale(0.25).setVisible(false);
        
        this.add(this.chatBubble);

        scene.add.existing(this);
    }

    update(time?: number, delta?: number) {
        if (this.isPerformingAction) return;

        // Smooth linear interpolation (lerp) to prevent jitter/teleportation
        this.x = Phaser.Math.Linear(this.x, this.targetX, 0.15);
        this.y = Phaser.Math.Linear(this.y, this.targetY, 0.15);

        this.playAnimations();
    }

    showChat(text: string) {
        this.chatBubble.setText(text);
        this.chatBubble.setVisible(true);
        if (this.chatTimer) {
            this.chatTimer.destroy();
        }
        this.chatTimer = this.scene.time.delayedCall(5000, () => {
            this.chatBubble.setVisible(false);
        });
    }

    playAnimations() {
        if (this.isPerformingAction) return;

        const animState = this.isMoving ? 'walk' : 'idle';
        const bodyKey = `player_base_${animState}`;
        const clothesKey = `player_clothes_${this.clothesIndex}_${animState}`;

        if (this.scene.anims.exists(bodyKey)) {
            this.bodySprite.play(bodyKey, true);
        }
        if (this.scene.anims.exists(clothesKey)) {
            this.clothesSprite.play(clothesKey, true);
        }

        // Apply flip based on current direction
        if (this.currentDirection === 'left') {
            this.bodySprite.setFlipX(true);
            this.clothesSprite.setFlipX(true);
        } else if (this.currentDirection === 'right') {
            this.bodySprite.setFlipX(false);
            this.clothesSprite.setFlipX(false);
        }
    }

    playWateringAnimation() {
        if (this.isPerformingAction) return;

        this.isPerformingAction = true;
        this.isMoving = false;

        this.toolSprite.setVisible(true);

        const isFlipped = this.currentDirection === 'left';
        this.bodySprite.setFlipX(isFlipped);
        this.clothesSprite.setFlipX(isFlipped);
        this.toolSprite.setFlipX(isFlipped);

        if (this.scene.anims.exists('player_base_watering')) {
            this.bodySprite.play('player_base_watering', true);
        }
        if (this.scene.anims.exists(`player_clothes_${this.clothesIndex}_watering`)) {
            this.clothesSprite.play(`player_clothes_${this.clothesIndex}_watering`, true);
        }
        if (this.scene.anims.exists('player_tools_watering')) {
            this.toolSprite.play('player_tools_watering', true);
        }

        // Stop action after 500ms (5 frames of watering animation at 10fps)
        this.scene.time.delayedCall(500, () => {
            this.toolSprite.setVisible(false);
            this.isPerformingAction = false;
        });
    }

    startFishingAnimation() {
        this.isPerformingAction = true;
        this.isMoving = false;
        this.toolSprite.setVisible(true);

        const isFlipped = this.currentDirection === 'left';
        this.bodySprite.setFlipX(isFlipped);
        this.clothesSprite.setFlipX(isFlipped);
        this.toolSprite.setFlipX(isFlipped);

        if (this.scene.anims.exists('player_base_casting')) {
            this.bodySprite.play('player_base_casting', true);
        }
        if (this.scene.anims.exists(`player_clothes_${this.clothesIndex}_casting`)) {
            this.clothesSprite.play(`player_clothes_${this.clothesIndex}_casting`, true);
        }
        if (this.scene.anims.exists('player_tools_casting')) {
            this.toolSprite.play('player_tools_casting', true);
        }

        // Wait 1.5s then play waiting anim
        this.scene.time.delayedCall(1500, () => {
            if (!this.isPerformingAction) return;
            if (this.scene.anims.exists('player_base_waiting')) {
                this.bodySprite.play('player_base_waiting', true);
            }
            if (this.scene.anims.exists(`player_clothes_${this.clothesIndex}_waiting`)) {
                this.clothesSprite.play(`player_clothes_${this.clothesIndex}_waiting`, true);
            }
            if (this.scene.anims.exists('player_tools_waiting')) {
                this.toolSprite.play('player_tools_waiting', true);
            }
        });
    }

    playCatchAnimation() {
        this.isPerformingAction = true;
        this.isMoving = false;
        this.toolSprite.setVisible(true);

        const isFlipped = this.currentDirection === 'left';
        this.bodySprite.setFlipX(isFlipped);
        this.clothesSprite.setFlipX(isFlipped);
        this.toolSprite.setFlipX(isFlipped);

        if (this.scene.anims.exists('player_base_reeling')) {
            this.bodySprite.play('player_base_reeling', true);
        }
        if (this.scene.anims.exists(`player_clothes_${this.clothesIndex}_reeling`)) {
            this.clothesSprite.play(`player_clothes_${this.clothesIndex}_reeling`, true);
        }
        if (this.scene.anims.exists('player_tools_reeling')) {
            this.toolSprite.play('player_tools_reeling', true);
        }

        // 1.3s later play caught anim
        this.scene.time.delayedCall(1300, () => {
            if (!this.isPerformingAction) return;
            if (this.scene.anims.exists('player_base_caught')) {
                this.bodySprite.play('player_base_caught', true);
            }
            if (this.scene.anims.exists(`player_clothes_${this.clothesIndex}_caught`)) {
                this.clothesSprite.play(`player_clothes_${this.clothesIndex}_caught`, true);
            }
            if (this.scene.anims.exists('player_tools_caught')) {
                this.toolSprite.play('player_tools_caught', true);
            }

            // Celebrate for 1.5s then stop
            this.scene.time.delayedCall(1500, () => {
                this.stopFishingAnimation();
            });
        });
    }

    stopFishingAnimation() {
        this.toolSprite.setVisible(false);
        this.isPerformingAction = false;
    }
}
