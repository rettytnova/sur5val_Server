import net from 'net';
import {
  getRedisData,
  getSocketByUser,
  getUserBySocket,
  setRedisData,
} from '../handlerMethod.js';
import { CustomSocket, Room, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { GlobalFailCode } from '../enumTyps.js';

export const leaveRoomHandler = async (socket: net.Socket) => {
  // 해당 소켓으로 전달받는 데이터에 유저가 있는지
  const user: User = await getUserBySocket(socket as CustomSocket);

  if (!user) {
    console.log('유저를 찾을 수 없습니다.');
    return;
  }

  const roomData: Room[] = await getRedisData('roomData');

  for (let i = 0; i < roomData.length; i++) {
    let is_find: boolean = false;
    for (let j = 0; j < roomData[i].users.length; j++) {
      if (roomData[i].users[j].id === user.id) {
        is_find = true;

        roomData[i].users.splice(j, 1);
        let roomBomb = false;
        // 방 인원이 부족할 경우 터트리기
        if (roomData[i].users.length === 0) {
          roomData.splice(i, 1);
          roomBomb = true;
        } else {
          // 나가는 인원이 방장일 경우 방장 위임
          if (user.id === roomData[i].ownerId) {
            roomData[i].ownerId = roomData[i].users[0].id;
          }
        }

        sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, {
          success: 1,
          fail: GlobalFailCode.NONE,
        });
        await setRedisData('roomData', roomData);

        // 전체 인원에게 방 나간다고 알려주기 (notification)
        if (roomBomb) {
          return;
        }
        for (let userIdx = 0; userIdx < roomData[i].users.length; userIdx++) {
          const roomUserSocket = await getSocketByUser(
            roomData[i].users[userIdx],
          );
          if (!roomUserSocket) {
            console.error(
              '(방 퇴장 응답 중)해당 User가 포함된 socket을 찾을 수 없습니다.',
              user,
            );
            return;
          }
          sendPacket(
            roomUserSocket,
            config.packetType.LEAVE_ROOM_NOTIFICATION,
            {
              userId: user.id,
            },
          );

          const sendData = {
            success: 1,
            room: roomData[i],
            failCode: GlobalFailCode.NONE,
          };
          sendPacket(
            roomUserSocket,
            config.packetType.JOIN_ROOM_RESPONSE,
            sendData,
          );
        }

        break;
      }
    }
    if (is_find) {
      break;
    }
  }
};
