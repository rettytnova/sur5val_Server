import dotenv from 'dotenv';

dotenv.config();

const PORT: number = 5555;
const CHATTING_SERVER_PORT: number = 5556;
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

export const CHATTING_ROOM_MAX = 5;

export const config = {
  server: {
    port: PORT,
    host: HOST
  },
  chattingServer: {
    chattingServerPort: CHATTING_SERVER_PORT
  },
  jobType: {
    CHATTING_LOGIN_REQUEST_JOB: 1,
    CHATTING_CREATE_ROOM_REQUEST_JOB: 2,
    CHATTING_JOIN_ROOM_REQUEST_JOB: 3,
    CHATTING_LEAVE_ROOM_REQUEST_JOB: 4,
    CHATTING_CHAT_SEND_REQUEST_JOB: 5
  },
  databases: {
    userDB: {
      name: USER_DB_NAME,
      user: USER_DB_USER,
      password: USER_DB_PASSWORD,
      host: USER_DB_HOST,
      port: USER_DB_PORT
    }
  },
  jwtToken: {
    secretKey: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    algorithm: process.env.JWT_ALGORITHM
  },
  packet: {
    typeLength: TYPE_LENGTH,
    versionLength: VERSION_LENGTH,
    sequenceLength: SEQUENCE_LENGTH,
    payloadLength: PAYLOAD_LENGTH
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
    LEAVE_ROOM_NOTIFICATION: 16,
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
    FLEA_MARKET_CARD_PICK_REQUEST: 33,
    FLEA_MARKET_CARD_PICK_RESPONSE: 34,
    USER_UPDATE_NOTIFICATION: 35,
    PHASE_UPDATE_NOTIFICATION: 36,
    RESULT_REQUEST: 37,
    BOSSROUND_RESPONSE: 38,
    DESTORY_CARD_REQUEST: 39,
    DESTORY_CARD_RESPONSE: 40,
    GAME_END_NOTIFICATION: 41,
    CARD_SELECT_REQUEST: 42,
    CARD_SELECT_RESPONSE: 43,
    PASS_DEBUFF_REQUEST: 44,
    PASS_DEBUFF_RESPONSE: 45,
    WARNING_NOTIFICATION: 46,
    ANIMATION_NOTIFICATION: 47,
    GLOBAL_MESSAGE_RESPONSE: 48,
    FLEA_MARKET_SELL_REQUEST: 49,
    SPAWN_POSITION_SEND_REQUEST: 50
  },
  chattingPacketType: {
    CHATTING_LOGIN_REQUEST: 1,
    CHATTING_LOGIN_RESPONSE: 2,
    CHATTING_CREATE_ROOM_REQUEST: 3,
    CHATTING_CREATE_ROOM_RESPONSE: 4,
    CHATTING_JOIN_ROOM_REQUEST: 5,
    CHATTING_LEAVE_ROOM_REQUEST: 6,
    CHATTING_CHAT_SEND_REQUEST: 7,
    CHATTING_CHAT_SEND_RESPONSE: 8
  }
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
  [config.packetType.LEAVE_ROOM_NOTIFICATION]: 'leaveRoomNotification',

  [config.packetType.GAME_PREPARE_REQUEST]: 'gamePrepareRequest',
  [config.packetType.GAME_PREPARE_RESPONSE]: 'gamePrepareResponse',
  [config.packetType.GAME_PREPARE_NOTIFICATION]: 'gamePrepareNotification',

  [config.packetType.GAME_START_REQUEST]: 'gameStartRequest',
  [config.packetType.GAME_START_RESPONSE]: 'gameStartResponse',
  [config.packetType.GAME_START_NOTIFICATION]: 'gameStartNotification',

  [config.packetType.POSITION_UPDATE_REQUEST]: 'positionUpdateRequest',
  [config.packetType.POSITION_UPDATE_NOTIFICATION]: 'positionUpdateNotification',

  [config.packetType.USE_CARD_REQUEST]: 'useCardRequest',
  [config.packetType.USE_CARD_RESPONSE]: 'useCardResponse',
  [config.packetType.USE_CARD_NOTIFICATION]: 'useCardNotification',

  [config.packetType.EQUIP_CARD_NOTIFICATION]: 'equipCardNotification',

  [config.packetType.CARD_EFFECT_NOTIFICATION]: 'cardEffectNotification',

  [config.packetType.FLEA_MARKET_PICK_REQUEST]: 'fleaMarketPickRequest',
  [config.packetType.FLEA_MARKET_PICK_RESPONSE]: 'fleaMarketPickResponse',
  [config.packetType.FLEA_MARKET_NOTIFICATION]: 'fleaMarketNotification',
  [config.packetType.FLEA_MARKET_CARD_PICK_REQUEST]: 'fleMarketCardPickRequest',
  [config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE]: 'fleMarketCardPickResponse',

  [config.packetType.USER_UPDATE_NOTIFICATION]: 'userUpdateNotification',

  [config.packetType.PHASE_UPDATE_NOTIFICATION]: 'phaseUpdateNotification',

  [config.packetType.RESULT_REQUEST]: 'resultRequest',
  [config.packetType.BOSSROUND_RESPONSE]: 'bossRoundResponse',

  [config.packetType.DESTORY_CARD_REQUEST]: 'destroyCardRequest',
  [config.packetType.DESTORY_CARD_RESPONSE]: 'destroyCardResponse',

  [config.packetType.GAME_END_NOTIFICATION]: 'gameEndNotification',

  [config.packetType.CARD_SELECT_REQUEST]: 'cardSelectRequest',
  [config.packetType.CARD_SELECT_RESPONSE]: 'cardSelectResponse',

  [config.packetType.PASS_DEBUFF_REQUEST]: 'passDebuffRequest',
  [config.packetType.PASS_DEBUFF_RESPONSE]: 'passDebuffResponse',

  [config.packetType.WARNING_NOTIFICATION]: 'warningNotification',

  [config.packetType.ANIMATION_NOTIFICATION]: 'animationNotification',

  [config.packetType.GLOBAL_MESSAGE_RESPONSE]: 'globalMessageResponse',

  [config.packetType.SPAWN_POSITION_SEND_REQUEST]: 'spawnPositionSendRequest'
};

export const chattingPacketMaps = {
  [config.chattingPacketType.CHATTING_LOGIN_REQUEST]: 'chattingServerLoginRequest',
  [config.chattingPacketType.CHATTING_LOGIN_RESPONSE]: 'chattingServerLoginResponse',
  [config.chattingPacketType.CHATTING_CREATE_ROOM_REQUEST]: 'chattingServerCreateRoomRequest',
  [config.chattingPacketType.CHATTING_CREATE_ROOM_RESPONSE]: 'chattingServerCreateRoomResponse',
  [config.chattingPacketType.CHATTING_JOIN_ROOM_REQUEST]: 'chattingServerJoinRoomRequest',
  [config.chattingPacketType.CHATTING_LEAVE_ROOM_REQUEST]: 'chattingServerLeaveRoomRequest',
  [config.chattingPacketType.CHATTING_CHAT_SEND_REQUEST]: 'chattingServerChatSendRequest',
  [config.chattingPacketType.CHATTING_CHAT_SEND_RESPONSE]: 'chattingServerChatSendResponse'
};
