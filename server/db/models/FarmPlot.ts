import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmPlot extends Document {
    plotId: string;
    ownerWallet: string;
    plantedItemId: string;
    plantedAt: Date;
    harvestReadyAt: Date;
    isWatered: boolean;
    is_watered: boolean; // snake_case compatibility
    createdAt: Date;
    updatedAt: Date;
}

const FarmPlotSchema: Schema = new Schema({
    plotId: { type: String, required: true, unique: true },
    ownerWallet: { type: String, required: true, ref: 'User' },
    plantedItemId: { type: String, default: null },
    plantedAt: { type: Date, default: null },
    harvestReadyAt: { type: Date, default: null },
    isWatered: { type: Boolean, default: false },
    is_watered: { type: Boolean, default: false }
}, { timestamps: true });

FarmPlotSchema.pre('save', async function (this: IFarmPlot) {
    if (this.isModified('isWatered')) {
        this.is_watered = this.isWatered;
    } else if (this.isModified('is_watered')) {
        this.isWatered = this.is_watered;
    }
});

export default mongoose.models.FarmPlot || mongoose.model<IFarmPlot>('FarmPlot', FarmPlotSchema);
