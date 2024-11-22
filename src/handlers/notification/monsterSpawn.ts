import { Room, User } from '../../interface/interface.js';
import { getRedisData, monsterAI, setRedisData } from '../handlerMethod.js';
import { monsterAiDatas } from './monsterMove.js';

const initMonster = 6;
export const monsterDatas: { [key: number]: { nickname: string; attackCool: number; attackRange: number } } = {
  3: { nickname: '상어군', attackCool: 105, attackRange: 3 },
  5: { nickname: '말랑이', attackCool: 120, attackRange: 3 },
  8: { nickname: '핑크군', attackCool: 135, attackRange: 4 },
  12: { nickname: '공룡군', attackCool: 150, attackRange: 4 }
};

// export const monsterDatas = { 3: {nickname:"상어군", attackCool : 60, attackRange: 7}}
const position = [
  [-17, 9],
  [-17, -1],
  [1, -9],
  [16, -9],
  [16, -1],
  [16, 9]
];

let monsterNumber = 1000000;
let positionIndex = 0;

// 게임 시작 시 몬스터 스폰 시작
export const monsterSpawnStart = async (roomId: number, level: number) => {
  // 유저가 속한 room찾기
  const roomDatas = await getRedisData('roomData');
  let roomData: Room | null = null;
  for (let i = 0; i < roomDatas.length; i++) {
    if (roomDatas[i].id === roomId) {
      roomData = roomDatas[i];
    }
  }
  if (roomData === null) return;

  // 이전 몬스터 모두 삭제 (roomData 삭제)
  for (let i = 0; i < roomData.users.length; i++) {
    if (roomData.users[i].character.roleType === 2) {
      roomData.users.splice(i, 1);
      i--;
    }
  }
  // characterPositionDatas 삭제
  const characterPositionDatas = await getRedisData('characterPositionDatas');
  for (let i = 0; i < characterPositionDatas[roomId].length; i++) {
    if (characterPositionDatas[roomId][i].id >= 1000000) characterPositionDatas[roomId].splice(i, 1), i--;
  }
  // monsterAiDatas 삭제
  monsterAiDatas[roomId] = [];
  await setRedisData('roomData', roomDatas);
  await setRedisData('characterPositionDatas', characterPositionDatas);

  // 몬스터 생성 함수 실행
  for (let k = 0; k < initMonster; k++) {
    await monsterSpawn(roomId, level);
  }
};

// 몬스터 생성 함수
export const monsterSpawn = async (roomId: number, level: number) => {
  // 몬스터 정보 생성 하기
  const roomDatas = await getRedisData('roomData');
  let roomData: Room | null = null;
  for (let i = 0; i < roomDatas.length; i++) {
    if (roomDatas[i].id === roomId) {
      roomData = roomDatas[i];
    }
  }
  if (roomData === null) return;
  const types = Object.keys(monsterDatas).map(Number);
  const typesIndex = Math.floor(Math.random() * types.length);
  const type = types[typesIndex];
  const monsterData = monsterDatas[type];
  const monster: User = {
    id: ++monsterNumber,
    nickname: `LV${level} ${monsterData.nickname}`,
    character: {
      characterType: type,
      roleType: 2,
      hp: level * 2 + 1,
      weapon: 0,
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
  };

  // 생성된 몬스터 정보 redis에 저장 하기
  roomData.users.push(monster);
  await setRedisData('roomData', roomDatas);

  // 랜덤한 위치 생성하기
  let characterPositionDatas = await getRedisData('characterPositionDatas');
  if (!characterPositionDatas) {
    characterPositionDatas = { [roomData.id]: [] };
  } else if (!characterPositionDatas[roomData.id]) {
    characterPositionDatas[roomData.id] = [];
  }
  positionIndex = (positionIndex + 1) % position.length;

  // 생성한 위치 정보 서버에 저장하기
  characterPositionDatas[roomId].push({
    id: monsterNumber,
    x: position[positionIndex][0],
    y: position[positionIndex][1]
  });
  // 생성한 몬스터가 움직일 방향과 거리 만들어주기 + 공격 쿨 만들어주기
  await setRedisData('characterPositionDatas', characterPositionDatas);
  if (!monsterAiDatas[roomId]) monsterAiDatas[roomId] = [];
  monsterAI(
    roomId,
    monsterNumber,
    position[positionIndex][0],
    position[positionIndex][1],
    monsterData.attackCool,
    monsterData.attackRange
  );
};
