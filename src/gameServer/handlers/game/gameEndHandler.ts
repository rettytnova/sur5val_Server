import { gameEndNotification } from '../notification/gameEnd.js';
import { getRoomByUserId, getUserIdBySocket } from '../handlerMethod.js';
import { CustomSocket, GameEndPayload } from '../../../gameServer/interface/interface.js';

// 게임 종료
export const gameEndHandler = async (socket: CustomSocket, payload: Object) => {
  const userId: number | null = await getUserIdBySocket(socket);
  const gameEndPayload = payload as GameEndPayload;
  if (userId === null) return;
  const room = await getRoomByUserId(userId);
  if (room === null) {
    console.error('gameEndHandler: 해당 유저가 속한 roomData를 찾을 수 없습니다.');
    return;
  }
  if (gameEndPayload.reactionType === 1) {
    await gameEndNotification(room.id, 4);
  } else {
    await gameEndNotification(room.id, 2);
  }
  console.log('게임 종료');
};
