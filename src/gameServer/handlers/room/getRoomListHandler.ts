import { sendPacket } from '../../../packet/createPacket.js';
import { config } from '../../../config/config.js';
import { convertSendRoomData, getRoomByUserId, getUserBySocket } from '../handlerMethod.js';
import { CustomSocket, Room } from '../../interface/interface.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';
import Server from '../../class/server.js';

export const getRoomListHandler = async (socket: CustomSocket) => {
  const rooms = Server.getInstance().getRooms();

  //console.log("방 목록 요청");

  const user = getUserBySocket(socket);
  if (!user) {
    console.log('getRoomListHandler user 없음');
    return;
  }

  const room = getRoomByUserId(user.getId());
  if (room && room.getRoomState() !== RoomStateType.INGAME) {
    const sendRoomData = convertSendRoomData(room);
    const sendData = {
      success: true,
      room: sendRoomData,
      failCode: GlobalFailCode.NONE
    };

    sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
    return;
  }

  const sendRooms: Room[] = [];
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].getRoomState() === RoomStateType.WAIT) {
      const sendRoomData = convertSendRoomData(rooms[i]);
      sendRooms.push(sendRoomData);
    }
  }

  sendPacket(socket, config.packetType.GET_ROOM_LIST_RESPONSE, { rooms: sendRooms });
};
