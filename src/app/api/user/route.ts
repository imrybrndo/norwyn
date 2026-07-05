import { NextResponse } from 'next/server';
import prisma from '../../../../server/db/prisma';

// lastDailyChestClaim is a BigInt column; JSON can't serialize BigInt, so
// convert it to a number before returning the user.
function serializeUser<T extends { lastDailyChestClaim: bigint }>(user: T) {
    return { ...user, lastDailyChestClaim: Number(user.lastDailyChestClaim) };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Missing walletAddress parameter' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { walletAddress } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(serializeUser(user), { status: 200 });
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { walletAddress, username, role, clothesIndex, gender, avatarStyle } = body;

        if (!walletAddress || !username) {
            return NextResponse.json({ error: 'Missing walletAddress or username' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { walletAddress } });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Create new user with role, gender, and avatarStyle
        const newUser = await prisma.user.create({
            data: {
                walletAddress,
                username,
                role: (role || 'Farmer') as 'Farmer' | 'Woodcutter' | 'Fisher',
                avatarStyle: avatarStyle || clothesIndex || 1,
                gender: (gender || 'Male') as 'Male' | 'Female',
            }
        });

        return NextResponse.json(serializeUser(newUser), { status: 201 });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
