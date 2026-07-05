import { NextResponse } from 'next/server';
import prisma from '../../../../server/db/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const user = searchParams.get('user');
        const friend = searchParams.get('friend');

        if (!user || !friend) {
            return NextResponse.json({ error: 'Missing user or friend parameter' }, { status: 400 });
        }

        // Fetch the last 50 messages between the user and friend, sorted chronologically
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { sender: user, receiver: friend },
                    { sender: friend, receiver: user }
                ]
            },
            orderBy: { timestamp: 'asc' },
            take: 50
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Chat history fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }
}
