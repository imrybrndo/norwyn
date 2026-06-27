import { NextResponse } from 'next/server';
import { connectDB } from '../../../../server/db/connect';
import Message from '../../../../server/db/models/Message';

export async function GET(request: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const user = searchParams.get('user');
        const friend = searchParams.get('friend');

        if (!user || !friend) {
            return NextResponse.json({ error: 'Missing user or friend parameter' }, { status: 400 });
        }

        // Fetch the last 50 messages between the user and friend, sorted chronologically
        const messages = await Message.find({
            $or: [
                { sender: user, receiver: friend },
                { sender: friend, receiver: user }
            ]
        })
        .sort({ timestamp: 1 })
        .limit(50)
        .lean();

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Chat history fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }
}
