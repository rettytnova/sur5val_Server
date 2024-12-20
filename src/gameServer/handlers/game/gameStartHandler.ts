﻿import { CustomSocket, Room } from '../../../gameServer/interface/interface.js';
import { CardType, GlobalFailCode, PhaseType, RoleType, RoomStateType } from '../enumTyps.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { config } from '../../../config/config.js';
import { convertSendRoomData, getRoomByUserId, getUserBySocket } from '../handlerMethod.js';
import { socketSessions } from '../../session/socketSession.js';
import { inGameTimeSessions } from '../../session/inGameTimeSession.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import Server from '../../class/server.js';
import { randomNumber } from '../../../utils/utils.js';
import GameRoom from '../../class/room.js';
import { monsterSpawnStart } from '../coreMethod/monsterSpawn.js';
import { userUpdateNotification } from '../notification/userUpdate.js';
import { fleaMarketCardCreate } from '../coreMethod/fleaMarketCardCreate.js';
import { monsterMoveStart } from '../coreMethod/monsterMove.js';
import { gameEndNotification } from '../notification/gameEnd.js';

// 게임 시작 함수 호출
export const gameStartHandler = (socket: CustomSocket) => {
  try {
    // requset 보낸 유저
    const user = getUserBySocket(socket);
    if (!user) {
      console.error('getUserBySocket: User not found');
      return;
    }
    const room = getRoomByUserId(user.getId());
    if (!room) {
      console.error('getRoomByUserId: Room not found');
      return;
    }

    const realUserNumber = room.getUsers().length;
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
        room.setRoomState(RoomStateType.WAIT);
        return;
      }

      const responseData = {
        success: true,
        failCode: GlobalFailCode.NONE
      };
      sendPacket(socket, config.packetType.GAME_START_RESPONSE, responseData);

      // 방에있는 유저들에게 게임 시작 notificationn 보내기, 게임 시작 시간 저장
      room.setRoomState(RoomStateType.INGAME);
      const initGameInfo = Server.getInstance().initGameInfo;
      if (!initGameInfo) return;
      const inGameTime = initGameInfo[0].normalRoundTime;
      const normalRound = initGameInfo[0].normalRoundNumber;
      const bossGameTime = initGameInfo[0].bossRoundTime;

      for (let i = 0; i < normalRound; i++) {
        normalPhaseNotification(i + 1, room.getRoomId(), inGameTime * i);
      }
      bossPhaseNotification(normalRound + 1, room.getRoomId(), inGameTime * normalRound);
      inGameTimeSessions[room.getRoomId()] = Date.now();

      // 게임 종료 notification 보내기
      const roomIdNow = JSON.parse(JSON.stringify(room.getRoomId()));
      setTimeout(
        () => {
          gameEndNotification(roomIdNow, 4);
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
export const normalPhaseNotification = (level: number, roomId: number, sendTime: number) => {
  setTimeout(() => {
    // room정보 찾지 못할 경우 return (게임 이미 종료)
    const rooms: GameRoom[] = Server.getInstance().getRooms();
    let room: GameRoom | null = null;
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].getRoomId() === roomId) {
        room = rooms[i];
        break;
      }
    }
    if (!room) return;
    if (room.getRoomId() !== roomId) return;

    // 라운드 기본 생성자 생성
    shoppingUserIdSessions[roomId] = [];
    fleaMarketCardCreate(level, roomId);
    monsterSpawnStart(roomId, level, -1);
    setBossStat(room, level);
    const characterPositionDatas = Server.getInstance()
      .getPositions()
      .find((position) => position.getPositionRoomId() === roomId);
    if (!characterPositionDatas) {
      console.error('characterPositionDatas데이터를 찾지 못하였습니다.');
      return;
    }

    // 라운드 시작 noti 보내기
    const roomData: Room = convertSendRoomData(room);
    const initGameInfo = Server.getInstance().initGameInfo;
    if (!initGameInfo) return;
    const inGameTime = initGameInfo[0].normalRoundTime;
    let phaseType: PhaseType = PhaseType.NONE_PHASE;
    switch (level) {
      case 1:
        phaseType = PhaseType.NORMAL_ROUND_1;
        break;
      case 2:
        phaseType = PhaseType.NORMAL_ROUND_2;
        break;
      case 3:
        phaseType = PhaseType.NORMAL_ROUND_3;
        break;
      case 4:
        phaseType = PhaseType.NORMAL_ROUND_4;
        break;
    }
    const gameStateData = { phaseType: phaseType, nextPhaseAt: Date.now() + inGameTime };
    const notifiData = {
      gameState: gameStateData,
      users: roomData.users,
      characterPositions: characterPositionDatas.getCharacterPositions()
    };
    for (let i = 0; i < roomData.users.length; i++) {
      const userSocket = socketSessions[roomData.users[i].id];
      if (userSocket) {
        sendPacket(userSocket, config.packetType.GAME_START_NOTIFICATION, notifiData);
      }
    }

    // 몬스터 움직임 시작 및 업데이트 정보 전달
    monsterMoveStart(roomId, inGameTime);
    userUpdateNotification(room);
  }, sendTime);
};

