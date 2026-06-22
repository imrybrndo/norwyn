import { NextResponse } from 'next/server';
import { connectDB } from '../../../../server/db/connect';
import User from '../../../../server/db/models/User';

export async function GET() {
    try {
        await connectDB();
        
        // Fetch top 10 users sorted by level (descending) and gold (descending)
        const topUsers = await User.find({})
            .sort({ level: -1, gold: -1 })
            .limit(10)
            .select('walletAddress username level gold')
            .lean();

        return NextResponse.json(topUsers, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
