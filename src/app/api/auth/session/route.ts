import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export async function GET() {
    const cookieStore = await cookies();
    const session = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);

    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({ address: session.address });
}
