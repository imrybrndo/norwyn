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
    aboveLayer!: Phaser.Tilemaps.TilemapLayer;
    
    room: Room<GameState> | null = null;
    otherPlayers: Map<string, OtherPlayer> = new Map();
    
    // Farming crop visual objects mapping: tileKey -> objects
    cropObjects: Map<string, {
        soil: Phaser.GameObjects.Image;
        crop: Phaser.GameObjects.Image;
        timer?: Phaser.GameObjects.Text;
    }> = new Map();

    activeItem: string = 'harvest'; // Active tool or seed from React UI overlay
    currentFacilityNear: string | null = null;

    // Farm Plots coordinates loaded dynamically from map
    farmPlots: Array<{ x: number, y: number, width: number, height: number }> = [];

    // Offline Mode Local State
    localStats = {
        gold: 150, // Initial gold in offline mode for testing
        energy: 100,
        hunger: 100,
        wateringCanLevel: 1,
        wateringCanDurability: 100,
        inventory: [
            { itemType: 'seed_rice', count: 5 },       // Rice seeds
            { itemType: 'seed_vegetable', count: 3 },  // Vegetable seeds
            { itemType: 'seed_fruit', count: 2 },      // Fruit seeds
            { itemType: 'food_bread', count: 1 }       // Starting food
        ]
    };

    localCropsData: Map<string, {
        id: string;
        tileX: number;
        tileY: number;
        cropType: string;
        plantedAt: number;
        readyAt: number;
        watered: boolean;
        ownerId: string;
    }> = new Map();

    lastLocalTick: number = 0;
    localTickCount: number = 0;

    // Store last sent movement packet to avoid redundant network floods
    lastSentData: { x: number; y: number; direction: string; isMoving: boolean } | null = null;

    constructor() {
        super('MainMap');
    }

    isFarmablePlot(x: number, y: number): boolean {
        return this.farmPlots.some(plot => 
            x >= plot.x && x <= plot.x + plot.width && 
            y >= plot.y && y <= plot.y + plot.height
        );
    }

    calculateGrowthStage(crop: any): number {
        const now = Date.now();
        if (now >= crop.readyAt) {
            return 5;
        }
        const duration = crop.readyAt - crop.plantedAt;
        if (duration <= 0) return 0;
        const elapsed = now - crop.plantedAt;
        const stage = Math.floor((elapsed / duration) * 5);
        return Phaser.Math.Clamp(stage, 0, 4);
    }

    addCropObject(tileKey: string, crop: any) {
        const x = crop.tileX * 16 + 8;
        const y = crop.tileY * 16 + 8;

        // Soil underlay
        const soilKey = crop.watered ? 'soil_wet' : 'soil_dry';
        const soil = this.add.image(x, y, soilKey);
        soil.setDepth(1);

        // Crop overlay
        const stage = this.calculateGrowthStage(crop);
        const cropSprite = this.add.image(x, y - 4, `crop_${crop.cropType}_stage_${stage}`);
        cropSprite.setDepth(2);

        // Growth text timer (sharp & crisp)
        const timer = this.add.text(x, y - 12, '', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#00000066',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setScale(0.25).setDepth(3);

        this.cropObjects.set(tileKey, { soil, crop: cropSprite, timer });
    }

    updateCropObject(tileKey: string, crop: any) {
        const obj = this.cropObjects.get(tileKey);
        if (obj) {
            obj.soil.setTexture(crop.watered ? 'soil_wet' : 'soil_dry');
            const stage = this.calculateGrowthStage(crop);
            obj.crop.setTexture(`crop_${crop.cropType}_stage_${stage}`);
        }
    }

    removeCropObject(tileKey: string) {
        const obj = this.cropObjects.get(tileKey);
        if (obj) {
            obj.soil.destroy();
            obj.crop.destroy();
            if (obj.timer) obj.timer.destroy();
            this.cropObjects.delete(tileKey);
        }
    }

    updateCropsVisuals() {
        const now = Date.now();
        this.cropObjects.forEach((obj, tileKey) => {
            const crop = this.room ? this.room.state.crops.get(tileKey) : this.localCropsData.get(tileKey);
            if (crop) {
                const stage = this.calculateGrowthStage(crop);
                obj.crop.setTexture(`crop_${crop.cropType}_stage_${stage}`);

                if (now < crop.readyAt) {
                    const remaining = Math.ceil((crop.readyAt - now) / 1000);
                    obj.timer?.setText(`${remaining}s`);
                } else {
                    obj.timer?.setText(crop.watered ? 'READY' : 'DRY');
                }
            }
        });
    }

    facilities: Array<{ id: string; x: number; y: number; width: number; height: number; color: number; label: string }> = [];

    createFacilityPlaceholders(map: Phaser.Tilemaps.Tilemap) {
        const getObjectCoords = (layerName: string) => {
            const layer = map.getObjectLayer(layerName);
            if (layer && layer.objects && layer.objects.length > 0) {
                const obj = layer.objects[0];
                if (obj.x !== undefined && obj.y !== undefined && obj.width !== undefined && obj.height !== undefined) {
                    return {
                        x: obj.x + obj.width / 2,
                        y: obj.y + obj.height / 2,
                        width: obj.width,
                        height: obj.height
                    };
                }
            }
            return null;
        };

        // 1. Seed Shop
        const seedShopObj = getObjectCoords('SeedShop');
        if (seedShopObj) {
            this.facilities.push({ id: 'seed_shop', x: seedShopObj.x, y: seedShopObj.y, width: seedShopObj.width, height: seedShopObj.height, color: 0x10b981, label: 'SEED SHOP' });
        } else {
            this.facilities.push({ id: 'seed_shop', x: 240, y: 150, width: 40, height: 40, color: 0x10b981, label: 'SEED SHOP' });
        }

        // 2. Food House
        const foodHouseObj = getObjectCoords('Food House');
        if (foodHouseObj) {
            this.facilities.push({ id: 'food_house', x: foodHouseObj.x, y: foodHouseObj.y, width: foodHouseObj.width, height: foodHouseObj.height, color: 0xf59e0b, label: 'FOOD HOUSE' });
        } else {
            this.facilities.push({ id: 'food_house', x: 120, y: 200, width: 40, height: 40, color: 0xf59e0b, label: 'FOOD HOUSE' });
        }

        // 3. Tool Repair
        const toolRepairObj = getObjectCoords('Tool Repair');
        if (toolRepairObj) {
            this.facilities.push({ id: 'tool_repair', x: toolRepairObj.x, y: toolRepairObj.y, width: toolRepairObj.width, height: toolRepairObj.height, color: 0x8b5cf6, label: 'TOOL REPAIR' });
        } else {
            this.facilities.push({ id: 'tool_repair', x: 240, y: 320, width: 40, height: 40, color: 0x8b5cf6, label: 'TOOL REPAIR' });
        }

        // 4. Beds (Parsed from the 'Bed' Object Layer)
        const bedLayer = map.getObjectLayer('Bed');
        let hasBeds = false;
        if (bedLayer && bedLayer.objects) {
            bedLayer.objects.forEach(obj => {
                if (obj.x !== undefined && obj.y !== undefined && obj.width !== undefined && obj.height !== undefined) {
                    hasBeds = true;
                    const label = obj.name || 'BED';
                    this.facilities.push({
                        id: 'sleep_house',
                        x: obj.x + obj.width / 2,
                        y: obj.y + obj.height / 2,
                        width: obj.width,
                        height: obj.height,
                        color: 0x3b82f6,
                        label: label.toUpperCase()
                    });
                }
            });
        }

        // Fallback sleep house if no beds are defined
        if (!hasBeds) {
            this.facilities.push({ id: 'sleep_house', x: 360, y: 200, width: 40, height: 40, color: 0x3b82f6, label: 'SLEEP HOUSE' });
        }

        this.facilities.forEach(fac => {
            // Create a static physics boundary box matching the object dimensions
            const wall = this.physics.add.staticImage(fac.x, fac.y, '');
            wall.setSize(fac.width, fac.height);
            // @ts-ignore
            wall.setVisible(false);
            this.physics.add.collider(this.player, wall);

            // Add high-resolution crisp label above the facility
            const textX = fac.x;
            const textY = fac.y - fac.height / 2 - 6;
            this.add.text(textX, textY, fac.label, {
                fontFamily: 'monospace',
                fontSize: '32px',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 6,
                padding: { x: 4, y: 4 }
            }).setOrigin(0.5).setScale(0.18).setDepth(11);
        });
    }

    checkProximityTrigger() {
        if (!this.player) return;

        let closest: string | null = null;
        let minDist = 40; // max interaction distance in pixels

        this.facilities.forEach(fac => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, fac.x, fac.y);
            if (dist < minDist) {
                minDist = dist;
                closest = fac.id;
            }
        });

        if (this.currentFacilityNear !== closest) {
            this.currentFacilityNear = closest;
            EventBus.emit('near-facility', closest);
        }
    }

    // Offline Fallback stats emitters
    addLocalInventory(itemType: string, count: number) {
        const item = this.localStats.inventory.find(i => i.itemType === itemType);
        if (item) {
            item.count += count;
        } else {
            this.localStats.inventory.push({ itemType, count });
        }
    }

    deductLocalInventory(itemType: string, count: number): boolean {
        const item = this.localStats.inventory.find(i => i.itemType === itemType);
        if (item && item.count >= count) {
            item.count -= count;
            return true;
        }
        return false;
    }

    emitLocalStats() {
        EventBus.emit('player-stats-changed', {
            gold: this.localStats.gold,
            energy: this.localStats.energy,
            hunger: this.localStats.hunger,
            wateringCanLevel: this.localStats.wateringCanLevel,
            wateringCanDurability: this.localStats.wateringCanDurability,
            inventory: this.localStats.inventory.map(i => ({
                itemType: i.itemType,
                count: i.count
            }))
        });
    }

    // Process UI requests locally when playing offline
    handleOfflineMessage(type: string, payload: any) {
        console.log(`[Offline Simulator] Action: ${type}`, payload);

        if (type === 'buySeed') {
            if (this.localStats.gold < 20) {
                EventBus.emit('network-error', 'Not enough gold!');
                return;
            }
            this.localStats.gold -= 20;

            const isLvl3 = this.localStats.wateringCanLevel >= 3;
            const roll = Math.random() * 100;
            let seedType = 'seed_rice';

            if (isLvl3) {
                if (roll < 30) seedType = 'seed_rice';
                else if (roll < 74) seedType = 'seed_vegetable';
                else if (roll < 97) seedType = 'seed_fruit';
                else seedType = 'seed_golden_tree';
            } else {
                if (roll < 50) seedType = 'seed_rice';
                else if (roll < 84) seedType = 'seed_vegetable';
                else if (roll < 99) seedType = 'seed_fruit';
                else seedType = 'seed_golden_tree';
            }

            this.addLocalInventory(seedType, 1);
            const friendlyNames: Record<string, string> = {
                seed_rice: 'Rice',
                seed_vegetable: 'Vegy',
                seed_fruit: 'Apple',
                seed_golden_tree: 'Golden Tree'
            };
            const friendlyName = friendlyNames[seedType] || seedType.replace('seed_', '');
            EventBus.emit('network-toast', { type: 'success', message: `Bought seed pack: Got ${friendlyName}!` });
            this.emitLocalStats();
        }

        else if (type === 'buyFood') {
            let price = 0;
            if (payload.foodType === 'food_bread') price = 10;
            else if (payload.foodType === 'food_rice_bowl') price = 25;
            else return;

            if (this.localStats.gold < price) {
                EventBus.emit('network-error', 'Not enough gold!');
                return;
            }

            this.localStats.gold -= price;
            this.addLocalInventory(payload.foodType, 1);
            EventBus.emit('network-toast', { type: 'success', message: `Bought food!` });
            this.emitLocalStats();
        }

        else if (type === 'eatFood') {
            if (this.deductLocalInventory(payload.foodType, 1)) {
                if (payload.foodType === 'food_bread') {
                    this.localStats.energy = Math.min(100, this.localStats.energy + 10);
                    this.localStats.hunger = Math.min(100, this.localStats.hunger + 20);
                } else if (payload.foodType === 'food_rice_bowl') {
                    this.localStats.energy = Math.min(100, this.localStats.energy + 30);
                    this.localStats.hunger = Math.min(100, this.localStats.hunger + 50);
                }
                EventBus.emit('network-toast', { type: 'success', message: 'Ate food. Energy/Hunger restored!' });
                this.emitLocalStats();
            } else {
                EventBus.emit('network-error', 'You do not have that food!');
            }
        }

        else if (type === 'sleep') {
            if (this.localStats.gold < 40) {
                EventBus.emit('network-error', 'Need 40 Gold to sleep!');
                return;
            }
            this.localStats.gold -= 40;
            this.localStats.energy = 100;
            EventBus.emit('network-toast', { type: 'success', message: 'Rested! Energy fully restored.' });
            this.emitLocalStats();
        }

        else if (type === 'repairTool') {
            let cost = 0;
            let repairAmount = 0;
            if (payload.option === 'dur_25') { cost = 15; repairAmount = 25; }
            else if (payload.option === 'dur_50') { cost = 25; repairAmount = 50; }
            else if (payload.option === 'dur_full') { cost = 40; repairAmount = 100; }

            if (this.localStats.gold < cost) {
                EventBus.emit('network-error', 'Not enough gold!');
                return;
            }

            this.localStats.gold -= cost;
            this.localStats.wateringCanDurability = Math.min(100, this.localStats.wateringCanDurability + repairAmount);
            EventBus.emit('network-toast', { type: 'success', message: 'Watering Can repaired!' });
            this.emitLocalStats();
        }

        else if (type === 'upgradeTool') {
            const nextLvl = this.localStats.wateringCanLevel + 1;
            let cost = 0;
            if (nextLvl === 2) cost = 300;
            else if (nextLvl === 3) cost = 700;
            else if (nextLvl === 4) cost = 1500;
            else return;

            if (this.localStats.gold < cost) {
                EventBus.emit('network-error', 'Not enough gold to upgrade!');
                return;
            }

            this.localStats.gold -= cost;
            this.localStats.wateringCanLevel = nextLvl;
            EventBus.emit('network-toast', { type: 'success', message: `Watering Can upgraded to Level ${nextLvl}!` });
            this.emitLocalStats();
        }

        else if (type === 'sellCrop') {
            const itemType = `crop_${payload.cropType}`;
            let sellPrice = 0;
            if (payload.cropType === 'rice') sellPrice = 2;
            else if (payload.cropType === 'vegetable') sellPrice = 50;
            else if (payload.cropType === 'fruit') sellPrice = 100;
            else if (payload.cropType === 'golden_tree') sellPrice = 200;

            const totalEarnings = sellPrice * payload.count;
            if (this.deductLocalInventory(itemType, payload.count)) {
                this.localStats.gold += totalEarnings;
                EventBus.emit('network-toast', { type: 'success', message: `Sold crops for ${totalEarnings} Gold!` });
                this.emitLocalStats();
            } else {
                EventBus.emit('network-error', 'Not enough crops to sell!');
            }
        }
    }

    handleOfflineTileClick(tileX: number, tileY: number, worldPoint: Phaser.Math.Vector2) {
        const tileKey = `${tileX}_${tileY}`;
        const crop = this.localCropsData.get(tileKey);

        if (this.activeItem === 'watering_can') {
            if (crop && !crop.watered) {
                if (this.localStats.wateringCanDurability < 1) {
                    EventBus.emit('network-error', 'Watering can is broken! Repair it.');
                    return;
                }
                let energyCost = 1;
                if (this.localStats.wateringCanLevel >= 4) energyCost = 0;

                if (this.localStats.energy < energyCost) {
                    EventBus.emit('network-error', 'Not enough energy!');
                    return;
                }

                this.player.playWateringAnimation();

                this.localStats.energy -= energyCost;
                this.localStats.wateringCanDurability -= 1;
                crop.watered = true;

                this.updateCropObject(tileKey, crop);
                this.emitLocalStats();
            }
        } else if (this.activeItem === 'harvest') {
            if (crop && Date.now() >= crop.readyAt) {
                if (!crop.watered) {
                    EventBus.emit('network-error', 'Crop never watered! It dried up.');
                    return;
                }
                this.removeCropObject(tileKey);
                this.localCropsData.delete(tileKey);
                this.addLocalInventory(`crop_${crop.cropType}`, 1);
                EventBus.emit('network-toast', { type: 'success', message: `Harvested ${crop.cropType}!` });
                this.emitLocalStats();
            }
        } else if (this.activeItem.startsWith('seed_')) {
            if (!crop && this.isFarmablePlot(worldPoint.x, worldPoint.y)) {
                let energyCost = 2;
                let growthTime = 10000; // rice 10s
                let cropType = 'rice';

                if (this.activeItem === 'seed_rice') {
                    energyCost = 2; growthTime = 10000; cropType = 'rice';
                } else if (this.activeItem === 'seed_vegetable') {
                    energyCost = 8; growthTime = 60000; cropType = 'vegetable';
                } else if (this.activeItem === 'seed_fruit') {
                    energyCost = 15; growthTime = 90000; cropType = 'fruit';
                } else if (this.activeItem === 'seed_golden_tree') {
                    energyCost = 20; growthTime = 120000; cropType = 'golden_tree';
                }

                if (this.localStats.wateringCanLevel >= 4) {
                    energyCost = Math.round(energyCost * 0.8);
                }
                if (this.localStats.wateringCanLevel >= 2) {
                    growthTime = Math.round(growthTime * 0.9);
                }

                if (this.localStats.energy < energyCost) {
                    EventBus.emit('network-error', 'Not enough energy!');
                    return;
                }
                if (this.localStats.wateringCanDurability < 1) {
                    EventBus.emit('network-error', 'Watering can is broken!');
                    return;
                }

                if (this.deductLocalInventory(this.activeItem, 1)) {
                    this.localStats.energy -= energyCost;
                    this.localStats.wateringCanDurability -= 1;

                    const newCrop = {
                        id: tileKey,
                        tileX,
                        tileY,
                        cropType,
                        plantedAt: Date.now(),
                        readyAt: Date.now() + growthTime,
                        watered: false,
                        ownerId: 'local_player'
                    };

                    this.localCropsData.set(tileKey, newCrop);
                    this.addCropObject(tileKey, newCrop);
                    this.emitLocalStats();
                } else {
                    EventBus.emit('network-error', 'No seeds left in inventory!');
                }
            }
        }
    }

    create() {
        // 1. Get registry settings
        const username = this.registry.get('username') || 'Farmer';
        const clothesIndex = this.registry.get('clothesIndex') || 1;
        const isOnline = this.registry.get('isOnline') || false;
        const walletAddress = this.registry.get('walletAddress');

        // 2. Generate animations
        createAnimations(this);

        // 3. Create tilemap and add tileset
        const map = this.make.tilemap({ key: 'farm_map' });
        const tilesetSunnyside = map.addTilesetImage('Sunnyside', 'sunnyside_tileset_16px');
        const tilesetForest = map.addTilesetImage('Forest', 'sunnyside_tileset_forest_32px');

        if (!tilesetSunnyside || !tilesetForest) {
            console.error('Failed to load tileset images in MainMap');
            return;
        }

        const tilesets = [tilesetSunnyside, tilesetForest];

        // 4. Create map layers
        this.groundLayer = map.createLayer('Ground', tilesets, 0, 0) as Phaser.Tilemaps.TilemapLayer;
        this.groundLayer.setCollisionByProperty({ collides: true });

        this.environmentLayer = map.createLayer('Environment', tilesets, 0, 0) as Phaser.Tilemaps.TilemapLayer;
        this.environmentLayer.setCollisionByExclusion([-1]);

        // 5. Spawn local player
        this.player = new Player(this, 240, 240, username, clothesIndex);
        this.physics.add.collider(this.player, this.environmentLayer);
        this.physics.add.collider(this.player, this.groundLayer);

        // Above layer for roofs and treetops (rendered above player)
        this.aboveLayer = map.createLayer('Above', tilesets, 0, 0) as Phaser.Tilemaps.TilemapLayer;
        if (this.aboveLayer) {
            this.aboveLayer.setDepth(10);
        }

        // 6. Camera and World Boundaries
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(2.5);

        // 6b. Dynamically load FarmPlots boundaries from Tiled JSON objects
        const plotsLayer = map.getObjectLayer('FarmPlots');
        if (plotsLayer) {
            plotsLayer.objects.forEach(obj => {
                if (obj.x !== undefined && obj.y !== undefined && obj.width !== undefined && obj.height !== undefined) {
                    this.farmPlots.push({
                        x: obj.x,
                        y: obj.y,
                        width: obj.width,
                        height: obj.height
                    });
                }
            });
        }

        // 6c. Spawn visible building/shop placeholders on the map with collision boundaries
        this.createFacilityPlaceholders(map);

        // 7. Input: Click on grid to plant/water/harvest
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
            const tileX = Math.floor(worldPoint.x / 16);
            const tileY = Math.floor(worldPoint.y / 16);

            // Proximity interaction distance limit
            const playerTileX = Math.floor(this.player.x / 16);
            const playerTileY = Math.floor(this.player.y / 16);
            const dist = Phaser.Math.Distance.Between(playerTileX, playerTileY, tileX, tileY);

            if (dist > 3.5) {
                console.log('Too far to interact!');
                return;
            }

            // Offline Mode Fallback Interceptor
            if (!this.room) {
                this.handleOfflineTileClick(tileX, tileY, worldPoint);
                return;
            }

            const tileKey = `${tileX}_${tileY}`;
            const crop = this.room.state.crops.get(tileKey);

            if (this.activeItem === 'watering_can') {
                if (crop && !crop.watered) {
                    this.player.playWateringAnimation();
                    this.room.send('waterCrop', { tileX, tileY });
                }
            } else if (this.activeItem === 'harvest') {
                if (crop && Date.now() >= crop.readyAt) {
                    this.room.send('harvestCrop', { tileX, tileY });
                }
            } else if (this.activeItem.startsWith('seed_')) {
                if (!crop && this.isFarmablePlot(worldPoint.x, worldPoint.y)) {
                    this.room.send('plantSeed', { tileX, tileY, seedType: this.activeItem });
                }
            }
        });

        // 8. Setup online multiplayer if selected
        if (isOnline) {
            this.connectToRoom(username, clothesIndex, walletAddress);
        } else {
            // Emits initial default stats when offline
            this.time.delayedCall(100, () => this.emitLocalStats());
        }

        // Listen for active tool changes from React
        EventBus.on('set-active-item', (itemType: string) => {
            this.activeItem = itemType;
        });

        // Listen for React UI room requests
        EventBus.on('send-room-message', (data: { type: string, payload?: any }) => {
            if (this.room) {
                this.room.send(data.type, data.payload);
            } else {
                this.handleOfflineMessage(data.type, data.payload);
            }
        });

        // Listen for outgoing chat from React UI overlay
        EventBus.on('send-chat', (text: string) => {
            if (this.room) {
                this.room.send('chat', { text });
            }
        });

        // Clean up EventBus listener when scene is shut down
        this.events.once('shutdown', () => {
            EventBus.off('send-chat');
            EventBus.off('set-active-item');
            EventBus.off('send-room-message');
            if (this.room) {
                this.room.leave();
            }
            this.cropObjects.forEach(obj => {
                obj.soil.destroy();
                obj.crop.destroy();
                if (obj.timer) obj.timer.destroy();
            });
            this.cropObjects.clear();
        });
    }

    connectToRoom(username: string, clothesIndex: number, walletAddress?: string) {
        colyseusClient.joinOrCreate('game_room', { username, clothesIndex, walletAddress }, GameState).then(room => {
            this.room = room;
            console.log('Joined room:', room.roomId);

            // Notify UI about successful connection
            EventBus.emit('connection-status', { connected: true, sessionId: room.sessionId });

            // Listen for watering animation broadcast
            room.onMessage('player-watered', (data: { sessionId: string }) => {
                if (data.sessionId === room.sessionId) {
                    this.player.playWateringAnimation();
                } else {
                    const other = this.otherPlayers.get(data.sessionId);
                    if (other) {
                        other.playWateringAnimation();
                    }
                }
            });

            const callbacks = Callbacks.get(room);

            // Handle new players joining
            callbacks.onAdd("players", (player: any, sessionId: string) => {
                // Listen to changes in self or other player's properties
                callbacks.onChange(player, () => {
                    if (sessionId === room.sessionId) {
                        // Notify React UI about self player stats change
                        EventBus.emit('player-stats-changed', {
                            gold: player.gold,
                            energy: player.energy,
                            hunger: player.hunger,
                            wateringCanLevel: player.wateringCanLevel,
                            wateringCanDurability: player.wateringCanDurability,
                            inventory: player.inventory.map((item: any) => ({
                                itemType: item.itemType,
                                count: item.count
                            }))
                        });
                        return;
                    }

                    const otherPlayer = this.otherPlayers.get(sessionId);
                    if (otherPlayer) {
                        otherPlayer.targetX = player.x;
                        otherPlayer.targetY = player.y;
                        otherPlayer.currentDirection = player.direction;
                        otherPlayer.isMoving = player.isMoving;
                    }
                });

                if (sessionId === room.sessionId) return; // Skip spawning other player logic here

                const otherPlayer = new OtherPlayer(this, player.x, player.y, player.username, player.clothesIndex);
                this.otherPlayers.set(sessionId, otherPlayer);
            });

            // Handle players leaving
            callbacks.onRemove("players", (player: any, sessionId: string) => {
                const other = this.otherPlayers.get(sessionId);
                if (other) {
                    other.destroy();
                    this.otherPlayers.delete(sessionId);
                }
            });

            // Handle crops loading from server
            callbacks.onAdd("crops", (crop: any, tileKey: string) => {
                this.addCropObject(tileKey, crop);

                callbacks.onChange(crop, () => {
                    this.updateCropObject(tileKey, crop);
                });
            });

            // Handle crops removed (harvested)
            callbacks.onRemove("crops", (crop: any, tileKey: string) => {
                this.removeCropObject(tileKey);
            });

            // Listen to chat message broadcasts
            room.onMessage('chat-message', (data: any) => {
                EventBus.emit('chat-received', data);
            });

            // Listen to error notifications
            room.onMessage('error', (msg: string) => {
                EventBus.emit('network-error', msg);
            });

            // Listen to success toast notifications
            room.onMessage('toast', (data: { type: string, message: string }) => {
                EventBus.emit('network-toast', data);
            });

        }).catch(err => {
            console.error('Failed to connect to Colyseus server room:', err);
            EventBus.emit('connection-status', { connected: false, error: err.message });
        });
    }

    update() {
        if (this.player) {
            this.player.update();
            this.checkProximityTrigger();

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
            } else {
                // Passive energy & hunger decrement simulation for offline mode
                const now = Date.now();
                if (this.lastLocalTick === 0 || now - this.lastLocalTick >= 10000) {
                    this.lastLocalTick = now;
                    this.localTickCount++;
                    let changed = false;

                    // passive energy recovery
                    if (this.localStats.hunger > 0 && this.localStats.energy < 100) {
                        this.localStats.energy = Math.min(100, this.localStats.energy + 1);
                        changed = true;
                    }

                    // passive hunger drain (decreases by 1 every 30s)
                    if (this.localTickCount % 3 === 0 && this.localStats.hunger > 0) {
                        this.localStats.hunger = Math.max(0, this.localStats.hunger - 1);
                        changed = true;
                    }

                    if (changed) {
                        this.emitLocalStats();
                    }
                }
            }
        }

        // Interpolate other players
        this.otherPlayers.forEach(other => other.update());

        // Update crop visual timers
        this.updateCropsVisuals();
    }
}
