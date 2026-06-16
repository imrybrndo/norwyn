import mongoose, { Schema, Document } from 'mongoose';

export interface IApartmentBed extends Document {
    bedId: number;
    ownerWallet: string;
    nftTokenAddress: string;
    isOccupied: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ApartmentBedSchema: Schema = new Schema({
    bedId: { type: Number, required: true, unique: true },
    ownerWallet: { type: String, required: true, ref: 'User' },
    nftTokenAddress: { type: String, default: null },
    isOccupied: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.ApartmentBed || mongoose.model<IApartmentBed>('ApartmentBed', ApartmentBedSchema);
