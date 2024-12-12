import { CustomSocket, Room } from '../../../gameServer/interface/interface.js';
import { CardType, GlobalFailCode, PhaseType, RoleType, RoomStateType } from '../enumTyps.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { config } from '../../../config/config.js';
import { getRedisData, getUserIdBySocket, setRedisData } from '../handlerMethod.js';
import { monsterMoveStart } from '../coreMethod/monsterMove.js';
import { monsterSpawnStart } from '../coreMethod/monsterSpawn.js';
import { socketSessions } from '../../session/socketSession.js';
import { inGameTimeSessions } from '../../session/inGameTimeSession.js';
import { gameEndNotification } from '../notification/gameEnd.js';
import { fleaMarketCardCreate } from '../coreMethod/fleaMarketCardCreate.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { userUpdateNotification } from '../notification/userUpdate.js';
import Server from '../../class/server.js';
import { randomNumber } from '../../../utils/utils.js';

// 게임 시작 함수 호출
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

      // 방에있는 유저들에게 게임 시작 notificationn 보내기, 게임 시작 시간 저장
      room.state = RoomStateType.INGAME;
      const initGameInfo = Server.getInstance().initGameInfo;
      if (!initGameInfo) return;
      const inGameTime = initGameInfo[0].normalRoundTime;
      const normalRound = initGameInfo[0].normalRoundNumber;
      const bossGameTime = initGameInfo[0].bossRoundTime;
      await setRedisData('roomData', rooms);
      for (let i = 0; i < normalRound; i++) {
        await normalPhaseNotification(i + 1, room.id, inGameTime * i);
      }
      await bossPhaseNotification(normalRound + 1, room.id, inGameTime * normalRound);
      inGameTimeSessions[room.id] = Date.now();

      // 게임 종료 notification 보내기
      setTimeout(
        async () => {
          await gameEndNotification(room.id, 4);
        },
        inGameTime * normalRound + bossGameTime
      );
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
    await monsterSpawnStart(roomId, level, -1);
    const characterPositionDatas = await getRedisData('characterPositionDatas');
    const rooms: Room[] = await getRedisData('roomData');
    let room: Room | null = null;
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].id === roomId) {
        room = rooms[i];
        break;
      }
    }
    if (!room) return;
    if (room.id !== roomId) return;
    setBossStat(room, level);

    const initGameInfo = Server.getInstance().initGameInfo;
    if (!initGameInfo) return;
    const inGameTime = initGameInfo[0].normalRoundTime;
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
    await userUpdateNotification(room);
    await setRedisData('roomData', rooms);
  }, sendTime);
};

// 보스 라운드 시작
export const bossPhaseNotification = async (level: number, roomId: number, sendTime: number) => {
  setTimeout(async () => {
    await fleaMarketCardCreate(level, roomId);
    shoppingUserIdSessions[roomId] = [];
    const idx: number = randomNumber(0, 3);
    await monsterSpawnStart(roomId, level, idx);
    const characterPositionDatas = await getRedisData('characterPositionDatas');
    const rooms: Room[] = await getRedisData('roomData');
    let room: Room | null = null;
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].id === roomId) {
        room = rooms[i];
        break;
      }
    }
    if (!room) return;
    if (room.id !== roomId) return;
    setBossStat(room, level);
    await setRedisData('roomData', rooms);

    const initGameInfo = Server.getInstance().initGameInfo;
    if (!initGameInfo) return;
    const bossGameTime = initGameInfo[0].bossRoundTime;
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
        sendPacket(userSocket, config.packetType.REACTION_RESPONSE, { success: 1, failCode: idx });
      }
    }
    await monsterMoveStart(roomId, bossGameTime);
  }, sendTime);
};

// 보스 스탯 상승
export const setBossStat = (room: Room, level: number) => {
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === RoleType.BOSS_MONSTER) {
      room.users[i].character.aliveState = true;
      // room.users[i].character.gold = 500 * level;
      // room.users[i].character.hp = 1000 * level;
      // room.users[i].character.maxHp = room.users[i].character.hp;
      // room.users[i].character.mp = 30 * level;
      room.users[i].character.attack = 10 * level;
      room.users[i].character.armor = 1 * level;

      switch (level) {
        case 1: // 일반 라운드
          room.users[i].character.handCards = [];
          break;
        case 2: // 일반 라운드
          room.users[i].character.handCards = [];
          break;
        case 3: // 일반 라운드
          room.users[i].character.handCards = [];
          break;
        case 4: // 일반 라운드
          room.users[i].character.handCards = [];
          break;
        case 5: // 보스 라운드
          room.users[i].character.handCards = [{ type: CardType.BOSS_EXTENDED_SKILL, count: 1 }];
          break;
        default:
          console.log('보스 스텟 설정을 위한 라운드(level)의 값이 잘못되었습니다.:', level);
          return;
      }
      // console.log(
      //   `${level}라운드 보스 스펙 - hp:${room.users[i].character.hp}, mp:${room.users[i].character.mp}, atk:${room.users[i].character.attack}, armor:${room.users[i].character.armor}, wallet gold:${room.users[i].character.gold}`
      // );
      return;
    }
  }
};
