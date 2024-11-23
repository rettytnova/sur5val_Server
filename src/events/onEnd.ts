import { getRedisData, getUserBySocket, setRedisData } from '../handlers/handlerMethod.js';
import { leaveRoomHandler } from '../handlers/room/leaveRoomHandler.js';
import { CustomSocket } from '../interface/interface.js';
import { socketSessions } from '../session/socketSession.js';

export const onEnd = (socket: CustomSocket) => async () => {
  const endUserData = await getUserBySocket(socket);
  if (!endUserData) {
    console.error('게임을 종료하는 유저의 userData가 이미 존재하지 않습니다');
  } else {
    leaveRoomHandler(socket); // 강제종료 했을 경우 방에서 나가기 처리
    const liveUserDatas = await getRedisData('userData');
    console.log('종료 처리 전 liveUserData 수: ', liveUserDatas.length);
    for (let i = 0; i < liveUserDatas.length; i++) {
      if (liveUserDatas[i].id === endUserData.id) {
        liveUserDatas.splice(i, 1);
        await setRedisData('userData', liveUserDatas);
        break;
      }
    }
    console.log('종료 처리 후 liveUserData 수: ', liveUserDatas.length);
  }
  delete socketSessions[endUserData.id];
};
