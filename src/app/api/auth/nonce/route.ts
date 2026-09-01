import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateNonce } from 'siwe';
import { NONCE_COOKIE, nonceCookieOptions } from '@/lib/auth';

export async function GET() {
    const nonce = generateNonce();
    const cookieStore = await cookies();
    cookieStore.set(NONCE_COOKIE, nonce, nonceCookieOptions);
    return NextResponse.json({ nonce });
}
