import { config } from '../../config/config.js';
import { CustomSocket, Room } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import {
  getRedisData,
  getSocketByUser,
  getUserBySocket,
  monsterMoveAI,
  setRedisData
} from '../handlerMethod.js';

// key값: room.id, value: [{id, direction, distance}, {id, direction, distance}...]
export const monsterMoveDirection: { [key: number]: any[] } = {};

const frame = 60; // 초당 프레임
const moveInterval = Math.floor(1000 / frame);
const totalTime = 6 * 60 * 1000;
export const moveSpeed = 0.03; // 프레임당 몬스터 이동 속도
export const directionChangeBasic = 60; // 프레임 당 방향 전환 기본 값
export const directionChangeRandom = 30; // 프레임 당 방향 전환 기본 값

export const monsterMoveStart = async (socket: CustomSocket) => {
  const user = await getUserBySocket(socket);
  const roomDatas: Room[] = await getRedisData('roomData');
  let roomData;
  for (let i = 0; i < roomDatas.length; i++) {
    for (let j = 0; j < roomDatas[i].users.length; j++) {
      if (roomDatas[i].users[j].id === user.id) {
        roomData = roomDatas[i];
        console.log('찾은 roomData: ', roomData);
        break;
      }
    }
    if (roomData) break;
  }
  if (!roomData) {
    console.error('roomData가 존재하지 않습니다.');
    return;
  }

  let timpPassed = 0;
  // 몬스터 이동을 n초마다 반복
  const monsterMove = setInterval(async () => {
    const characterPositions = await getRedisData('characterPositionDatas');
    for (let i = 0; i < monsterMoveDirection[roomData.id].length; i++) {
      // 남은 거리가 없을 경우 새로운 경로 지정
      if (monsterMoveDirection[roomData.id][i].distance <= 0) {
        const position: number[] = [];
        for (let j = 0; j < characterPositions[roomData.id].length; j++) {
          if (characterPositions[roomData.id][j].id === monsterMoveDirection[roomData.id][i].id) {
            position.push(characterPositions[roomData.id][j].x);
            position.push(characterPositions[roomData.id][j].y);
            break;
          }
        }
        monsterMoveAI(
          roomData.id,
          monsterMoveDirection[roomData.id][i].id,
          position[0],
          position[1]
        );
      }

      // 위로 이동
      if (monsterMoveDirection[roomData.id][i].direction === 0) {
        monsterMoveDirection[roomData.id][i].distance--;
        for (let j = 0; j < characterPositions[roomData.id].length; j++) {
          if (monsterMoveDirection[roomData.id][i].id === characterPositions[roomData.id][j].id) {
            if (characterPositions[roomData.id][j])
              characterPositions[roomData.id][j].y += moveSpeed;
            break;
          }
        }
      }

      // 오른쪽으로 이동
      else if (monsterMoveDirection[roomData.id][i].direction === 1) {
        monsterMoveDirection[roomData.id][i].distance--;
        for (let j = 0; j < characterPositions[roomData.id].length; j++) {
          if (monsterMoveDirection[roomData.id][i].id === characterPositions[roomData.id][j].id) {
            characterPositions[roomData.id][j].x += moveSpeed;
            break;
          }
        }
      }

      // 아래로 이동
      else if (monsterMoveDirection[roomData.id][i].direction === 2) {
        monsterMoveDirection[roomData.id][i].distance--;
        for (let j = 0; j < characterPositions[roomData.id].length; j++) {
          if (monsterMoveDirection[roomData.id][i].id === characterPositions[roomData.id][j].id) {
            characterPositions[roomData.id][j].y -= moveSpeed;
            break;
          }
        }
      }

      // 왼쪽으로 이동
      else if (monsterMoveDirection[roomData.id][i].direction === 3) {
        monsterMoveDirection[roomData.id][i].distance--;
        for (let j = 0; j < characterPositions[roomData.id].length; j++) {
          if (monsterMoveDirection[roomData.id][i].id === characterPositions[roomData.id][j].id) {
            characterPositions[roomData.id][j].x -= moveSpeed;
            break;
          }
        }
      }
    }

    // 이동 종료 redis에 데이터 저장 및 notification 뿌리기
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
