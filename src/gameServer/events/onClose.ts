import Server from '../class/server.js';
import UserSessions from '../class/userSessions.js';
import { getRoomByUserId, getUserBySocket } from '../handlers/handlerMethod.js';
import { leaveRoomHandler } from '../handlers/room/leaveRoomHandler.js';
import { CustomSocket } from '../interface/interface.js';
import { socketSessions } from '../session/socketSession.js';

export const onClose = (socket: CustomSocket) => async () => {
    Server.getInstance().connectingClientCount--;

    console.log(`게임서버 연결 종료 ${socket.remoteAddress}:${socket.remotePort} 연결 중인 클라 ${Server.getInstance().connectingClientCount}`);

    const closeUser = getUserBySocket(socket);
    if (!closeUser) {
        return;
    }

    const users = Server.getInstance().getUsers();
    if (!users) {
        return;
    }

    // 참여 중인 방이 있으면 방에서 나감
    const leaveRoom = getRoomByUserId(closeUser.getId());
    if (leaveRoom) {
        await leaveRoomHandler(socket);
    }

    // users에서 삭제
    const remainUsers = users.filter((user: UserSessions) => user.getId() !== closeUser.getId());
    Server.getInstance().setUsers(remainUsers);

    console.log(`로그인 중인 클라 ${Server.getInstance().getUsers().length}`);

    delete socketSessions[closeUser.getId()];
};
