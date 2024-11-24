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

// 캐릭터 코드
export const UserCharacterType = Object.freeze({
  RED: 1, // 빨강이
  FROGGY: 7, // 개굴군
  SWIM_GLASSES: 9, // 물안경군
  MASK: 10, // 가면군
  PINK_SLIME: 13 // 핑크슬라임
});
export type UserCharacterType = (typeof UserCharacterType)[keyof typeof UserCharacterType];

// 캐릭터 코드
export const CharacterType = Object.freeze({
  RED: 1, // 빨강이
  SHARK: 3, // 상어군
  MALANG: 5, // 말랑이
  FROGGY: 7, // 개굴군
  PINK: 8, // 핑크군
  SWIM_GLASSES: 9, // 물안경군
  MASK: 10, // 가면군
  DINOSAUR: 12, // 공룡이
  PINK_SLIME: 13 // 핑크슬라임
});
export type CharacterType = (typeof CharacterType)[keyof typeof CharacterType];

// 역할 코드
export const RoleType = Object.freeze({
  NONE_ROLE: 0,
  TARGET: 1,
  BODYGUARD: 2,
  HITMAN: 3,
  PSYCHOPATH: 4
});
export type RoleType = (typeof RoleType)[keyof typeof RoleType];

export const CardType = Object.freeze({
  NONE: 0,
  BBANG: 1, // 20장
  BIG_BBANG: 2, // 1장
  SHIELD: 3, // 10장
  VACCINE: 4, // 6장
  CALL_119: 5, // 2장
  DEATH_MATCH: 6, // 4장
  GUERRILLA: 7, // 1장
  ABSORB: 8, // 4장
  HALLUCINATION: 9, // 4장
  FLEA_MARKET: 10, // 3장
  MATURED_SAVINGS: 11, // 2장
  WIN_LOTTERY: 12, // 1장
  SNIPER_GUN: 13, // 1장
  HAND_GUN: 14, // 2장
  DESERT_EAGLE: 15, // 3장
  AUTO_RIFLE: 16, // 2장
  LASER_POINTER: 17, // 1장
  RADAR: 18, // 1장
  AUTO_SHIELD: 19, // 2장
  STEALTH_SUIT: 20, // 2장
  CONTAINMENT_UNIT: 21, // 3장
  SATELLITE_TARGET: 22, // 1장
  BOMB: 23 // 1장
});
export type CardType = (typeof CardType)[keyof typeof CardType];
