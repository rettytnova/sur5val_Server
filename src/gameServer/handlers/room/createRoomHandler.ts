import { sendPacket } from '../../../packet/createPacket.js';
import { config } from '../../../config/config.js';
import { CreateRoomPayload, CustomSocket, RoomData } from '../../interface/interface.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';
import Server from '../../class/server.js';
import GameRoom from '../../class/room.js';
import { convertSendRoomData, getUserBySocket } from '../handlerMethod.js';
import UserSessions from '../../class/userSessions.js';

let gRoomId: number = 1;
export const getgRoomId = () => {
  return gRoomId;
};
export const addgRoomId = () => {
  gRoomId++;
};

export const createRoomHandler = async (socket: CustomSocket, payload: Object) => {
  let failCode: Number = GlobalFailCode.NONE;
  let success: boolean = true;

  let sendRoomInfo;

  const createRoomPayload = payload as CreateRoomPayload;

  createRoomPayload.maxUserNum = 5;

  const user = getUserBySocket(socket);
  if (!user) {
    success = false;
    failCode = GlobalFailCode.CREATE_ROOM_FAILED;
  } else {
    const rooms = Server.getInstance().getRooms();
    if (!rooms) {
      return;
    }

    for (let i = 0; i < rooms.length; i++) {
      for (let j = 0; j < rooms[i].getUsers().length; j++) {
        if (rooms[i].getUsers()[j].getId() === user.getId()) {
          console.error(`이미 참여중인 방 [${rooms[i]}] 이 있습니다.`);
          const sendData = {
            success: false,
            room: {},
            failCode: GlobalFailCode.JOIN_ROOM_FAILED
          };

          sendPacket(socket, config.packetType.JOIN_ROOM_REQUEST, sendData);
          return;
        }
      }
    }

    if (!createRoomPayload.name || !createRoomPayload.maxUserNum) {
      success = false;
      failCode = GlobalFailCode.CREATE_ROOM_FAILED;
    } else {
      const rooms = Server.getInstance().getRooms();
      if (!rooms) {
        return;
      }

      const room = rooms.find((room: GameRoom) => room.getRoomOwnerId() === user.getId());
      if (!room) {
        const users: UserSessions[] = [];
        users.push(user);

        const newRoomInfo: RoomData = {
          id: gRoomId,
          ownerId: user.getId(),
          ownerEmail: user.getEmail(),
          name: createRoomPayload.name,
          maxUserNum: createRoomPayload.maxUserNum,
          state: RoomStateType.WAIT,
          users: users
        };

        const newGameRoom: GameRoom = new GameRoom(newRoomInfo);
        newGameRoom.setUsers(users);
        Server.getInstance().getRooms().push(newGameRoom);

        sendRoomInfo = convertSendRoomData(newGameRoom);

        gRoomId++;
      } else {
        success = false;
        failCode = GlobalFailCode.CREATE_ROOM_FAILED;
      }

      Server.getInstance().chattingServerSend(config.chattingPacketType.CHATTING_CREATE_ROOM_REQUEST, {
        email: user.getEmail()
      });
    }

    sendPacket(socket, config.packetType.CREATE_ROOM_RESPONSE, {
      success,
      room: sendRoomInfo,
      failCode
    });
  }
};
