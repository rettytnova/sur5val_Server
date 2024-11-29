import { CharacterPositionData, CustomSocket, RedisUserData, Room } from '../../interface/interface.js';
import { GlobalFailCode, PhaseType, RoleType, CardType, RoomStateType } from '../enumTyps.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config, spawnPoint, inGameTime, normalRound, bossGameTime } from '../../config/config.js';
import { getRedisData, getUserIdBySocket, nonSameRandom, setRedisData } from '../handlerMethod.js';
import { monsterMoveStart } from '../coreMethod/monsterMove.js';
import { monsterSpawnStart } from '../coreMethod/monsterSpawn.js';
import { socketSessions } from '../../session/socketSession.js';
import { inGameTimeSessions } from '../../session/inGameTimeSession.js';
import { gameEndNotification } from '../notification/gameEnd.js';
import { fleaMarketCardCreate } from '../coreMethod/fleaMarketCardCreate.js';
import { fleaMarketOpenHandler } from '../market/fleaMarketOpenHandler.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';

export let monsterLevel: number = 0;

export const gameStartHandler = async (socket: CustomSocket, payload: Object) => {
  // 핸들러가 호출되면 success. response 만들어서 보냄
  // responseData = { success: true, failCode: GlobalFailCode.value }
  // sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData)
  try {
    // requset 보낸 유저
    const userId: number | null = await getUserIdBySocket(socket);
    const rooms: Room[] = await getRedisData('roomData');
    const room = rooms.find((room) => room.users.some((roomUser) => roomUser.id === userId));
    if (!room) {
      console.error('getRoomByUserId: Room not found');
      return null;
    }

    if (!room) return;
    const realUserNumber = room.users.length;
    // 유저가 있는 방 찾기
    if (userId !== undefined) {
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

      const randomIndex = nonSameRandom(1, 10, realUserNumber);
      const userPositionDatas = [];
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

      // 방에있는 유저들에게 게임 시작 notificationn 보내기, 게임 시작 시간 저장
      room.state = RoomStateType.INGAME;
      monsterLevel = 1;
      await setRedisData('roomData', rooms);
      for (let i = 0; i < normalRound; i++) {
        await setBossStat(room);
        await normalPhaseNotification(i + 1, room.id, inGameTime * i);
        monsterLevel++;
      }
      await setBossStat(room);
      bossPhaseNotification(normalRound + 1, room.id, inGameTime * normalRound);
      inGameTimeSessions[room.id] = Date.now();

      // 게임 종료 notification 보내기
      setTimeout(
        async () => {
          await gameEndNotification(room.id, 4);
        },
        inGameTime * normalRound + bossGameTime
      );

      for (let i = 0; i < room.users.length; i++) {
        if (room.users[i].character.roleType !== 1) {
          const roomUserSocket = socketSessions[room.users[i].id];
          setTimeout(async () => {
            await fleaMarketOpenHandler(roomUserSocket);
          }, 5000);
        }
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

// 일반 라운드 시작
export const normalPhaseNotification = async (level: number, roomId: number, sendTime: number) => {
  setTimeout(async () => {
    await fleaMarketCardCreate(level, roomId);
    shoppingUserIdSessions[roomId] = [];
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

    const gameStateData = { phaseType: PhaseType.DAY, nextPhaseAt: Date.now() + inGameTime };
    const notifiData = {
      gameState: gameStateData,
      users: room.users,
      characterPositions: characterPositionDatas[roomId]
    };
    for (let i = 0; i < room.users.length; i++) {
      const userSocket = socketSessions[room.users[i].id];
      if (userSocket) {
        sendPacket(userSocket, config.packetType.GAME_START_NOTIFICATION, notifiData);
      }
    }

    await monsterMoveStart(roomId, inGameTime);
  }, sendTime);
};

// 보스 라운드 시작
export const bossPhaseNotification = async (level: number, roomId: number, sendTime: number) => {
  setTimeout(async () => {
    await fleaMarketCardCreate(level, roomId);
    shoppingUserIdSessions[roomId] = [];
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

    const gameStateData = { phaseType: PhaseType.DAY, nextPhaseAt: Date.now() + bossGameTime };
    const notifiData = {
      gameState: gameStateData,
      users: room.users,
      characterPositions: characterPositionDatas[roomId]
    };
    for (let i = 0; i < room.users.length; i++) {
      const userSocket = socketSessions[room.users[i].id];
      if (userSocket) {
        sendPacket(userSocket, config.packetType.GAME_START_NOTIFICATION, notifiData);
        sendPacket(userSocket, config.packetType.REACTION_RESPONSE, { success: 1, failCode: roomId });
      }
    }
    await monsterMoveStart(roomId, bossGameTime);
  }, sendTime);
};

export const setBossStat = async (room: Room) => {
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === RoleType.BOSS_MONSTER) {
      room.users[i].character.aliveState = true;
      room.users[i].character.gold = 500 * monsterLevel;
      room.users[i].character.hp = 1000 * monsterLevel;
      room.users[i].character.maxHp = room.users[i].character.hp;
      room.users[i].character.mp = 30 * monsterLevel;
      room.users[i].character.attack = 10 * monsterLevel;
      room.users[i].character.armor = 2 * monsterLevel;

      switch (monsterLevel) {
        case 1: // 일반 라운드
          room.users[i].character.handCards = [
            { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
            { type: CardType.MAGICIAN_EXTENDED_SKILL, count: 1 },
            { type: CardType.BASIC_HP_POTION, count: 3 * monsterLevel },
            { type: CardType.BASIC_WEAPON, count: 1 },
            { type: CardType.BASIC_HEAD, count: 1 },
            { type: CardType.BASIC_ARMOR, count: 1 },
            { type: CardType.BASIC_CLOAK, count: 1 },
            { type: CardType.BASIC_GLOVE, count: 1 }
          ];
          break;
        case 2: // 일반 라운드
          room.users[i].character.handCards = [
            { type: CardType.WARRIOR_BASIC_SKILL, count: 1 },
            { type: CardType.ARCHER_BASIC_SKILL, count: 1 },
            { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
            { type: CardType.PALADIN_BASIC_SKILL, count: 1 },
            { type: CardType.BASIC_HP_POTION, count: 3 * monsterLevel },
            { type: CardType.BASIC_WEAPON, count: 1 },
            { type: CardType.BASIC_HEAD, count: 1 },
            { type: CardType.BASIC_ARMOR, count: 1 },
            { type: CardType.BASIC_CLOAK, count: 1 },
            { type: CardType.BASIC_GLOVE, count: 1 }
          ];
          break;
        case 3: // 일반 라운드
          room.users[i].character.handCards = [
            { type: CardType.WARRIOR_BASIC_SKILL, count: 1 },
            { type: CardType.ARCHER_BASIC_SKILL, count: 1 },
            { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
            { type: CardType.PALADIN_BASIC_SKILL, count: 1 },
            { type: CardType.WARRIOR_EXTENDED_SKILL, count: 1 },
            { type: CardType.ARCHER_EXTENDED_SKILL, count: 1 },
            { type: CardType.BASIC_HP_POTION, count: 3 * monsterLevel },
            { type: CardType.BASIC_WEAPON, count: 1 },
            { type: CardType.BASIC_HEAD, count: 1 },
            { type: CardType.BASIC_ARMOR, count: 1 },
            { type: CardType.BASIC_CLOAK, count: 1 },
            { type: CardType.BASIC_GLOVE, count: 1 }
          ];
          break;
        case 4: // 일반 라운드
          room.users[i].character.handCards = [
            { type: CardType.WARRIOR_BASIC_SKILL, count: 1 },
            { type: CardType.ARCHER_BASIC_SKILL, count: 1 },
            { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
            { type: CardType.PALADIN_BASIC_SKILL, count: 1 },
            { type: CardType.WARRIOR_EXTENDED_SKILL, count: 1 },
            { type: CardType.ARCHER_EXTENDED_SKILL, count: 1 },
            { type: CardType.MAGICIAN_EXTENDED_SKILL, count: 1 },
            { type: CardType.PALADIN_EXTENDED_SKILL, count: 1 },
            { type: CardType.BASIC_HP_POTION, count: 3 * monsterLevel },
            { type: CardType.BASIC_WEAPON, count: 1 },
            { type: CardType.BASIC_HEAD, count: 1 },
            { type: CardType.BASIC_ARMOR, count: 1 },
            { type: CardType.BASIC_CLOAK, count: 1 },
            { type: CardType.BASIC_GLOVE, count: 1 }
          ];
          break;
        case 5: // 보스 라운드
          room.users[i].character.handCards = [
            { type: CardType.WARRIOR_BASIC_SKILL, count: 1 },
            { type: CardType.ARCHER_BASIC_SKILL, count: 1 },
            { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
            { type: CardType.PALADIN_BASIC_SKILL, count: 1 },
            { type: CardType.WARRIOR_EXTENDED_SKILL, count: 1 },
            { type: CardType.ARCHER_EXTENDED_SKILL, count: 1 },
            { type: CardType.MAGICIAN_EXTENDED_SKILL, count: 1 },
            { type: CardType.PALADIN_EXTENDED_SKILL, count: 1 },
            { type: CardType.BASIC_HP_POTION, count: 5 * monsterLevel },
            { type: CardType.BASIC_WEAPON, count: 1 },
            { type: CardType.BASIC_HEAD, count: 1 },
            { type: CardType.BASIC_ARMOR, count: 1 },
            { type: CardType.BASIC_CLOAK, count: 1 },
            { type: CardType.BASIC_GLOVE, count: 1 }
          ];
          break;
        default:
          console.log('보스 스텟 설정을 위한 라운드(monsterLevel)의 값이 잘못되었습니다.:', monsterLevel);
          return;
      }
      console.log(
        `${monsterLevel}라운드 보스 스펙 - hp:${room.users[i].character.hp}, mp:${room.users[i].character.mp}, atk:${room.users[i].character.attack}, armor:${room.users[i].character.armor}, gold:${room.users[i].character.gold}`
      );
      return;
    }
  }
};
