import Server from '../../class/server.js';
import { spawnPoint } from '../../config/config.js';
import { CharacterPositionData, Room, User } from '../../interface/interface.js';
import { RoleType, UserCharacterType } from '../enumTyps.js';
import { getRedisData, monsterAI, nonSameRandom, setRedisData } from '../handlerMethod.js';
import { monsterAiDatas } from './monsterMove.js';

let idx = -1;
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
export const monsterSpawnStart = async (roomId: number, level: number, idx: number) => {
  // 유저가 속한 room찾기
  const rooms = await getRedisData('roomData');
  let room: Room | null = null;
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].id === roomId) {
      room = rooms[i];
    }
  }
  if (room === null) return;

  // 공격팀 유저 상태 회복시키기
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === RoleType.SUR5VAL) {
      room.users[i].character.hp = room.users[i].character.maxHp;
      room.users[i].character.stateInfo.state = 0;
      room.users[i].character.aliveState = true;
    }
  }

  // 필요한 데이터 가져오기
  const initGameInfo = Server.getInstance().initGameInfo;
  if (!initGameInfo) {
    console.error('몬스터 스폰 중 initGameInfo를 찾을 수 없습니다.');
    return;
  }
  const characterDB = Server.getInstance().characterStatInfo;
  if (!characterDB) {
    console.error('몬스터 스폰 중 / 데이터베이스에서 캐릭터데이터를 찾을 수 없습니다.');
    return;
  }

  // 공격팀 유저 마나 회복시키기
  for (let i = 0; i < room.users.length; i++) {
    const character = characterDB.find((data) => data.characterType === room.users[i].character.characterType);
    if (character) {
      room.users[i].character.mp = Math.min(
        room.users[i].character.mp + character.mp * initGameInfo[0].mpRestoreRate,
        character.mp
      );
    }
  }

  // 이전 몬스터의 roomData 삭제
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === RoleType.WEAK_MONSTER) {
      room.users.splice(i, 1);
      i--;
    }
  }

  // 이전 몬스터의 characterPositionDatas 삭제
  let characterPositionDatas = await getRedisData('characterPositionDatas');
  if (!characterPositionDatas) characterPositionDatas = {};
  characterPositionDatas[roomId] = [];

  // 유저의 시작 위치 랜덤하게 지정
  if (!characterPositionDatas) {
    characterPositionDatas = { [room.id]: [] };
  } else if (!characterPositionDatas[room.id]) {
    characterPositionDatas[room.id] = [];
  }
  const randomIndex = nonSameRandom(1, 10, room.users.length);
  const userPositionDatas = [];
  for (let i = 0; i < room.users.length; i++) {
    const randomSpawnPoint = spawnPoint[randomIndex[i]];

    let characterPositionData: CharacterPositionData = { id: -1, x: -1, y: -1 };
    if (level === 5 && room.users[i].character.characterType === UserCharacterType.PINK_SLIME) {
      switch (idx) {
        case 0:
          characterPositionData = {
            id: room.users[i].id,
            x: -22.5,
            y: -1.14001215
          };
          break;
        case 1:
          characterPositionData = {
            id: room.users[i].id,
            x: 1.38865852,
            y: -9.18549061
          };
          break;
        case 2:
          characterPositionData = {
            id: room.users[i].id,
            x: 22.0167046,
            y: -1.156556
          };
          break;
        case 3:
          characterPositionData = {
            id: room.users[i].id,
            x: 1.54476261,
            y: 9.82438946
          };
          break;
      }
    } else {
      characterPositionData = {
        id: room.users[i].id,
        x: randomSpawnPoint.x,
        y: randomSpawnPoint.y
      };
    }
    userPositionDatas.push(characterPositionData);
  }
  characterPositionDatas[room.id].unshift(...userPositionDatas);

  // 이전 몬스터의 monsterAiDatas 삭제
  monsterAiDatas[roomId] = [];
  await setRedisData('roomData', rooms);
  await setRedisData('characterPositionDatas', characterPositionDatas);

  // 다음 몬스터 생성 함수 실행
  const initMonster = initGameInfo[0].roundInitMonster;
  for (let k = 0; k < initMonster; k++) {
    await monsterSpawn(roomId, level);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 몬스터 생성 함수
const monsterSpawn = async (roomId: number, level: number) => {
  // 몬스터 초기 데이터 값 가져오기
  const monsterDBInfo = Server.getInstance().monsterInfo;
  if (!monsterDBInfo) {
    console.error('monsterInfo 정보를 불러오는데 실패하였습니다.');
    return;
  }

  // 유효성 검사
  const rooms = await getRedisData('roomData');
  let roomData: Room | null = null;
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].id === roomId) {
      roomData = rooms[i];
    }
  }
  if (roomData === null) return;

  // 랜덤하게 몬스터 생성 하기
  const monsterDatas = monsterDBInfo.filter((data) => data.level === level);
  const monsterData = monsterDatas[Math.floor(monsterDatas.length * Math.random())];
  const monster: User = {
    id: ++monsterNumber,
    email: '',
    nickname: monsterData.nickname,
    character: {
      characterType: monsterData.monsterType,
      roleType: RoleType.WEAK_MONSTER,
      aliveState: true,
      coolDown: 0,
      level: level,
      maxExp: 0,
      exp: monsterData.exp,
      gold: monsterData.gold,
      maxHp: monsterData.hp,
      hp: monsterData.hp,
      mp: 0,
      attack: monsterData.attack,
      armor: monsterData.armor,
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
  await setRedisData('roomData', rooms);

  // 랜덤 위치 생성하기
  let characterPositionDatas = await getRedisData('characterPositionDatas');
  if (!characterPositionDatas) {
    characterPositionDatas = { [roomId]: [] };
  } else if (!characterPositionDatas[roomId]) {
    characterPositionDatas[roomId] = [];
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
    monsterData.attackCool / 2,
    monsterData.attackRange
  );

  // 에러 찾기 임시 함수
  if (roomData.users.length !== characterPositionDatas[roomId].length) {
    throw new Error(`monsterMove에서 에러 발생 ${roomData.users}, ${characterPositionDatas[roomId]}`);
  }
};
