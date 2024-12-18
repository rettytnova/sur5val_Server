import { getRoomByUserIdTwo, getUserBySocket } from '../handlerMethod.js';
import { CustomSocket, GameEndPayload } from '../../../gameServer/interface/interface.js';
import GameRoom from '../../class/room.js';
import { gameEndNotificationTwo } from '../notification/gameEndTwo.js';

// 게임 종료
export const gameEndHandlerTwo = (socket: CustomSocket, payload: Object) => {
    const gameEndPayload = payload as GameEndPayload;

    const gameEndUser = getUserBySocket(socket);
    if (!gameEndUser) {
        console.log('gameEndHandler user가 없음');
        return;
    }

    const gameEndRoom: GameRoom | null = getRoomByUserIdTwo(gameEndUser.getId());
    if (gameEndRoom === null) {
        console.error('gameEndHandler room이 없음');
        return;
    }

    if (gameEndPayload.resultType === 1) {
        gameEndNotificationTwo(gameEndRoom.getRoomId(), 4);
    }
    else {
        gameEndNotificationTwo(gameEndRoom.getRoomId(), 2);
    }

    console.log('게임 종료');
};
