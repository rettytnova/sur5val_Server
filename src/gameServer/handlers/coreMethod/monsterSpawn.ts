import Server from '../../class/server.js';
import { CharacterPositionData, SpawnPositionData, User } from '../../../gameServer/interface/interface.js';
import { RoleType } from '../enumTyps.js';
import { monsterAI } from '../handlerMethod.js';
import { randomNumber } from '../../../utils/utils.js';
import UserSessions from '../../class/userSessions.js';
import PositionSessions from '../../class/positionSessions.js';
import { monsterAiDatas } from './monsterMove.js';

let monsterNumber = 10000000;
let positionIndex = 0;
let monsterIdx = 0;

// 게임 시작 시 몬스터 스폰 시작
export const monsterSpawnStart = (roomId: number, level: number, bossIdx: number) => {
  try {
    const playerSpawnPositionList = Server.getInstance().playerSpawnPositionList;
    if (!playerSpawnPositionList) return;
    const monsterSpawnPositionList = Server.getInstance().monsterSpawnPositionList;
    if (!monsterSpawnPositionList) return;
    const bossSpawnPositionList = Server.getInstance().bossSpawnPositionList;
    if (!bossSpawnPositionList) return;

    // 유저가 속한 room 찾기
    const room = Server.getInstance()
      .getRooms()
      .find((room) => room.getRoomId() === roomId);
    if (!room) {
      console.error('몬스터 소환을 요청받은 roomId의 데이터를 찾을 수 없음');
      return;
    }

    // 공격팀 유저 상태 회복시키기
    for (let i = 0; i < room.getUsers().length; i++) {
      if (room.getUsers()[i].getCharacter().roleType === RoleType.SUR5VAL) {
        room.getUsers()[i].getCharacter().hp = room.getUsers()[i].getCharacter().maxHp;
        room.getUsers()[i].getCharacter().stateInfo.state = 0;
        room.getUsers()[i].getCharacter().aliveState = true;
        room.getUsers()[i].getCharacter().coolDown = 0;
        room.getUsers()[i].getCharacter().gold += 100 * (level - 1);
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
    for (let i = 0; i < room.getUsers().length; i++) {
      const character = characterDB.find(
        (data) => data.characterType === room.getUsers()[i].getCharacter().characterType
      );
      if (character) {
        room.getUsers()[i].getCharacter().mp = Math.min(
          room.getUsers()[i].getCharacter().mp + character.mp * initGameInfo[0].mpRestoreRate,
          character.mp
        );
      }
    }

    // 이전 몬스터의 roomData 삭제
    for (let i = 0; i < room.getUsers().length; i++) {
      if (room.getUsers()[i].getCharacter().roleType === RoleType.WEAK_MONSTER) {
        room.getUsers().splice(i, 1);
        i--;
      }
    }

    // 이전 몬스터의 characterPositionDatas 삭제
    let characterPositionDatas = Server.getInstance()
      .getPositions()
      .find((position) => position.getPositionRoomId() === roomId);
    if (!characterPositionDatas) {
      characterPositionDatas = new PositionSessions(roomId, []);
      Server.getInstance().getPositions().push(characterPositionDatas);
    }
    characterPositionDatas.setCharacterPositions([]);

    const userPositionDatas = [];
    let playerIdx = 0;
    for (let i = 0; i < room.getUsers().length; i++) {
      let characterPositionData: CharacterPositionData = { id: -1, x: -1, y: -1 };
      if (room.getUsers()[i].getCharacter().roleType === RoleType.BOSS_MONSTER) {
        if (bossIdx === -1) {
          bossIdx = randomNumber(4, bossSpawnPositionList.length - 1);
        }
        characterPositionData = {
          id: room.getUsers()[i].getId(),
          x: bossSpawnPositionList[bossIdx].x,
          y: bossSpawnPositionList[bossIdx].y
        };
      } else if (room.getUsers()[i].getCharacter().roleType === RoleType.SUR5VAL) {
        characterPositionData = {
          id: room.getUsers()[i].getId(),
          x: playerSpawnPositionList[playerIdx].x,
          y: playerSpawnPositionList[playerIdx].y
        };
        playerIdx++;
      } else if (room.getUsers()[i].getCharacter().roleType === RoleType.WEAK_MONSTER) {
        characterPositionData = {
          id: room.getUsers()[i].getId(),
          x: monsterSpawnPositionList[monsterIdx].x,
          y: monsterSpawnPositionList[monsterIdx].y
        };
        monsterIdx++;
        monsterIdx = monsterIdx % monsterSpawnPositionList.length;
      }
      userPositionDatas.push(characterPositionData);
    }
    playerIdx = 0;
    characterPositionDatas.setCharacterPositions(userPositionDatas);

    // 이전 몬스터의 monsterAiDatas 삭제
    monsterAiDatas[roomId] = [];

    // 다음 몬스터 생성 함수 실행
    const initMonster = initGameInfo[0].roundInitMonster;
    for (let k = 0; k < initMonster; k++) {
      monsterSpawn(roomId, level, monsterSpawnPositionList);
    }
  } catch (err) {
    console.log('::: monsterSpawnStart ::: ', err);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 몬스터 생성 함수
const monsterSpawn = (roomId: number, level: number, positionList: SpawnPositionData[]) => {
  // 몬스터 초기 데이터 값 가져오기
  const monsterDBInfo = Server.getInstance().monsterInfo;
  if (!monsterDBInfo) {
    console.error('monsterInfo 정보를 불러오는데 실패하였습니다.');
    return;
  }

  // 유저가 속한 room 찾기
  const room = Server.getInstance()
    .getRooms()
    .find((room) => room.getRoomId() === roomId);
  if (!room) {
    console.error('몬스터 소환을 요청받은 roomId의 데이터를 찾을 수 없음');
    return;
  }

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
  const madeMonster: UserSessions = new UserSessions(monster);

  // 생성된 몬스터 정보 서버에 저장 하기
  room.getUsers().push(madeMonster);

  // 랜덤 위치 생성하기
  const characterPositionDatas = Server.getInstance()
    .getPositions()
    .find((position) => position.getPositionRoomId() === room.getRoomId());
  if (!characterPositionDatas) {
    console.error('characterPositionDatas를 찾지 못하였습니다.');
    return;
  }

  positionIndex = (positionIndex + 1) % positionList.length;

  // 생성한 위치 정보 서버에 저장하기
  characterPositionDatas.getCharacterPositions().push({
    id: monsterNumber,
    x: positionList[positionIndex].x,
    y: positionList[positionIndex].y
  });

  // 생성한 몬스터가 움직일 방향과 거리 만들어주기 + 공격 쿨 만들어주기
  if (!monsterAiDatas[roomId]) monsterAiDatas[roomId] = [];
  monsterAI(
    roomId,
    monsterNumber,
    positionList[positionIndex].x,
    positionList[positionIndex].y,
    monsterData.attackCool / 2,
    monsterData.attackRange
  );
};
