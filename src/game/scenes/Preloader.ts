import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Create simple loading bar graphics
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading Assets...',
            style: {
                font: '20px monospace',
                color: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                color: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
            percentText.setText(parseInt(String(value * 100)) + '%');
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // Load map and tileset
        this.load.tilemapTiledJSON('farm_map', '/assets/maps/farm-v2.tmj?v=' + Date.now());
        this.load.image('sunnyside_tileset_16px', '/assets/tilesets/spr_tileset_sunnysideworld_16px.png');
        this.load.image('sunnyside_tileset_forest_32px', '/assets/tilesets/spr_tileset_sunnysideworld_forest_32px.png');

        // Load player sprite sheets
        this.load.spritesheet('player_base_walk', '/assets/sprites/characters/base_walk.png', {
            frameWidth: 96,
            frameHeight: 64
        });
        this.load.spritesheet('player_base_idle', '/assets/sprites/characters/base_idle.png', {
            frameWidth: 96,
            frameHeight: 64
        });

        // Load clothes sprite sheets
        for (let i = 1; i <= 3; i++) {
            this.load.spritesheet(`player_clothes_walk_${i}`, `/assets/sprites/characters/clothes_walk_${i}.png`, {
                frameWidth: 96,
                frameHeight: 64
            });
            this.load.spritesheet(`player_clothes_idle_${i}`, `/assets/sprites/characters/clothes_idle_${i}.png`, {
                frameWidth: 96,
                frameHeight: 64
            });
        }

        // Load watering animations
        this.load.spritesheet('player_base_watering', '/assets/Characters/Human/WATERING/base_watering_strip5.png', {
            frameWidth: 96,
            frameHeight: 64
        });
        this.load.spritesheet('player_tools_watering', '/assets/Characters/Human/WATERING/tools_watering_strip5.png', {
            frameWidth: 96,
            frameHeight: 64
        });
        for (let i = 1; i <= 3; i++) {
            const hairNames = ['bowlhair', 'curlyhair', 'longhair'];
            const hairName = hairNames[i - 1];
            this.load.spritesheet(`player_clothes_watering_${i}`, `/assets/Characters/Human/WATERING/${hairName}_watering_strip5.png`, {
                frameWidth: 96,
                frameHeight: 64
            });
        }

        // Load fishing animations (casting, waiting, reeling, caught)
        this.load.spritesheet('player_base_casting', '/assets/Characters/Human/CASTING/base_casting_strip15.png', {
            frameWidth: 96,
            frameHeight: 64
        });
        this.load.spritesheet('player_tools_casting', '/assets/Characters/Human/CASTING/tools_casting_strip15.png', {
            frameWidth: 96,
            frameHeight: 64
        });
        this.load.spritesheet('player_base_waiting', '/assets/Characters/Human/WAITING/base_waiting_strip9.png', {
            frameWidth: 96,
            frameHeight: 64
        });
        this.load.spritesheet('player_tools_waiting', '/assets/Characters/Human/WAITING/tools_waiting_strip9.png', {
            frameWidth: 96,
            frameHeight: 64
        });
        this.load.spritesheet('player_base_reeling', '/assets/Characters/Human/REELING/base_reeling_strip13.png', {
            frameWidth: 96,
            frameHeight: 64
        });
        this.load.spritesheet('player_tools_reeling', '/assets/Characters/Human/REELING/tools_reeling_strip13.png', {
            frameWidth: 96,
            frameHeight: 64
        });
        this.load.spritesheet('player_base_caught', '/assets/Characters/Human/CAUGHT/base_caught_strip10.png', {
            frameWidth: 96,
            frameHeight: 64
        });
        this.load.spritesheet('player_tools_caught', '/assets/Characters/Human/CAUGHT/tools_caught_strip10.png', {
            frameWidth: 96,
            frameHeight: 64
        });

        for (let i = 1; i <= 3; i++) {
            const hairNames = ['bowlhair', 'curlyhair', 'longhair'];
            const hairName = hairNames[i - 1];
            this.load.spritesheet(`player_clothes_casting_${i}`, `/assets/Characters/Human/CASTING/${hairName}_casting_strip15.png`, {
                frameWidth: 96,
                frameHeight: 64
            });
            this.load.spritesheet(`player_clothes_waiting_${i}`, `/assets/Characters/Human/WAITING/${hairName}_waiting_strip9.png`, {
                frameWidth: 96,
                frameHeight: 64
            });
            this.load.spritesheet(`player_clothes_reeling_${i}`, `/assets/Characters/Human/REELING/${hairName}_reeling_strip13.png`, {
                frameWidth: 96,
                frameHeight: 64
            });
            this.load.spritesheet(`player_clothes_caught_${i}`, `/assets/Characters/Human/CAUGHT/${hairName}_caught_strip10.png`, {
                frameWidth: 96,
                frameHeight: 64
            });
        }

        // Load UI and alert expression
        this.load.image('expression_alerted', '/assets/UI/expression_alerted.png');


        // Load crop sprites (wheat for rice, cabbage for vegetable, pumpkin for fruit, sunflower for golden_tree)
        const cropMap = {
            rice: 'wheat',
            vegetable: 'cabbage',
            fruit: 'pumpkin',
            golden_tree: 'sunflower'
        };

        Object.entries(cropMap).forEach(([key, value]) => {
            for (let i = 0; i <= 5; i++) {
                const pad = String(i).padStart(2, '0');
                this.load.image(`crop_${key}_stage_${i}`, `/assets/Elements/Crops/${value}_${pad}.png`);
            }
        });

        this.load.image('seeds_generic', '/assets/Elements/Crops/seeds_generic.png');
        this.load.image('soil_dry', '/assets/Elements/Crops/soil_00.png');
        this.load.image('soil_wet', '/assets/Elements/Crops/soil_01.png');
        this.load.spritesheet('sunnyside_tileset_16px_sheet', '/assets/tilesets/spr_tileset_sunnysideworld_16px.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        
        // Load Background Music
        this.load.audio('bgm', '/music.mp3');
    }

    create() {
        this.scene.start('MainMap');
    }
}
