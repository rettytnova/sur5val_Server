import net from 'net';
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
  maxUserNum: Number;
}

export interface Card {
  type: Number;
  count: Number;
}

export interface CharacterStateInfo {
  state: Number;
  nextState: Number;
  nextStateAt: Number;
  stateTargetUserId: Number;
}

export interface Character {
  characterType: Number;
  roleType: Number;
  hp: Number;
  weapon: Number;
  stateInfo: CharacterStateInfo;
  equips: Number[];
  debuffs: Number[];
  handCards: Card[];
  bbangCount: Number;
  handCardsCount: Number;
}

export interface User {
  id: Number;
  nickname: string;
  character: Character;
}

export interface Room {
  id: Number;
  ownerId: Number;
  name: string;
  maxUserNum: Number;
  state: Number;
  users: User[];
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
export interface CharacterPositionData {}
