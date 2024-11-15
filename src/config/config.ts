import dotenv from 'dotenv';

dotenv.config();

const PORT: number = 5555;
const HOST: string = '127.0.0.1';

export const REDIS_PORT = process.env.REDIS_PORT;
export const REDIS_HOST = process.env.REDIS_HOST;

export const TOTAL_LENGTH = 11;
export const VERSION_START = 3;
export const SEQUENCE_SIZE = 4;

const TYPE_LENGTH = 2;
const VERSION_LENGTH = 1;
export const CLIENT_VERSION = '1.0.0';
const SEQUENCE_LENGTH = 4;
const PAYLOAD_LENGTH = 4;

const USER_DB_NAME = process.env.DB_NAME;
const USER_DB_USER = process.env.DB_USER;
const USER_DB_PASSWORD = process.env.DB_PASSWORD;
const USER_DB_HOST = process.env.DB_HOST;
const USER_DB_PORT = process.env.DB_PORT;

export const config = {
  server: {
    port: PORT,
    host: HOST,
  },
  databases: {
    userDB: {
      name: USER_DB_NAME,
      user: USER_DB_USER,
      password: USER_DB_PASSWORD,
      host: USER_DB_HOST,
      port: USER_DB_PORT,
    },
  },
  packet: {
    typeLength: TYPE_LENGTH,
    versionLength: VERSION_LENGTH,
    sequenceLength: SEQUENCE_LENGTH,
    payloadLength: PAYLOAD_LENGTH,
  },
  packetType: {
    REGISTER_REQUEST: 1,
    REGISTER_RESPONSE: 2,
    LOGIN_REQUEST: 3,
    LOGIN_RESPONSE: 4,
    CREATE_ROOM_REQUEST: 5,
    CREATE_ROOM_RESPONSE: 6,
    GET_ROOM_LIST_REQUEST: 7,
    GET_ROOM_LIST_RESPONSE: 8,
    JOIN_ROOM_REQUEST: 9,
    JOIN_ROOM_RESPONSE: 10,
    JOIN_RANDOM_ROOM_REQUEST: 11,
    JOIN_RANDOM_ROOM_RESPONSE: 12,
    JOIN_ROOM_NOTIFICATION: 13,
    LEAVE_ROOM_REQUEST: 14,
    LEAVE_ROOM_RESPONSE: 15,
    LEAVE_RROM_NOTIFICATION: 16,
    GAME_PREPARE_REQUEST: 17,
    GAME_PREPARE_RESPONSE: 18,
    GAME_PREPARE_NOTIFICATION: 19,
    GAME_START_REQUEST: 20,
    GAME_START_RESPONSE: 21,
    GAME_START_NOTIFICATION: 22,
    POSITION_UPDATE_REQUEST: 23,
    POSITION_UPDATE_NOTIFICATION: 24,
    USE_CARD_REQUEST: 25,
    USE_CARD_RESPONSE: 26,
    USE_CARD_NOTIFICATION: 27,
    EQUIP_CARD_NOTIFICATION: 28,
    CARD_EFFECT_NOTIFICATION: 29,
    FLEA_MARKET_NOTIFICATION: 30,
    FLEA_MARKET_PICK_REQUEST: 31,
    FLEA_MARKET_PICK_RESPONSE: 32,
    USER_UPDATE_NOTIFICATION: 33,
    PHASE_UPDATE_NOTIFICATION: 34,
    REACTION_REQUEST: 35,
    REACTION_RESPONSE: 36,
    DESTORY_CARD_REQUEST: 37,
    DESTORY_CARD_RESPONSE: 38,
    GAME_END_NOTIFICATION: 39,
    CARD_SELECT_REQUEST: 40,
    CARD_SELECT_RESPONSE: 41,
    PASS_DEBUFF_REQUEST: 42,
    PASS_DEBUFF_RESPONSE: 43,
    WARNING_NOTIFICATION: 44,
    ANIMATION_NOTIFICATION: 45,
  },
};

