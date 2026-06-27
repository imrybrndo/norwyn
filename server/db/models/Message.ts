import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    sender: string;
    receiver: string;
    text: string;
    timestamp: Date;
}

const MessageSchema: Schema = new Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Add index for fast retrieval of conversations between two specific users
MessageSchema.index({ sender: 1, receiver: 1, timestamp: 1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
