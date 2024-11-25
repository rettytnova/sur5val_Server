import net from 'net';
import { PhaseType, RoomStateType } from '../handlers/enumTyps.js';
//#region 레디스 인터페이스

//#endregion
export interface CustomSocket extends net.Socket {
  buffer: Buffer;
  id: string;
}

export interface joinRoomPayload {
  roomId: number;
}

export interface CreateRoomPayload {
  name: string;
  maxUserNum: number;
}

export interface positionUpdatePayload {
  x: number;
  y: number;
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
  hp: number;
  weapon: number;
  potion: number;
  stateInfo: CharacterStateInfo;
  equips: number[];
  debuffs: number[];
  handCards: Card[];
  bbangCount: number;
  handCardsCount: number;
}

export interface User {
  id: number;
  nickname: string;
  character: Character;
}

export interface Room {
  id: number;
  ownerId: number;
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
