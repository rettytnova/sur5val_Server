import net from 'net';
import { getRedisData, getRoomByUserId, getUserIdBySocket, setRedisData } from '../handlerMethod.js';
import { CustomSocket, Room, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { GlobalFailCode, RoomStateType, RoleType } from '../enumTyps.js';
import { socketSessions } from '../../session/socketSession.js';

export const leaveRoomHandler = async (socket: net.Socket) => {
  // 해당 소켓으로 전달받는 데이터에 유저가 있는지
  const userId: number | null = await getUserIdBySocket(socket as CustomSocket);
  if (!userId) {
    sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, {
      success: false,
      failCode: GlobalFailCode.LEAVE_ROOM_FAILED
    });
    console.log('비정상적인 접근입니다. => 유저를 찾을 수 없습니다.');
    return;
  } // 모든 방 데이터

  const rooms: Room[] = await getRedisData('roomData');
  if (!rooms) return;
  const room = await getRoomByUserId(userId);
  if (!room) {
    sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, {
      success: false,
      failCode: GlobalFailCode.LEAVE_ROOM_FAILED
    });
    console.log('비정상적인 접근입니다. => 방을 찾을 수 없습니다.');
    return;
  }

  if (room.state !== RoomStateType.WAIT) {
    console.log('플레이 중이던 유저 퇴장');
    return;
  }

  let roomIndex: number | null = null;
  let userIndex: number | null = null;
  for (let i = 0; i < rooms.length; i++) {
    for (let j = 0; j < rooms[i].users.length; j++) {
      if (rooms[i].users[j].id === userId) {
        roomIndex = i;
        userIndex = j;
      }
    }
  }
  if (roomIndex === null) return;
  if (userIndex === null) return;

  // 방에서 해당 유저 삭제
  rooms[roomIndex].users.splice(userIndex, 1);

  // 나가는 유저가 방장일 경우 방장 변경
  if (userId === rooms[roomIndex].ownerId && rooms[roomIndex].users.length > 0) {
    rooms[roomIndex].ownerId = rooms[roomIndex].users[0].id;
  }

  // 유저에게 success response 전달
  sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, {
    success: 1,
    fail: GlobalFailCode.NONE
  });

  // 모든 유저에게 해당 데이터 기반으로 업데이트
  for (let userIdx = 0; userIdx < rooms[roomIndex].users.length; userIdx++) {
    const roomUserSocket = socketSessions[rooms[roomIndex].users[userIdx].id];
    if (roomUserSocket) {
      sendPacket(roomUserSocket, config.packetType.LEAVE_ROOM_NOTIFICATION, {
        userId: userId
      });

      const sendData = {
        success: 1,
        room: rooms[roomIndex],
        failCode: GlobalFailCode.NONE
      };
      sendPacket(roomUserSocket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
    }
  }

  // 방에 roleType이 2와 4(player, boss)인 user가 0명일때 방을 없애기
  let isClosedRoom: boolean = true;
  for (let i = 0; i < rooms[roomIndex].users.length; i++) {
    const userRoleType = rooms[roomIndex].users[i].character.roleType;
    if (userRoleType === RoleType.SUR5VAL || userRoleType === RoleType.BOSS_MONSTER) {
      isClosedRoom = false;
      break;
    }
  }
  if (isClosedRoom) {
    rooms.splice(roomIndex, 1);
  }

  await setRedisData('roomData', rooms);
};
