import { getRedis } from '../database/redis.js';
import {
  CustomSocket,
  RedisUserData,
  Room,
  User,
} from '../interface/interface.js';
import { socketSessions } from '../session/socketSession.js';

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

export const getRooms = async () => {
  const rooms = await getRedisData('roomData');
  if (!rooms) {
    return null;
  }

  return rooms;
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
