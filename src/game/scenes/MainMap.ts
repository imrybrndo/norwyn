import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { OtherPlayer } from '../entities/OtherPlayer';
import { NPC } from '../entities/NPC';
import { createAnimations } from '../managers/AnimationManager';
import { colyseusClient } from '../../network/colyseus';
import { EventBus } from '../EventBus';
import { Room, Callbacks } from '@colyseus/sdk';
import { GameState } from '../../../server/rooms/schema/GameState';

export class MainMap extends Phaser.Scene {
    player!: Player;
    environmentLayer!: Phaser.Tilemaps.TilemapLayer;
    groundLayer!: Phaser.Tilemaps.TilemapLayer;
    groundDetailLayer!: Phaser.Tilemaps.TilemapLayer;
    aboveLayer!: Phaser.Tilemaps.TilemapLayer;
    
    room: Room<GameState> | null = null;
    otherPlayers: Map<string, OtherPlayer> = new Map();
    npcs: NPC[] = [];
    bgmMusic?: Phaser.Sound.BaseSound;
    
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
    customInteractables: Array<{
        name: string;
        type: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }> = [];
    chestSprite: Phaser.GameObjects.Sprite | null = null;
    isChestClaimed: boolean = false;

    // Offline Mode Local State
    localStats = {
        gold: 150, // Initial gold in offline mode for testing
        energy: 100,
        hunger: 100,
        wateringCanLevel: 1,
        wateringCanDurability: 100,
        fishingRodLevel: 1,
        fishingRodDurability: 100,
        inventory: [
            { itemType: 'seed_rice', count: 5 },       // Rice seeds
            { itemType: 'seed_vegetable', count: 3 },  // Vegetable seeds
            { itemType: 'seed_fruit', count: 2 },      // Fruit seeds
            { itemType: 'food_bread', count: 1 },      // Starting food
            { itemType: 'fishing_rod', count: 1 }      // Fishing Rod
        ],
        isSleeping: false
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

    tileAnimations: Array<{
        firstgid: number;
        tilesetName: string;
        tileId: number;
        frames: Array<{ tileid: number; duration: number }>;
        currentFrame: number;
        elapsed: number;
    }> = [];
    animatedTileCoords: Array<{
        layer: Phaser.Tilemaps.TilemapLayer;
        x: number;
        y: number;
        animIndex: number;
    }> = [];

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
        }).setOrigin(0.5).setScale(0.25).setDepth(6);

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
        const interactablesLayer = map.getObjectLayer('Interactables');
        if (!interactablesLayer || !interactablesLayer.objects) {
            // Fallbacks if layer doesn't exist
            this.facilities.push({ id: 'shop', x: 240, y: 150, width: 40, height: 40, color: 0x10b981, label: 'SHOP' });
            this.facilities.push({ id: 'food_house', x: 120, y: 200, width: 40, height: 40, color: 0xf59e0b, label: 'FOOD HOUSE' });
            this.facilities.push({ id: 'tool_repair', x: 240, y: 320, width: 40, height: 40, color: 0x8b5cf6, label: 'TOOL REPAIR' });
            this.facilities.push({ id: 'sleep_house', x: 360, y: 200, width: 40, height: 40, color: 0x3b82f6, label: 'SLEEP HOUSE' });
            
            this.facilities.forEach(fac => {
                const wall = this.physics.add.staticImage(fac.x, fac.y, '');
                wall.setSize(fac.width, fac.height);
                // @ts-ignore
                wall.setVisible(false);
                this.physics.add.collider(this.player, wall);
            });
            return;
        }

        let hasBeds = false;

        interactablesLayer.objects.forEach(obj => {
            if (obj.x === undefined || obj.y === undefined) return;

            const width = obj.width || 16;
            const height = obj.height || 16;
            const x = obj.x + width / 2;
            const y = obj.y + height / 2;

            if (obj.type === 'shop') {
                if (obj.name === 'SeedShop') {
                    this.facilities.push({ id: 'shop', x, y, width, height, color: 0x10b981, label: 'SHOP' });
                } else if (obj.name === 'Food House') {
                    this.facilities.push({ id: 'food_house', x, y, width, height, color: 0xf59e0b, label: 'FOOD HOUSE' });
                } else if (obj.name === 'Tool Repair') {
                    this.facilities.push({ id: 'tool_repair', x, y, width, height, color: 0x8b5cf6, label: 'TOOL REPAIR' });
                } else if (obj.name === 'Marketplace') {
                    this.facilities.push({ id: 'marketplace', x, y, width, height, color: 0xec4899, label: 'MARKETPLACE' });
                }
            } else if (obj.type === 'bed') {
                hasBeds = true;
                const label = obj.name || 'BED';
                this.facilities.push({
                    id: 'sleep_house',
                    x,
                    y,
                    width,
                    height,
                    color: 0x3b82f6,
                    label: label.toUpperCase()
                });
            }
        });

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

        this.customInteractables.forEach(obj => {
            if (obj.name === 'Chest' && this.isChestClaimed) {
                return;
            }
            // Calculate distance to bounding box instead of center point
            const halfW = (obj.width || 0) / 2;
            const halfH = (obj.height || 0) / 2;
            const closestX = Math.max(obj.x - halfW, Math.min(this.player.x, obj.x + halfW));
            const closestY = Math.max(obj.y - halfH, Math.min(this.player.y, obj.y + halfH));
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, closestX, closestY);

            // Fishing spots need a tighter interaction range so player stands right at the shore
            const isFishingSpot = obj.name.includes('laut') || obj.name.includes('sungai') || obj.name.includes('danau');
            const maxRange = isFishingSpot ? 16 : 40;

            if (dist < maxRange && dist < minDist) {
                minDist = dist;
                closest = obj.name;
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
            username: this.registry.get('username') || 'Farmer',
            gold: this.localStats.gold,
            energy: this.localStats.energy,
            hunger: this.localStats.hunger,
            isSleeping: this.localStats.isSleeping,
            wateringCanLevel: this.localStats.wateringCanLevel,
            wateringCanDurability: this.localStats.wateringCanDurability,
            fishingRodLevel: this.localStats.fishingRodLevel || 1,
            fishingRodDurability: this.localStats.fishingRodDurability ?? 100,
            inventory: this.localStats.inventory.map(i => ({
                itemType: i.itemType,
                count: i.count
            })),
            friends: [],
            friendRequests: []
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

        else if (type === 'buyFishingRod') {
            const price = 5000;
            if (this.localStats.gold < price) {
                EventBus.emit('network-error', 'Not enough gold!');
                return;
            }
            const hasRod = this.localStats.inventory.find(i => i.itemType === 'fishing_rod' && i.count > 0);
            if (hasRod) {
                EventBus.emit('network-error', 'You already own a Fishing Rod!');
                return;
            }
            this.localStats.gold -= price;
            this.addLocalInventory('fishing_rod', 1);
            EventBus.emit('network-toast', { type: 'success', message: 'Purchased Fishing Rod!' });
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
            this.localStats.isSleeping = true;
            this.emitLocalStats();
            EventBus.emit('network-toast', { type: 'success', message: 'Going to sleep. Energy will restore in 30 seconds...' });

            this.time.delayedCall(30000, () => {
                this.localStats.isSleeping = false;
                this.localStats.energy = 100;
                this.emitLocalStats();
                EventBus.emit('network-toast', { type: 'success', message: 'Rested! Energy fully restored.' });
            });
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
            const target = payload.toolType || 'watering_can';
            if (target === 'fishing_rod') {
                this.localStats.fishingRodDurability = Math.min(100, (this.localStats.fishingRodDurability || 0) + repairAmount);
                EventBus.emit('network-toast', { type: 'success', message: 'Fishing Rod repaired!' });
            } else {
                this.localStats.wateringCanDurability = Math.min(100, this.localStats.wateringCanDurability + repairAmount);
                EventBus.emit('network-toast', { type: 'success', message: 'Watering Can repaired!' });
            }
            this.emitLocalStats();
        }

        else if (type === 'upgradeTool') {
            const target = payload?.toolType || 'watering_can';
            if (target === 'fishing_rod') {
                const nextLvl = (this.localStats.fishingRodLevel || 1) + 1;
                let cost = 0;
                if (nextLvl === 2) cost = 500;
                else {
                    EventBus.emit('network-error', 'Fishing Rod already at maximum level!');
                    return;
                }

                if (this.localStats.gold < cost) {
                    EventBus.emit('network-error', 'Not enough gold to upgrade!');
                    return;
                }

                this.localStats.gold -= cost;
                this.localStats.fishingRodLevel = nextLvl;
                this.localStats.fishingRodDurability = 100; // Reset durability
                EventBus.emit('network-toast', { type: 'success', message: `Fishing Rod upgraded to Level ${nextLvl}!` });
            } else {
                const nextLvl = this.localStats.wateringCanLevel + 1;
                let cost = 0;
                if (nextLvl === 2) cost = 300;
                else if (nextLvl === 3) cost = 700;
                else if (nextLvl === 4) cost = 1500;
                else {
                    EventBus.emit('network-error', 'Watering Can already at maximum level!');
                    return;
                }

                if (this.localStats.gold < cost) {
                    EventBus.emit('network-error', 'Not enough gold to upgrade!');
                    return;
                }

                this.localStats.gold -= cost;
                this.localStats.wateringCanLevel = nextLvl;
                EventBus.emit('network-toast', { type: 'success', message: `Watering Can upgraded to Level ${nextLvl}!` });
            }
            this.emitLocalStats();
        }

        else if (type === 'sellCrop') {
            const itemType = payload.cropType.startsWith('fish_') ? payload.cropType : `crop_${payload.cropType}`;
            let sellPrice = 0;
            if (payload.cropType === 'rice') sellPrice = 2;
            else if (payload.cropType === 'vegetable') sellPrice = 50;
            else if (payload.cropType === 'fruit') sellPrice = 100;
            else if (payload.cropType === 'golden_tree') sellPrice = 200;
            else if (payload.cropType === 'fish_common') sellPrice = 25;
            else if (payload.cropType === 'fish_uncommon') sellPrice = 60;
            else if (payload.cropType === 'fish_rare') sellPrice = 150;

            const totalEarnings = sellPrice * payload.count;
            if (this.deductLocalInventory(itemType, payload.count)) {
                this.localStats.gold += totalEarnings;
                EventBus.emit('network-toast', { type: 'success', message: `Sold items for ${totalEarnings} Gold!` });
                this.emitLocalStats();
            } else {
                EventBus.emit('network-error', 'Not enough items to sell!');
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
        const isGuest = this.registry.get('isGuest') || false;

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

        this.groundDetailLayer = map.createLayer('Ground_Detail', tilesets, 0, 0) as Phaser.Tilemaps.TilemapLayer;
        if (this.groundDetailLayer) {
            this.groundDetailLayer.setCollisionByProperty({ collides: true });
        }

        this.environmentLayer = map.createLayer('Environment', tilesets, 0, 0) as Phaser.Tilemaps.TilemapLayer;
        this.environmentLayer.setCollisionByExclusion([-1]);

        // Programmatically clear static chest tile (14, 16) to prevent overlapping with dynamic chest sprite
        this.environmentLayer.removeTileAt(14, 15);
        this.environmentLayer.removeTileAt(14, 16);

        // 5. Spawn local player
        this.player = new Player(this, 240, 240, username, clothesIndex);
        this.player.setDepth(5);
        this.physics.add.collider(this.player, this.environmentLayer);
        this.physics.add.collider(this.player, this.groundLayer);
        if (this.groundDetailLayer) {
            this.physics.add.collider(this.player, this.groundDetailLayer);
        }

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

        // 6b. Parse Interactables Layer (shops, beds, farm plots, and custom objects)
        const interactablesLayer = map.getObjectLayer('Interactables');
        if (interactablesLayer && interactablesLayer.objects) {
            interactablesLayer.objects.forEach(obj => {
                if (obj.type === 'farm_plot' || (obj.name && obj.name.startsWith('lahan_'))) {
                    if (obj.x !== undefined && obj.y !== undefined && obj.width !== undefined && obj.height !== undefined) {
                        this.farmPlots.push({
                            x: obj.x,
                            y: obj.y,
                            width: obj.width,
                            height: obj.height
                        });
                    }
                } else if (
                    obj.name === 'Chest' || 
                    obj.name === 'chest' || 
                    obj.name === 'Top Ranking' || 
                    obj.name === 'Portal 1' || 
                    obj.name === 'Portal 2' ||
                    ((obj as any).class === 'laut' || obj.type === 'laut' || (obj as any).class === 'danau' || obj.type === 'danau' || (obj.name && (obj.name.includes('laut') || obj.name.includes('danau'))))
                ) {
                    if (obj.x !== undefined && obj.y !== undefined && obj.width !== undefined && obj.height !== undefined) {
                        const centerX = obj.x + obj.width / 2;
                        const centerY = obj.y + obj.height / 2;
                        const normalName = (obj.name === 'Chest' || obj.name === 'chest') ? 'Chest' : obj.name;
                        this.customInteractables.push({
                            name: normalName,
                            type: obj.type || '',
                            x: centerX,
                            y: centerY,
                            width: obj.width,
                            height: obj.height
                        });

                        if (obj.name === 'Chest' || obj.name === 'chest') {
                            this.chestSprite = this.add.sprite(centerX, centerY, 'sunnyside_tileset_16px_sheet', 1958);
                            this.chestSprite.setDisplaySize(obj.width, obj.height);
                            this.chestSprite.setDepth(4);
                            this.updateChestVisibility();
                        }
                    }
                }
            });
        }

        // 6c. Spawn visible building/shop/bed placeholders on the map with collision boundaries
        this.createFacilityPlaceholders(map);

        // 6d. Parse tile animations from raw Tiled JSON
        const rawMap = this.cache.json.get('farm_map');
        const tileAnims: Array<{
            firstgid: number;
            tilesetName: string;
            tileId: number;
            frames: Array<{ tileid: number; duration: number }>;
            currentFrame: number;
            elapsed: number;
        }> = [];

        if (rawMap && rawMap.tilesets) {
            rawMap.tilesets.forEach((ts: any) => {
                if (ts.tiles) {
                    ts.tiles.forEach((tile: any) => {
                        if (tile.animation && tile.animation.length > 0) {
                            tileAnims.push({
                                firstgid: ts.firstgid,
                                tilesetName: ts.name,
                                tileId: tile.id,
                                frames: tile.animation,
                                currentFrame: 0,
                                elapsed: 0
                            });
                        }
                    });
                }
            });
        }

        const animatedTileCoords: Array<{
            layer: Phaser.Tilemaps.TilemapLayer;
            x: number;
            y: number;
            animIndex: number;
        }> = [];

        const layers = [this.groundLayer, this.groundDetailLayer, this.environmentLayer, this.aboveLayer].filter(Boolean) as Phaser.Tilemaps.TilemapLayer[];

        layers.forEach(layer => {
            layer.forEachTile(tile => {
                const tileIndex = tile.index;
                for (let i = 0; i < tileAnims.length; i++) {
                    const anim = tileAnims[i];
                    const startGid = anim.firstgid + anim.tileId;
                    if (tileIndex === startGid) {
                        animatedTileCoords.push({
                            layer,
                            x: tile.x,
                            y: tile.y,
                            animIndex: i
                        });
                        break;
                    }
                }
            });
        });
        
        this.tileAnimations = tileAnims;
        this.animatedTileCoords = animatedTileCoords;

        // 7. Input: Click on grid to plant/water/harvest
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const isSleeping = this.room 
                ? this.room.state.players.get(this.room.sessionId)?.isSleeping 
                : this.localStats.isSleeping;
            if (isSleeping) return;

            const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;

            // Check if click was inside a custom interactable object
            const clickedObject = this.customInteractables.find(obj => {
                const left = obj.x - obj.width / 2;
                const right = obj.x + obj.width / 2;
                const top = obj.y - obj.height / 2;
                const bottom = obj.y + obj.height / 2;
                return worldPoint.x >= left && worldPoint.x <= right && 
                       worldPoint.y >= top && worldPoint.y <= bottom;
            });

            if (clickedObject) {
                const left = clickedObject.x - clickedObject.width / 2 - 24;
                const right = clickedObject.x + clickedObject.width / 2 + 24;
                const top = clickedObject.y - clickedObject.height / 2 - 24;
                const bottom = clickedObject.y + clickedObject.height / 2 + 24;
                
                const isNear = this.player.x >= left && this.player.x <= right && 
                               this.player.y >= top && this.player.y <= bottom;
                
                if (!isNear) {
                    EventBus.emit('network-toast', { type: 'warning', message: 'Too far to interact!' });
                    return;
                }
                
                if (clickedObject.name === 'Chest' && this.isChestClaimed) {
                    return;
                }
                
                this.handleCustomObjectInteraction(clickedObject);
                return;
            }

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

        // Initialize Background Music
        try {
            this.bgmMusic = this.sound.add('bgm', { loop: true, volume: 0.35 });
        } catch (e) {
            console.warn('Failed to add bgm sound:', e);
        }

        // Request initial sound settings from React HUD
        this.time.delayedCall(200, () => {
            EventBus.emit('request-sound-status');
        });

        // Spawn NPCs (Ed and Rey) with different clothes indexes for distinction
        const ed = new NPC(this, 300, 300, 'Guest_19803', 2);
        const rey = new NPC(this, 500, 500, 'Guest_28192', 3);
        ed.setDepth(5);
        rey.setDepth(5);
        this.npcs = [ed, rey];

        // Add collisions for NPCs
        this.npcs.forEach(npc => {
            this.physics.add.collider(npc, this.environmentLayer);
            this.physics.add.collider(npc, this.groundLayer);
            if (this.groundDetailLayer) {
                this.physics.add.collider(npc, this.groundDetailLayer);
            }
        });

        // 8. Setup online multiplayer if selected
        if (isOnline) {
            this.connectToRoom(username, clothesIndex, walletAddress, isGuest);
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

        // Listen to toggle-sound event from React
        EventBus.on('toggle-sound', (enabled: boolean) => {
            if (this.bgmMusic) {
                if (enabled) {
                    if (!this.bgmMusic.isPlaying) {
                        try {
                            this.bgmMusic.play();
                        } catch (e) {
                            console.warn('BGM play blocked or failed:', e);
                        }
                    }
                } else {
                    if (this.bgmMusic.isPlaying) {
                        this.bgmMusic.stop();
                    }
                }
            }
        });

        EventBus.on('interact-near-object', () => {
            if (this.currentFacilityNear) {
                const obj = this.customInteractables.find(c => c.name === this.currentFacilityNear);
                if (obj) {
                    this.handleCustomObjectInteraction(obj);
                }
            }
        });

        // Clean up EventBus listener when scene is shut down
        this.events.once('shutdown', () => {
            EventBus.off('interact-near-object');
            EventBus.off('send-chat');
            EventBus.off('set-active-item');
            EventBus.off('send-room-message');
            EventBus.off('toggle-sound');
            if (this.bgmMusic) {
                this.bgmMusic.stop();
                this.bgmMusic.destroy();
            }
            if (this.room) {
                this.room.leave();
            }
            this.cropObjects.forEach(obj => {
                obj.soil.destroy();
                obj.crop.destroy();
                if (obj.timer) obj.timer.destroy();
            });
            this.cropObjects.clear();

            // Destroy and clean up NPCs
            this.npcs.forEach(npc => npc.destroy());
            this.npcs = [];
        });
    }

    connectToRoom(username: string, clothesIndex: number, walletAddress?: string, isGuest: boolean = false) {
        colyseusClient.joinOrCreate('game_room', { username, clothesIndex, walletAddress, isGuest }, GameState).then(room => {
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

            // Listen for fishing animation broadcasts
            room.onMessage('player-start-fishing', (data: { sessionId: string }) => {
                if (data.sessionId !== room.sessionId) {
                    const other = this.otherPlayers.get(data.sessionId);
                    if (other) {
                        other.startFishingAnimation();
                    }
                }
            });

            room.onMessage('player-stop-fishing', (data: { sessionId: string }) => {
                if (data.sessionId !== room.sessionId) {
                    const other = this.otherPlayers.get(data.sessionId);
                    if (other) {
                        other.stopFishingAnimation();
                    }
                }
            });

            room.onMessage('player-catch-fish', (data: { sessionId: string }) => {
                if (data.sessionId !== room.sessionId) {
                    const other = this.otherPlayers.get(data.sessionId);
                    if (other) {
                        other.playCatchAnimation();
                    }
                }
            });

            const callbacks = Callbacks.get(room);

            // Handle new players joining
            callbacks.onAdd("players", (player: any, sessionId: string) => {
                // Ignore virtual NPC guest players to prevent duplication
                if (sessionId === 'npc_ed' || sessionId === 'npc_rey' || player.username === 'Guest_19803' || player.username === 'Guest_28192') {
                    EventBus.emit('online-count-changed', room.state.players.size);
                    return;
                }

                if (sessionId === room.sessionId) {
                    this.updateChestVisibility();
                }
                
                // Listen to changes in self or other player's properties
                callbacks.onChange(player, () => {
                    if (sessionId === room.sessionId) {
                        // Notify React UI about self player stats change
                        EventBus.emit('player-stats-changed', {
                            username: player.username || 'Farmer',
                            gold: player.gold,
                            energy: player.energy,
                            hunger: player.hunger,
                            level: player.level,
                            exp: player.exp,
                            isSleeping: player.isSleeping,
                            wateringCanLevel: player.wateringCanLevel,
                            wateringCanDurability: player.wateringCanDurability,
                            inventory: player.inventory.map((item: any) => ({
                                itemType: item.itemType,
                                count: item.count
                            })),
                            lastClaimedQuests: Object.fromEntries(player.lastClaimedQuests || new Map()),
                            friends: player.friends ? Array.from(player.friends) : [],
                            friendRequests: player.friendRequests ? Array.from(player.friendRequests) : []
                        });
                        this.updateChestVisibility();
                        return;
                    }

                    const otherPlayer = this.otherPlayers.get(sessionId);
                    if (otherPlayer) {
                        otherPlayer.targetX = player.x;
                        otherPlayer.targetY = player.y;
                        otherPlayer.currentDirection = player.direction;
                        otherPlayer.isMoving = player.isMoving;

                        // Sleep visual state for other players
                        otherPlayer.setAlpha(player.isSleeping ? 0.3 : 1.0);
                        if (player.isSleeping) {
                            otherPlayer.showChat("Zzz...");
                        } else if (otherPlayer.chatBubble.text === "Zzz...") {
                            otherPlayer.chatBubble.setVisible(false);
                        }
                    }
                });

                if (sessionId === room.sessionId) {
                    EventBus.emit('online-count-changed', room.state.players.size);
                    return; // Skip spawning other player logic here
                }

                const otherPlayer = new OtherPlayer(this, player.x, player.y, player.username, player.clothesIndex);
                otherPlayer.setDepth(5);
                this.otherPlayers.set(sessionId, otherPlayer);
                EventBus.emit('online-count-changed', room.state.players.size);
            });

            // Handle players leaving
            callbacks.onRemove("players", (player: any, sessionId: string) => {
                const other = this.otherPlayers.get(sessionId);
                if (other) {
                    other.destroy();
                    this.otherPlayers.delete(sessionId);
                }
                EventBus.emit('online-count-changed', room.state.players.size);
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
                if (data.senderId === room.sessionId) {
                    this.player.showChat(data.text);
                } else {
                    const other = this.otherPlayers.get(data.senderId);
                    if (other) {
                        other.showChat(data.text);
                    }
                }
            });

            room.onMessage('private-chat-received', (data: any) => {
                EventBus.emit('private-chat-received', data);
            });

            room.onMessage('private-chat-sent-confirm', (data: any) => {
                EventBus.emit('private-chat-sent-confirm', data);
            });

            // Listen to error notifications
            room.onMessage('error', (msg: string) => {
                EventBus.emit('network-error', msg);
            });

            // Listen to success toast notifications
            room.onMessage('toast', (data: { type: string, message: string }) => {
                EventBus.emit('network-toast', data);
            });

            // Listen to playtime ranking data
            room.onMessage('playtimeRankingData', (data: any) => {
                EventBus.emit('playtime-ranking-data', data);
            });

            // Listen to fishing wait time from server
            room.onMessage('fishing-wait-time', (data: { waitTime: number }) => {
                if (this.player) {
                    this.player.onFishingWaitTimeReceived(data.waitTime);
                }
            });

        }).catch(err => {
            console.error('Failed to connect to Colyseus server room:', err);
            EventBus.emit('connection-status', { connected: false, error: err.message });
        });
    }

    update(time: number, delta: number) {
        if (this.player) {
            const selfIsSleeping = this.room 
                ? this.room.state.players.get(this.room.sessionId)?.isSleeping 
                : this.localStats.isSleeping;

            this.player.setAlpha(selfIsSleeping ? 0.3 : 1.0);
            if (selfIsSleeping) {
                this.player.showChat("Zzz...");
                const body = this.player.body as Phaser.Physics.Arcade.Body;
                if (body) body.setVelocity(0, 0);
            } else {
                if (this.player.chatBubble.text === "Zzz...") {
                    this.player.chatBubble.setVisible(false);
                }
                this.player.update();
            }
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

                    // Expire/decay local offline crops after 2 minutes from ready time
                    this.localCropsData.forEach((crop, tileKey) => {
                        if (now >= crop.readyAt + 120000) {
                            this.removeCropObject(tileKey);
                            this.localCropsData.delete(tileKey);
                        }
                    });

                    if (changed) {
                        this.emitLocalStats();
                    }
                }
            }
        }

        // Interpolate other players
        this.otherPlayers.forEach(other => other.update(time, delta));

        // Update NPCs
        this.npcs.forEach(npc => npc.update(time, delta));

        // Update crop visual timers
        this.updateCropsVisuals();

        // Update animated tiles
        if (this.tileAnimations && this.tileAnimations.length > 0) {
            const frameChanged = this.tileAnimations.map((anim) => {
                anim.elapsed += delta;
                const currentDuration = anim.frames[anim.currentFrame].duration;
                if (anim.elapsed >= currentDuration) {
                    anim.elapsed = anim.elapsed % currentDuration;
                    anim.currentFrame = (anim.currentFrame + 1) % anim.frames.length;
                    return true;
                }
                return false;
            });

            this.animatedTileCoords.forEach(coords => {
                if (frameChanged[coords.animIndex]) {
                    const anim = this.tileAnimations[coords.animIndex];
                    const nextTileId = anim.frames[anim.currentFrame].tileid;
                    const nextGid = anim.firstgid + nextTileId;
                    
                    const tile = coords.layer.getTileAt(coords.x, coords.y);
                    if (tile) {
                        tile.index = nextGid;
                    }
                }
            });
        }
    }

    updateChestVisibility() {
        if (!this.chestSprite) return;

        let lastClaimed = 0;
        if (this.room) {
            const selfPlayer = this.room.state.players.get(this.room.sessionId);
            if (selfPlayer) {
                lastClaimed = selfPlayer.lastDailyChestClaim || 0;
            }
        } else {
            // @ts-ignore
            lastClaimed = this.localStats.lastDailyChestClaim || 0;
        }
        
        const now = Date.now();
        const COOLDOWN = 24 * 60 * 60 * 1000;
        
        this.isChestClaimed = (now - lastClaimed < COOLDOWN);
        
        if (this.isChestClaimed) {
            this.chestSprite.setFrame(1959); // opened chest tile
        } else {
            this.chestSprite.setFrame(1958); // closed chest tile
        }
    }

    handleCustomObjectInteraction(obj: { name: string; x: number; y: number; width: number; height: number }) {
        if (obj.name === 'Chest') {
            if (this.room) {
                this.room.send('claimChest');
            } else {
                const randomGold = Math.floor(Math.random() * 101) + 100;
                this.localStats.gold += randomGold;
                // @ts-ignore
                this.localStats.lastDailyChestClaim = Date.now();
                EventBus.emit('network-toast', { type: 'success', message: `[Offline] Opened chest: Got ${randomGold} Gold!` });
                this.emitLocalStats();
                this.updateChestVisibility();
            }
        } else if (obj.name === 'Top Ranking') {
            if (this.room) {
                this.room.send('getPlaytimeRanking');
            }
            EventBus.emit('open-playtime-ranking');
        } else if (obj.name === 'Portal 1' || obj.name === 'Portal 2') {
            const destination = obj.name === 'Portal 1' ? 'Forest' : 'Sea';
            EventBus.emit('network-toast', { type: 'warning', message: `The gate to the ${destination} is currently locked!` });
        } else if (obj.name.includes('laut') || obj.name.includes('sungai') || obj.name.includes('danau')) {
            if (this.player) {
                if (this.player.isFishing) {
                    this.player.attemptReel();
                } else {
                    this.player.startFishing(obj.name);
                }
            }
        }
    }
}

