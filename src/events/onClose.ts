import { getRedisData, getUserIdBySocket, setRedisData } from '../handlers/handlerMethod.js';
import { leaveRoomHandler } from '../handlers/room/leaveRoomHandler.js';
import { CustomSocket } from '../interface/interface.js';
import { socketSessions } from '../session/socketSession.js';

export const onClose = (socket: CustomSocket) => async () => {
  const endUserId: number | null = await getUserIdBySocket(socket);
  if (endUserId) {
    // 강제종료 했을 경우 방에서 나가기 처리
    await leaveRoomHandler(socket);

    // userData 없애기
    const liveUserDatas = await getRedisData('userData');
    console.log('종료 처리 전 liveUserData 수: ', liveUserDatas.length);
    for (let i = 0; i < liveUserDatas.length; i++) {
      if (liveUserDatas[i].id === endUserId) {
        liveUserDatas.splice(i, 1);
        await setRedisData('userData', liveUserDatas);
        break;
      }
    }
    console.log('종료 처리 후 liveUserData 수: ', liveUserDatas.length);

    // socketSessions 없애기
    delete socketSessions[endUserId];
  }
};
