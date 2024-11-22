import net from 'net';
import { getRedisData, getUserBySocket, setRedisData } from '../handlerMethod.js';
import { CustomSocket, Room, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { GlobalFailCode } from '../enumTyps.js';
import { socketSessions } from '../../session/socketSession.js';

export const leaveRoomHandler = async (socket: net.Socket) => {
  // 해당 소켓으로 전달받는 데이터에 유저가 있는지
  const user: User = await getUserBySocket(socket as CustomSocket);
  if (!user) {
    sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, {
      success: false,
      failCode: GlobalFailCode.LEAVE_ROOM_FAILED
    });
    console.log('비정상적인 접근입니다. => 유저를 찾을 수 없습니다.');
    return;
  } // 모든 방 데이터

  const roomData: Room[] = await getRedisData('roomData');
  if (!roomData) {
    sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, {
      success: false,
      failCode: GlobalFailCode.LEAVE_ROOM_FAILED
    });
    console.log('비정상적인 접근입니다. => 방을 찾을 수 없습니다.');
    return;
  }

  for (let i = 0; i < roomData.length; i++) {
    let isFind: boolean = false;
    for (let j = 0; j < roomData[i].users.length; j++) {
      if (roomData[i].users[j].id === user.id) {
        isFind = true;

        roomData[i].users.splice(j, 1);
        let isClosedRoom: boolean = false; // 방 인원이 0명
        if (roomData[i].users.length === 0) {
          roomData.splice(i, 1);
          isClosedRoom = true;
        } else {
          // 나가는 인원이 방장일 경우
          if (user.id === roomData[i].ownerId) {
            roomData[i].ownerId = roomData[i].users[0].id;
          }
        }

        sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, {
          success: 1,
          fail: GlobalFailCode.NONE
        });
        await setRedisData('roomData', roomData); // 전체 인원에게 방 나간다고 알려주기 (notification)

        if (isClosedRoom) {
          return;
        }
        for (let userIdx = 0; userIdx < roomData[i].users.length; userIdx++) {
          const roomUserSocket = socketSessions[roomData[i].users[userIdx].id];
          if (roomUserSocket)
            sendPacket(roomUserSocket, config.packetType.LEAVE_ROOM_NOTIFICATION, {
              userId: user.id
            });

          if (roomUserSocket) {
            const sendData = {
              success: 1,
              room: roomData[i],
              failCode: GlobalFailCode.NONE
            };
            sendPacket(roomUserSocket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
          }
        }

        break;
      }
    }
    if (isFind) {
      break;
    }
  }
};
