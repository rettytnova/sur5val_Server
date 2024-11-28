/* 응답 성공 상태를 나타내는 상수 */
export const RESPONSE_SUCCESS_CODE = 0;
/**
 * GlobalFailCode
 * - 응답 상태에 따른 실패 코드
 */
export const GlobalFailCode = Object.freeze({
  NONE: RESPONSE_SUCCESS_CODE,
  UNKNOWN_ERROR: 1,
  INVALID_REQUEST: 2,
  AUTHENTICATION_FAILED: 3,
  CREATE_ROOM_FAILED: 4,
  JOIN_ROOM_FAILED: 5,
  LEAVE_ROOM_FAILED: 6,
  REGISTER_FAILED: 7,
  ROOM_NOT_FOUND: 8,
  CHARACTER_NOT_FOUND: 9,
  CHARACTER_STATE_ERROR: 10,
  CHARACTER_NO_CARD: 11,
  INVALID_ROOM_STATE: 12,
  NOT_ROOM_OWNER: 13,
  ALREADY_USED_BBANG: 14,
  INVALID_PHASE: 15,
  CHARACTER_CONTAINED: 16
});

// 방 상태
export const RoomStateType = Object.freeze({
  WAIT: 0,
  PREPARE: 1,
  INGAME: 2
});
export type RoomStateType = (typeof RoomStateType)[keyof typeof RoomStateType];

// 인게임 페이즈
export const PhaseType = Object.freeze({
  NONE_PHASE: 0,
  DAY: 1,
  EVENING: 2,
  END: 3
});
export type PhaseType = (typeof PhaseType)[keyof typeof PhaseType];

// 카드
export const CardType = Object.freeze({
  NONE: 0,
  MAGICIAN_BASIC_SKILL: 101,
  WARRIOR_BASIC_SKILL: 102,
  ARCHER_BASIC_SKILL: 103,
  PALADIN_BASIC_SKILL: 104,
  MAGICIAN_EXTENDED_SKILL: 105,
  WARRIOR_EXTENDED_SKILL: 106,
  ARCHER_EXTENDED_SKILL: 107,
  PALADIN_EXTENDED_SKILL: 108,
  BASIC_HP_POTION: 201,
  BASIC_WEAPON: 306,
  BASIC_HEAD: 307,
  BASIC_ARMOR: 308,
  BASIC_CLOAK: 309,
  BASIC_GLOVE: 310,
  ADVANCED_WEAPON: 311,
  ADVANCED_HEAD: 312,
  ADVANCED_ARMOR: 313,
  ADVANCED_CLOAK: 314,
  ADVANCED_GLOVE: 315
});
export type CardType = (typeof CardType)[keyof typeof CardType];
// 캐릭터 상태
export const CharacterStateType = Object.freeze({
  NONE_CHARACTER_STATE: 0,
  BBANG_SHOOTER: 1, // 빵야 시전자
  BBANG_TARGET: 2, // 빵야 대상 (쉴드 사용가능 상태)
  DEATH_MATCH_STATE: 3, // 현피 중 자신의 턴이 아닐 때
  DEATH_MATCH_TURN_STATE: 4, // 현피 중 자신의 턴
  FLEA_MARKET_TURN: 5, // 플리마켓 자신의 턴
  FLEA_MARKET_WAIT: 6, // 플리마켓 턴 대기 상태
  GUERRILLA_SHOOTER: 7, // 게릴라 시전자
  GUERRILLA_TARGET: 8, // 게릴라 대상
  BIG_BBANG_SHOOTER: 9, // 난사 시전자
  BIG_BBANG_TARGET: 10, // 난사 대상
  ABSORBING: 11, // 흡수 중
  ABSORB_TARGET: 12, // 흡수 대상
  HALLUCINATING: 13, // 신기루 중
  HALLUCINATION_TARGET: 14, // 신기루 대상
  CONTAINED: 15 // 감금 중
});
export type CharacterStateType = (typeof CharacterStateType)[keyof typeof CharacterStateType];

// 유저 캐릭터 코드
export const UserCharacterType = Object.freeze({
  RED: 1, // 빨강이
  FROGGY: 7, // 개굴군
  SWIM_GLASSES: 9, // 물안경군
  MASK: 10, // 가면군
  PINK_SLIME: 13 // 핑크슬라임
});
export type UserCharacterType = (typeof UserCharacterType)[keyof typeof UserCharacterType];

// 몬스터 캐릭터 코드
export const MonsterCharacterType = Object.freeze({
  SHARK: 3, // 상어군
  MALANG: 5, // 말랑이
  PINK: 8, // 핑크군
  DINOSAUR: 12, // 공룡이
  PINK_SLIME: 13 // 핑크슬라임
});
export type MonsterCharacterType = (typeof MonsterCharacterType)[keyof typeof MonsterCharacterType];

// 역할 코드
export const RoleType = Object.freeze({
  NONE_ROLE: 0,
  WEAK_MONSTER: 1, //TARGET
  SUR5VAL: 2, //BODYGUARD
  UNKNOWN: 3, //HITMAN
  BOSS_MONSTER: 4 //PSYCHOPATH
});
export type RoleType = (typeof RoleType)[keyof typeof RoleType];
