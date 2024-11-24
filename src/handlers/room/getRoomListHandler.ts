import net from 'net';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { getRedisData } from '../handlerMethod.js';
import { Room } from '../../interface/interface.js';
import { RoomStateType } from '../enumTyps.js';

export const getRoomListHandler = async (socket: net.Socket) => {
  const rooms: Room[] | undefined = await getRedisData('roomData');
  if (rooms === undefined) return;
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
