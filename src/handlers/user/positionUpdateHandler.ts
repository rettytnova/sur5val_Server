import net from 'net';
import { getRedisData, setRedisData } from '../handlerMethod.js';
import { CharacterPositionData, positionUpdatePayload } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { GlobalFailCode } from '../enumTyps.js';

export const positionUpdateHandler = async (socket: net.Socket, payload: Object) => {
  // const user: User = await getUserBySocket(socket as CustomSocket);

  // if (!user) {
  //     sendPacket(socket, config.packetType.POSITION_UPDATE_NOTIFICATION, {
  //       success: false,
  //       failCode: GlobalFailCode.CHARACTER_NOT_FOUND,
  //     });
  //     console.log('비정상적인 접근입니다. => 유저를 찾을 수 없습니다.');
  //     return;
  // }
  const update = payload as positionUpdatePayload;

  const positionData: CharacterPositionData = await getRedisData('characterPositionDatas');

  if (!positionData) {
    sendPacket(socket, config.packetType.POSITION_UPDATE_NOTIFICATION, {
      success: false,
      failCode: GlobalFailCode.CHARACTER_NOT_FOUND
    });
    console.log('비정상적인 접근입니다. => 해당 유저의 위치 정보가 없습니다.');
    return;
  }

  const changedPosition = {
    id: positionData.id,
    x: positionData.x + update.x,
    y: positionData.y + update.y
  };
  sendPacket(socket, config.packetType.POSITION_UPDATE_NOTIFICATION, {
    x: changedPosition.x,
    y: changedPosition.y
  });
  setRedisData('characterPositionDatas', changedPosition);
};
