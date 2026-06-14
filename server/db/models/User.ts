import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    clothesIndex: number;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true, trim: true },
    clothesIndex: { type: Number, default: 1 }, // Default to clothes 1
}, {
    timestamps: true
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
