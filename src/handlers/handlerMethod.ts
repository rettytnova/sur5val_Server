import { getRedis } from '../database/redis.js';
import { CustomSocket, Room } from '../interface/interface.js';
import { socketSessions } from '../session/socketSession.js';
import { directionChangeBasic, directionChangeRandom, monsterAiDatas, moveSpeed } from './coreMethod/monsterMove.js';

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

// 몬스터 이동 방향 및 거리 설정 / 0:위, 1: 오른쪽, 2: 아래, 3: 왼쪽
export const monsterAI = (
  roomId: number,
  id: number,
  x: number,
  y: number,
  attackCool: number,
  attackRange: number
) => {
  let monsterDirection = Math.floor(Math.random() * 4);
  const monsterdistance = Math.floor(Math.random() * directionChangeRandom + directionChangeBasic);

  let nextX = x;
  let nextY = y;
  if (monsterDirection === 0) nextY = y + monsterdistance * moveSpeed;
  else if (monsterDirection === 1) nextX = x + monsterdistance * moveSpeed;
  else if (monsterDirection === 2) nextY = y - monsterdistance * moveSpeed;
  else if (monsterDirection === 3) nextX = x - monsterdistance * moveSpeed;

  if (nextX < -19.5) monsterDirection = (monsterDirection + 2) % 4;
  else if (nextX > 19.5) monsterDirection = (monsterDirection + 2) % 4;
  else if (nextX > -15.5 && nextX < -1.5 && nextY > 0.5 && nextY < 7.5) monsterDirection = (monsterDirection + 2) % 4;
  else if (nextX > -15.5 && nextX < -3.5 && nextY > -8.3 && nextY < -2.8) monsterDirection = (monsterDirection + 2) % 4;
  else if (nextX > 4.5 && nextX < 13.5 && nextY > 1.5 && nextY < 7.5) monsterDirection = (monsterDirection + 2) % 4;
  else if (nextX > 3.5 && nextX < 14.5 && nextY > -7.5 && nextY < -2.5) monsterDirection = (monsterDirection + 2) % 4;
  else if (nextY > 10.5) monsterDirection = (monsterDirection + 2) % 4;
  else if (nextY < -10.5) monsterDirection = (monsterDirection + 2) % 4;

  let index;
  for (let i = 0; i < monsterAiDatas[roomId].length; i++) {
    if (monsterAiDatas[roomId][i].id === id) {
      index = i;
      break;
    }
  }

  if (index === undefined) {
    monsterAiDatas[roomId].push({
      id: id,
      direction: monsterDirection,
      distance: monsterdistance,
      attackCool: attackCool,
      attackRange: attackRange,
      animationDelay: 0
    });
  } else {
    monsterAiDatas[roomId][index] = {
      id: id,
      direction: monsterDirection,
      distance: monsterdistance,
      attackCool: attackCool,
      attackRange: attackRange,
      animationDelay: 0
    };
  }
};
