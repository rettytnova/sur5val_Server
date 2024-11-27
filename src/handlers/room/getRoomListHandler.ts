import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { getRedisData, getUserBySocket } from '../handlerMethod.js';
import { CustomSocket, Room, User } from '../../interface/interface.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';

export const getRoomListHandler = async (socket: CustomSocket) => {
  const rooms: Room[] | undefined = await getRedisData('roomData');
  const user: User = await getUserBySocket(socket);
  if (rooms === undefined) return;
  for (let i = 0; i < rooms.length; i++) {
    for (let j = 0; j < rooms[i].users.length; j++) {
      if (rooms[i].users[j].id === user.id) {
        const sendData = {
          success: 1,
          room: rooms[i],
          failCode: GlobalFailCode.NONE
        };
        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
      }
    }
  }

  const waitRooms = [];
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].state === RoomStateType.WAIT) waitRooms.push(rooms[i]);
  }
  if (!rooms) {
    console.error('getRoomListHandler 방 목록을 찾을 수 없음');
    return;
  }

  sendPacket(socket, config.packetType.GET_ROOM_LIST_RESPONSE, { rooms: waitRooms });
};
