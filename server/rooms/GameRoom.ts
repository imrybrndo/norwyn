import { Room, Client } from '@colyseus/core';
import { GameState, PlayerState, InventoryItemState, CropState } from './schema/GameState';
import prisma from '../db/prisma';
import { CROP_CATALOG, getCrop, getCropBySeed } from '../../shared/crops';
import fs from 'fs';
import path from 'path';

// Farm plot rectangles parsed from the same Tiled map the client renders, so
// client and server always agree on where planting is allowed. If the map file
// can't be read the list stays empty and validation fails open (with a log).
const FARM_PLOTS: Array<{ x: number; y: number; width: number; height: number }> = (() => {
    try {
        const mapPath = path.join(process.cwd(), 'public', 'assets', 'maps', 'farm-v2.tmj');
        const rawMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        const layer = (rawMap.layers ?? []).find((l: any) => l.type === 'objectgroup' && l.name === 'Interactables');
        const plots = (layer?.objects ?? [])
            .filter((o: any) => o.type === 'farm_plot' || (o.name && o.name.startsWith('lahan_')))
            .map((o: any) => ({ x: o.x, y: o.y, width: o.width, height: o.height }));
        console.log(`[GameRoom] Loaded ${plots.length} farm plots from map file.`);
        return plots;
    } catch (e) {
        console.error('[GameRoom] Failed to load farm plots from map file — plant location validation disabled:', e);
        return [];
    }
})();

// Same check as MainMap.isFarmablePlot, applied to the center of the tile.
function isFarmableTile(tileX: number, tileY: number): boolean {
    const x = tileX * 16 + 8;
    const y = tileY * 16 + 8;
    return FARM_PLOTS.some(plot =>
        x >= plot.x && x <= plot.x + plot.width &&
        y >= plot.y && y <= plot.y + plot.height
    );
}

// Helper to sync DB player stats to Colyseus schema state
function syncPlayerState(player: PlayerState, user: any) {
    player.walletAddress = user.walletAddress ?? "";
    player.role = user.role ?? "Farmer";
    player.gender = user.gender ?? "Male";
    player.avatarStyle = user.avatarStyle ?? 1;
    player.clothesIndex = user.avatarStyle ?? 1;
    player.gold = user.gold ?? 100;
    player.energy = user.energy ?? 100;
    player.hunger = user.hunger ?? 100;
    player.level = user.level ?? 1;
    player.exp = user.exp ?? 0;
    player.wateringCanLevel = user.wateringCanLevel ?? 1;
    player.wateringCanDurability = user.wateringCanDurability ?? 100;
    player.axeLevel = user.axeLevel ?? 1;
    player.axeDurability = user.axeDurability ?? 100;
    player.fishingRodLevel = user.fishingRodLevel ?? 1;
    player.fishingRodDurability = user.fishingRodDurability ?? 100;

    player.inventory.clear();
    if (Array.isArray(user.inventory)) {
        user.inventory.forEach((item: any) => {
            const itemState = new InventoryItemState();
            itemState.itemType = item.itemType;
            itemState.count = item.count;
            player.inventory.push(itemState);
        });
    }

    player.lastClaimedQuests.clear();
    if (user.lastClaimedQuests) {
        // Stored as a JSON object ({ questId: epochMs }) in Postgres.
        Object.entries(user.lastClaimedQuests).forEach(([key, value]) => {
            player.lastClaimedQuests.set(key, Number(value));
        });
    }

    player.lastDailyChestClaim = Number(user.lastDailyChestClaim ?? 0);

    player.friends.clear();
    if (user.friends) {
        user.friends.forEach((friend: string) => {
            player.friends.push(friend);
        });
    }

    player.friendRequests.clear();
    if (user.friendRequests) {
        user.friendRequests.forEach((req: string) => {
            player.friendRequests.push(req);
        });
    }
}

// Helper to save current Colyseus player state to DB
async function savePlayerToDb(player: PlayerState) {
    if (player.isGuest) return;
    try {
        const where = player.walletAddress
            ? { walletAddress: player.walletAddress }
            : { username: player.username };

        await prisma.user.update({
            where,
            data: {
                gold: player.gold,
                energy: player.energy,
                hunger: player.hunger,
                level: player.level,
                exp: player.exp,
                gender: player.gender as 'Male' | 'Female',
                avatarStyle: player.avatarStyle,
                wateringCanLevel: player.wateringCanLevel,
                wateringCanDurability: player.wateringCanDurability,
                axeLevel: player.axeLevel,
                axeDurability: player.axeDurability,
                fishingRodLevel: player.fishingRodLevel,
                fishingRodDurability: player.fishingRodDurability,
                inventory: player.inventory.map(item => ({
                    itemType: item.itemType,
                    count: item.count
                })),
                lastClaimedQuests: Object.fromEntries(player.lastClaimedQuests),
                lastDailyChestClaim: BigInt(player.lastDailyChestClaim)
            }
        });
    } catch (e) {
        console.error(`Error saving user ${player.username} to DB:`, e);
    }
}

// Write-through crop persistence: crops are written on plant/water and removed
// on harvest/decay so growing plants survive server restarts.
async function saveCropToDb(crop: CropState) {
    try {
        await prisma.crop.upsert({
            where: { id: crop.id },
            create: {
                id: crop.id,
                tileX: crop.tileX,
                tileY: crop.tileY,
                cropType: crop.cropType,
                plantedAt: BigInt(crop.plantedAt),
                readyAt: BigInt(crop.readyAt),
                watered: crop.watered,
                ownerId: crop.ownerId
            },
            update: { watered: crop.watered }
        });
    } catch (e) {
        console.error(`Error saving crop ${crop.id} to DB:`, e);
    }
}

async function deleteCropFromDb(cropId: string) {
    try {
        await prisma.crop.deleteMany({ where: { id: cropId } });
    } catch (e) {
        console.error(`Error deleting crop ${cropId} from DB:`, e);
    }
}

