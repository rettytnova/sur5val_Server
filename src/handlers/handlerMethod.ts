import { getRedis } from '../database/redis.js';
import net from 'net';

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
export const getUserBySocket = async (socket: net.Socket) => {
  const redisClient = await getRedis();
  const stringUserDatas = await redisClient.get('userData');
  if (stringUserDatas) {
    const userDatas = JSON.parse(stringUserDatas);
    for (let i = 0; i < userDatas.length; i++) {
      if (userDatas[i].socket === socket) {
        return userDatas[i];
      }
    }
  }
};
