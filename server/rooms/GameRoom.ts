import { Room, Client } from '@colyseus/core';
import { GameState, PlayerState, InventoryItemState, CropState } from './schema/GameState';
import User from '../db/models/User';

// Helper to sync DB player stats to Colyseus schema state
function syncPlayerState(player: PlayerState, user: any) {
    player.walletAddress = user.walletAddress ?? "";
    player.role = user.role ?? "Farmer";
    player.gender = user.gender ?? "Male";
    player.avatarStyle = user.avatarStyle ?? 1;
    player.clothesIndex = user.clothesIndex ?? user.avatarStyle ?? 1;
    player.gold = user.gold ?? 100;
    player.energy = user.energy ?? 100;
    player.hunger = user.hunger ?? 100;
    player.level = user.level ?? 1;
    player.exp = user.exp ?? 0;
    player.wateringCanLevel = user.wateringCan?.level ?? 1;
    player.wateringCanDurability = user.wateringCan?.durability ?? 100;
    player.axeLevel = user.axe?.level ?? 1;
    player.axeDurability = user.axe?.durability ?? 100;
    player.fishingRodLevel = user.fishingRod?.level ?? 1;
    player.fishingRodDurability = user.fishingRod?.durability ?? 100;

    player.inventory.clear();
    if (user.inventory) {
        user.inventory.forEach((item: any) => {
            const itemState = new InventoryItemState();
            itemState.itemType = item.itemType;
            itemState.count = item.count;
            player.inventory.push(itemState);
        });
    }

    player.lastClaimedQuests.clear();
    if (user.lastClaimedQuests) {
        user.lastClaimedQuests.forEach((value: number, key: string) => {
            player.lastClaimedQuests.set(key, value);
        });
    }

    player.lastDailyChestClaim = user.lastDailyChestClaim ?? 0;
}

