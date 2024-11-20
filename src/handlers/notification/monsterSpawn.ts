import { CustomSocket, Room, User } from '../../interface/interface.js';
import { getRedisData, getUserBySocket, monsterAI, setRedisData } from '../handlerMethod.js';
import { monsterAiDatas } from './monsterMove.js';

const initMonster = 6;
const monsterDatas = [
  { type: 3, nickcame: '상어군', attackCool: 60, attackRange: 7 },
  { type: 5, nickcame: '말랑이', attackCool: 90, attackRange: 7 },
  { type: 8, nickcame: '핑크군', attackCool: 120, attackRange: 7 },
  { type: 12, nickcame: '공룡군', attackCool: 150, attackRange: 7 }
];
const position = [
  [-17, 9],
  [-17, -1],
  [1, -9],
  [16, -9],
  [16, -1],
  [16, 9]
];

let monsterNumber = 10000000;
let positionIndex = 0;

// 게임 시작 시 몬스터 스폰 시작
export const monsterSpawnStart = async (socket: CustomSocket) => {
  const user = await getUserBySocket(socket);
  const roomDatas = await getRedisData('roomData');
  let roomData: Room;
  for (let i = 0; i < roomDatas.length; i++) {
    for (let j = 0; j < roomDatas[i].users.length; j++) {
      if (roomDatas[i].users[j].id === user.id) {
        roomData = roomDatas[i];
        for (let k = 0; k < initMonster; k++) {
          await monsterSpawn(roomData, 0);
        }
        break;
      }
    }
  }
};

// 몬스터 생성 함수
export const monsterSpawn = async (roomData: Room, n: number) => {
  // 몬스터 정보 생성 하기
  const rooms = await getRedisData('roomData');
  let roomIndex;
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].id === roomData.id) {
      roomIndex = i;
      break;
    }
  }
  if (roomIndex === undefined) {
    console.error('roomData를 찾을 수 없습니다.');
    return;
  }
  const monsterData = monsterDatas[Math.floor(Math.random() * monsterDatas.length)];
  const monsetData: User = {
    id: ++monsterNumber,
    nickname: `LV1 몬스터 ${monsterData.nickcame}`,
    character: {
      characterType: monsterData.type,
      roleType: 2,
      hp: 10,
      weapon: 1,
      stateInfo: {
        state: 0,
        nextState: 0,
        nextStateAt: 0,
        stateTargetUserId: 0
      },
      equips: [],
      debuffs: [],
      handCards: [],
      bbangCount: 0,
      handCardsCount: 0
    }
  }; // 생성된 몬스터 정보 redis에 저장 하기

  rooms[roomIndex].users.push(monsetData);
  await setRedisData('roomData', rooms); // 랜덤한 위치 생성하기

  let characterPositionDatas = await getRedisData('characterPositionDatas');
  if (!characterPositionDatas) {
    characterPositionDatas = { [rooms[roomIndex].id]: [] };
  } else if (!characterPositionDatas[rooms[roomIndex].id]) {
    characterPositionDatas[rooms[roomIndex].id] = [];
  }
  positionIndex = (positionIndex + 1) % position.length; // 생성한 위치 정보 서버에 저장하기

  characterPositionDatas[roomData.id].push({
    id: monsterNumber,
    x: position[positionIndex][0],
    y: position[positionIndex][1]
  });
  await setRedisData('characterPositionDatas', characterPositionDatas); // 생성한 몬스터가 움직일 방향과 거리 만들어주기 + 공격 쿨 만들어주기

  if (!monsterAiDatas[roomData.id]) monsterAiDatas[roomData.id] = [];
  monsterAI(
    roomData.id,
    monsterNumber,
    position[positionIndex][0],
    position[positionIndex][0],
    monsterData.attackCool,
    monsterData.attackRange
  );
};