function addToInventory(player: PlayerState, itemType: string, count: number) {
    let item = player.inventory.find(i => i.itemType === itemType);
    if (item) {
        item.count += count;
    } else {
        const newItem = new InventoryItemState();
        newItem.itemType = itemType;
        newItem.count = count;
        player.inventory.push(newItem);
    }
}

function deductFromInventory(player: PlayerState, itemType: string, count: number): boolean {
    let item = player.inventory.find(i => i.itemType === itemType);
    if (item && item.count >= count) {
        item.count -= count;
        // Clean up 0 count items optionally, or just leave it
        return true;
    }
    return false;
}

function gainExp(client: Client, player: PlayerState, amount: number) {
    player.exp += amount;
    let requiredExp = player.level * 100;
    while (player.exp >= requiredExp) {
        if (player.isGuest) {
            player.exp = requiredExp - 1; // Cap EXP at Level 1 max
            client.send('toast', { type: 'warning', message: 'Guest accounts cannot progress past Level 1. Connect a wallet to level up!' });
            break;
        }
        player.level += 1;
        player.exp -= requiredExp;
        client.send('toast', { type: 'success', message: `Level Up! You are now Level ${player.level}!` });
        requiredExp = player.level * 100;
    }
}

export class GameRoom extends Room<{ state: GameState }> {
    private joinTimes = new Map<string, number>();
    private fishingStartTimes = new Map<string, number>();
    private preRolledFishing = new Map<string, { fishType: string, fishName: string, expGained: number, waitTime: number }>();

