import net from 'net';
import {
  CharacterPositionData,
  CustomSocket,
  RedisUserData,
} from '../../interface/interface.js';
import { GlobalFailCode, PhaseType } from '../enumTyps.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import {
  getRedisData,
  getRoomByUserId,
  getSocketByUser,
  getUserBySocket,
  setRedisData,
} from '../handlerMethod.js';

export const gameStartHandler = async (
  socket: CustomSocket,
  payload: Object,
) => {
  // 핸들러가 호출되면 success. response 만들어서 보냄
  // responseData = { success: true, failCode: GlobalFailCode.value }
  // sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData)
  try {
    // requset 보낸 유저
    const user: RedisUserData = await getUserBySocket(socket);
    // 유저가 있는 방 찾기
    if (user !== undefined) {
      const room = await getRoomByUserId(user.id);
      if (room === null) {
        const responseData = {
          success: false,
          failCode: GlobalFailCode.INVALID_REQUEST,
        };
        sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);

        return;
      }

      if (room.users.length <= 1) {
        console.error('게임을 시작 할 수 없습니다.(인원 부족)');
      }

      const responseData = {
        success: true,
        failCode: GlobalFailCode.NONE,
      };
      sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);

      let characterPositionDatas = await getRedisData('characterPositionDatas');
      if (!characterPositionDatas) {
        characterPositionDatas = { [room.id]: [] };
      } else {
        characterPositionDatas[room.id] = [];
      }

      for (let i = 0; i < room.users.length; i++) {
        // 위치 데이터
        const characterPositionData: CharacterPositionData = {
          id: room.users[i].id,
          x: 0 + 1 * i,
          y: 0 - 1 * i,
        };
        characterPositionDatas[room.id].push(characterPositionData);
      }

      await setRedisData('characterPostionDatas', characterPositionDatas);

      // // ------------------------------- 최성원 ------------------------
      // let characterPositionDatas = await getRedisData('characterPositionDatas');
      // if (!characterPositionDatas) characterPositionDatas = { [room.id]: [] };
      // else characterPositionDatas[room.id] = []

      // characterPositionDatas[room.id].push(characterPositionData); // [{id:1, x:2, y:3}, {id:1, x:2, y:3}, {id:1, x:2, y:3} ...]

      // await setRedisData('characterPositionDatas', characterPositionDatas);
      // // ------------------------------- 최성원 ------------------------
      // let characterPositionDatas: CharacterPositionData[] = [];
      // for (let i = 0; i < room.users.length; i++) {
      //   // 위치 데이터
      //   const characterPositionData: CharacterPositionData = {
      //     id: room.users[i].id,
      //     x: 0 + 12 * i,
      //     y: 0 - 12 * i,
      //   };
      //   characterPositionDatas.push(characterPositionData);
      // }

      // 방에있는 유저들에게 notifi 보내기
      for (let i = 0; i < room.users.length; i++) {
        const userSocket = await getSocketByUser(room.users[i]);
        if (!userSocket) {
          console.error('gameStartHandler: socket not found');
          const responseData = {
            success: false,
            failCode: GlobalFailCode.INVALID_REQUEST,
          };
          sendPacket(
            socket,
            config.packetType.GAME_START_RESPONSE,
            responseData,
          );
          return;
        }
        // noti 데이터
        const now = Date.now() + 300000;
        const gameStateData = { phaseType: PhaseType.DAY, nextPhaseAt: now };
        const notifiData = {
          gameState: gameStateData,
          users: room.users,
          characterPositions: characterPositionDatas[room.id],
        };

        sendPacket(
          userSocket,
          config.packetType.GAME_START_NOTIFICATION,
          notifiData,
        );
      }
    } else {
      console.error('위치: gameStartHandler, 유저를 찾을 수 없습니다.');

      const responseData = {
        success: false,
        failCode: GlobalFailCode.INVALID_REQUEST,
      };
      sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);
    }
  } catch (err) {
    const responseData = {
      success: false,
      failCode: GlobalFailCode.INVALID_REQUEST,
    };
    sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);
    console.log('gameStartHandler 오류', err);
  }
};
