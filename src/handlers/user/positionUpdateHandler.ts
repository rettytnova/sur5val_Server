import net from 'net';
import { getRedisData, getUserBySocket, setRedisData } from '../handlerMethod.js';
import {
  CharacterPositionData,
  CustomSocket,
  positionUpdatePayload,
  Room,
  User
} from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { GlobalFailCode } from '../enumTyps.js';
import { socketSessions } from '../../session/socketSession.js';

export const positionUpdateHandler = async (socket: net.Socket, payload: Object) => {
  const update = payload as positionUpdatePayload;
  // roomData 찾기
  const user: User = await getUserBySocket(socket as CustomSocket);
  if (!user) {
    console.log('비정상적인 접근입니다. => 유저를 찾을 수 없습니다.');
    return;
  }
  const roomDatas: Room[] = await getRedisData('roomData');
  if (!roomDatas) {
    console.log('비정상적인 접근입니다. => 방을 찾을 수 없습니다.');
    return;
  }

  for (let i = 0; i < roomDatas.length; i++) {
    for (let j = 0; j < roomDatas[i].users.length; j++) {
      if (roomDatas[i].users[j].id === user.id) {
        const positionDatas = await getRedisData('characterPositionDatas'); // 모든 방의 위치데이터
        const positionData: CharacterPositionData[] = positionDatas[roomDatas[i].id]; // 유저가 속한 방의 위치데이터

        // positionData 중 socket보낸 사람의 data를 찾아서 update하기
        if (!positionData) {
          console.log('비정상적인 접근입니다. => 해당 유저의 위치 정보가 없습니다.');
          return;
        }

        const changedPosition: CharacterPositionData = {
          id: user.id,
          x: update.x,
          y: update.y
        };

        // 움직인 유저의 위치값 변경
        for (let idx = 0; idx < positionData.length; idx++) {
          if (positionData[idx].id === user.id) {
            positionData[idx].x = changedPosition.x;
            positionData[idx].y = changedPosition.y;
          }
        }

        // 유저 위치 동기화
        for (let idx = 0; idx < positionData.length; idx++) {
          const roomUserSocket = socketSessions[positionData[idx].id];
          sendPacket(roomUserSocket, config.packetType.POSITION_UPDATE_NOTIFICATION, {
            characterPositions: positionData
          });
        }

        setRedisData('characterPositionDatas', positionDatas); // 모든 방에 있는 위치데이터 값
      }
    }
  }
};
