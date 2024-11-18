import net from 'net';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import {
  getRedisData,
  getUserBySocket,
  setRedisData,
} from '../handlerMethod.js';
import {
  CreateRoomPayload,
  CustomSocket,
  Room,
  User,
} from '../../interface/interface.js';

let gRoomId = 1;

export const createRoomHandler = async (
  socket: net.Socket,
  payload: Object,
) => {
  let failCode = 0;
  let success = true;

  const createRoomPayload = payload as CreateRoomPayload;

  const redisUserData: User | null = await getUserBySocket(
    socket as CustomSocket,
  );
  if (!redisUserData) {
    success = false;
    failCode = 4;
  } else {
    // 클라로부터 받은 roomName과 maxUserNum이 undefine과 null이 아닐 경우
    if (!createRoomPayload.name || !createRoomPayload.maxUserNum) {
      success = false;
      failCode = 4;
    } else {
      let existRoom = false;

      const users: User[] = [];
      users.push(redisUserData);

      const rooms = await getRedisData('roomData');
      if (!rooms) {
        const noRoom: Room[] = [];
        const newRoom: Room = {
          id: gRoomId,
          ownerId: redisUserData.id,
          name: createRoomPayload.name,
          maxUserNum: createRoomPayload.maxUserNum,
          state: 0,
          users: users,
        };
        noRoom.push(newRoom);
        gRoomId++;

        await setRedisData('roomData', noRoom);

        sendPacket(socket, config.packetType.CREATE_ROOM_RESPONSE, {
          success,
          room: newRoom,
          failCode,
        });
      } else {
        // 방을 이미 만들었는지 검사
        for (let i = 0; i < rooms.length; i++) {
          if (rooms[i].ownerId === redisUserData.id) {
            existRoom = true;
            break;
          }
        }

        if (existRoom === false) {
          const newRoom: Room = {
            id: gRoomId,
            ownerId: redisUserData.id,
            name: createRoomPayload.name,
            maxUserNum: createRoomPayload.maxUserNum,
            state: 0,
            users: users,
          };

          rooms.push(newRoom);

          await setRedisData('roomData', rooms);

          gRoomId++;

          sendPacket(socket, config.packetType.CREATE_ROOM_RESPONSE, {
            success,
            room: newRoom,
            failCode,
          });
        } else {
          success = false;
          failCode = 4;
        }
      }
    }
  }
};
