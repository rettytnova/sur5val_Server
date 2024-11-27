import { gameEndNotification } from '../notification/gameEnd.js';
import { getRoomByUserId, getUserBySocket } from '../handlerMethod.js';
import { CustomSocket } from '../../interface/interface.js';

// 게임 종료
export const gameEndHandler = async (socket: CustomSocket) => {
  const user = await getUserBySocket(socket);
  const room = await getRoomByUserId(user.id);
  if (room === null) {
    console.error('gameEndHandler: 해당 유저가 속한 roomData를 찾을 수 없습니다.');
    return;
  }
  await gameEndNotification(room.id, 2);
  console.log('게임 종료');
};
