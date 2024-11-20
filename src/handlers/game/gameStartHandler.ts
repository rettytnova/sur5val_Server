import net from 'net';
import { CharacterPositionData, CustomSocket, RedisUserData } from '../../interface/interface.js';
import { GlobalFailCode, PhaseType } from '../enumTyps.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config, spawnPoint } from '../../config/config.js';
import { getRedisData, getRoomByUserId, getSocketByUser, getUserBySocket, setRedisData } from '../handlerMethod.js';
import { randomNumber } from '../../utils/utils.js';

export const gameStartHandler = async (socket: CustomSocket, payload: Object) => {
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
          failCode: GlobalFailCode.INVALID_REQUEST
        };
        sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);

        return;
      }

      if (room.users.length <= 1) {
        console.error('게임을 시작 할 수 없습니다.(인원 부족)');
      }

      const responseData = {
        success: true,
        failCode: GlobalFailCode.NONE
      };
      sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);

      let characterPositionDatas = await getRedisData('characterPositionDatas');
      if (!characterPositionDatas) {
        characterPositionDatas = { [room.id]: [] };
      } else {
        characterPositionDatas[room.id] = [];
      }

      for (let i = 0; i < room.users.length; i++) {
        // 랜덤 스폰포인트
        const spawnPointArray = Object.values(spawnPoint);
        const randomSpawnPoint = spawnPointArray[randomNumber(1, 20)];
        const characterPositionData: CharacterPositionData = {
          id: room.users[i].id,
          x: randomSpawnPoint.x,
          y: randomSpawnPoint.y
        };
        characterPositionDatas[room.id].push(characterPositionData);
      }

      await setRedisData('characterPositionDatas', characterPositionDatas);

      // 방에있는 유저들에게 notifi 보내기
      for (let i = 0; i < room.users.length; i++) {
        const userSocket = await getSocketByUser(room.users[i]);
        if (!userSocket) {
          console.error('gameStartHandler: socket not found');
          const responseData = {
            success: false,
            failCode: GlobalFailCode.INVALID_REQUEST
          };
          sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);
          return;
        }
        // noti 데이터
        const now = Date.now() + 300000;
        const gameStateData = { phaseType: PhaseType.DAY, nextPhaseAt: now };
        const notifiData = {
          gameState: gameStateData,
          users: room.users,
          characterPositions: characterPositionDatas[room.id]
        };

        sendPacket(userSocket, config.packetType.GAME_START_NOTIFICATION, notifiData);
      }
    } else {
      console.error('위치: gameStartHandler, 유저를 찾을 수 없습니다.');

      const responseData = {
        success: false,
        failCode: GlobalFailCode.INVALID_REQUEST
      };
      sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);
    }
  } catch (err) {
    const responseData = {
      success: false,
      failCode: GlobalFailCode.INVALID_REQUEST
    };
    sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);
    console.log('gameStartHandler 오류', err);
  }
};
