import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const LOCK_DEFAULT_TTL = 5000; // 밀리초 단위의 기본 락 유지 시간

/*
* - Redis 클라이언트 가져오기
*   const redisClient = await getRedis();
* - 데이터 추가
*   await redisClient.set('abc', '111'); // key, value
*   console.log('Data added to Redis');
* - 데이터 조회
*   console.log('redis: ', await redisClient.get('abc'));
* - 단일 데이터 제거
*   await redisClient.del('myKey');
*   console.log('Key "myKey" has been removed.');
*/

interface RedisConfig {
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
}

const configs: RedisConfig = {
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
};

// Redis 클라이언트 변수 선언
let redis: Redis | null = null;
let subscriberRedis: Redis | null = null;

const createRedisClient = (isSubscriber = false): Redis => {
  const client = new Redis({
    host: configs.REDIS_HOST,
    port: configs.REDIS_PORT,
    password: configs.REDIS_PASSWORD,
  });

  client.on('error', (err: Error) => {
    console.error(
      `${isSubscriber ? 'Subscriber ' : ''}Redis connection failed: ${err.message}`,
    );
  });

  return client;
};

// Redis에 연결합니다. 연결 실패 시 에러를 던집니다.
export const connect = async (): Promise<void> => {
  if (!redis) {
    redis = createRedisClient();
    console.info('Redis connected');
  }

  if (!subscriberRedis) {
    subscriberRedis = createRedisClient(true);
    subscriberRedis.on('message', (channel: string, message: string) => {
      console.info(`Redis received publish[${channel}] => ${message}`);
    });
    console.info('Subscriber Redis connected');
  }
};

// Redis 클라이언트를 반환합니다.
export const getRedis = async (): Promise<Redis> => {
  if (!redis) {
    console.warn('Redis is null. It will try to connect.');
    await connect();
  }
  return redis as Redis;
};

// Subscriber Redis 클라이언트를 반환합니다.
export const getSubscriberRedis = async (): Promise<Redis> => {
  if (!subscriberRedis) {
    console.warn('Subscriber Redis is null. It will try to connect.');
    await connect();
  }
  return subscriberRedis as Redis;
};

// Redis 락 생성
export const acquireLock = async (
  lockKey: string,
  ttl: number = LOCK_DEFAULT_TTL,
): Promise<string | null> => {
  const redisClient = await getRedis();
  const lockValue = uuidv4();

  try {
    const lockAcquired = await redisClient.set(
      lockKey,
      lockValue,
      'PX',
      ttl.toString(),
      'NX',
    );

    return lockAcquired ? lockValue : null;
  } catch (error: any) {
    console.error(`Redis.acquireLock: ${error.message}`);
    return null;
  }
};

// Redis 락 해제
export const releaseLock = async (
  lockKey: string,
  lockValue: string,
): Promise<boolean> => {
  const redisClient = await getRedis();

  try {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await redisClient.eval(script, 1, lockKey, lockValue);
    return result !== 0;
  } catch (error: any) {
    console.error(`Redis.releaseLock: ${error.message}`);
    return false;
  }
};
