import { config } from '../../config/config.js';
import { Room } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { socketSessions } from '../../session/socketSession.js';
import { getRedisData, monsterAI, setRedisData } from '../handlerMethod.js';
import { monsterAttackCheck } from './monsterAttack.js';

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
export const animationDelay = 5;

// 몬스터 이동 및 공격 시작
export const monsterMoveStart = async (roomId: number, totalTime: number) => {
  const roomDatas: Room[] = await getRedisData('roomData');
  let roomData: Room | null = null;
  for (let i = 0; i < roomDatas.length; i++) {
    if (roomDatas[i].id === roomId) {
      roomData = roomDatas[i];
    }
    break;
  }
  if (!roomData) {
    console.error('roomData가 존재하지 않습니다.');
    return;
  }

  // 몬스터 이동을 n초마다 반복
  const time = Date.now();
  let callme = 0;
  totalTime -= 500;
  const monsterMove = setInterval(async () => {
    const characterPositions = await getRedisData('characterPositionDatas');
    await monsterAttackCheck(roomData);
    callme++;
    for (let i = 0; i < monsterAiDatas[roomId].length; i++) {
      // 남은 거리가 없을 경우 새로운 경로 지정
      if (monsterAiDatas[roomId][i].distance <= 0) {
        const position: number[] = [];
        for (let j = 0; j < characterPositions[roomId].length; j++) {
          if (characterPositions[roomId][j].id === monsterAiDatas[roomId][i].id) {
            position.push(characterPositions[roomId][j].x);
            position.push(characterPositions[roomId][j].y);
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
        for (let j = 0; j < characterPositions[roomId].length; j++) {
          if (monsterAiDatas[roomId][i].id === characterPositions[roomId][j].id) {
            characterPositions[roomId][j].y += moveSpeed;
            break;
          }
        }
      } // 오른쪽으로 이동
      else if (monsterAiDatas[roomId][i].direction === 1) {
        monsterAiDatas[roomId][i].distance--;
        monsterAiDatas[roomId][i].attackCool--;
        for (let j = 0; j < characterPositions[roomId].length; j++) {
          if (monsterAiDatas[roomId][i].id === characterPositions[roomId][j].id) {
            characterPositions[roomId][j].x += moveSpeed;
            break;
          }
        }
      } // 아래로 이동
      else if (monsterAiDatas[roomId][i].direction === 2) {
        monsterAiDatas[roomId][i].distance--;
        monsterAiDatas[roomId][i].attackCool--;
        for (let j = 0; j < characterPositions[roomId].length; j++) {
          if (monsterAiDatas[roomId][i].id === characterPositions[roomId][j].id) {
            characterPositions[roomId][j].y -= moveSpeed;
            break;
          }
        }
      } // 왼쪽으로 이동
      else if (monsterAiDatas[roomId][i].direction === 3) {
        monsterAiDatas[roomId][i].distance--;
        monsterAiDatas[roomId][i].attackCool--;
        for (let j = 0; j < characterPositions[roomId].length; j++) {
          if (monsterAiDatas[roomId][i].id === characterPositions[roomId][j].id) {
            characterPositions[roomId][j].x -= moveSpeed;
            break;
          }
        }
      }
    }

    // 이동 종료 redis에 데이터 저장 및 notification 뿌리기
    await setRedisData('characterPositionDatas', characterPositions);
    for (let i = 0; i < roomData.users.length; i++) {
      const roomUserSocket = socketSessions[roomData.users[i].id];
      if (roomUserSocket) {
        sendPacket(roomUserSocket, config.packetType.POSITION_UPDATE_NOTIFICATION, {
          characterPositions: characterPositions[roomId]
        });
      }
    }

    // 시간 다되면 함수 종료
    if (Date.now() - time >= totalTime)
      console.log('함수 실행 횟수:', callme, '함수 실행 시간:', Date.now() - time), clearInterval(monsterMove);
  }, 100);
};
