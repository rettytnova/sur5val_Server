import { config } from '../../config/config.js';
import { CustomSocket, Room } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { getRedisData, getSocketByUser, getUserBySocket, monsterAI, setRedisData } from '../handlerMethod.js';
import { monsterAttackCheck } from './monsterAttack.js';
import { userUpdateNotification } from './userUpdate.js';

export const monsterAiDatas: {
  [key: number]: { id: number; direction: number; distance: number; attackCool: number; attackRange: number }[];
} = {};

const frame = 60; // 초당 프레임
const moveInterval = Math.floor(1000 / frame);
const totalTime = 6 * 60 * 1000;
export const moveSpeed = 0.4; // 프레임당 몬스터 이동 속도
export const directionChangeBasic = 60; // 프레임 당 방향 전환 기본 값
export const directionChangeRandom = 30; // 프레임 당 방향 전환 기본 값

export const monsterMoveStart = async (socket: CustomSocket) => {
  const user = await getUserBySocket(socket);
  const roomDatas: Room[] = await getRedisData('roomData');

  let roomData: Room | null = null;
  for (let i = 0; i < roomDatas.length; i++) {
    for (let j = 0; j < roomDatas[i].users.length; j++) {
      if (roomDatas[i].users[j].id === user.id) {
        roomData = roomDatas[i];
        break;
      }
    }
    if (roomData) break;
  }
  if (!roomData) {
    console.error('roomData가 존재하지 않습니다.');
    return;
  }

  let timpPassed = 0; // 몬스터 이동을 n초마다 반복

  // setTimeout(async () => {
  //   const loseSocket = await getSocketByUser(roomData.users[0]);
  //   if (loseSocket) sendPacket(loseSocket, config.packetType.GAME_END_NOTIFICATION, { winners: [], winType: 0 });
  // }, 10000);

  const monsterMove = setInterval(async () => {
    // 공격 가능한지 확인하여 공격 실행
    await monsterAttackCheck(roomData);

    const characterPositions = await getRedisData('characterPositionDatas');
    for (let i = 0; i < monsterAiDatas[roomData.id].length; i++) {
      // 남은 거리가 없을 경우 새로운 경로 지정
      if (monsterAiDatas[roomData.id][i].distance <= 0) {
        const position: number[] = [];
        for (let j = 0; j < characterPositions[roomData.id].length; j++) {
          if (characterPositions[roomData.id][j].id === monsterAiDatas[roomData.id][i].id) {
            position.push(characterPositions[roomData.id][j].x);
            position.push(characterPositions[roomData.id][j].y);
            break;
          }
        }
        monsterAI(
          roomData.id,
          monsterAiDatas[roomData.id][i].id,
          position[0],
          position[1],
          monsterAiDatas[roomData.id][i].attackCool,
          monsterAiDatas[roomData.id][i].attackRange
        );
      } // 위로 이동
      if (monsterAiDatas[roomData.id][i].direction === 0) {
        monsterAiDatas[roomData.id][i].distance--;
        monsterAiDatas[roomData.id][i].attackCool--;
        for (let j = 0; j < characterPositions[roomData.id].length; j++) {
          if (monsterAiDatas[roomData.id][i].id === characterPositions[roomData.id][j].id) {
            if (characterPositions[roomData.id][j]) characterPositions[roomData.id][j].y += moveSpeed;
            break;
          }
        }
      } // 오른쪽으로 이동
      else if (monsterAiDatas[roomData.id][i].direction === 1) {
        monsterAiDatas[roomData.id][i].distance--;
        monsterAiDatas[roomData.id][i].attackCool--;
        for (let j = 0; j < characterPositions[roomData.id].length; j++) {
          if (monsterAiDatas[roomData.id][i].id === characterPositions[roomData.id][j].id) {
            characterPositions[roomData.id][j].x += moveSpeed;
            break;
          }
        }
      } // 아래로 이동
      else if (monsterAiDatas[roomData.id][i].direction === 2) {
        monsterAiDatas[roomData.id][i].distance--;
        monsterAiDatas[roomData.id][i].attackCool--;
        for (let j = 0; j < characterPositions[roomData.id].length; j++) {
          if (monsterAiDatas[roomData.id][i].id === characterPositions[roomData.id][j].id) {
            characterPositions[roomData.id][j].y -= moveSpeed;
            break;
          }
        }
      } // 왼쪽으로 이동
      else if (monsterAiDatas[roomData.id][i].direction === 3) {
        monsterAiDatas[roomData.id][i].distance--;
        monsterAiDatas[roomData.id][i].attackCool--;
        for (let j = 0; j < characterPositions[roomData.id].length; j++) {
          if (monsterAiDatas[roomData.id][i].id === characterPositions[roomData.id][j].id) {
            characterPositions[roomData.id][j].x -= moveSpeed;
            break;
          }
        }
      }
    } // 이동 종료 redis에 데이터 저장 및 notification 뿌리기
    await setRedisData('roomData', roomDatas);
    await setRedisData('characterPositionDatas', characterPositions);
    for (let i = 0; i < roomData.users.length; i++) {
      const roomUserSocket = await getSocketByUser(roomData.users[i]);
      if (roomUserSocket) {
        sendPacket(roomUserSocket, config.packetType.POSITION_UPDATE_NOTIFICATION, {
          characterPositions: characterPositions[roomData.id]
        });
      }
    }

    timpPassed += moveInterval;
    if (timpPassed >= totalTime) clearInterval(monsterMove);
  }, moveInterval);
};
