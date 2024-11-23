import net from 'net';
import { getRedisData, getUserBySocket, setRedisData } from '../handlerMethod.js';
import { CustomSocket, Room, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';
import { socketSessions } from '../../session/socketSession.js';
import { monsterAiDatas } from '../coreMethod/monsterMove.js';

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

  const rooms: Room[] = await getRedisData('roomData');
  if (!rooms) {
    sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, {
      success: false,
      failCode: GlobalFailCode.LEAVE_ROOM_FAILED
    });
    console.log('비정상적인 접근입니다. => 방을 찾을 수 없습니다.');
    return;
  }

  let roomIndex: number | null = null;
  let userIndex: number | null = null;
  for (let i = 0; i < rooms.length; i++) {
    for (let j = 0; j < rooms[i].users.length; j++) {
      if (rooms[i].users[j].id === user.id) {
        roomIndex = i;
        userIndex = j;
      }
    }
  }
  if (roomIndex === null) return;
  if (userIndex === null) return;

  // 나가는 인원이 방장일 경우
  rooms[roomIndex].users.splice(userIndex, 1);
  if (user.id === rooms[roomIndex].ownerId) {
    rooms[roomIndex].ownerId = rooms[roomIndex].users[0].id;
  }

  // success response 전달
  sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, {
    success: 1,
    fail: GlobalFailCode.NONE
  });

  // wait, prepare 상태일 경우 전체 인원에게 방 나간다고 알려주기 (notification)
  if (rooms[roomIndex].state === (RoomStateType.WAIT || RoomStateType.PREPARE)) {
    for (let userIdx = 0; userIdx < rooms[roomIndex].users.length; userIdx++) {
      const roomUserSocket = socketSessions[rooms[roomIndex].users[userIdx].id];
      if (roomUserSocket)
        sendPacket(roomUserSocket, config.packetType.LEAVE_ROOM_NOTIFICATION, {
          userId: user.id
        });

      if (roomUserSocket) {
        const sendData = {
          success: 1,
          room: rooms[roomIndex],
          failCode: GlobalFailCode.NONE
        };
        sendPacket(roomUserSocket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
      }
    }
    // ingame 상태일 경우 해당 유저의 게임 data 삭제하긴
  } else {
    // redis의 characterPositionDatas
    const characterPositionDatas = await getRedisData('characterPositionDatas');
    const characterPositionData = characterPositionDatas[rooms[roomIndex].id];
    for (let i = 0; i < characterPositionData.length; i++) {
      if (characterPositionData[i].id === user.id) {
        characterPositionData.splice(i, 1);
        break;
      }
    }
    await setRedisData('characterPositionDatas', characterPositionDatas);
  }

  // 방에 roleType이 0과 1(player, boss)인 user가 0명일때 방을 없애기
  let isClosedRoom: boolean = true;
  for (let i = 0; i < rooms[roomIndex].users.length; i++) {
    const userRoleType = rooms[roomIndex].users[i].character.roleType;
    if (userRoleType === 0 || userRoleType === 1) {
      isClosedRoom = false;
      break;
    }
  }
  if (isClosedRoom) {
    rooms.splice(roomIndex, 1);
  }

  await setRedisData('roomData', rooms);
};