// 보스 라운드 시작
export const bossPhaseNotification = (level: number, roomId: number, sendTime: number) => {
  setTimeout(() => {
    // room정보 찾지 못할 경우 return (게임 이미 종료)
    const rooms: GameRoom[] = Server.getInstance().getRooms();
    let room: GameRoom | null = null;
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].getRoomId() === roomId) {
        room = rooms[i];
        break;
      }
    }
    if (!room) return;
    if (room.getRoomId() !== roomId) return;

    // 라운드 기본 생성자 생성
    shoppingUserIdSessions[roomId] = [];
    fleaMarketCardCreate(level, roomId);
    const idx: number = randomNumber(0, 3);
    monsterSpawnStart(roomId, level, idx);
    const characterPositionDatas = Server.getInstance()
      .getPositions()
      .find((position) => position.getPositionRoomId() === roomId);
    if (!characterPositionDatas) {
      console.error('characterPositionDatas데이터를 찾지 못하였습니다.');
      return;
    }
    setBossStat(room, level);

    // 라운드 시작 noti 보내기
    const roomData: Room = convertSendRoomData(room);
    const initGameInfo = Server.getInstance().initGameInfo;
    if (!initGameInfo) return;
    const bossGameTime = initGameInfo[0].bossRoundTime;
    const gameStateData = { phaseType: PhaseType.BOSS_ROUND, nextPhaseAt: Date.now() + bossGameTime };
    const notifiData = {
      gameState: gameStateData,
      users: roomData.users,
      characterPositions: characterPositionDatas.getCharacterPositions()
    };
    for (let i = 0; i < roomData.users.length; i++) {
      const userSocket = socketSessions[roomData.users[i].id];
      if (userSocket) {
        sendPacket(userSocket, config.packetType.GAME_START_NOTIFICATION, notifiData);
        sendPacket(userSocket, config.packetType.BOSSROUND_RESPONSE, { success: 1, extranceIdx: idx });
      }
    }

    // 몬스터 움직임 시작 및 업데이트 정보 전달
    monsterMoveStart(roomId, bossGameTime);
  }, sendTime);
};

// 보스 스탯 상승
export const setBossStat = (room: GameRoom, level: number) => {
  for (let i = 0; i < room.getUsers().length; i++) {
    if (room.getUsers()[i].getCharacter().roleType === RoleType.BOSS_MONSTER) {
      room.getUsers()[i].getCharacter().aliveState = true;
      room.getUsers()[i].getCharacter().level = level;
      room.getUsers()[i].getCharacter().attack = 10 * level;
      room.getUsers()[i].getCharacter().armor = 2 * level;

      switch (level) {
        case 1: // 일반 라운드
          room.getUsers()[i].getCharacter().handCards = [];
          break;
        case 2: // 일반 라운드
          room.getUsers()[i].getCharacter().handCards = [];
          break;
        case 3: // 일반 라운드
          room.getUsers()[i].getCharacter().handCards = [];
          break;
        case 4: // 일반 라운드
          room.getUsers()[i].getCharacter().handCards = [];
          break;
        case 5: // 보스 라운드
          room.getUsers()[i].getCharacter().handCards = [{ type: CardType.BOSS_EXTENDED_SKILL, count: 1 }];
          break;
        default:
          console.log('보스 스텟 설정을 위한 라운드(level)의 값이 잘못되었습니다.:', level);
          return;
      }
      return;
    }
  }
};
