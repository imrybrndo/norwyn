import { NextResponse } from 'next/server';
import prisma from '../../../../server/db/prisma';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        // Fetch top 100 players, sorted by level (descending), then gold (descending)
        const topUsers = await prisma.user.findMany({
            select: {
                walletAddress: true,
                username: true,
                level: true,
                gold: true,
                totalPlaytime: true,
                role: true,
                createdAt: true
            },
            orderBy: [{ level: 'desc' }, { gold: 'desc' }],
            take: 100
        });

        return NextResponse.json(topUsers);
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
