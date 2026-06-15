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
        this.load.tilemapTiledJSON('farm_map', '/assets/maps/farm-v2.tmj');
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
    }

    create() {
        this.scene.start('MainMap');
    }
}
