import { Room, User } from '../../interface/interface.js';
import { userCharacterData } from '../game/gamePrepareHandler.js';
import { getRedisData, monsterAI, setRedisData } from '../handlerMethod.js';
import { monsterAiDatas } from './monsterMove.js';

const initMonster = 8;
export const monsterDatas: {
  [type: number]: {
    [level: number]: {
      nickname: string;
      exp: number;
      gold: number;
      attackCool: number;
      attackRange: number;
      attack: number;
      hp: number;
      armor: number;
    };
  };
} = {
  5: {
    1: { nickname: `Lv1 말랑이`, gold: 10, exp: 2, attackCool: 30, attackRange: 2, attack: 1, hp: 5, armor: 0 },
    2: { nickname: `Lv2 말랑이`, gold: 30, exp: 3, attackCool: 30, attackRange: 2, attack: 2, hp: 8, armor: 1 },
    3: { nickname: `Lv3 말랑이`, gold: 60, exp: 4, attackCool: 30, attackRange: 2, attack: 3, hp: 13, armor: 1 },
    4: { nickname: `Lv4 말랑이`, gold: 100, exp: 5, attackCool: 30, attackRange: 2, attack: 5, hp: 21, armor: 2 },
    5: { nickname: `Lv5 말랑이`, gold: 150, exp: 6, attackCool: 30, attackRange: 2, attack: 8, hp: 34, armor: 2 }
  },
  8: {
    1: { nickname: `Lv1 핑크군`, gold: 10, exp: 2, attackCool: 40, attackRange: 2, attack: 1, hp: 5, armor: 0 },
    2: { nickname: `Lv2 핑크군`, gold: 30, exp: 3, attackCool: 40, attackRange: 2, attack: 2, hp: 9, armor: 1 },
    3: { nickname: `Lv3 핑크군`, gold: 60, exp: 4, attackCool: 40, attackRange: 2, attack: 4, hp: 14, armor: 1 },
    4: { nickname: `Lv4 핑크군`, gold: 100, exp: 5, attackCool: 40, attackRange: 2, attack: 6, hp: 23, armor: 2 },
    5: { nickname: `Lv5 핑크군`, gold: 150, exp: 6, attackCool: 40, attackRange: 2, attack: 9, hp: 37, armor: 2 }
  },
  12: {
    1: { nickname: 'Lv1 공룡군', gold: 10, exp: 2, attackCool: 50, attackRange: 2.5, attack: 2, hp: 5, armor: 0 },
    2: { nickname: 'Lv2 공룡군', gold: 30, exp: 3, attackCool: 50, attackRange: 2.5, attack: 2, hp: 10, armor: 1 },
    3: { nickname: 'Lv3 공룡군', gold: 60, exp: 4, attackCool: 50, attackRange: 2.5, attack: 4, hp: 15, armor: 1 },
    4: { nickname: 'Lv4 공룡군', gold: 100, exp: 5, attackCool: 50, attackRange: 2.5, attack: 6, hp: 25, armor: 2 },
    5: { nickname: 'Lv5 공룡군', gold: 150, exp: 6, attackCool: 50, attackRange: 2.5, attack: 10, hp: 40, armor: 2 }
  }
};

const position = [
  [-17.5, 9],
  [-17.5, -1.1],
  [-17.5, -9],
  [-8.5, -1.1],
  [1, 9],
  [1, 4],
  [1, -1],
  [1, -5.5],
  [1, -9],
  [8.5, -1.1],
  [17, 9],
  [17, -1],
  [17, -9]
];

let monsterNumber = 10000000;
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

  // 공격팀 유저 상태 회복시키기
  for (let i = 0; i < roomData.users.length; i++) {
    if (roomData.users[i].character.roleType === 2) {
      roomData.users[i].character.hp = roomData.users[i].character.maxHp;
      roomData.users[i].character.stateInfo.state = 0;
    }
  }

  // 이전 몬스터 모두 삭제 (roomData 삭제)
  for (let i = 0; i < roomData.users.length; i++) {
    if (roomData.users[i].character.roleType === 1) {
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
    nickname: monsterData[level].nickname,
    character: {
      characterType: type,
      roleType: 1,
      level: level,
      exp: 0,
      gold: monsterData[level].gold,
      maxHp: monsterData[level].hp,
      hp: monsterData[level].hp,
      mp: 0,
      attack: monsterData[level].attack,
      armor: monsterData[level].armor,
      weapon: 0,
      potion: 0,
      stateInfo: {
        state: 0,
        nextState: 0,
        nextStateAt: 0,
        stateTargetUserId: 0
      },
      equips: [],
      debuffs: [],
      handCards: []
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
    monsterData[level].attackCool / 2,
    monsterData[level].attackRange
  );
};
