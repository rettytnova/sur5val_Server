import { CustomSocket } from '../interface/interface.js';

// socket을 담고 있을 세션 객체 , [key: user.id, value: socket]
export const socketSessions: Record<number, CustomSocket> = {};
