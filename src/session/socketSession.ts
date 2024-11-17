// socket을 담고 있을 세션 {socket.id : socket}

import { CustomSocket } from '../interface/interface.js';

export const socketSessions: Record<string, CustomSocket> = {};
