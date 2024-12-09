import { config } from '../../config/config.js';
import { CustomSocket, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { socketSessions } from '../../session/socketSession.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';
import { getRedisData, getUserIdBySocket, setRedisData } from '../handlerMethod.js';

export const joinRandomRoomHandler = async (socket: CustomSocket) => {
  // 모든 방 정보 가져오기
  const rooms = await getRedisData('roomData');
  if (!rooms) return;

  // userData가 존재하지 않는 오류 발생 시
  const userId = await getUserIdBySocket(socket);
  if (!userId) {
    console.error('요청한 클라이언트의 userData가 존재하지 않습니다.');
    const sendData = {
      success: false,
      room: {},
      failCode: GlobalFailCode.JOIN_ROOM_FAILED
    };
    sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
    return;
  }

  // 이미 참여중인 방이 있는지 검사
  for (let i = 0; i < rooms.length; i++) {
    for (let j = 0; j < rooms[i].users.length; j++) {
      if (rooms[i].users[j].id === userId) {
        console.error('이미 참여중인 방이 존재합니다.');
        const sendData = {
          success: false,
          room: {},
          failCode: GlobalFailCode.JOIN_ROOM_FAILED
        };
        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
        return;
      }
    }
  }

  // 맨 앞방 부터 순서대로 들어갈 수 있는 방 탐색
  if (rooms) {
    let roomFound = false;
    for (let i = 0; i < rooms.length; i++) {
      // 남은 자리가 있는 지 확인
      if (rooms[i].maxUserNum > rooms[i].users.length) {
        // wait 상태가 아닐 시 실패 response
        if (rooms[i].state !== RoomStateType.WAIT) {
          const sendData = {
            success: false,
            room: {},
            failCode: GlobalFailCode.JOIN_ROOM_FAILED
          };
          sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
          return;
        }

        // 방 참가 성공 시 : 해당 유저의 정보를 roomData에 추가하고, 성공 response
        let user: User | null = null;
        const userDatas = await getRedisData('userData');
        if (userDatas) {
          for (let i = 0; i < userDatas.length; i++) {
            if (socketSessions[userDatas[i].id] === socket) {
              user = userDatas[i];
            }
          }
        }
        if (!user) return;
        rooms[i].users.push(user);
        await setRedisData('roomData', rooms);
        const sendData = {
          success: true,
          room: rooms[i],
          failCode: GlobalFailCode.NONE
        };
        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);

        // 방에 있는 모든 인원에게 새로운 유저가 참가했다는 notification 전달 (본인 포함)
        for (let x = 0; x < rooms[i].users.length; x++) {
          const roomUserSocket = socketSessions[rooms[i].users[x].id];

          if (!roomUserSocket) {
            console.error('socket을 찾을 수 없습니다.');
            return;
          }
          sendPacket(roomUserSocket, config.packetType.JOIN_ROOM_NOTIFICATION, {
            joinUser: user
          });
        }

        roomFound = true;
        break;
      }
    }

    // 잘못된 방id를 요구한 경우
    if (!roomFound) {
      const sendData = {
        success: false,
        room: {},
        failCode: GlobalFailCode.ROOM_NOT_FOUND
      };
      sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
    }
  } else {
    // 서버에 방이 존재 하지 않을 경우
    const sendData = {
      success: false,
      room: {},
      failCode: GlobalFailCode.ROOM_NOT_FOUND
    };
    sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
    return;
  }
};
