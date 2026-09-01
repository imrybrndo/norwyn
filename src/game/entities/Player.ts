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
    isFishing: boolean = false;
    fishingState: 'IDLE' | 'CASTING' | 'WAITING' | 'BITE' | 'REELING' | 'CAUGHT' = 'IDLE';
    biteIndicatorSprite: Phaser.GameObjects.Sprite | null = null;
    fishingTimer: Phaser.Time.TimerEvent | null = null;
    biteTimer: Phaser.Time.TimerEvent | null = null;
    serverWaitTime: number | null = null;
    hasCompletedCasting: boolean = false;
    offlinePreRolled: { fishType: string, fishName: string, expGained: number } | null = null;

    facingLeft: boolean = false;

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

        // Bite Indicator (initially invisible)
        this.biteIndicatorSprite = scene.add.sprite(0, -32, 'expression_alerted');
        this.biteIndicatorSprite.setVisible(false);

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
        this.add(this.biteIndicatorSprite);
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
        if (this.isFishing) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            if (body) {
                body.setVelocity(0, 0);
            }
            return;
        }

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

    playBodyAnim(state: string) {
        const key = `player_base_${state}`;
        if (this.scene.anims.exists(key)) {
            this.bodySprite.play(key, true);
        }
    }

    // Single place that turns a logical facing into per-sprite flips.
    setFacing(facingLeft: boolean) {
        this.facingLeft = facingLeft;
        this.bodySprite.setFlipX(facingLeft);
        this.clothesSprite.setFlipX(facingLeft);
        this.toolSprite.setFlipX(facingLeft);
    }

    playAnimations() {
        if (this.isPerformingAction) return;

        const animState = this.isMoving ? 'walk' : 'idle';
        const clothesKey = `player_clothes_${this.clothesIndex}_${animState}`;

        this.playBodyAnim(animState);
        if (this.scene.anims.exists(clothesKey)) {
            this.clothesSprite.play(clothesKey, true);
        }

        // Apply flip based on current direction
        if (this.currentDirection === 'left') {
            this.setFacing(true);
        } else if (this.currentDirection === 'right') {
            this.setFacing(false);
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

        this.setFacing(this.currentDirection === 'left');

        this.playBodyAnim('watering');
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

    setFishingState(state: 'IDLE' | 'CASTING' | 'WAITING' | 'BITE' | 'REELING' | 'CAUGHT') {
        this.fishingState = state;
        EventBus.emit('player-fishing-state-changed', state);
    }

    startFishing(spotName: string) {
        const mainMap = this.scene as any;
        
        // 1. Check if has fishing rod in inventory
        let hasRod = false;
        let durability = 100;

        if (mainMap.room) {
            const selfPlayer = mainMap.room.state.players.get(mainMap.room.sessionId);
            if (selfPlayer) {
                hasRod = selfPlayer.inventory.some((i: any) => i.itemType === 'fishing_rod' && i.count > 0);
                durability = selfPlayer.fishingRodDurability ?? 100;
            }
        } else {
            hasRod = mainMap.localStats.inventory.some((i: any) => i.itemType === 'fishing_rod' && i.count > 0);
            durability = mainMap.localStats.fishingRodDurability ?? 100;
        }

        if (!hasRod) {
            EventBus.emit('network-error', 'You need to buy a Fishing Rod from the Marketplace first!');
            return;
        }

        // 2. Check durability
        if (durability <= 0) {
            EventBus.emit('network-error', 'Your Fishing Rod is broken! Repair it at the Blacksmith.');
            return;
        }

        // Freeze player
        this.isFishing = true;
        this.setFishingState('CASTING');
        this.isMoving = false;
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(0, 0);
        }

        // Auto-align player to face the water spot
        const interactable = mainMap.customInteractables?.find((c: any) => c.name === spotName);
        if (interactable) {
            const halfW = (interactable.width || 0) / 2;
            const halfH = (interactable.height || 0) / 2;
            const closestX = Math.max(interactable.x - halfW, Math.min(this.x, interactable.x + halfW));
            const closestY = Math.max(interactable.y - halfH, Math.min(this.y, interactable.y + halfH));

            const dx = closestX - this.x;
            const dy = closestY - this.y;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.currentDirection = dx < 0 ? 'left' : 'right';
            } else {
                this.currentDirection = dy < 0 ? 'up' : 'down';
            }
        }

        // Align facing direction (keep current facing when looking up/down)
        this.setFacing(this.currentDirection === 'left' || (this.currentDirection !== 'right' && this.facingLeft));

        this.toolSprite.setVisible(true);

        // Play casting anim
        this.playBodyAnim('casting');
        if (this.scene.anims.exists(`player_clothes_${this.clothesIndex}_casting`)) {
            this.clothesSprite.play(`player_clothes_${this.clothesIndex}_casting`, true);
        }
        if (this.scene.anims.exists('player_tools_casting')) {
            this.toolSprite.play('player_tools_casting', true);
        }

        // Reset dynamic properties
        this.serverWaitTime = null;
        this.hasCompletedCasting = false;
        this.offlinePreRolled = null;

        // Send startFishing to server if online
        if (mainMap.room) {
            mainMap.room.send('startFishing');
        }

        // Wait 1.5s (casting time) then transition to WAITING
        this.fishingTimer = this.scene.time.delayedCall(1500, () => {
            this.setFishingState('WAITING');

            this.playBodyAnim('waiting');
            if (this.scene.anims.exists(`player_clothes_${this.clothesIndex}_waiting`)) {
                this.clothesSprite.play(`player_clothes_${this.clothesIndex}_waiting`, true);
            }
            if (this.scene.anims.exists('player_tools_waiting')) {
                this.toolSprite.play('player_tools_waiting', true);
            }

            this.hasCompletedCasting = true;

            if (mainMap.room) {
                // If the serverWaitTime has already arrived, start the bite timer immediately
                if (this.serverWaitTime !== null) {
                    this.startBiteTimer(this.serverWaitTime);
                }
            } else {
                // Offline fallback: pre-roll fish and set wait time (5s for common, 10s for rare)
                const roll = Math.random() * 100;
                const rodLvl = mainMap.localStats.fishingRodLevel || 1;
                let fishType = 'fish_common';
                let fishName = 'Common Fish';
                let expGained = 15;
                let waitTime = 5000;

                if (rodLvl >= 2) {
                    if (roll < 40) {
                        fishType = 'fish_common'; fishName = 'Common Fish'; expGained = 15; waitTime = 5000;
                    } else if (roll < 80) {
                        fishType = 'fish_uncommon'; fishName = 'Uncommon Fish'; expGained = 35; waitTime = 10000;
                    } else {
                        fishType = 'fish_rare'; fishName = 'Rare Fish'; expGained = 75; waitTime = 10000;
                    }
                } else {
                    if (roll < 70) {
                        fishType = 'fish_common'; fishName = 'Common Fish'; expGained = 15; waitTime = 5000;
                    } else if (roll < 95) {
                        fishType = 'fish_uncommon'; fishName = 'Uncommon Fish'; expGained = 35; waitTime = 10000;
                    } else {
                        fishType = 'fish_rare'; fishName = 'Rare Fish'; expGained = 75; waitTime = 10000;
                    }
                }

                this.offlinePreRolled = { fishType, fishName, expGained };
                this.startBiteTimer(waitTime);
            }
        });
    }

    attemptReel() {
        const mainMap = this.scene as any;

        // Clear timers
        if (this.fishingTimer) this.fishingTimer.destroy();
        if (this.biteTimer) this.biteTimer.destroy();

        if (this.biteIndicatorSprite) {
            this.biteIndicatorSprite.setVisible(false);
        }

        if (this.fishingState === 'BITE') {
            this.setFishingState('REELING');

            // Play reeling anim
            this.playBodyAnim('reeling');
            if (this.scene.anims.exists(`player_clothes_${this.clothesIndex}_reeling`)) {
                this.clothesSprite.play(`player_clothes_${this.clothesIndex}_reeling`, true);
            }
            if (this.scene.anims.exists('player_tools_reeling')) {
                this.toolSprite.play('player_tools_reeling', true);
            }

            // 1.3s later, caught the fish
            this.scene.time.delayedCall(1300, () => {
                this.setFishingState('CAUGHT');

                this.playBodyAnim('caught');
                if (this.scene.anims.exists(`player_clothes_${this.clothesIndex}_caught`)) {
                    this.clothesSprite.play(`player_clothes_${this.clothesIndex}_caught`, true);
                }
                if (this.scene.anims.exists('player_tools_caught')) {
                    this.toolSprite.play('player_tools_caught', true);
                }

                if (mainMap.room) {
                    // Send to server
                    mainMap.room.send('catchFish');
                } else {
                    // Offline fallback catch: use pre-rolled fish
                    mainMap.localStats.fishingRodDurability = Math.max(0, (mainMap.localStats.fishingRodDurability ?? 100) - 1);
                    const preRolled = this.offlinePreRolled || { fishType: 'fish_common', fishName: 'Common Fish', expGained: 15 };

                    mainMap.addLocalInventory(preRolled.fishType, 1);
                    EventBus.emit('network-toast', { type: 'success', message: `[Offline] Caught a ${preRolled.fishName}! (+${preRolled.expGained} EXP)` });
                    mainMap.emitLocalStats();

                    if (mainMap.localStats.fishingRodDurability <= 0) {
                        EventBus.emit('network-toast', { type: 'error', message: 'Your Fishing Rod broke! Repair it.' });
                    }
                }

                // Wait 1.5s (celebration) then stop fishing
                this.scene.time.delayedCall(1500, () => {
                    this.isFishing = false;
                    this.setFishingState('IDLE');
                    this.toolSprite.setVisible(false);
                });
            });
        } else {
            // Reeled in too early/late
            this.cancelFishing('Too early! The fish got away.');
        }
    }

    cancelFishing(reason?: string) {
        if (this.fishingTimer) this.fishingTimer.destroy();
        if (this.biteTimer) this.biteTimer.destroy();
        
        if (this.biteIndicatorSprite) {
            this.biteIndicatorSprite.setVisible(false);
        }

        this.isFishing = false;
        this.setFishingState('IDLE');
        this.toolSprite.setVisible(false);

        const mainMap = this.scene as any;
        if (mainMap.room) {
            mainMap.room.send('stopFishing');
        }

        if (reason) {
            EventBus.emit('network-toast', { type: 'warning', message: reason });
        }
    }

    onFishingWaitTimeReceived(waitTime: number) {
        this.serverWaitTime = waitTime;
        if (this.hasCompletedCasting && this.fishingState === 'WAITING' && !this.biteTimer) {
            this.startBiteTimer(waitTime);
        }
    }

    startBiteTimer(waitTime: number) {
        if (this.biteTimer) this.biteTimer.destroy();
        this.biteTimer = this.scene.time.delayedCall(waitTime, () => {
            this.setFishingState('BITE');

            // Show exclamation mark alert
            if (this.biteIndicatorSprite) {
                this.biteIndicatorSprite.setVisible(true);
            }

            // 2 seconds reaction window
            this.fishingTimer = this.scene.time.delayedCall(2000, () => {
                if (this.biteIndicatorSprite) {
                    this.biteIndicatorSprite.setVisible(false);
                }
                this.cancelFishing('The fish got away!');
            });
        });
    }
}
