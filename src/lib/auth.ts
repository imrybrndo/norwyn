import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'session';
export const NONCE_COOKIE = 'siwe_nonce';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error('AUTH_SECRET is not set');
    }
    return new TextEncoder().encode(secret);
}

export async function signSession(address: string): Promise<string> {
    return new SignJWT({ address })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
        .sign(getSecretKey());
}

export async function verifySession(token: string | undefined | null): Promise<{ address: string } | null> {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        if (typeof payload.address !== 'string') return null;
        return { address: payload.address };
    } catch {
        return null;
    }
}

export const sessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
};

export const nonceCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 10, // 10 minutes
};
