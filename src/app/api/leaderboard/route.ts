import { NextResponse } from 'next/server';
import { connectDB } from '../../../../server/db/connect';
import User from '../../../../server/db/models/User';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        await connectDB();

        // Fetch top 100 players, sorted by level (descending), then gold (descending)
        const topUsers = await User.find({})
            .select('walletAddress username level gold totalPlaytime role createdAt')
            .sort({ level: -1, gold: -1 })
            .limit(100)
            .lean();

        return NextResponse.json(topUsers);
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
