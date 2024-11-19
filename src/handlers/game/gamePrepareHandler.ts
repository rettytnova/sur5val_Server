import net from 'net';
import { GlobalFailCode } from '../enumTyps.js';
import {
  CustomSocket,
  RedisUserData,
  Room,
  User,
} from '../../interface/interface.js';
import { config } from '../../config/config.js';
import { sendPacket } from '../../packet/createPacket.js';
import {
  getRoomByUserId,
  getRooms,
  getSocketByUser,
  getUserBySocket,
  setCharacterInfoInit,
  setRedisData,
} from '../handlerMethod.js';

export const gamePrepareHandler = async (
  socket: CustomSocket,
  payload: Object,
) => {
  try {
    // requset 보낸 유저
    const user: RedisUserData = await getUserBySocket(socket);

    // 유저가 있는 방 찾기
    if (user !== undefined) {
      const room: Room | null = await getRoomByUserId(user.id);
      if (room === null) {
        return;
      }
      if (room.users.length <= 1) {
        console.error('게임을 시작 할 수 없습니다(인원 부족).');
        const responseData = {
          success: false,
          failCode: GlobalFailCode.INVALID_REQUEST,
        };
        sendPacket(
          socket,
          config.packetType.GAME_PREPARE_RESPONSE,
          responseData,
        );
      } else {
        // 게임준비 시작 요건 충족
        const responseData = {
          success: true,
          failCode: GlobalFailCode.NONE,
        };
        sendPacket(
          socket,
          config.packetType.GAME_PREPARE_RESPONSE,
          responseData,
        );

        // 방에있는 유저들 캐릭터 정하기
        for (let i = 0; i < room.users.length; i++) {
          setCharacterInfoInit(room.users[i].character);
        }
        const rooms: Room[] | null = await getRooms();
        if (!rooms) {
          return;
        }

        for (let i = 0; i < rooms.length; i++) {
          if (rooms[i].id === room.id) {
            rooms[i] = room;
            break;
          }
        }

        // 레디스에 있는 룸 배열에서 user가 속해 있는 방을 수정하고,
        // 위에서 수정한 방이 포함되어 있는 전체 배열을 넣음
        await setRedisData('roomData', rooms);

        // sendPacket(socket, config.packetType.GAME_PREPARE_NOTIFICATION, {
        //   room,
        // });

        // 방에있는 유저들에게 notifi 보내기
        for (let i = 0; i < room.users.length; i++) {
          const userSocket = await getSocketByUser(room.users[i]);
          if (!userSocket) {
            console.error('gamePrepareHandler: socket not found');
            return;
          }
          //console.dir(room, { depth: null });
          sendPacket(userSocket, config.packetType.GAME_PREPARE_NOTIFICATION, {
            room,
          });
        }
      }
    } else {
      console.error('위치: gamePrepareHandler, 유저를 찾을 수 없습니다.');
      const responseData = {
        success: false,
        failCode: GlobalFailCode.INVALID_REQUEST,
      };
      sendPacket(socket, config.packetType.GAME_PREPARE_RESPONSE, responseData);
    }
  } catch (err) {
    const responseData = {
      success: false,
      failCode: GlobalFailCode.INVALID_REQUEST,
    };
    sendPacket(socket, config.packetType.GAME_PREPARE_RESPONSE, responseData);
    console.error('gameStartHandler 오류', err);
  }
};