    async onCreate(options: any) {
        this.setState(new GameState());

        // Restore persisted crops so growing plants survive server restarts.
        // Timestamps are absolute epoch ms, so growth continued while offline;
        // anything past its decay window is purged instead of restored.
        try {
            const savedCrops = await prisma.crop.findMany();
            const now = Date.now();
            const expiredIds: string[] = [];
            for (const saved of savedCrops) {
                if (now >= Number(saved.readyAt) + 120000) {
                    expiredIds.push(saved.id);
                    continue;
                }
                const crop = new CropState();
                crop.id = saved.id;
                crop.tileX = saved.tileX;
                crop.tileY = saved.tileY;
                crop.cropType = saved.cropType;
                crop.plantedAt = Number(saved.plantedAt);
                crop.readyAt = Number(saved.readyAt);
                crop.watered = saved.watered;
                crop.ownerId = saved.ownerId;
                this.state.crops.set(crop.id, crop);
            }
            if (expiredIds.length > 0) {
                await prisma.crop.deleteMany({ where: { id: { in: expiredIds } } });
            }
            console.log(`[GameRoom] Restored ${this.state.crops.size} crops from DB (purged ${expiredIds.length} expired).`);
        } catch (e) {
            console.error('[GameRoom] Failed to restore crops from DB:', e);
        }

        // Initialize the 2 NPCs (Ed and Rey) in the room state so they are always counted as online players
        const edState = new PlayerState();
        edState.id = "npc_ed";
        edState.username = "Guest_19804";
        edState.isGuest = true;
        edState.clothesIndex = 2;
        edState.level = 1;
        edState.gold = 100;
        edState.energy = 100;
        edState.hunger = 100;
        this.state.players.set("npc_ed", edState);

        const reyState = new PlayerState();
        reyState.id = "npc_rey";
        reyState.username = "Guest_28193";
        reyState.isGuest = true;
        reyState.clothesIndex = 3;
        reyState.level = 1;
        reyState.gold = 100;
        reyState.energy = 100;
        reyState.hunger = 100;
        this.state.players.set("npc_rey", reyState);

        let tickCount = 0;
        this.setSimulationInterval(() => {
            tickCount++;
            this.state.players.forEach(async (player: PlayerState) => {
                let changed = false;

                // 1. Passive energy recovery (only if Hunger > 0)
                if (player.hunger > 0 && player.energy < 100) {
                    player.energy = Math.min(100, player.energy + 1);
                    changed = true;
                }

                // 2. Passive hunger drain (decreases by 1 every 30s)
                if (tickCount % 3 === 0 && player.hunger > 0) {
                    player.hunger = Math.max(0, player.hunger - 1);
                    changed = true;
                }

                // Flush passive regen to the DB every 6th tick (~60s) instead of
                // every tick — all gold/item transactions save immediately anyway,
                // so a crash loses at most a minute of passive energy/hunger drift.
                if (changed && tickCount % 6 === 0) {
                    await savePlayerToDb(player);
                }
            });

            // Crop decay logic: remove crops that have been ready for more than 2 minutes
            const now = Date.now();
            this.state.crops.forEach((crop, tileKey) => {
                if (now >= crop.readyAt + 120000) {
                    this.state.crops.delete(tileKey);
                    deleteCropFromDb(tileKey);
                }
            });
        }, 10000);

        // Handle movement updates
        this.onMessage('move', (client: Client, data: { x: number, y: number, direction: string, isMoving: boolean }) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = data.x;
                player.y = data.y;
                player.direction = data.direction;
                player.isMoving = data.isMoving;
            }
        });

        // Buy Seed Pack (Gacha System) - Cost: 20 Gold
        this.onMessage('buySeed', async (client: Client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            if (player.gold < 20) {
                client.send('error', 'Not enough gold!');
                return;
            }

            player.gold -= 20;

            // Roll Gacha
            // Level 3 Upgrade: improves high tier crop rate
            const isLvl3 = player.wateringCanLevel >= 3;
            const roll = Math.random() * 100;
            let seedType = 'seed_rice';

            if (isLvl3) {
                // Higher tier crop rates at level 3
                if (roll < 30) seedType = 'seed_rice';        // 30%
                else if (roll < 74) seedType = 'seed_vegetable'; // 44%
                else if (roll < 97) seedType = 'seed_fruit';     // 23%
                else seedType = 'seed_golden_tree';              // 3%
            } else {
                // Standard GDD rates
                if (roll < 50) seedType = 'seed_rice';        // 50%
                else if (roll < 84) seedType = 'seed_vegetable'; // 34%
                else if (roll < 99) seedType = 'seed_fruit';     // 15%
                else seedType = 'seed_golden_tree';              // 1%
            }

            addToInventory(player, seedType, 1);
            await savePlayerToDb(player);
            client.send('toast', { type: 'success', message: `Got ${seedType.replace('seed_', '')} seed!` });
        });

        // Buy a specific seed directly (no gacha) - cost from crop catalog
        this.onMessage('buySeedSpecific', async (client: Client, data: { cropType: string, count?: number }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            const crop = getCrop(data.cropType);
            if (!crop) {
                client.send('error', 'Invalid seed type!');
                return;
            }

            const rawCount = Number(data.count ?? 1);
            const count = Number.isFinite(rawCount) ? Math.max(1, Math.floor(rawCount)) : 1;
            const totalCost = crop.buyPrice * count;

            if (player.gold < totalCost) {
                client.send('error', 'Not enough gold!');
                return;
            }

            player.gold -= totalCost;
            addToInventory(player, `seed_${crop.id}`, count);
            await savePlayerToDb(player);
            client.send('toast', { type: 'success', message: `Bought ${count}x ${crop.name} seed!` });
        });

        // Plant Seed - requires seed, tile coordinates, and deducts Energy + Durability
        this.onMessage('plantSeed', async (client: Client, data: { tileX: number, tileY: number, seedType: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            if (!Number.isInteger(data.tileX) || !Number.isInteger(data.tileY)) {
                client.send('error', 'Invalid tile!');
                return;
            }

            if (FARM_PLOTS.length > 0 && !isFarmableTile(data.tileX, data.tileY)) {
                client.send('error', 'You can only plant on farm land!');
                return;
            }

            const tileKey = `${data.tileX}_${data.tileY}`;
            if (this.state.crops.has(tileKey)) {
                client.send('error', 'Tile already has a crop!');
                return;
            }

            // Energy & Durability cost depending on crop (from shared catalog)
            const cropDef = getCropBySeed(data.seedType);
            if (!cropDef) {
                client.send('error', 'Invalid seed type!');
                return;
            }

            let energyCost = cropDef.energyCost;
            let growthTime = cropDef.growthTime;
            const cropType = cropDef.id;

            // Apply Level 4 Energy Cost discount (20% reduction)
            if (player.wateringCanLevel >= 4) {
                energyCost = Math.round(energyCost * 0.8);
            }

            // Apply Level 2 Growth Speed discount (10% faster)
            if (player.wateringCanLevel >= 2) {
                growthTime = Math.round(growthTime * 0.9);
            }

            if (player.energy < energyCost) {
                client.send('error', 'Not enough energy!');
                return;
            }

            if (player.wateringCanDurability < 1) {
                client.send('error', 'Watering can is broken! Repair it at Tool Repair.');
                return;
            }

            // Deduct seed
            if (!deductFromInventory(player, data.seedType, 1)) {
                client.send('error', 'No seeds of that type in inventory!');
                return;
            }

            // Deduct stats
            player.energy -= energyCost;
            player.wateringCanDurability -= 1;

            // Create Crop
            const crop = new CropState();
            crop.id = tileKey;
            crop.tileX = data.tileX;
            crop.tileY = data.tileY;
            crop.cropType = cropType;
            crop.plantedAt = Date.now();
            crop.readyAt = Date.now() + growthTime;
            crop.watered = false; // Must be watered to grow/harvest
            crop.ownerId = player.username;

            this.state.crops.set(tileKey, crop);
            await saveCropToDb(crop);
            await savePlayerToDb(player);
        });

        // Water Crop
        this.onMessage('waterCrop', async (client: Client, data: { tileX: number, tileY: number }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            const tileKey = `${data.tileX}_${data.tileY}`;
            const crop = this.state.crops.get(tileKey);
            if (!crop) {
                client.send('error', 'No crop at this tile!');
                return;
            }

            if (crop.watered) {
                client.send('error', 'Crop is already watered!');
                return;
            }

            if (player.wateringCanDurability < 1) {
                client.send('error', 'Watering can is broken!');
                return;
            }

            let energyCost = 1;
            if (player.wateringCanLevel >= 4) {
                energyCost = 0; // level 4 cuts it down, let's say 0 energy for watering
            }

            if (player.energy < energyCost) {
                client.send('error', 'Not enough energy!');
                return;
            }

            player.energy -= energyCost;
            player.wateringCanDurability -= 1;
            crop.watered = true;

            this.broadcast('player-watered', { sessionId: client.sessionId });

            await saveCropToDb(crop);
            await savePlayerToDb(player);
        });

        // Harvest Crop
        this.onMessage('harvestCrop', async (client: Client, data: { tileX: number, tileY: number }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            const tileKey = `${data.tileX}_${data.tileY}`;
            const crop = this.state.crops.get(tileKey);
            if (!crop) {
                client.send('error', 'No crop here!');
                return;
            }

            if (crop.ownerId && crop.ownerId !== player.username) {
                client.send('error', 'Only the player who planted this crop can harvest it!');
                return;
            }

            if (!crop.watered) {
                client.send('error', 'Crop was never watered! It cannot grow without water.');
                return;
            }

            if (Date.now() < crop.readyAt) {
                client.send('error', 'Crop is not ready for harvest yet!');
                return;
            }

            // Remove crop and add to inventory
            this.state.crops.delete(tileKey);
            await deleteCropFromDb(tileKey);
            addToInventory(player, `crop_${crop.cropType}`, 1);
            
            // Add EXP based on crop type (from shared catalog)
            const expGained = getCrop(crop.cropType)?.exp ?? 10;

            gainExp(client, player, expGained);

            await savePlayerToDb(player);
            client.send('toast', { type: 'success', message: `Harvested ${crop.cropType}! (+${expGained} EXP)` });
        });

        // Sell Crops & Fish
        this.onMessage('sellCrop', async (client: Client, data: { cropType: string, count: number }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            const itemType = data.cropType.startsWith('fish_') ? data.cropType : `crop_${data.cropType}`;
            let sellPrice = 0;

            const cropDef = getCrop(data.cropType);
            if (cropDef) sellPrice = cropDef.sellPrice;
            else if (data.cropType === 'fish_common') sellPrice = 25;
            else if (data.cropType === 'fish_uncommon') sellPrice = 60;
            else if (data.cropType === 'fish_rare') sellPrice = 150;
            else {
                client.send('error', 'Invalid item type for sale!');
                return;
            }

            const count = Math.floor(Number(data.count));
            if (!Number.isFinite(count) || count < 1) {
                client.send('error', 'Invalid sell amount!');
                return;
            }

            const totalEarnings = sellPrice * count;
            if (deductFromInventory(player, itemType, count)) {
                player.gold += totalEarnings;
                await savePlayerToDb(player);
                client.send('toast', { type: 'success', message: `Sold items for ${totalEarnings} Gold!` });
            } else {
                client.send('error', 'Not enough items to sell!');
            }
        });

        // Buy Food
        this.onMessage('buyFood', async (client: Client, data: { foodType: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            let price = 0;
            if (data.foodType === 'food_bread') price = 10;
            else if (data.foodType === 'food_rice_bowl') price = 25;
            else {
                client.send('error', 'Invalid food item!');
                return;
            }

            if (player.gold < price) {
                client.send('error', 'Not enough gold!');
                return;
            }

            player.gold -= price;
            addToInventory(player, data.foodType, 1);
            await savePlayerToDb(player);
        });

        // Buy Fishing Rod
        this.onMessage('buyFishingRod', async (client: Client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            const price = 5000;
            if (player.gold < price) {
                client.send('error', 'Not enough gold to buy a Fishing Rod!');
                return;
            }

            const hasRod = player.inventory.find(i => i.itemType === 'fishing_rod' && i.count > 0);
            if (hasRod) {
                client.send('error', 'You already own a Fishing Rod!');
                return;
            }

            player.gold -= price;
            addToInventory(player, 'fishing_rod', 1);

            // Set default rod properties
            player.fishingRodLevel = 1;
            player.fishingRodDurability = 100;

            await savePlayerToDb(player);
            client.send('toast', { type: 'success', message: 'Purchased Fishing Rod!' });
        });

        // Eat Food
        this.onMessage('eatFood', async (client: Client, data: { foodType: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            if (deductFromInventory(player, data.foodType, 1)) {
                if (data.foodType === 'food_bread') {
                    player.energy = Math.min(100, player.energy + 10);
                    player.hunger = Math.min(100, player.hunger + 20);
                } else if (data.foodType === 'food_rice_bowl') {
                    player.energy = Math.min(100, player.energy + 30);
                    player.hunger = Math.min(100, player.hunger + 50);
                }
                await savePlayerToDb(player);
                client.send('toast', { type: 'success', message: `Ate food. Energy/Hunger restored!` });
            } else {
                client.send('error', 'You do not have that food!');
            }
        });

        // Sleep House (Apartment) - Cost: 40 Gold
        this.onMessage('sleep', async (client: Client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            if (player.isSleeping) {
                client.send('error', 'You are already sleeping!');
                return;
            }

            if (player.gold < 40) {
                client.send('error', 'Need 40 Gold to sleep!');
                return;
            }

            player.gold -= 40;
            player.isSleeping = true;
            await savePlayerToDb(player);
            client.send('toast', { type: 'success', message: 'Going to sleep. Energy will restore in 30 seconds...' });

            this.clock.setTimeout(async () => {
                const currentPlayer = this.state.players.get(client.sessionId);
                if (currentPlayer) {
                    currentPlayer.isSleeping = false;
                    currentPlayer.energy = 100; // Full restore
                    await savePlayerToDb(currentPlayer);
                    client.send('toast', { type: 'success', message: 'Rested! Energy fully restored.' });
                } else {
                    // Fallback: If user disconnected during sleep, update energy in DB directly
                    try {
                        const where = player.walletAddress
                            ? { walletAddress: player.walletAddress }
                            : { username: player.username };
                        await prisma.user.update({ where, data: { energy: 100 } });
                        console.log(`[Sleep Offline Complete] Updated disconnected player ${player.username} energy to 100 in DB.`);
                    } catch (err) {
                        console.error('Failed to update sleeping disconnected user energy in DB:', err);
                    }
                }
            }, 30000);
        });

        // Repair Tool (Watering Can or Fishing Rod)
        this.onMessage('repairTool', async (client: Client, data: { option: 'dur_25' | 'dur_50' | 'dur_full', toolType?: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            let cost = 0;
            let repairAmount = 0;

            if (data.option === 'dur_25') {
                cost = 15;
                repairAmount = 25;
            } else if (data.option === 'dur_50') {
                cost = 25;
                repairAmount = 50;
            } else if (data.option === 'dur_full') {
                cost = 40;
                repairAmount = 100;
            } else {
                client.send('error', 'Invalid repair option!');
                return;
            }

            const target = data.toolType || 'watering_can';
            const currentDurability = target === 'fishing_rod' ? player.fishingRodDurability : player.wateringCanDurability;
            if (currentDurability >= 100) {
                client.send('error', 'Tool durability is already full!');
                return;
            }

            if (player.gold < cost) {
                client.send('error', 'Not enough gold!');
                return;
            }

            player.gold -= cost;
            if (target === 'fishing_rod') {
                player.fishingRodDurability = Math.min(100, player.fishingRodDurability + repairAmount);
                client.send('toast', { type: 'success', message: 'Fishing Rod repaired!' });
            } else {
                player.wateringCanDurability = Math.min(100, player.wateringCanDurability + repairAmount);
                client.send('toast', { type: 'success', message: 'Watering Can repaired!' });
            }
            await savePlayerToDb(player);
        });

        // Upgrade Tool (Watering Can or Fishing Rod)
        this.onMessage('upgradeTool', async (client: Client, data?: { toolType?: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            const toolType = data?.toolType || 'watering_can';

            if (toolType === 'fishing_rod') {
                const nextLvl = player.fishingRodLevel + 1;
                let cost = 0;
                if (nextLvl === 2) cost = 500;
                else {
                    client.send('error', 'Fishing Rod already at maximum level!');
                    return;
                }

                if (player.gold < cost) {
                    client.send('error', 'Not enough gold to upgrade!');
                    return;
                }

                player.gold -= cost;
                player.fishingRodLevel = nextLvl;
                player.fishingRodDurability = 100; // Reset durability
                await savePlayerToDb(player);
                client.send('toast', { type: 'success', message: `Fishing Rod upgraded to Level ${nextLvl}!` });
            } else {
                const nextLvl = player.wateringCanLevel + 1;
                let cost = 0;

                if (nextLvl === 2) cost = 300;
                else if (nextLvl === 3) cost = 700;
                else if (nextLvl === 4) cost = 1500;
                else {
                    client.send('error', 'Tool already at maximum level!');
                    return;
                }

                if (player.gold < cost) {
                    client.send('error', 'Not enough gold to upgrade!');
                    return;
                }

                player.gold -= cost;
                player.wateringCanLevel = nextLvl;
                await savePlayerToDb(player);
                client.send('toast', { type: 'success', message: `Watering Can upgraded to Level ${nextLvl}!` });
            }
        });

        // Start Fishing
        this.onMessage('startFishing', (client: Client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            // Check if player has a fishing rod in inventory
            const hasRod = player.inventory.find(i => i.itemType === 'fishing_rod' && i.count > 0);
            if (!hasRod) {
                client.send('error', 'You need a Fishing Rod to fish!');
                return;
            }

            // Check durability
            if (player.fishingRodDurability <= 0) {
                client.send('error', 'Your Fishing Rod is broken! Repair it at the blacksmith.');
                return;
            }

            // Pre-roll caught fish type based on rod level
            const roll = Math.random() * 100;
            let fishType = 'fish_common';
            let fishName = 'Common Fish';
            let expGained = 15;
            let waitTime = 5000; // default 5s for common

            if (player.fishingRodLevel >= 2) {
                if (roll < 40) {
                    fishType = 'fish_common';
                    fishName = 'Common Fish';
                    expGained = 15;
                    waitTime = 5000;
                } else if (roll < 80) {
                    fishType = 'fish_uncommon';
                    fishName = 'Uncommon Fish';
                    expGained = 35;
                    waitTime = 10000; // unique/rare
                } else {
                    fishType = 'fish_rare';
                    fishName = 'Rare Fish';
                    expGained = 75;
                    waitTime = 10000; // unique/rare
                }
            } else {
                if (roll < 70) {
                    fishType = 'fish_common';
                    fishName = 'Common Fish';
                    expGained = 15;
                    waitTime = 5000;
                } else if (roll < 95) {
                    fishType = 'fish_uncommon';
                    fishName = 'Uncommon Fish';
                    expGained = 35;
                    waitTime = 10000;
                } else {
                    fishType = 'fish_rare';
                    fishName = 'Rare Fish';
                    expGained = 75;
                    waitTime = 10000;
                }
            }

            // Save start time and pre-roll info
            this.fishingStartTimes.set(client.sessionId, Date.now());
            this.preRolledFishing.set(client.sessionId, { fishType, fishName, expGained, waitTime });

            this.broadcast('player-start-fishing', { sessionId: client.sessionId });

            // Send waitTime back to client
            client.send('fishing-wait-time', { waitTime });
        });

        // Stop/Cancel Fishing
        this.onMessage('stopFishing', (client: Client) => {
            this.fishingStartTimes.delete(client.sessionId);
            this.preRolledFishing.delete(client.sessionId);
            this.broadcast('player-stop-fishing', { sessionId: client.sessionId });
        });

        // Catch Fish
        this.onMessage('catchFish', async (client: Client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            const startTime = this.fishingStartTimes.get(client.sessionId);
            const preRolled = this.preRolledFishing.get(client.sessionId);
            if (!startTime || !preRolled) {
                client.send('error', 'You are not fishing!');
                return;
            }

            const elapsed = Date.now() - startTime;
            this.fishingStartTimes.delete(client.sessionId);
            this.preRolledFishing.delete(client.sessionId);

            // Anticheat check: allow 200ms latency buffer
            if (elapsed < preRolled.waitTime - 200) {
                client.send('error', 'Too early! The fish got away.');
                return;
            }

            // Validate rod and durability
            const hasRod = player.inventory.find(i => i.itemType === 'fishing_rod' && i.count > 0);
            if (!hasRod || player.fishingRodDurability <= 0) {
                client.send('error', 'Invalid fishing rod state.');
                return;
            }

            // Deduct durability by 1 per catch
            player.fishingRodDurability = Math.max(0, player.fishingRodDurability - 1);

            // Add fish to inventory
            addToInventory(player, preRolled.fishType, 1);
            gainExp(client, player, preRolled.expGained);

            // Broadcast catch to other players
            this.broadcast('player-catch-fish', { sessionId: client.sessionId });

            await savePlayerToDb(player);

            client.send('toast', { 
                type: 'success', 
                message: `Caught a ${preRolled.fishName}! (+${preRolled.expGained} EXP)` 
            });

            if (player.fishingRodDurability <= 0) {
                client.send('toast', {
                    type: 'error',
                    message: 'Your Fishing Rod broke! Repair it at the Blacksmith.'
                });
            }
        });

        // Handle chat messages
        this.onMessage('chat', (client: Client, data: { text: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                this.broadcast('chat-message', {
                    senderId: client.sessionId,
                    username: player.username,
                    text: data.text,
                    timestamp: Date.now()
                });
            }
        });

        // Claim Quest
        this.onMessage('claimQuest', async (client: Client, data: { questId: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            const now = Date.now();
            const lastClaimed = player.lastClaimedQuests.get(data.questId) || 0;
            const ONE_DAY = 24 * 60 * 60 * 1000;

            if (now - lastClaimed < ONE_DAY) {
                client.send('error', 'Quest already claimed today. Try again tomorrow!');
                return;
            }

            let expReward = 0;
            if (data.questId === 'rice') expReward = 50;
            else if (data.questId === 'vegy') expReward = 100;
            else if (data.questId === 'apple') expReward = 200;
            else if (data.questId === 'gold') expReward = 150;
            else if (data.questId === 'fish') expReward = 150;
            else {
                client.send('error', 'Invalid quest!');
                return;
            }

            // Verify quest requirements server-side (mirrors HUD getQuestStatus)
            const hasItem = (itemType: string) =>
                (player.inventory.find(i => i.itemType === itemType)?.count ?? 0) >= 1;
            let requirementMet = false;
            if (data.questId === 'rice') requirementMet = hasItem('crop_rice');
            else if (data.questId === 'vegy') requirementMet = hasItem('crop_vegetable');
            else if (data.questId === 'apple') requirementMet = hasItem('crop_fruit');
            else if (data.questId === 'gold') requirementMet = player.gold >= 500;
            else if (data.questId === 'fish') requirementMet = hasItem('fish_common') || hasItem('fish_uncommon') || hasItem('fish_rare');

            if (!requirementMet) {
                client.send('error', 'Quest requirements not met yet!');
                return;
            }

            player.lastClaimedQuests.set(data.questId, now);
            gainExp(client, player, expReward);

            await savePlayerToDb(player);
            client.send('toast', { type: 'success', message: `Quest Claimed! +${expReward} EXP` });
        });

        // Claim Daily Treasure Chest
        this.onMessage('claimChest', async (client: Client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            try {
                const now = Date.now();
                const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

                if (player.isGuest) {
                    const timePassed = now - (player.lastDailyChestClaim || 0);
                    if (timePassed < COOLDOWN) {
                        const timeLeft = COOLDOWN - timePassed;
                        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                        
                        let timeString = hours > 0 ? `${hours} hours and ${minutes} minutes` : `${minutes} minutes`;
                        client.send('toast', { 
                            type: 'warning', 
                            message: `Chest is empty! Next claim in ${timeString}.` 
                        });
                        return;
                    }

                    const goldGained = Math.floor(Math.random() * 101) + 100;
                    player.gold += goldGained;
                    player.lastDailyChestClaim = now;

                    client.send('toast', { 
                        type: 'success', 
                        message: `You opened the chest and found ${goldGained} Gold!` 
                    });
                    return;
                }

                const where = player.walletAddress
                    ? { walletAddress: player.walletAddress }
                    : { username: player.username };

                const user = await prisma.user.findUnique({ where });
                if (!user) {
                    client.send('error', 'User not found in database!');
                    return;
                }

                const timePassed = now - Number(user.lastDailyChestClaim || 0);

                if (timePassed < COOLDOWN) {
                    const timeLeft = COOLDOWN - timePassed;
                    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                    
                    let timeString = '';
                    if (hours > 0) {
                        timeString = `${hours} hours and ${minutes} minutes`;
                    } else {
                        timeString = `${minutes} minutes`;
                    }
                    
                    client.send('toast', { 
                        type: 'warning', 
                        message: `Chest is empty! Next claim in ${timeString}.` 
                    });
                    return;
                }

                // Award 100-200 gold
                const goldGained = Math.floor(Math.random() * 101) + 100;
                player.gold += goldGained;
                player.lastDailyChestClaim = now;

                await prisma.user.update({
                    where,
                    data: {
                        lastDailyChestClaim: BigInt(now),
                        gold: player.gold // Keep in sync
                    }
                });

                client.send('toast', { 
                    type: 'success', 
                    message: `You opened the chest and found ${goldGained} Gold!` 
                });
            } catch (e) {
                console.error(`Error claiming chest for ${player.username}:`, e);
                client.send('error', 'Failed to claim chest rewards.');
            }
        });

        // Get Playtime Ranking Leaderboard
        this.onMessage('getPlaytimeRanking', async (client: Client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            try {
                // Find top 10 users by totalPlaytime (descending)
                const topUsers = await prisma.user.findMany({
                    orderBy: { totalPlaytime: 'desc' },
                    take: 10,
                    select: { username: true, totalPlaytime: true, walletAddress: true }
                });

                const data = topUsers.map((u, index) => ({
                    rank: index + 1,
                    username: u.username || 'Unknown',
                    walletAddress: u.walletAddress || '',
                    totalPlaytime: u.totalPlaytime || 0
                }));

                client.send('playtimeRankingData', data);
            } catch (e) {
                console.error('Error fetching playtime ranking:', e);
                client.send('error', 'Failed to load ranking leaderboard.');
            }
        });

        // Send Friend Request
        this.onMessage('sendFriendRequest', async (client: Client, data: { targetUsername: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            if (player.isGuest) {
                client.send('toast', { type: 'error', message: 'Guest accounts cannot use the Friend system.' });
                return;
            }

            const targetUsername = data.targetUsername?.trim();
            if (!targetUsername) {
                client.send('toast', { type: 'error', message: 'Invalid username.' });
                return;
            }

            if (targetUsername.toLowerCase() === player.username.toLowerCase()) {
                client.send('toast', { type: 'error', message: 'You cannot add yourself as a friend.' });
                return;
            }

            try {
                const targetUser = await prisma.user.findFirst({ where: { username: { equals: targetUsername, mode: 'insensitive' } } });
                if (!targetUser) {
                    client.send('toast', { type: 'error', message: `Player "${targetUsername}" not found.` });
                    return;
                }

                const resolvedTargetUsername = targetUser.username;

                if (player.friends.includes(resolvedTargetUsername)) {
                    client.send('toast', { type: 'warning', message: `You are already friends with ${resolvedTargetUsername}.` });
                    return;
                }

                if (targetUser.friendRequests.includes(player.username)) {
                    client.send('toast', { type: 'warning', message: `Friend request already sent to ${resolvedTargetUsername}.` });
                    return;
                }

                if (player.friendRequests.includes(resolvedTargetUsername)) {
                    client.send('toast', { type: 'info', message: `${resolvedTargetUsername} has already sent you a friend request. Accept it instead!` });
                    return;
                }

                await prisma.user.update({
                    where: { username: resolvedTargetUsername },
                    data: { friendRequests: [...targetUser.friendRequests, player.username] }
                });

                // Find online player state in this room
                let targetOnlinePlayer: PlayerState | undefined;
                let targetOnlineClient: Client | undefined;
                for (const [sid, p] of this.state.players.entries()) {
                    if (p.username === resolvedTargetUsername) {
                        targetOnlinePlayer = p;
                        targetOnlineClient = this.clients.find(c => c.sessionId === sid);
                        break;
                    }
                }

                if (targetOnlinePlayer && targetOnlineClient) {
                    targetOnlinePlayer.friendRequests.push(player.username);
                    targetOnlineClient.send('toast', { type: 'info', message: `You received a friend request from ${player.username}!` });
                }

                client.send('toast', { type: 'success', message: `Friend request sent to ${resolvedTargetUsername}!` });
            } catch (e) {
                console.error('Error sending friend request:', e);
                client.send('toast', { type: 'error', message: 'Failed to send friend request.' });
            }
        });

        // Accept Friend Request
        this.onMessage('acceptFriendRequest', async (client: Client, data: { requesterUsername: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            if (player.isGuest) {
                client.send('toast', { type: 'error', message: 'Guest accounts cannot use the Friend system.' });
                return;
            }

            const requesterUsername = data.requesterUsername?.trim();
            if (!requesterUsername) return;

            try {
                const currentUserQuery = player.walletAddress
                    ? { walletAddress: player.walletAddress }
                    : { username: player.username };
                const currentUser = await prisma.user.findUnique({ where: currentUserQuery });
                if (!currentUser) {
                    client.send('toast', { type: 'error', message: 'Your account was not found.' });
                    return;
                }

                const requesterUser = await prisma.user.findFirst({ where: { username: { equals: requesterUsername, mode: 'insensitive' } } });
                if (!requesterUser) {
                    client.send('toast', { type: 'error', message: `Player "${requesterUsername}" not found.` });
                    return;
                }

                const resolvedRequesterUsername = requesterUser.username;

                const currentFriendRequests = currentUser.friendRequests.filter((name: string) => name !== resolvedRequesterUsername);
                const currentFriends = currentUser.friends.includes(resolvedRequesterUsername)
                    ? currentUser.friends
                    : [...currentUser.friends, resolvedRequesterUsername];
                await prisma.user.update({
                    where: currentUserQuery,
                    data: { friendRequests: currentFriendRequests, friends: currentFriends }
                });

                const requesterFriends = requesterUser.friends.includes(player.username)
                    ? requesterUser.friends
                    : [...requesterUser.friends, player.username];
                const requesterFriendRequests = requesterUser.friendRequests.filter((name: string) => name !== player.username);
                await prisma.user.update({
                    where: { username: resolvedRequesterUsername },
                    data: { friends: requesterFriends, friendRequests: requesterFriendRequests }
                });

                // Update current player state in room
                const reqIndex = player.friendRequests.indexOf(resolvedRequesterUsername);
                if (reqIndex !== -1) player.friendRequests.splice(reqIndex, 1);
                if (!player.friends.includes(resolvedRequesterUsername)) {
                    player.friends.push(resolvedRequesterUsername);
                }

                // Check if requester is online in room
                let requesterOnlinePlayer: PlayerState | undefined;
                let requesterOnlineClient: Client | undefined;
                for (const [sid, p] of this.state.players.entries()) {
                    if (p.username === resolvedRequesterUsername) {
                        requesterOnlinePlayer = p;
                        requesterOnlineClient = this.clients.find(c => c.sessionId === sid);
                        break;
                    }
                }

                if (requesterOnlinePlayer && requesterOnlineClient) {
                    if (!requesterOnlinePlayer.friends.includes(player.username)) {
                        requesterOnlinePlayer.friends.push(player.username);
                    }
                    const selfIndex = requesterOnlinePlayer.friendRequests.indexOf(player.username);
                    if (selfIndex !== -1) requesterOnlinePlayer.friendRequests.splice(selfIndex, 1);

                    requesterOnlineClient.send('toast', { type: 'success', message: `${player.username} accepted your friend request!` });
                }

                client.send('toast', { type: 'success', message: `You are now friends with ${resolvedRequesterUsername}!` });
            } catch (e) {
                console.error('Error accepting friend request:', e);
                client.send('toast', { type: 'error', message: 'Failed to accept friend request.' });
            }
        });

        // Reject Friend Request
        this.onMessage('rejectFriendRequest', async (client: Client, data: { requesterUsername: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            if (player.isGuest) {
                client.send('toast', { type: 'error', message: 'Guest accounts cannot use the Friend system.' });
                return;
            }

            const requesterUsername = data.requesterUsername?.trim();
            if (!requesterUsername) return;

            try {
                const currentUserQuery = player.walletAddress
                    ? { walletAddress: player.walletAddress }
                    : { username: player.username };
                const currentUser = await prisma.user.findUnique({ where: currentUserQuery });
                if (!currentUser) {
                    client.send('toast', { type: 'error', message: 'Your account was not found.' });
                    return;
                }

                await prisma.user.update({
                    where: currentUserQuery,
                    data: { friendRequests: currentUser.friendRequests.filter((name: string) => name !== requesterUsername) }
                });

                const reqIndex = player.friendRequests.indexOf(requesterUsername);
                if (reqIndex !== -1) player.friendRequests.splice(reqIndex, 1);

                client.send('toast', { type: 'info', message: `Rejected friend request from ${requesterUsername}.` });
            } catch (e) {
                console.error('Error rejecting friend request:', e);
                client.send('toast', { type: 'error', message: 'Failed to reject friend request.' });
            }
        });

        // Send Private Chat Message
        this.onMessage('sendPrivateChat', async (client: Client, data: { targetUsername: string; text: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            if (player.isGuest) {
                client.send('toast', { type: 'error', message: 'Guest accounts cannot send private messages.' });
                return;
            }

            const targetUsername = data.targetUsername?.trim();
            const text = data.text?.trim();

            if (!targetUsername || !text) {
                client.send('toast', { type: 'error', message: 'Invalid message or recipient.' });
                return;
            }

            // Check if they are friends in the player state
            if (!player.friends.includes(targetUsername)) {
                client.send('toast', { type: 'error', message: 'You can only message players who are on your friends list.' });
                return;
            }

            try {
                // Save private chat message to Postgres
                await prisma.message.create({
                    data: {
                        sender: player.username,
                        receiver: targetUsername,
                        text: text,
                        timestamp: new Date()
                    }
                });

                // Find the target friend's client connection in the room if online
                let targetOnlineClient: Client | undefined;
                for (const [sid, p] of this.state.players.entries()) {
                    if (p.username === targetUsername) {
                        targetOnlineClient = this.clients.find(c => c.sessionId === sid);
                        break;
                    }
                }

                if (targetOnlineClient) {
                    // Instantly push the message to the online friend
                    targetOnlineClient.send('private-chat-received', {
                        sender: player.username,
                        text: text,
                        timestamp: Date.now()
                    });
                }
                
                // Send confirmation/echo back to the sender
                client.send('private-chat-sent-confirm', {
                    receiver: targetUsername,
                    text: text,
                    timestamp: Date.now()
                });
            } catch (e) {
                console.error('Error sending private message:', e);
                client.send('toast', { type: 'error', message: 'Failed to send private message.' });
            }
        });
    }

    async onJoin(client: Client, options: { username: string; walletAddress?: string; isGuest?: boolean }) {
        console.log(`${client.sessionId} joined!`);
        this.joinTimes.set(client.sessionId, Date.now());

        const username = options.username || `Player_${client.sessionId.substring(0, 5)}`;
        
        const player = new PlayerState();
        player.id = client.sessionId;
        player.username = username;
        player.x = 240; // Default spawn coordinates
        player.y = 240;

        if (options.isGuest) {
            player.isGuest = true;
            player.clothesIndex = 1;
            player.gold = 100;
            player.energy = 100;
            player.hunger = 100;
            player.level = 1;
            player.exp = 0;
            player.wateringCanLevel = 1;
            player.wateringCanDurability = 100;
            player.axeLevel = 1;
            player.axeDurability = 100;
            player.fishingRodLevel = 1;
            player.fishingRodDurability = 100;

            // Set default guest starting inventory
            addToInventory(player, 'seed_rice', 5);
            addToInventory(player, 'seed_vegetable', 3);
            addToInventory(player, 'seed_fruit', 2);
            addToInventory(player, 'food_bread', 1);
            addToInventory(player, 'fishing_rod', 1);
        } else {
            let dbUser;
            try {
                // Find user in Postgres, create if not found
                if (options.walletAddress) {
                    dbUser = await prisma.user.findUnique({ where: { walletAddress: options.walletAddress } });
                } else {
                    dbUser = await prisma.user.findUnique({ where: { username } });
                }

                if (!dbUser) {
                    const userFields: any = {
                        username,
                        avatarStyle: 1,
                        inventory: [
                            { itemType: 'seed_rice', count: 5 },
                            { itemType: 'seed_vegetable', count: 3 },
                            { itemType: 'seed_fruit', count: 2 },
                            { itemType: 'food_bread', count: 1 }
                        ]
                    };
                    if (options.walletAddress) {
                        userFields.walletAddress = options.walletAddress;
                    }
                    dbUser = await prisma.user.create({ data: userFields });
                }
            } catch (e) {
                console.error('Error fetching user from database on join:', e);
            }

            player.clothesIndex = dbUser?.avatarStyle ?? 1;
            if (dbUser) {
                syncPlayerState(player, dbUser);
            }
        }

        this.state.players.set(client.sessionId, player);
    }

    async onLeave(client: Client, code?: number) {
        console.log(`${client.sessionId} left!`);
        const player = this.state.players.get(client.sessionId);
        const joinTime = this.joinTimes.get(client.sessionId);
        this.joinTimes.delete(client.sessionId);
        this.fishingStartTimes.delete(client.sessionId);
        this.preRolledFishing.delete(client.sessionId);
        if (player) {
            if (joinTime && !player.isGuest) {
                const playSessionSeconds = Math.floor((Date.now() - joinTime) / 1000);
                try {
                    const where = player.walletAddress
                        ? { walletAddress: player.walletAddress }
                        : { username: player.username };
                    await prisma.user.update({
                        where,
                        data: { totalPlaytime: { increment: playSessionSeconds } }
                    });
                } catch (e) {
                    console.error(`Error updating playtime for ${player.username}:`, e);
                }
            }
            await savePlayerToDb(player);
        }
        this.state.players.delete(client.sessionId);
    }

    onDispose() {
        console.log('Room disposed');
    }
}
