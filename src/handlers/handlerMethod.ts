import { getRedis } from '../database/redis.js';
import { CustomSocket, Room, User } from '../interface/interface.js';
import { socketSessions } from '../session/socketSession.js';
import { UserCharacterType } from './enumTyps.js';
import { directionChangeBasic, directionChangeRandom, monsterAiDatas, moveSpeed } from './notification/monsterMove.js';
import { randomNumber } from '../utils/utils.js';

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

// 유저 캐릭터 초기화
export const setCharacterInfoInit = (users: User[]) => {
  const numbers: number[] = [1, 2, 3, 4, 5];

  // 배열을 랜덤으로 섞기 (Fisher-Yates Shuffle Algorithm)
  for (let i = users.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  // 보스가 선택되지 않는 예외처리 추가
  const selectedNumbers = numbers.slice(0, users.length);
  if (!selectedNumbers.includes(5)) {
    const bossUserIndex = Math.floor(Math.random() * (users.length - 1));
    selectedNumbers[bossUserIndex] = 5;
  }

  // 직업 부여 랜덤 로직
  for (let i = 0; i < users.length; i++) {
    switch (selectedNumbers[i]) {
      case 1:
        {
          // 탱커 - 물안경군
          users[i].character.characterType = UserCharacterType.SWIM_GLASSES;
          users[i].character.roleType = 0;
          users[i].character.hp = 5;
          users[i].character.weapon = 1; // 무기 아닙니다 기획 따라 바뀌어서 스킬입니다
          //users[i].character.equips = 14;
          users[i].character.handCards = [
            { type: 2, count: 1 },
            { type: 17, count: 1 },
            { type: 21, count: 3 },
            { type: 22, count: 1 }
          ];
        }
        break;
      case 2:
        {
          // 로그 - 개굴군(근딜)
          users[i].character.characterType = UserCharacterType.FROGGY;
          users[i].character.roleType = 0;
          users[i].character.hp = 3;
          users[i].character.weapon = 4; // 무기 아닙니다 기획 따라 바뀌어서 스킬입니다
          //users[i].character.equips = 13;
          users[i].character.handCards = [
            { type: 5, count: 1 },
            { type: 18, count: 1 },
            { type: 21, count: 3 },
            { type: 22, count: 1 }
          ];
        }
        break;
      case 3:
        {
          // 가면군 - 마법사(원딜)
          users[i].character.characterType = UserCharacterType.MASK;
          users[i].character.roleType = 0;
          users[i].character.hp = 2;
          users[i].character.weapon = 7; // 무기 아닙니다 기획 따라 바뀌어서 스킬입니다
          //users[i].character.equips = 16;
          users[i].character.handCards = [
            { type: 8, count: 1 },
            { type: 19, count: 1 },
            { type: 21, count: 3 },
            { type: 22, count: 1 }
          ];
        }
        break;
      case 4:
        {
          // 빨강이 - 서포터
          users[i].character.characterType = UserCharacterType.RED;
          users[i].character.roleType = 0;
          users[i].character.hp = 1;
          users[i].character.weapon = 10; // 무기 아닙니다 기획 따라 바뀌어서 스킬입니다
          //users[i].character.equips = 15;
          users[i].character.handCards = [
            { type: 11, count: 1 },
            { type: 19, count: 1 },
            { type: 21, count: 3 },
            { type: 22, count: 1 }
          ];
        }
        break;
      case 5:
        {
          // 핑크슬라임 - 보스
          users[i].character.characterType = UserCharacterType.PINK_SLIME;
          users[i].character.roleType = 1;
          users[i].character.hp = 5;
          users[i].character.weapon = 1; // 무기 아닙니다 기획 따라 바뀌어서 스킬입니다
          //users[i].character.equips = 20;
          users[i].character.handCards = [
            { type: 4, count: 1 },
            { type: 7, count: 1 },
            { type: 10, count: 1 },
            { type: 13, count: 1 },
            { type: 14, count: 1 },
            { type: 23, count: 1 },
            { type: 22, count: 1 }
          ];
        }
        break;
    }
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

export const getSocketByUserId = async (user: User) => {
  const redisUserDatas = await getRedisData('userData');
  for (let i = 0; i < redisUserDatas.length; i++) {
    if (redisUserDatas[i].id === user.id) {
      return socketSessions[redisUserDatas[i].id];
    }
  }
};

// 몬스터 이동 방향 및 거리 설정 / 0:위, 1: 오른쪽, 2: 아래, 3: 왼쪽 (맵의 일정 범위를 벗어날 것으로 예상 되는 경우 반대 방향으로 전환)
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