// Helper to save current Colyseus player state to DB
async function savePlayerToDb(player: PlayerState) {
    if (player.isGuest) return;
    try {
        const query = player.walletAddress 
            ? { walletAddress: player.walletAddress } 
            : { username: player.username };

        await User.updateOne(query, {
            gold: player.gold,
            offChainCoins: player.gold,
            off_chain_coins: player.gold,
            energy: player.energy,
            currentEnergy: player.energy,
            current_energy: player.energy,
            hunger: player.hunger,
            level: player.level,
            exp: player.exp,
            gender: player.gender,
            avatarStyle: player.avatarStyle,
            avatar_style: player.avatarStyle,
            clothesIndex: player.avatarStyle,
            wateringCan: {
                level: player.wateringCanLevel,
                durability: player.wateringCanDurability
            },
            axe: {
                level: player.axeLevel,
                durability: player.axeDurability
            },
            fishingRod: {
                level: player.fishingRodLevel,
                durability: player.fishingRodDurability
            },
            inventory: player.inventory.map(item => ({
                itemType: item.itemType,
                count: item.count
            })),
            lastClaimedQuests: Object.fromEntries(player.lastClaimedQuests),
            lastDailyChestClaim: player.lastDailyChestClaim
        });
    } catch (e) {
        console.error(`Error saving user ${player.username} to DB:`, e);
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
    if (player.exp >= requiredExp) {
        if (player.isGuest) {
            player.exp = requiredExp - 1; // Cap EXP at Level 1 max
            client.send('toast', { type: 'warning', message: 'Guest accounts cannot progress past Level 1. Connect a wallet to level up!' });
        } else {
            player.level += 1;
            player.exp -= requiredExp;
            client.send('toast', { type: 'success', message: `Level Up! You are now Level ${player.level}!` });
        }
    }
}

export class GameRoom extends Room<{ state: GameState }> {
    private joinTimes = new Map<string, number>();
    private fishingStartTimes = new Map<string, number>();
    private preRolledFishing = new Map<string, { fishType: string, fishName: string, expGained: number, waitTime: number }>();

    onCreate(options: any) {
        this.setState(new GameState());

        // Initialize the 2 NPCs (Ed and Rey) in the room state so they are always counted as online players
        const edState = new PlayerState();
        edState.id = "npc_ed";
        edState.username = "Guest_Ed";
        edState.isGuest = true;
        edState.clothesIndex = 2;
        edState.level = 1;
        edState.gold = 100;
        edState.energy = 100;
        edState.hunger = 100;
        this.state.players.set("npc_ed", edState);

        const reyState = new PlayerState();
        reyState.id = "npc_rey";
        reyState.username = "Guest_Rey";
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

                // Save to database if changed
                if (changed) {
                    await savePlayerToDb(player);
                }
            });

            // Crop decay logic: remove crops that have been ready for more than 2 minutes
            const now = Date.now();
            this.state.crops.forEach((crop, tileKey) => {
                if (now >= crop.readyAt + 120000) {
                    this.state.crops.delete(tileKey);
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

        // Plant Seed - requires seed, tile coordinates, and deducts Energy + Durability
        this.onMessage('plantSeed', async (client: Client, data: { tileX: number, tileY: number, seedType: string }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            const tileKey = `${data.tileX}_${data.tileY}`;
            if (this.state.crops.has(tileKey)) {
                client.send('error', 'Tile already has a crop!');
                return;
            }

            // Energy & Durability cost depending on crop
            let energyCost = 2;
            let growthTime = 10000; // default rice 10s
            let cropType = 'rice';

            if (data.seedType === 'seed_rice') {
                energyCost = 2;
                growthTime = 10000;
                cropType = 'rice';
            } else if (data.seedType === 'seed_vegetable') {
                energyCost = 8;
                growthTime = 60000; // 60s
                cropType = 'vegetable';
            } else if (data.seedType === 'seed_fruit') {
                energyCost = 15;
                growthTime = 90000; // 90s
                cropType = 'fruit';
            } else if (data.seedType === 'seed_golden_tree') {
                energyCost = 20;
                growthTime = 120000; // 120s
                cropType = 'golden_tree';
            } else {
                client.send('error', 'Invalid seed type!');
                return;
            }

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
            addToInventory(player, `crop_${crop.cropType}`, 1);
            
            // Add EXP based on crop type
            let expGained = 10;
            if (crop.cropType === 'rice') expGained = 10;
            else if (crop.cropType === 'vegetable') expGained = 25;
            else if (crop.cropType === 'fruit') expGained = 50;
            else if (crop.cropType === 'golden_tree') expGained = 100;
            
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

            if (data.cropType === 'rice') sellPrice = 2;
            else if (data.cropType === 'vegetable') sellPrice = 50;
            else if (data.cropType === 'fruit') sellPrice = 100;
            else if (data.cropType === 'golden_tree') sellPrice = 200;
            else if (data.cropType === 'fish_common') sellPrice = 25;
            else if (data.cropType === 'fish_uncommon') sellPrice = 60;
            else if (data.cropType === 'fish_rare') sellPrice = 150;
            else {
                client.send('error', 'Invalid item type for sale!');
                return;
            }

            const totalEarnings = sellPrice * data.count;
            if (deductFromInventory(player, itemType, data.count)) {
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
                        const query = player.walletAddress 
                            ? { walletAddress: player.walletAddress } 
                            : { username: player.username };
                        await User.updateOne(query, { energy: 100 });
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

            if (player.gold < cost) {
                client.send('error', 'Not enough gold!');
                return;
            }

            player.gold -= cost;
            const target = data.toolType || 'watering_can';
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

                const query = player.walletAddress 
                    ? { walletAddress: player.walletAddress } 
                    : { username: player.username };
                
                const user = await User.findOne(query);
                if (!user) {
                    client.send('error', 'User not found in database!');
                    return;
                }

                const timePassed = now - (user.lastDailyChestClaim || 0);

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
                
                user.lastDailyChestClaim = now;
                user.gold = player.gold; // Keep in sync
                await user.save();

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
                const topUsers = await User.find({})
                    .sort({ totalPlaytime: -1 })
                    .limit(10)
                    .select('username totalPlaytime walletAddress');

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
                // Find user in MongoDB, create if not found
                if (options.walletAddress) {
                    dbUser = await User.findOne({ walletAddress: options.walletAddress });
                } else {
                    dbUser = await User.findOne({ username });
                }

                if (!dbUser) {
                    const userFields: any = { 
                        username, 
                        clothesIndex: 1,
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
                    dbUser = await User.create(userFields);
                }
            } catch (e) {
                console.error('Error fetching user from database on join:', e);
            }

            player.clothesIndex = dbUser?.clothesIndex ?? 1;
            if (dbUser) {
                syncPlayerState(player, dbUser);
            }
        }

        this.state.players.set(client.sessionId, player);
    }

    async onLeave(client: Client, code?: number) {
        console.log(`${client.sessionId} left!`);
        const player = this.state.players.get(client.sessionId);
        if (player) {
            const joinTime = this.joinTimes.get(client.sessionId);
            if (joinTime && !player.isGuest) {
                const playSessionSeconds = Math.floor((Date.now() - joinTime) / 1000);
                this.joinTimes.delete(client.sessionId);
                try {
                    const query = player.walletAddress 
                        ? { walletAddress: player.walletAddress } 
                        : { username: player.username };
                    await User.updateOne(query, {
                        $inc: { totalPlaytime: playSessionSeconds }
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
