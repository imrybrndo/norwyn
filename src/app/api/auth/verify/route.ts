import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SiweMessage } from 'siwe';
import { signSession, NONCE_COOKIE, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { message, signature } = await request.json();
        if (!message || !signature) {
            return NextResponse.json({ error: 'Missing message or signature' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const nonce = cookieStore.get(NONCE_COOKIE)?.value;
        if (!nonce) {
            return NextResponse.json({ error: 'Missing or expired nonce' }, { status: 400 });
        }

        const siweMessage = new SiweMessage(message);
        const result = await siweMessage.verify({ signature, nonce });

        if (!result.success) {
            return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
        }

        const address = result.data.address;
        const token = await signSession(address);

        cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
        cookieStore.delete(NONCE_COOKIE);

        return NextResponse.json({ address });
    } catch (error: any) {
        console.error('Error verifying SIWE signature:', error);
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }
}
