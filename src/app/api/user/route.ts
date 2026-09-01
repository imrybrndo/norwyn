import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../server/db/prisma';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

// lastDailyChestClaim is a BigInt column; JSON can't serialize BigInt, so
// convert it to a number before returning the user.
function serializeUser<T extends { lastDailyChestClaim: bigint }>(user: T) {
    return { ...user, lastDailyChestClaim: Number(user.lastDailyChestClaim) };
}

async function getSessionAddress() {
    const cookieStore = await cookies();
    const session = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
    return session?.address ?? null;
}

export async function GET() {
    try {
        const walletAddress = await getSessionAddress();
        if (!walletAddress) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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
        const walletAddress = await getSessionAddress();
        if (!walletAddress) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { username, role, clothesIndex, gender, avatarStyle } = body;

        if (!username) {
            return NextResponse.json({ error: 'Missing username' }, { status: 400 });
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
