import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class Player extends Phaser.GameObjects.Container {
    bodySprite: Phaser.GameObjects.Sprite;
    clothesSprite: Phaser.GameObjects.Sprite;
    toolSprite: Phaser.GameObjects.Sprite;
    usernameText: Phaser.GameObjects.Text;
    chatBubble: Phaser.GameObjects.Text;
    chatTimer: Phaser.Time.TimerEvent | null = null;
    
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    wasdKeys: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };

    speed: number = 100;
    currentDirection: string = 'down';
    isMoving: boolean = false;
    isPerformingAction: boolean = false;
    clothesIndex: number = 1;
    username: string;
    inputEnabled: boolean = true;

    constructor(scene: Phaser.Scene, x: number, y: number, username: string, clothesIndex: number) {
        super(scene, x, y);
        this.username = username;
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

        // Username Tag (high resolution & crisp)
        this.usernameText = scene.add.text(0, -14, username, {
            fontFamily: 'monospace',
            fontSize: '32px',
            color: '#ffffff',
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

        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(16, 16);
        body.setOffset(-8, -8);
        body.setCollideWorldBounds(true);

        this.cursors = scene.input.keyboard!.createCursorKeys();
        this.wasdKeys = scene.input.keyboard!.addKeys('W,A,S,D') as any;

        // Hook event listeners to disable controls during chat typing
        const handleDisableInput = () => {
            this.inputEnabled = false;
            if (scene.input && scene.input.keyboard) {
                scene.input.keyboard.enabled = false;
            }
        };

        const handleEnableInput = () => {
            this.inputEnabled = true;
            if (scene.input && scene.input.keyboard) {
                scene.input.keyboard.enabled = true;
            }
        };

        EventBus.on('disable-player-input', handleDisableInput);
        EventBus.on('enable-player-input', handleEnableInput);

        // Clean up listeners when destroyed
        this.once('destroy', () => {
            EventBus.off('disable-player-input', handleDisableInput);
            EventBus.off('enable-player-input', handleEnableInput);
        });

        scene.add.existing(this);
    }

    update() {
        if (this.isPerformingAction) return;

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        let vx = 0;
        let vy = 0;
        let direction = this.currentDirection;
        let moving = false;

        // Only read keyboards if input is enabled (not typing in Chat)
        if (this.inputEnabled) {
            if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
                vx = -this.speed;
                direction = 'left';
                moving = true;
            } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
                vx = this.speed;
                direction = 'right';
                moving = true;
            }

            if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
                vy = -this.speed;
                direction = 'up';
                moving = true;
            } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
                vy = this.speed;
                direction = 'down';
                moving = true;
            }

            if (vx !== 0 && vy !== 0) {
                vx *= 0.7071;
                vy *= 0.7071;
            }
        }

        body.setVelocity(vx, vy);

        this.currentDirection = direction;
        this.isMoving = moving;

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

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(0, 0);
        }

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
}
