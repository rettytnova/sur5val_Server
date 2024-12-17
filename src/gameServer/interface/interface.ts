import net from 'net';
import { CardType, PhaseType, RoomStateType } from '../handlers/enumTyps.js';
import UserSessions from '../class/userSessions.js';
//#region 레디스 인터페이스

//#endregion
export interface CustomSocket extends net.Socket {
  buffer: Buffer;
  id: string;
}

// /* UserCharacterData 타입 정의 */
// export interface UserCharacterData {
//   [types: number]: UserCharacterInitData;
// }

// /* UserCharacterInitData 타입 정의 */
// export interface UserCharacterInitData {
//   roleType: number;
//   maxExp: number;
//   exp: number;
//   gold: number;
//   hp: number;
//   mp: number;
//   attack: number;
//   armor: number;
//   handCards: Card[];
// }

export interface CharacterInitStatDBData {
  characterType: number;
  attack: number;
  armor: number;
  hp: number;
  mp: number;
  handCards: number;
}

export interface CharacterLevelUpStatDBData {
  characterType: number;
  attack: number;
  armor: number;
  hp: number;
}

/* MonsterDatas 타입 정의 */
export interface MonsterDatas {
  [type: number]: MonsterLevelData;
}

/* MonsterLevelData 타입 정의 */
export interface MonsterLevelData {
  [level: number]: MonsterInitData;
}

/* MonsterDataInit 타입 정의 */
export interface MonsterInitData {
  nickname: string;
  hp: number;
  attackCool: number;
  attackRange: number;
  attack: number;
  armor: number;
  exp: number;
  gold: number;
  hpRecovery: number;
  mpRecovery: number;
  //cardRewards: Card[];
}

export interface MonsterDBData {
  monsterType: number;
  nickname: string;
  level: number;
  hp: number;
  attack: number;
  attackCool: number;
  attackRange: number;
  armor: number;
  exp: number;
  gold: number;
  hpRecovery: number;
}

export interface equipItemDBData {
  cardType: number;
  price: number;
  attack: number;
  armor: number;
  hp: number;
}

export interface consumableItemDBData {
  cardType: number;
  price: number;
  attack: number;
  hp: number;
  mp: number;
  exp: number;
}

export interface initGameDBData {
  roundInitMonster: number;
  normalRoundTime: number;
  normalRoundNumber: number;
  bossRoundTime: number;
  attackCool: number;
  mpRestoreRate: number;
}

export interface shopListDBData {
  round: number;
  itemList: CardType[];
}

export interface skillCardDBData {
  cardType: number;
  coolTime: number;
}

export interface joinRoomPayload {
  roomId: number;
}

export interface CreateRoomPayload {
  name: string;
  maxUserNum: number;
}

export interface position {
  x: number;
  y: number;
}

export interface positionType {
  spawnPositionX: number;
  spawnPositionY: number;
  roleType: string;
}

export interface FleaMarketItemSelectPayload {
  pickIndex: number;
}

export interface Card {
  type: number;
  count: number;
}

export interface CharacterStateInfo {
  state: number;
  nextState: number;
  nextStateAt: number;
  stateTargetUserId: number;
}

export interface Character {
  characterType: number;
  roleType: number;
  aliveState: boolean;
  coolDown: number;
  level: number;
  maxExp: number;
  exp: number;
  gold: number;
  maxHp: number;
  hp: number;
  mp: number;
  attack: number;
  armor: number;
  weapon: number;
  potion: number;
  stateInfo: CharacterStateInfo;
  equips: number[];
  debuffs: number[];
  handCards: Card[];
}

export interface User {
  id: number;
  email: string;
  nickname: string;
  character: Character;
}

export interface RoomTwo {
  id: number;
  ownerId: number;
  ownerEmail: string;
  name: string;
  maxUserNum: number;
  state: RoomStateType;
  users: UserSessions[];
}

export interface Room {
  id: number;
  ownerId: number;
  ownerEmail: string;
  name: string;
  maxUserNum: number;
  state: RoomStateType;
  users: User[];
}

export interface GameStateData {
  phaseType: PhaseType;
  nextPhaseAt: number;
}

/* 회원가입 요청 페이로드 타입 정의 */
export interface RegisterRequest {
  nickname: string;
  password: string;
  email: string;
}

/* 회원가입 응답 페이로드 타입 정의 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  failCode: number;
}

/* 로그인 요청 페이로드 타입 정의 */
export interface LoginRequest {
  email: string;
  password: string;
}

/* 로그인 응답 페이로드 타입 정의 */
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  myInfo: User | null;
  failCode: number;
}

/* 레디스 타입 정의 */
export interface RedisUserData extends User {
  socketId: string;
  refreshToken: string;
}

/* CharacterPositionData 타입 정의 */
export interface CharacterPositionData {
  id: number;
  x: number;
  y: number;
}

export interface SpawnPositionData {
  mapNumber: number;
  spawnNumber: number;
  x: number;
  y: number;
  roleType: string;
}

/* CardSelectRequest 타입 정의 */
export interface CardSelectRequest {
  selectType: number;
  selectCardType: number;
}

/* CardSelectResponse 타입 정의 */
export interface CardSelectResponse {
  success: boolean;
  failCode: number;
}

/* UseCardRequest 타입 정의 */
export interface UseCardRequest {
  cardType: number;
  targetUserId: number;
}

/* UseCardResponse 타입 정의 */
export interface UseCardResponse {
  success: boolean;
  failCode: number;
}

/* UseCardNotification 타입 정의 */
export interface UseCardNotification {
  cardType: number;
  userId: number;
  targetUserId: number;
}

/* UserUpdateNotification 타입 정의 */
export interface UserUpdateNotification {
  user: User[];
}

/* CardEffectNotification 타입 정의 */
export interface CardEffectNotification {
  cardType: number;
  userId: number;
  success: boolean;
}

export interface GameEndPayload {
  resultType: number;
}
