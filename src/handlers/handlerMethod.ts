import { getRedis } from '../database/redis.js';
import { Character, CustomSocket, Room, User } from '../interface/interface.js';
import { socketSessions } from '../session/socketSession.js';
import { CharacterStateType } from './enumTyps.js';
import {
  directionChangeBasic,
  directionChangeRandom,
  monsterMoveDirection,
  moveSpeed
} from './notification/monsterMove.js';

// 레디스에서 데이터 가져오기 ex: getRedisData("roomData")
export const getRedisData = async (key: string) => {
  const redisClient = await getRedis();
  const jsonDatas = await redisClient.get(key);
  if (jsonDatas) {
    const datas = JSON.parse(jsonDatas);
    return datas;
  }
};

// 레디스에 데이터 설정하기 ex: setRedisData("roomData", data)
export const setRedisData = async <T>(key: string, data: T) => {
  const redisClient = await getRedis();
  const redisData = JSON.stringify(data);
  await redisClient.set(key, redisData);
};

// 레디스에서 데이터 삭제하기 ex: deleteRedisData("roomData")
export const deleteRedisData = async (key: string) => {
  const redisClient = await getRedis();
  await redisClient.del(key);
};

// socket으로 유저 데이터 가져오기 ex: getUserBySocket(socket)
export const getUserBySocket = async (socket: CustomSocket) => {
  const userDatas = await getRedisData('userData');
  if (userDatas) {
    for (let i = 0; i < userDatas.length; i++) {
      if (socketSessions[userDatas[i].id] === socket) {
        return userDatas[i];
      }
    }
  }

  return null;
};

// roomData 가지고 오기
export const getRooms = async () => {
  const rooms: Room[] = await getRedisData('roomData');
  if (!rooms) {
    return null;
  }

  return rooms;
};
// userid로 방 찾기
export const getRoomByUserId = async (userId: number) => {
  const rooms: Room[] = await getRedisData('roomData');
  const room = rooms.find((room) => room.users.some((user) => user.id === userId));
  if (!room) {
    //throw new Error('getRoomByUserId: Room not found');
    console.error('getRoomByUserId: Room not found');
    return null;
  }
  return room;
};

/**
 * export interface Character {
  characterType: number;
  roleType: number;
  hp: number;
  weapon: number;
  stateInfo: CharacterStateInfo;
  equips: number[];
  debuffs: number[];
  handCards: Card[];
  bbangCount: number;
  handCardsCount: number;
}

export interface CharacterStateInfo {
  state: number; 0
  nextState: number; 
  nextStateAt: number;
  stateTargetUserId: number;
}
 */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const characterTypes = [1, 3, 5, 7, 8, 9, 10, 12, 13];

export const setCharacterInfoInit = (character: Character) => {
  const characterTypeIndex = rand(0, 8);
  character.characterType = characterTypes[characterTypeIndex];
  character.roleType = rand(1, 4);
  character.hp = 4;
};

// socket으로 유저 데이터 가져오기
export const getSocketByUser = async (user: User) => {
  const redisUserDatas = await getRedisData('userData');
  for (let i = 0; i < redisUserDatas.length; i++) {
    if (redisUserDatas[i].id === user.id) {
      return socketSessions[redisUserDatas[i].id];
    }
  }
};

export const saveSocketSession = (userId: number, socket: CustomSocket) => {
  socketSessions[userId] = socket;
};

export const getSocketByUserId = async (user: User) => {
  const redisUserDatas = await getRedisData('userData');
  for (let i = 0; i < redisUserDatas.length; i++) {
    if (redisUserDatas[i].id === user.id) {
      return socketSessions[redisUserDatas[i].id];
    }
  }
};

// 몬스터 이동 방향 및 거리 설정 / 0:위, 1: 오른쪽, 2: 아래, 3: 왼쪽 (맵의 일정 범위를 벗어날 것으로 예상 되는 경우 반대 방향으로 전환)
export const monsterMoveAI = (roomId: number, id: number, x: number, y: number) => {
  let monsterDirection = Math.floor(Math.random() * 4);
  const monsterdistance = Math.floor(Math.random() * directionChangeRandom + directionChangeBasic);
  if (monsterDirection === 0 && y + monsterdistance * moveSpeed > 10)
    monsterDirection = (monsterDirection + 2) % 4;
  else if (monsterDirection === 1 && x + monsterdistance * moveSpeed > 19)
    monsterDirection = (monsterDirection + 2) % 4;
  else if (monsterDirection === 2 && y - monsterdistance * moveSpeed < -10)
    monsterDirection = (monsterDirection + 2) % 4;
  else if (monsterDirection === 3 && x - monsterdistance * moveSpeed < -19)
    monsterDirection = (monsterDirection + 2) % 4;

  let index;
  for (let i = 0; i < monsterMoveDirection[roomId].length; i++) {
    if (monsterMoveDirection[roomId][i].id === id) {
      index = i;
      break;
    }
  }

  if (index === undefined) {
    monsterMoveDirection[roomId].push({
      id: id,
      direction: monsterDirection,
      distance: monsterdistance
    });
  } else {
    monsterMoveDirection[roomId][index] = {
      id: id,
      direction: monsterDirection,
      distance: monsterdistance
    };
  }
};
