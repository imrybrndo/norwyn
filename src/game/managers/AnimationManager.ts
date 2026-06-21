import Phaser from 'phaser';

export function createAnimations(scene: Phaser.Scene) {
    // Avoid double creation errors if scene restarts
    if (scene.anims.exists('player_base_walk')) {
        return;
    }

    // 1. Create Base body animations
    scene.anims.create({
        key: 'player_base_walk',
        frames: scene.anims.generateFrameNumbers('player_base_walk', {
            start: 0,
            end: 7
        }),
        frameRate: 10,
        repeat: -1
    });

    scene.anims.create({
        key: 'player_base_idle',
        frames: scene.anims.generateFrameNumbers('player_base_idle', {
            start: 0,
            end: 8
        }),
        frameRate: 6,
        repeat: -1
    });

    // 1b. Create Base watering animation
    scene.anims.create({
        key: 'player_base_watering',
        frames: scene.anims.generateFrameNumbers('player_base_watering', {
            start: 0,
            end: 4
        }),
        frameRate: 10,
        repeat: 0
    });

    scene.anims.create({
        key: 'player_tools_watering',
        frames: scene.anims.generateFrameNumbers('player_tools_watering', {
            start: 0,
            end: 4
        }),
        frameRate: 10,
        repeat: 0
    });

    // 2. Create Clothes animations (1, 2, 3)
    for (let c = 1; c <= 3; c++) {
        scene.anims.create({
            key: `player_clothes_${c}_walk`,
            frames: scene.anims.generateFrameNumbers(`player_clothes_walk_${c}`, {
                start: 0,
                end: 7
            }),
            frameRate: 10,
            repeat: -1
        });

        scene.anims.create({
            key: `player_clothes_${c}_idle`,
            frames: scene.anims.generateFrameNumbers(`player_clothes_idle_${c}`, {
                start: 0,
                end: 8
            }),
            frameRate: 6,
            repeat: -1
        });

        scene.anims.create({
            key: `player_clothes_${c}_watering`,
            frames: scene.anims.generateFrameNumbers(`player_clothes_watering_${c}`, {
                start: 0,
                end: 4
            }),
            frameRate: 10,
            repeat: 0
        });

        // Clothes fishing animations
        scene.anims.create({
            key: `player_clothes_${c}_casting`,
            frames: scene.anims.generateFrameNumbers(`player_clothes_casting_${c}`, { start: 0, end: 14 }),
            frameRate: 10,
            repeat: 0
        });
        scene.anims.create({
            key: `player_clothes_${c}_waiting`,
            frames: scene.anims.generateFrameNumbers(`player_clothes_waiting_${c}`, { start: 0, end: 8 }),
            frameRate: 6,
            repeat: -1
        });
        scene.anims.create({
            key: `player_clothes_${c}_reeling`,
            frames: scene.anims.generateFrameNumbers(`player_clothes_reeling_${c}`, { start: 0, end: 12 }),
            frameRate: 10,
            repeat: 0
        });
        scene.anims.create({
            key: `player_clothes_${c}_caught`,
            frames: scene.anims.generateFrameNumbers(`player_clothes_caught_${c}`, { start: 0, end: 9 }),
            frameRate: 10,
            repeat: 0
        });
    }

    // Fishing base animations
    scene.anims.create({
        key: 'player_base_casting',
        frames: scene.anims.generateFrameNumbers('player_base_casting', { start: 0, end: 14 }),
        frameRate: 10,
        repeat: 0
    });
    scene.anims.create({
        key: 'player_base_waiting',
        frames: scene.anims.generateFrameNumbers('player_base_waiting', { start: 0, end: 8 }),
        frameRate: 6,
        repeat: -1
    });
    scene.anims.create({
        key: 'player_base_reeling',
        frames: scene.anims.generateFrameNumbers('player_base_reeling', { start: 0, end: 12 }),
        frameRate: 10,
        repeat: 0
    });
    scene.anims.create({
        key: 'player_base_caught',
        frames: scene.anims.generateFrameNumbers('player_base_caught', { start: 0, end: 9 }),
        frameRate: 10,
        repeat: 0
    });

    // Fishing tool animations
    scene.anims.create({
        key: 'player_tools_casting',
        frames: scene.anims.generateFrameNumbers('player_tools_casting', { start: 0, end: 14 }),
        frameRate: 10,
        repeat: 0
    });
    scene.anims.create({
        key: 'player_tools_waiting',
        frames: scene.anims.generateFrameNumbers('player_tools_waiting', { start: 0, end: 8 }),
        frameRate: 6,
        repeat: -1
    });
    scene.anims.create({
        key: 'player_tools_reeling',
        frames: scene.anims.generateFrameNumbers('player_tools_reeling', { start: 0, end: 12 }),
        frameRate: 10,
        repeat: 0
    });
    scene.anims.create({
        key: 'player_tools_caught',
        frames: scene.anims.generateFrameNumbers('player_tools_caught', { start: 0, end: 9 }),
        frameRate: 10,
        repeat: 0
    });

}
