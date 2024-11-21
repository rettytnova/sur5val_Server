import { CharacterPositionData, CustomSocket, RedisUserData, Room, User } from '../../interface/interface.js';
import { GlobalFailCode, PhaseType } from '../enumTyps.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config, spawnPoint } from '../../config/config.js';
import {
  getRedisData,
  getRoomByUserId,
  getSocketByUser,
  getSocketByUserId,
  getUserBySocket,
  setRedisData
} from '../handlerMethod.js';
import { monsterMoveStart } from '../notification/monsterMove.js';
import { monsterSpawnStart } from '../notification/monsterSpawn.js';
import { randomNumber } from '../../utils/utils.js';

export const gameStartHandler = async (socket: CustomSocket, payload: Object) => {
  // 핸들러가 호출되면 success. response 만들어서 보냄
  // responseData = { success: true, failCode: GlobalFailCode.value }
  // sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData)
  try {
    // requset 보낸 유저
    const user: RedisUserData = await getUserBySocket(socket);
    const room = await getRoomByUserId(user.id);
    if (!room) return;
    const realUserNumber = room.users.length;
    await monsterSpawnStart(socket);
    // 유저가 있는 방 찾기
    if (user !== undefined) {
      if (room === null) {
        const responseData = {
          success: false,
          failCode: GlobalFailCode.INVALID_REQUEST
        };
        sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);

        return;
      }

      if (realUserNumber <= 1) {
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
      } else if (!characterPositionDatas[room.id]) {
        characterPositionDatas[room.id] = [];
      }

      const userPositionDatas = [];
      for (let i = 0; i < realUserNumber; i++) {
        // 랜덤 스폰포인트
        const spawnPointArray = Object.values(spawnPoint);
        const randomSpawnPoint = spawnPointArray[randomNumber(1, 10)];
        const characterPositionData: CharacterPositionData = {
          id: room.users[i].id,
          x: randomSpawnPoint.x,
          y: randomSpawnPoint.y
        };
        userPositionDatas.push(characterPositionData);
      }
      characterPositionDatas[room.id].unshift(...userPositionDatas);

      await setRedisData('characterPositionDatas', characterPositionDatas);

      // 방에있는 유저들에게 notifi 보내기
      console.log(room, characterPositionDatas);
      await phaseNotification(socket, 0);
      await phaseNotification(socket, 120000);
      await phaseNotification(socket, 240000);
      await monsterMoveStart(socket);
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

const phaseNotification = async (socket: CustomSocket, sendTime: number) => {
  setTimeout(async () => {
    const characterPositionDatas = await getRedisData('characterPositionDatas');
    const roomData: Room[] = await getRedisData('roomData');
    const user: User = await getUserBySocket(socket);

    let room: Room | null = null;
    if (!user) return;
    for (let i = 0; i < roomData.length; i++) {
      for (let j = 0; j < roomData[i].users.length; j++) {
        if (roomData[i].users[j].id === user.id) {
          room = roomData[i];
          break;
        }
      }
      if (room) break;
    }
    if (!room) return;

    for (let i = 0; i < room.users.length; i++) {
      const userSocket = await getSocketByUser(room.users[i]);
      const gameStateData = { phaseType: PhaseType.DAY, nextPhaseAt: Date.now() + 120000 };
      const notifiData = {
        gameState: gameStateData,
        users: room.users,
        characterPositions: characterPositionDatas[room.id]
      };
      if (userSocket) {
        sendPacket(userSocket, config.packetType.GAME_START_NOTIFICATION, notifiData);
      }
      // else {
      //   console.error('위치: gameStartHandler, 유저를 찾을 수 없습니다.');
      //   const responseData = {
      //     success: false,
      //     failCode: GlobalFailCode.INVALID_REQUEST
      //   };
      //   sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);
      // }
    }
  }, sendTime);
};
