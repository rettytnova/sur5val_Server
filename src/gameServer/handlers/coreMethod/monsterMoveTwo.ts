import { config } from '../../../config/config.js';
import { sendPacket } from '../../../packet/createPacket.js';
import GameRoom from '../../class/room.js';
import Server from '../../class/server.js';
import UserSessions from '../../class/userSessions.js';
import { socketSessions } from '../../session/socketSession.js';
import { monsterAI } from '../handlerMethod.js';
import { monsterAttackCheckTwo } from './monsterAttackTwo.js';

export const monsterAiDatas: {
  [roomId: number]: {
    id: number;
    direction: number;
    distance: number;
    attackCool: number;
    attackRange: number;
    animationDelay: number;
  }[];
} = {};

export const moveSpeed = 0.11;
export const directionChangeBasic = 8;
export const directionChangeRandom = 3;
export const animationDelay = 6;

// 몬스터 이동 및 공격 시작
export const monsterMoveStartTwo = (roomId: number, totalTime: number) => {
  // 몬스터 이동을 n초마다 반복
  const time = Date.now();
  let callme = 0;
  totalTime -= 500;

  // setInterval 반복 시작
  const monsterMove = setInterval(() => {
    // 시간 다되면 함수 종료
    if (Date.now() - time >= totalTime)
      console.log('함수 실행 횟수:', callme, '함수 실행 시간:', Date.now() - time), clearInterval(monsterMove);

    // roomdData 없으면 함수 종료 (게임 종료 시 없어짐)
    const rooms: GameRoom[] | undefined = Server.getInstance().getRooms();
    if (!rooms) {
      console.log('함수 실행 횟수:', callme, '함수 실행 시간:', Date.now() - time), clearInterval(monsterMove);
      return;
    }
    let room: GameRoom | null = null;
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].getRoomId() === roomId) {
        room = rooms[i];
        break;
      }
    }
    if (!room) {
      console.log('함수 실행 횟수:', callme, '함수 실행 시간:', Date.now() - time), clearInterval(monsterMove);
      return;
    }

    // characterPositions 없으면 함수 종료 (게임 종료 시 없어짐)
    const positionSessions = Server.getInstance()
      .getPositions()
      .find((PositionSessions) => PositionSessions.getPositionUserId() === room.getRoomId());
    if (!positionSessions) {
      console.log('함수 실행 횟수:', callme, '함수 실행 시간:', Date.now() - time), clearInterval(monsterMove);
      return;
    }
    if (!positionSessions.getCharacterPosition()) {
      console.log('함수 실행 횟수:', callme, '함수 실행 시간:', Date.now() - time), clearInterval(monsterMove);
      return;
    }
    const characterPositions = positionSessions.getCharacterPosition();

    // 몬스터 공격 실행
    monsterAttackCheckTwo(room, rooms);
    callme++;

    // 각 몬스터 별로 움직이기 작업 실행
    for (let i = 0; i < monsterAiDatas[roomId].length; i++) {
      // 죽은 몬스터일 경우 움직이기 작업 생략
      let monsterData: UserSessions | null = null;
      for (let j = 0; j < room.getUsers().length; j++) {
        if (room.getUsers()[j].getId() === monsterAiDatas[roomId][i].id) {
          monsterData = room.getUsers()[j];
        }
      }
      if (!monsterData) {
        console.error('움직이려는 몬스터의 정보를 찾을 수 없습니다.');
        return;
      }
      if (monsterData.getCharacter().hp <= 0) continue;

      // 남은 거리가 없을 경우 새로운 경로 지정
      if (monsterAiDatas[roomId][i].distance <= 0) {
        const position: number[] = [];
        for (let j = 0; j < characterPositions.length; j++) {
          if (characterPositions[j].id === monsterAiDatas[roomId][i].id) {
            position.push(characterPositions[j].x);
            position.push(characterPositions[j].y);
            break;
          }
        }
        monsterAI(
          roomId,
          monsterAiDatas[roomId][i].id,
          position[0],
          position[1],
          monsterAiDatas[roomId][i].attackCool,
          monsterAiDatas[roomId][i].attackRange
        );
      }

      // 애니메이션 재생 지연시간 계산
      if (monsterAiDatas[roomId][i].animationDelay > 0) {
        monsterAiDatas[roomId][i].animationDelay--;
      }

      // 위로 이동
      else if (monsterAiDatas[roomId][i].direction === 0) {
        monsterAiDatas[roomId][i].distance--;
        monsterAiDatas[roomId][i].attackCool--;
        for (let j = 0; j < characterPositions.length; j++) {
          if (monsterAiDatas[roomId][i].id === characterPositions[j].id) {
            characterPositions[j].y += moveSpeed;
            break;
          }
        }
      } // 오른쪽으로 이동
      else if (monsterAiDatas[roomId][i].direction === 1) {
        monsterAiDatas[roomId][i].distance--;
        monsterAiDatas[roomId][i].attackCool--;
        for (let j = 0; j < characterPositions.length; j++) {
          if (monsterAiDatas[roomId][i].id === characterPositions[j].id) {
            characterPositions[j].x += moveSpeed;
            break;
          }
        }
      } // 아래로 이동
      else if (monsterAiDatas[roomId][i].direction === 2) {
        monsterAiDatas[roomId][i].distance--;
        monsterAiDatas[roomId][i].attackCool--;
        for (let j = 0; j < characterPositions.length; j++) {
          if (monsterAiDatas[roomId][i].id === characterPositions[j].id) {
            characterPositions[j].y -= moveSpeed;
            break;
          }
        }
      } // 왼쪽으로 이동
      else if (monsterAiDatas[roomId][i].direction === 3) {
        monsterAiDatas[roomId][i].distance--;
        monsterAiDatas[roomId][i].attackCool--;
        for (let j = 0; j < characterPositions.length; j++) {
          if (monsterAiDatas[roomId][i].id === characterPositions[j].id) {
            characterPositions[j].x -= moveSpeed;
            break;
          }
        }
      }
    }

    // 이동 종료: notification 뿌리기
    for (let i = 0; i < room.getUsers().length; i++) {
      const roomUserSocket = socketSessions[room.getUsers()[i].getId()];
      if (roomUserSocket) {
        sendPacket(roomUserSocket, config.packetType.POSITION_UPDATE_NOTIFICATION, {
          characterPositions: characterPositions[roomId]
        });
      }
    }

    // 에러 찾기 임시 함수
    if (room.getUsers().length !== characterPositions.length) {
      throw new Error(`monsterSpawn에서 에러 발생 ${room.getUsers()}, ${characterPositions[roomId]}`);
    }
  }, 100);
};
