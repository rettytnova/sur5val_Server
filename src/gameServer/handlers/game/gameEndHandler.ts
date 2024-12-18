import { getRoomByUserId, getUserBySocket } from '../handlerMethod.js';
import { CustomSocket, GameEndPayload } from '../../../gameServer/interface/interface.js';
import GameRoom from '../../class/room.js';
import { gameEndNotification } from '../notification/gameEnd.js';

// 게임 종료
export const gameEndHandler = (socket: CustomSocket, payload: Object) => {
  const gameEndPayload = payload as GameEndPayload;

  const gameEndUser = getUserBySocket(socket);
  if (!gameEndUser) {
    console.log('gameEndHandler user가 없음');
    return;
  }

  const gameEndRoom: GameRoom | null = getRoomByUserId(gameEndUser.getId());
  if (gameEndRoom === null) {
    console.error('gameEndHandler room이 없음');
    return;
  }

  if (gameEndPayload.resultType === 1) {
    gameEndNotification(gameEndRoom.getRoomId(), 4);
  } else {
    gameEndNotification(gameEndRoom.getRoomId(), 2);
  }

  console.log('게임 종료');
};
