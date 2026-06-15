import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem {
    itemType: string;
    count: number;
}

export interface IUser extends Document {
    username: string;
    clothesIndex: number;
    gold: number;
    energy: number;
    hunger: number;
    inventory: IInventoryItem[];
    wateringCan: {
        level: number;
        durability: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true, trim: true },
    clothesIndex: { type: Number, default: 1 },
    gold: { type: Number, default: 100 },
    energy: { type: Number, default: 100, min: 0, max: 100 },
    hunger: { type: Number, default: 100, min: 0, max: 100 },
    inventory: [{
        itemType: { type: String, required: true },
        count: { type: Number, required: true, default: 0 }
    }],
    wateringCan: {
        level: { type: Number, default: 1 },
        durability: { type: Number, default: 100, min: 0, max: 100 }
    }
}, {
    timestamps: true
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
