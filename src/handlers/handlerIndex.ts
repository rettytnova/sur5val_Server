import { config } from '../config/config.js';
import { registerHandler } from './user/registerHandler.js';
import { loginHandler } from './user/loginHandler.js';
import { createRoomHandler } from './room/createRoomHandler.js';
import { getRoomListHandler } from './room/getRoomListHandler.js';
import { joinRoomHandler } from './room/joinRoomHandler.js';
import { joinRandomRoomHandler } from './room/joinRandomRoomHandler.js';
import { leaveRoomHandler } from './room/leaveRoomHandler.js';
import { gamePrepareHandler } from './game/gamePrepareHandler.js';
import { gameStartHandler } from './game/gameStartHandler.js';
import { positionUpdateHandler } from './user/positionUpdateHandler.js';
import { useCardHandler } from './card/useCardHandler.js';
import { fleaMarketBuyOpenHandler } from './market/fleaMarketBuyOpenHandler.js';
import { destoryCardHandler } from './card/destoryCardHandler.js';
import { cardSelectHandler } from './card/cardSelectHandler.js';
import { passDebuffHandler } from './user/passDebuffHandler.js';
import { fleaMarketSelectHandler } from './market/fleaMarketSelectHandler.js';
import { gameEndHandler } from './game/gameEndHandler.js';
import { fleaMarketItemSellOpenHandler } from './market/fleaMarketSellOpenHandler.js';

const handlers = {
  [config.packetType.REGISTER_REQUEST]: {
    handler: registerHandler,
    protoType: 'request.C2SRegisterRequest'
  },
  [config.packetType.LOGIN_REQUEST]: {
    handler: loginHandler,
    protoType: 'request.C2SLoginRequest'
  },
  [config.packetType.CREATE_ROOM_REQUEST]: {
    handler: createRoomHandler,
    protoType: 'request.C2SCreateRoomRequest'
  },
  [config.packetType.GET_ROOM_LIST_REQUEST]: {
    handler: getRoomListHandler,
    protoType: 'request.C2SGetRoomListRequest'
  },
  [config.packetType.JOIN_ROOM_REQUEST]: {
    handler: joinRoomHandler,
    protoType: 'request.C2SJoinRoomRequest'
  },
  [config.packetType.JOIN_RANDOM_ROOM_REQUEST]: {
    handler: joinRandomRoomHandler,
    protoType: 'request.C2SJoinRandomRoomRequest'
  },
  [config.packetType.LEAVE_ROOM_REQUEST]: {
    handler: leaveRoomHandler,
    protoType: 'request.C2SLeaveRoomRequest'
  },
  [config.packetType.GAME_PREPARE_REQUEST]: {
    handler: gamePrepareHandler,
    protoType: 'request.C2SGamePrepareRequest'
  },
  [config.packetType.GAME_START_REQUEST]: {
    handler: gameStartHandler,
    protoType: 'request.C2SGameStartRequest'
  },
  [config.packetType.POSITION_UPDATE_REQUEST]: {
    handler: positionUpdateHandler,
    protoType: 'request.C2SPositionUpdateRequest'
  },
  [config.packetType.USE_CARD_REQUEST]: {
    handler: useCardHandler,
    protoType: 'request.C2SUseCardRequest'
  },
  [config.packetType.FLEA_MARKET_PICK_REQUEST]: {
    handler: fleaMarketBuyOpenHandler,
    protoType: 'request.C2SFleaMarketPickRequest'
  },
  [config.packetType.FLEA_MARKET_SELL_REQUEST]: {
    handler: fleaMarketItemSellOpenHandler,
    protoType: 'request.C2SFleaMarketSellRequest'
  },
  [config.packetType.FLEA_MARKET_CARD_PICK_REQUEST]: {
    handler: fleaMarketSelectHandler,
    protoType: 'request.C2SFleaMarketCardPickRequest'
  },
  [config.packetType.REACTION_REQUEST]: {
    handler: gameEndHandler,
    protoType: 'request.C2SReactionRequest'
  },
  [config.packetType.DESTORY_CARD_REQUEST]: {
    handler: destoryCardHandler,
    protoType: 'request.C2SDestroyCardRequest'
  },
  [config.packetType.CARD_SELECT_REQUEST]: {
    handler: cardSelectHandler,
    protoType: 'request.C2SCardSelectRequest'
  },
  [config.packetType.PASS_DEBUFF_REQUEST]: {
    handler: passDebuffHandler,
    protoType: 'request.C2SPassDebuffRequest'
  }
};

export const getHandlerByPacketType = (packetType: number) => {
  if (!handlers[packetType]) {
    console.log(`해당 패킷타입의 핸들러를 찾을 수 없습니다. ${packetType}`);
    return;
  }

  return handlers[packetType].handler;
};

export const getProtoByPacketType = (packetType: number) => {
  if (!handlers[packetType]) {
    console.error(`해당 패킷타입의 프로토타입을 찾을 수 없습니다: ID ${packetType}`);
    return;
  }

  return handlers[packetType].protoType;
};