export const packetMaps = {
  [config.packetType.REGISTER_REQUEST]: 'registerRequest',
  [config.packetType.REGISTER_RESPONSE]: 'registerResponse',

  [config.packetType.LOGIN_REQUEST]: 'loginRequest',
  [config.packetType.LOGIN_RESPONSE]: 'loginResponse',

  [config.packetType.CREATE_ROOM_REQUEST]: 'createRoomRequest',
  [config.packetType.CREATE_ROOM_RESPONSE]: 'createRoomResponse',

  [config.packetType.GET_ROOM_LIST_REQUEST]: 'getRoomListRequest',
  [config.packetType.GET_ROOM_LIST_RESPONSE]: 'getRoomListResponse',

  [config.packetType.JOIN_ROOM_REQUEST]: 'joinRoomRequest',
  [config.packetType.JOIN_ROOM_RESPONSE]: 'joinRoomResponse',
  [config.packetType.JOIN_RANDOM_ROOM_REQUEST]: 'joinRandomRoomRequest',
  [config.packetType.JOIN_RANDOM_ROOM_RESPONSE]: 'joinRandomRoomResponse',
  [config.packetType.JOIN_ROOM_NOTIFICATION]: 'joinRoomNotification',

  [config.packetType.LEAVE_ROOM_REQUEST]: 'leaveRoomRequest',
  [config.packetType.LEAVE_ROOM_RESPONSE]: 'leaveRoomResponse',
  [config.packetType.LEAVE_RROM_NOTIFICATION]: 'leaveRoomNotification',

  [config.packetType.GAME_PREPARE_REQUEST]: 'gamePrepareRequest',
  [config.packetType.GAME_PREPARE_RESPONSE]: 'gamePrepareResponse',
  [config.packetType.GAME_PREPARE_NOTIFICATION]: 'gamePrepareNotification',

  [config.packetType.GAME_START_REQUEST]: 'gameStartRequest',
  [config.packetType.GAME_START_RESPONSE]: 'gameStartResponse',
  [config.packetType.GAME_START_NOTIFICATION]: 'gameStartNotification',

  [config.packetType.POSITION_UPDATE_REQUEST]: 'positionUpdateRequest',
  [config.packetType.POSITION_UPDATE_NOTIFICATION]:
    'positionUpdateNotification',

  [config.packetType.USE_CARD_REQUEST]: 'useCardRequest',
  [config.packetType.USE_CARD_RESPONSE]: 'useCardResponse',
  [config.packetType.USE_CARD_NOTIFICATION]: 'useCardNotification',

  [config.packetType.EQUIP_CARD_NOTIFICATION]: 'equipCardNotification',

  [config.packetType.CARD_EFFECT_NOTIFICATION]: 'cardEffectNotification',

  [config.packetType.FLEA_MARKET_PICK_REQUEST]: 'fleaMarketPickRequest',
  [config.packetType.FLEA_MARKET_PICK_RESPONSE]: 'fleaMarketPickResponse',
  [config.packetType.FLEA_MARKET_NOTIFICATION]: 'fleaMarketNotification',

  [config.packetType.USER_UPDATE_NOTIFICATION]: 'userUpdateNotification',

  [config.packetType.PHASE_UPDATE_NOTIFICATION]: 'phaseUpdateNotification',

  [config.packetType.REACTION_REQUEST]: 'reactionRequest',
  [config.packetType.REACTION_RESPONSE]: 'reactionResponse',

  [config.packetType.DESTORY_CARD_REQUEST]: 'destroyCardRequest',
  [config.packetType.DESTORY_CARD_RESPONSE]: 'destroyCardResponse',

  [config.packetType.GAME_END_NOTIFICATION]: 'gameEndNotification',

  [config.packetType.CARD_SELECT_REQUEST]: 'cardSelectRequest',
  [config.packetType.CARD_SELECT_RESPONSE]: 'cardSelectResponse',

  [config.packetType.PASS_DEBUFF_REQUEST]: 'passDebuffRequest',
  [config.packetType.PASS_DEBUFF_RESPONSE]: 'passDebuffResponse',

  [config.packetType.WARNING_NOTIFICATION]: 'warningNotification',

  [config.packetType.ANIMATION_NOTIFICATION]: 'animationNotification',
};
