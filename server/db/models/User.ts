import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem {
    itemType: string;
    count: number;
}

export interface IUser extends Document {
    walletAddress: string; // Primary Web3 Identifier
    username: string; 
    role: string; // 'Farmer', 'Woodcutter', or 'Fisher'
    clothesIndex: number;
    gender: string; // 'Male' or 'Female'
    avatarStyle: number;
    avatar_style: number; // snake_case compatibility
    gold: number;
    offChainCoins: number;
    off_chain_coins: number; // snake_case compatibility
    energy: number;
    energyCapacity: number;
    energy_capacity: number; // snake_case compatibility
    currentEnergy: number;
    current_energy: number; // snake_case compatibility
    hunger: number;
    level: number;
    exp: number;
    inventory: IInventoryItem[];
    lastClaimedQuests: Map<string, number>;
    // Tools extended for 3 professions
    wateringCan: { level: number; durability: number; };
    axe: { level: number; durability: number; };
    fishingRod: { level: number; durability: number; };
    lastPosition: { map: string; x: number; y: number; };
    last_coordinates?: { x: number; y: number; map: string; }; // snake_case compatibility
    lastDailyChestClaim: number;
    totalPlaytime: number;
    friends: string[];
    friendRequests: string[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    walletAddress: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    role: { type: String, enum: ['Farmer', 'Woodcutter', 'Fisher'], default: 'Farmer' },
    clothesIndex: { type: Number, default: 1 },
    gender: { type: String, enum: ['Male', 'Female'], default: 'Male' },
    avatarStyle: { type: Number, default: 1 },
    avatar_style: { type: Number, default: 1 },
    gold: { type: Number, default: 100 },
    offChainCoins: { type: Number, default: 100 },
    off_chain_coins: { type: Number, default: 100 },
    energy: { type: Number, default: 100, min: 0, max: 100 },
    energyCapacity: { type: Number, default: 100 },
    energy_capacity: { type: Number, default: 100 },
    currentEnergy: { type: Number, default: 100, min: 0, max: 100 },
    current_energy: { type: Number, default: 100, min: 0, max: 100 },
    hunger: { type: Number, default: 100, min: 0, max: 100 },
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    inventory: [{
        itemType: { type: String, required: true },
        count: { type: Number, required: true, default: 0 }
    }],
    lastClaimedQuests: { type: Map, of: Number, default: {} },
    wateringCan: {
        level: { type: Number, default: 1 },
        durability: { type: Number, default: 100, min: 0, max: 100 }
    },
    axe: {
        level: { type: Number, default: 1 },
        durability: { type: Number, default: 100, min: 0, max: 100 }
    },
    fishingRod: {
        level: { type: Number, default: 1 },
        durability: { type: Number, default: 100, min: 0, max: 100 }
    },
    lastPosition: {
        map: { type: String, default: 'farm' },
        x: { type: Number, default: 240 },
        y: { type: Number, default: 240 }
    },
    last_coordinates: {
        map: { type: String, default: 'farm' },
        x: { type: Number, default: 240 },
        y: { type: Number, default: 240 }
    },
    lastDailyChestClaim: { type: Number, default: 0 },
    totalPlaytime: { type: Number, default: 0 },
    friends: { type: [String], default: [] },
    friendRequests: { type: [String], default: [] }
}, { timestamps: true });

// Pre-save hook to keep snake_case and camelCase parameters synchronized
UserSchema.pre('save', function (this: IUser) {
    if (this.isModified('gold')) {
        this.offChainCoins = this.gold;
        this.off_chain_coins = this.gold;
    } else if (this.isModified('offChainCoins')) {
        this.gold = this.offChainCoins;
        this.off_chain_coins = this.offChainCoins;
    } else if (this.isModified('off_chain_coins')) {
        this.gold = this.off_chain_coins;
        this.offChainCoins = this.off_chain_coins;
    }

    if (this.isModified('energy')) {
        this.currentEnergy = this.energy;
        this.current_energy = this.energy;
    } else if (this.isModified('currentEnergy')) {
        this.energy = this.currentEnergy;
        this.current_energy = this.currentEnergy;
    } else if (this.isModified('current_energy')) {
        this.energy = this.current_energy;
        this.currentEnergy = this.current_energy;
    }

    if (this.isModified('energyCapacity')) {
        this.energy_capacity = this.energyCapacity;
    } else if (this.isModified('energy_capacity')) {
        this.energyCapacity = this.energy_capacity;
    }

    if (this.isModified('avatarStyle')) {
        this.clothesIndex = this.avatarStyle;
        this.avatar_style = this.avatarStyle;
    } else if (this.isModified('avatar_style')) {
        this.clothesIndex = this.avatar_style;
        this.avatarStyle = this.avatar_style;
    } else if (this.isModified('clothesIndex')) {
        this.avatarStyle = this.clothesIndex;
        this.avatar_style = this.clothesIndex;
    }

    if (this.isModified('lastPosition')) {
        this.last_coordinates = {
            map: this.lastPosition.map,
            x: this.lastPosition.x,
            y: this.lastPosition.y
        };
    } else if (this.isModified('last_coordinates') && this.last_coordinates) {
        this.lastPosition = {
            map: this.last_coordinates.map,
            x: this.last_coordinates.x,
            y: this.last_coordinates.y
        };
    }


});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
