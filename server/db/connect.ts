import mongoose from 'mongoose';

export async function connectDB() {
    try {
        const mongodbUri = process.env.MONGODB_URI;
        if (!mongodbUri) {
            throw new Error('Missing MONGODB_URI environment variable');
        }

        if (mongoose.connection.readyState >= 1) {
            return;
        }

        await mongoose.connect(mongodbUri);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}
