import { CharacterPositionData, CustomSocket, RedisUserData, Room, User } from '../../interface/interface.js';
import { GlobalFailCode, PhaseType, RoomStateType } from '../enumTyps.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config, spawnPoint, inGameTime, totalRound } from '../../config/config.js';
import { getRedisData, getUserBySocket, nonSameRandom, setRedisData } from '../handlerMethod.js';
import { monsterMoveStart } from '../coreMethod/monsterMove.js';
import { monsterSpawnStart } from '../coreMethod/monsterSpawn.js';
import { socketSessions } from '../../session/socketSession.js';
import { inGameTimeSessions } from '../../session/inGameTimeSession.js';

export const gameStartHandler = async (socket: CustomSocket, payload: Object) => {
  // 핸들러가 호출되면 success. response 만들어서 보냄
  // responseData = { success: true, failCode: GlobalFailCode.value }
  // sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData)
  try {
    // requset 보낸 유저
    const user: RedisUserData = await getUserBySocket(socket);
    const rooms: Room[] = await getRedisData('roomData');
    const room = rooms.find((room) => room.users.some((roomUser) => roomUser.id === user.id));
    if (!room) {
      console.error('getRoomByUserId: Room not found');
      return null;
    }

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

        const responseData = {
          success: false,
          failCode: GlobalFailCode.INVALID_REQUEST
        };
        sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);
        room.state = RoomStateType.WAIT;

        // 기존room을 없애기, newRoom을 기존 room데이터로 만들어서 push해주기, 방참가response 보내기
        // for (let i = 0; i < rooms.length; i++) {
        //   if (rooms[i].id === room.id) {
        //     rooms.splice(i, 1);
        //     break;
        //   }
        // }
        // const newRoom = {
        //   id: room.id + 1,
        //   ownerId: room.ownerId,
        //   name: room.name,
        //   maxUserNum: room.maxUserNum,
        //   state: RoomStateType.WAIT,
        //   users: room.users
        // };
        // sendPacket(socket, config.packetType.CREATE_ROOM_RESPONSE, {
        //   success: 1,
        //   room: newRoom,
        //   failCode: 0
        // });

        // for (let i = 0; i < newRoom.users.length; i++) {
        //   const roomUserSocket = socketSessions[newRoom.users[i].id];
        //   const sendData = {
        //     success: 1,
        //     room: newRoom,
        //     failCode: GlobalFailCode.NONE
        //   };
        //   if (roomUserSocket)
        //     sendPacket(roomUserSocket, config.packetType.JOIN_ROOM_RESPONSE, sendData), console.log('방 참가');
        // }

        await setRedisData('roomData', rooms);
        return;
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

      // const userPositionDatas = [];
      // for (let i = 0; i < realUserNumber; i++) {
      //   // 랜덤 스폰포인트
      //   const randomSpawnPoint = spawnPoint[randomNumber(1, 10)];
      //   const characterPositionData: CharacterPositionData = {
      //     id: room.users[i].id,
      //     x: randomSpawnPoint.x,
      //     y: randomSpawnPoint.y
      //   };
      //   userPositionDatas.push(characterPositionData);
      // }
      const randomIndex = nonSameRandom(1, 10, realUserNumber);
      const userPositionDatas = [];
      console.log(randomIndex);
      for (let i = 0; i < realUserNumber; i++) {
        // 랜덤 스폰포인트
        const randomSpawnPoint = spawnPoint[randomIndex[i]];
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
      room.state = RoomStateType.INGAME;
      await setRedisData('roomData', rooms);
      for (let i = 0; i < totalRound; i++) {
        await phaseNotification(i + 1, room.id, inGameTime * i);
      }
      inGameTimeSessions[room.id] = Date.now();
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

export const phaseNotification = async (level: number, roomId: number, sendTime: number) => {
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
      const userSocket = socketSessions[room.users[i].id];
      const gameStateData = { phaseType: PhaseType.DAY, nextPhaseAt: Date.now() + inGameTime };
      const notifiData = {
        gameState: gameStateData,
        users: room.users,
        characterPositions: characterPositionDatas[roomId]
      };
      if (userSocket) {
        sendPacket(userSocket, config.packetType.GAME_START_NOTIFICATION, notifiData);
      }
    }
    await monsterMoveStart(roomId, inGameTime);
  }, sendTime);
};
