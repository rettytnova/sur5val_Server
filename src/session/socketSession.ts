// socket을 담고 있을 세션 {user.id : socket}

import { CustomSocket } from '../interface/interface.js';

export const socketSessions: Record<number, CustomSocket> = {};
