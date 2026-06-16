import { NextResponse } from 'next/server';
import { connectDB } from '../../../../server/db/connect';
import User from '../../../../server/db/models/User';

export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Missing walletAddress parameter' }, { status: 400 });
        }

        const user = await User.findOne({ walletAddress });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const { walletAddress, username, role, clothesIndex, gender, avatarStyle } = body;

        if (!walletAddress || !username) {
            return NextResponse.json({ error: 'Missing walletAddress or username' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ walletAddress });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Create new user with role, clothesIndex, gender, and avatarStyle
        const newUser = new User({
            walletAddress,
            username,
            role: role || 'Farmer',
            clothesIndex: clothesIndex || avatarStyle || 1,
            avatarStyle: avatarStyle || clothesIndex || 1,
            avatar_style: avatarStyle || clothesIndex || 1,
            gender: gender || 'Male',
        });

        await newUser.save();
        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
