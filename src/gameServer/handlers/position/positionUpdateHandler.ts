import net from 'net';
import Server from '../../class/server.js';
import { getRoomByUserId, getUserBySocket } from '../handlerMethod.js';
import { CharacterPositionData, CustomSocket, position } from '../../interface/interface.js';
import UserSessions from '../../class/userSessions.js';
import PositionSessions from '../../class/positionSessions.js';

export const positionUpdateHandler = (socket: net.Socket, payload: Object) => {
    const update = payload as position;

    const user: UserSessions | null | undefined = getUserBySocket(socket as CustomSocket);
    if (!user) {
        console.log('비정상적인 접근입니다. => 유저를 찾을 수 없습니다.');
        return;
    }

    const userId = user.getId();
    if (!userId) {
        console.log('비정상적인 접근입니다. => 유저를 찾을 수 없습니다.');
        return;
    }

    const room = getRoomByUserId(userId);
    if (!room) {
        console.log('해당 유저id가 참여하고 있는 방이 없습니다.');
        return;
    }

    const positionDatas = Server.getInstance().getPositions(); // 모든 방의 위치데이터
    const positionData = positionDatas.find((position) => position.getPositionRoomId() === room.getRoomId())

    // positionData 중 socket보낸 사람의 data를 찾아서 update하기
    if (!positionData) return;

    const changedPosition: CharacterPositionData = {
        id: userId,
        x: update.x,
        y: update.y
    };

    for (let i = 0; i < positionData.getCharacterPositions().length; i++) {
        if (positionData.getCharacterPositions()[i].id === changedPosition.id) {
            positionData.getCharacterPositions()[i].x = changedPosition.x;
            positionData.getCharacterPositions()[i].y = changedPosition.y;
        }
    }
};
