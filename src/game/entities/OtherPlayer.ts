import Phaser from 'phaser';

export class OtherPlayer extends Phaser.GameObjects.Container {
    bodySprite: Phaser.GameObjects.Sprite;
    clothesSprite: Phaser.GameObjects.Sprite;
    toolSprite: Phaser.GameObjects.Sprite;
    usernameText: Phaser.GameObjects.Text;
    
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

        scene.add.existing(this);
    }

    update() {
        if (this.isPerformingAction) return;

        // Smooth linear interpolation (lerp) to prevent jitter/teleportation
        this.x = Phaser.Math.Linear(this.x, this.targetX, 0.15);
        this.y = Phaser.Math.Linear(this.y, this.targetY, 0.15);

        this.playAnimations();
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
}
