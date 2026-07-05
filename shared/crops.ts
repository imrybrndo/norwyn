// Central crop / seed catalog — single source of truth shared by the
// authoritative Colyseus server (server/) and the client (src/).
//
// Keep this a PURE DATA module (no node / phaser / react imports) so it can be
// bundled by Next.js on the client and executed by tsx on the server.
//
// Each crop maps 1:1 to:
//   - a seed inventory item:    `seed_${id}`
//   - a harvested crop item:    `crop_${id}`
//   - a sprite set in /public/assets/Elements/Crops/${sprite}_00..05.png
//
// The original four crops (rice, vegetable, fruit, golden_tree) keep their exact
// gameplay numbers so existing save data / inventories stay valid.

export interface CropDef {
    /** cropType id, also used for seed_<id> / crop_<id> inventory keys */
    id: string;
    /** Display name shown in shop / hotbar / tooltips */
    name: string;
    /** Sprite base name in /assets/Elements/Crops (loaded as crop_<id>_stage_<n>) */
    sprite: string;
    /** Emoji icon for UI (used when `image` is not set) */
    emoji?: string;
    /** Image icon path for UI (takes priority over emoji) */
    image?: string;
    /** Gold cost to buy one seed in the shop "Buy Seeds" tab */
    buyPrice: number;
    /** Gold earned when selling one harvested crop */
    sellPrice: number;
    /** Energy consumed when planting */
    energyCost: number;
    /** Growth duration in ms before the crop is ready to harvest */
    growthTime: number;
    /** EXP granted on harvest */
    exp: number;
    /** Included in the random gacha "Buy Pack" (original four only) */
    inGacha?: boolean;
}

// Ordered by tier (cheapest → most valuable) for nice shop display.
export const CROP_CATALOG: CropDef[] = [
    { id: 'rice',        name: 'Rice',         sprite: 'wheat',       image: '/padi.png', buyPrice: 1,   sellPrice: 2,   energyCost: 2,  growthTime: 10000,  exp: 10,  inGacha: true },
    { id: 'carrot',      name: 'Carrot',       sprite: 'carrot',      emoji: '🥕',        buyPrice: 6,   sellPrice: 12,  energyCost: 3,  growthTime: 20000,  exp: 12 },
    { id: 'radish',      name: 'Radish',       sprite: 'radish',      image: '/assets/Elements/Crops/radish_05.png',      buyPrice: 8,   sellPrice: 16,  energyCost: 3,  growthTime: 25000,  exp: 14 },
    { id: 'potato',      name: 'Potato',       sprite: 'potato',      emoji: '🥔',        buyPrice: 10,  sellPrice: 20,  energyCost: 4,  growthTime: 30000,  exp: 16 },
    { id: 'beetroot',    name: 'Beetroot',     sprite: 'beetroot',    image: '/assets/Elements/Crops/beetroot_05.png',    buyPrice: 14,  sellPrice: 28,  energyCost: 5,  growthTime: 40000,  exp: 20 },
    { id: 'parsnip',     name: 'Parsnip',      sprite: 'parsnip',     image: '/assets/Elements/Crops/parsnip_05.png',     buyPrice: 22,  sellPrice: 45,  energyCost: 7,  growthTime: 50000,  exp: 24 },
    { id: 'vegetable',   name: 'Vegy',         sprite: 'cabbage',     emoji: '🥬',        buyPrice: 25,  sellPrice: 50,  energyCost: 8,  growthTime: 60000,  exp: 25,  inGacha: true },
    { id: 'cauliflower', name: 'Cauliflower',  sprite: 'cauliflower', image: '/assets/Elements/Crops/cauliflower_05.png', buyPrice: 30,  sellPrice: 60,  energyCost: 9,  growthTime: 70000,  exp: 30 },
    { id: 'kale',        name: 'Kale',         sprite: 'kale',        image: '/assets/Elements/Crops/kale_05.png',        buyPrice: 35,  sellPrice: 70,  energyCost: 10, growthTime: 80000,  exp: 35 },
    { id: 'fruit',       name: 'Apple',        sprite: 'pumpkin',     emoji: '🍎',        buyPrice: 50,  sellPrice: 100, energyCost: 15, growthTime: 90000,  exp: 50,  inGacha: true },
    { id: 'golden_tree', name: 'Golden Tree',  sprite: 'sunflower',   emoji: '⭐',         buyPrice: 120, sellPrice: 200, energyCost: 20, growthTime: 120000, exp: 100, inGacha: true },
];

const CROP_BY_ID: Record<string, CropDef> = Object.fromEntries(
    CROP_CATALOG.map(c => [c.id, c])
);

/** Look up a crop by its cropType id (e.g. "carrot"). */
export function getCrop(id: string): CropDef | undefined {
    return CROP_BY_ID[id];
}

/** Look up a crop by its seed inventory key (e.g. "seed_carrot"). */
export function getCropBySeed(seedType: string): CropDef | undefined {
    if (!seedType.startsWith('seed_')) return undefined;
    return CROP_BY_ID[seedType.slice('seed_'.length)];
}

/** The crop's seed inventory item key. */
export const seedKey = (id: string) => `seed_${id}`;
/** The crop's harvested item inventory key. */
export const cropKey = (id: string) => `crop_${id}`;
