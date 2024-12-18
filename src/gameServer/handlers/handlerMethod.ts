import { getRedis } from '../../database/redis.js';
import { CustomSocket, Room, User } from '../../gameServer/interface/interface.js';
import GameRoom from '../class/room.js';
import Server from '../class/server.js';
import UserSessions from '../class/userSessions.js';
import { socketSessions } from '../session/socketSession.js';
import { directionChangeBasic, directionChangeRandom, monsterAiDatas, moveSpeed } from './coreMethod/monsterMove.js';

// socket으로 유저 데이터 가져오기 ex: getUserBySocket(socket)
export const getUserBySocket = (socket: CustomSocket) => {
  const users = Server.getInstance().getUsers();
  if (users) {
    for (let i = 0; i < users.length; i++) {
      if (socketSessions[users[i].getId()] === socket) {
        return Server.getInstance().getUser(users[i].getId());
      }
    }
  }

  return null;
};


export const getRoomByUserId = (userId: number) => {
  const rooms: GameRoom[] = Server.getInstance().getRooms();
  const room = rooms.find((room) => room.getUsers().some((user) => user.getId() === userId));
  if (!room) {
    return null;
  }
  return room;
}

// UserSession을 User로 변환
export const convertSendUserData = (user: UserSessions) => {
  const sendUser: User = {
    id: user.getId(),
    email: user.getEmail(),
    nickname: user.getNickname(),
    character: user.getCharacter()
  }

  return sendUser;
}

// GameRoom을 Room으로 변환
export const convertSendRoomData = (room: GameRoom) => {
  const sendUsers: User[] = [];
  room.getUsers().forEach((user: UserSessions) => {
    sendUsers.push(user.getUserInfo());
  });

  const sendRoom: Room = {
    id: room.getRoomId(),
    ownerId: room.getRoomOwnerId(),
    ownerEmail: room.getRoomOwnerEmail(),
    name: room.getRoomName(),
    maxUserNum: room.getRoomMaxUser(),
    state: room.getRoomState(),
    users: sendUsers
  }

  return sendRoom;
}

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

  if (
    !(-25 <= nextX && nextX <= 25) || // 오른쪽, 왼족 외벽
    !(-11 <= nextY && nextY <= 11) || // 위, 아래 외벽
    (-23 <= nextX && nextX <= 0 && 5 <= nextY && nextY <= 10) || // 건물 1, 2
    (3 <= nextX && nextX <= 23 && 5 <= nextY && nextY <= 10) || // 건물 3, 4
    (-23 <= nextX && nextX <= -2.5 && -9 <= nextY && nextY <= -2.5) || // 건물 5, 6
    (5 <= nextX && nextX <= 23 && -9 <= nextY && nextY <= -2.5) || // 건물 7, 8
    (-21 <= nextX && nextX <= -20 && 2.5 <= nextY && nextY <= 3.5) || // 부쉬 1
    (-15 <= nextX && nextX <= -14 && 2.5 <= nextY && nextY <= 3.5) || // 부쉬 2
    (11 <= nextX && nextX <= 12 && 0.5 <= nextY && nextY <= 1.5) || // 부쉬 3
    (21 <= nextX && nextX <= 22 && 0.5 <= nextY && nextY <= 1.5) || // 부쉬 4
    (-2 <= nextX && nextX <= -1 && -8.5 <= nextY && nextY <= -7.5) || // 부쉬 5
    (4 <= nextX && nextX <= 5 && -8.5 <= nextY && nextY <= -7.5) || // 부쉬 6
    (-9 <= nextX && nextX <= -8 && 2 <= nextY && nextY <= 3) || // 작은 나무1
    (14 <= nextX && nextX <= 15 && 2 <= nextY && nextY <= 3) || // 작은 나무2
    (0 <= nextX && nextX <= 3 && -2 <= nextY && nextY <= 1) // 큰나무
  )
    monsterDirection = (monsterDirection + 2) % 4;

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

// a이상 ~ b이하 중 m개를 안겹치게 랜덤하게 뽑기
export const nonSameRandom = (a: number, b: number, m: number) => {
  const numbers: number[] = [];
  for (let i = a; i < b + 1; i++) numbers.push(i);
  const answer: number[] = [];
  for (let i = 0; i < m; i++) {
    const index = Math.floor(Math.random() * numbers.length);
    const number = numbers[index];
    answer.push(number);
    numbers.splice(index, 1);
  }
  return answer;
};
