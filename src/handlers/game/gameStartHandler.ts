import { CharacterPositionData, CustomSocket, RedisUserData, Room, User } from '../../interface/interface.js';
import { GlobalFailCode, PhaseType } from '../enumTyps.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config, spawnPoint } from '../../config/config.js';
import { getRedisData, getRoomByUserId, getSocketByUser, getUserBySocket, setRedisData } from '../handlerMethod.js';
import { monsterMoveStart } from '../notification/monsterMove.js';
import { monsterSpawnStart } from '../notification/monsterSpawn.js';
import { randomNumber } from '../../utils/utils.js';

const roundPlayTime = 60000;
const totalRound = 4;

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
    // await monsterSpawnStart(socket, 1);
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
      const roomData = await getRoomByUserId(user.id);
      if (!roomData) return;
      for (let i = 0; i < totalRound; i++) {
        await phaseNotification(i + 1, room.id, roundPlayTime * i);
      }
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

const phaseNotification = async (level: number, roomId: number, sendTime: number) => {
  setTimeout(async () => {
    await monsterSpawnStart(roomId, level);
    const characterPositionDatas = await getRedisData('characterPositionDatas');
    const roomData: Room[] = await getRedisData('roomData');

    let room: Room | null = null;
    for (let i = 0; i < roomData.length; i++) {
      if (roomData[i].id === roomId) {
        room = roomData[i];
        break;
      }
    }
    if (!room) return;

    for (let i = 0; i < room.users.length; i++) {
      const userSocket = await getSocketByUser(room.users[i]);
      const gameStateData = { phaseType: PhaseType.DAY, nextPhaseAt: Date.now() + roundPlayTime };
      const notifiData = {
        gameState: gameStateData,
        users: room.users,
        characterPositions: characterPositionDatas[roomId]
      };
      if (userSocket) {
        sendPacket(userSocket, config.packetType.GAME_START_NOTIFICATION, notifiData);
      }
    }
    await monsterMoveStart(roomId, roundPlayTime);
  }, sendTime);
};
