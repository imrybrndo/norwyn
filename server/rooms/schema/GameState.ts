import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

export class InventoryItemState extends Schema {
    @type("string") itemType: string = "";
    @type("number") count: number = 0;
}

export class PlayerState extends Schema {
    @type("string") id: string = "";
    @type("string") username: string = "";
    @type("string") walletAddress: string = ""; // [NEW] Web3 Wallet
    @type("string") role: string = "Farmer"; // [NEW] Profession role
    @type("string") gender: string = "Male"; // [NEW] Character gender
    @type("number") avatarStyle: number = 1; // [NEW] Character visual style
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("string") direction: string = "down";
    @type("boolean") isMoving: boolean = false;
    @type("number") clothesIndex: number = 1;
    @type("number") gold: number = 100;
    @type("number") energy: number = 100;
    @type("number") hunger: number = 100;
    @type("number") level: number = 1;
    @type("number") exp: number = 0;
    @type("number") wateringCanLevel: number = 1;
    @type("number") wateringCanDurability: number = 100;
    @type("number") axeLevel: number = 1; // [NEW] Woodcutter tool level
    @type("number") axeDurability: number = 100; // [NEW] Woodcutter tool durability
    @type("number") fishingRodLevel: number = 1; // [NEW] Fisher tool level
    @type("number") fishingRodDurability: number = 100; // [NEW] Fisher tool durability
    @type([InventoryItemState]) inventory = new ArraySchema<InventoryItemState>();
    @type({ map: "number" }) lastClaimedQuests = new MapSchema<number>();
    @type("boolean") isSleeping: boolean = false;
    @type("number") lastDailyChestClaim: number = 0;
    @type("boolean") isGuest: boolean = false;
    @type(["string"]) friends = new ArraySchema<string>();
    @type(["string"]) friendRequests = new ArraySchema<string>();
}


export class CropState extends Schema {
    @type("string") id: string = ""; // Format: "x_y"
    @type("number") tileX: number = 0;
    @type("number") tileY: number = 0;
    @type("string") cropType: string = "";
    @type("number") plantedAt: number = 0;
    @type("number") readyAt: number = 0;
    @type("boolean") watered: boolean = false;
    @type("string") ownerId: string = "";
}

export class GameState extends Schema {
    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
    @type({ map: CropState }) crops = new MapSchema<CropState>();
}
