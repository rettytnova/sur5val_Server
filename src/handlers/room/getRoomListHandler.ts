import net from 'net';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { getRedisData } from '../handlerMethod.js';

export const getRoomListHandler = async (socket: net.Socket) => {
  const rooms = await getRedisData('roomData');
  if (!rooms) {
    console.error('getRoomListHandler 방 목록을 찾을 수 없음');
    return;
  }

  sendPacket(socket, config.packetType.GET_ROOM_LIST_RESPONSE, { rooms });
};
