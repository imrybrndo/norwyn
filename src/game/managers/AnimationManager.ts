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
    }
}
