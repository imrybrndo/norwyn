import { Client } from '@colyseus/sdk';

const getEndpoint = () => {
    if (typeof window === 'undefined') {
        return 'ws://localhost:3000/colyseus';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/colyseus`;
};

export const colyseusClient = new Client(getEndpoint());
export type GameRoomType = any; // Colyseus client Room type
