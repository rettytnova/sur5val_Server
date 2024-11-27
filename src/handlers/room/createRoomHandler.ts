import net from 'net';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { getRedisData, getUserBySocket, setRedisData } from '../handlerMethod.js';
import { CreateRoomPayload, CustomSocket, RedisUserData, Room, User } from '../../interface/interface.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';

let gRoomId = 1;

export const createRoomHandler = async (socket: net.Socket, payload: Object) => {
  let failCode: Number = GlobalFailCode.NONE;
  let success: boolean = true;
  let roomDatas: Room[] = [];
  let newRoom;

  const createRoomPayload = payload as CreateRoomPayload;

  const redisUserData: RedisUserData | null = await getUserBySocket(socket as CustomSocket);
  if (!redisUserData) {
    success = false;
    failCode = GlobalFailCode.CREATE_ROOM_FAILED;
  } else {
    // 이미 참여중인 방이 있는지 검사
    const rooms = await getRedisData('roomData');
    if (rooms) {
      for (let i = 0; i < rooms.length; i++) {
        for (let j = 0; j < rooms[i].users.length; j++) {
          if (rooms[i].users[j].id === redisUserData.id) {
            console.error('이미 참여중인 방이 존재합니다.');
            const sendData = {
              success: 0,
              room: {},
              failCode: GlobalFailCode.JOIN_ROOM_FAILED
            };
            sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
            return;
          }
        }
      }
    }

    // 클라로부터 받은 roomName과 maxUserNum이 undefine과 null이 아닐 경우
    if (!createRoomPayload.name || !createRoomPayload.maxUserNum) {
      success = false;
      failCode = GlobalFailCode.CREATE_ROOM_FAILED;
    } else {
      const users: User[] = [];
      users.push(redisUserData);
      createRoomPayload.maxUserNum = 5;

      roomDatas = await getRedisData('roomData');
      if (!roomDatas) {
        newRoom = {
          id: gRoomId,
          ownerId: redisUserData.id,
          name: createRoomPayload.name,
          maxUserNum: createRoomPayload.maxUserNum,
          state: RoomStateType.WAIT,
          users: users
        };

        roomDatas = [newRoom];

        await setRedisData('roomData', roomDatas);

        gRoomId++;
      } else {
        let existRoom = false;

        // 방을 이미 만들었는지 검사
        for (let i = 0; i < roomDatas.length; i++) {
          if (roomDatas[i].ownerId === redisUserData.id) {
            existRoom = true;
            break;
          }
        }

        if (existRoom === false) {
          newRoom = {
            id: gRoomId,
            ownerId: redisUserData.id,
            name: createRoomPayload.name,
            maxUserNum: createRoomPayload.maxUserNum,
            state: RoomStateType.WAIT,
            users: users
          };

          roomDatas.push(newRoom);

          await setRedisData('roomData', roomDatas);

          gRoomId++;
        } else {
          success = false;
          failCode = GlobalFailCode.CREATE_ROOM_FAILED;
        }
      }
    }

    sendPacket(socket, config.packetType.CREATE_ROOM_RESPONSE, {
      success,
      room: newRoom,
      failCode
    });
  }
};
