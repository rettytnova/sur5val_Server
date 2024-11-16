import { getRedis } from '../database/redis.js';
import { CustomSocket, User } from '../interface/interface.js';
import { socketSession } from '../session/socketSession.js';

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
      if (userDatas[i].socketId === socket.id) {
        const result = userDatas[i] as User;
        return result;
      }
    }
  }
};

// socket으로 유저 데이터 가져오기 ex: getUserBySocket(socket)
export const getSocketByUserData = async (userData: any) => {
  const socketId = userData.socketId;
  for (let i = 0; i < socketSession.length; i++) {
    if (socketSession[i].socketId === socketId) {
      return socketSession[i].socket;
    }
  }
};
