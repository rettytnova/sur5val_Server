import { number } from 'joi';
import { getRedis } from '../database/redis.js';
import { Character, CustomSocket, Room, User } from '../interface/interface.js';
import { socketSessions } from '../session/socketSession.js';
import { randomNumber } from '../utils/utils.js';
import { CharacterStateType, CharacterType } from './enumTyps.js';

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
  const room = rooms.find((room) =>
    room.users.some((user) => user.id === userId),
  );
  if (!room) {
    //throw new Error('getRoomByUserId: Room not found');
    console.error('getRoomByUserId: Room not found');
    return null;
  }
  return room;
};

// 유저 캐릭터 초기화
// 생각보다 내용이 더 복잡해질거 같아 일단 보류. (기획에 따라 바뀔것이기 때문)
export const setCharacterInfoInit = (users: User[]) => {
  let characterValues = Object.values(CharacterType);
  const result = [];
  const usedIndex = new Set<number>();
  while (result.length < users.length) {
    const characterTypeIndex = randomNumber(0, characterValues.length - 1);
    if (!usedIndex.has(characterTypeIndex)) {
      result.push(characterTypeIndex);
      usedIndex.add(characterTypeIndex);
    }
  }
  for (let i = 0; i < users.length; i++) {
    users[i].character.characterType = characterValues[result[i]];
    users[i].character.roleType = randomNumber(1, 4);
    users[i].character.hp = 3;
  }
  return users;
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
