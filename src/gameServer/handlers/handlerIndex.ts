import { config } from '../../config/config.js';
import { registerHandler } from './user/registerHandler.js';
import { destoryCardHandler } from './card/destoryCardHandler.js';
import { cardSelectHandler } from './card/cardSelectHandler.js';
import { passDebuffHandler } from './user/passDebuffHandler.js';
import { createPositionDataHandler } from './position/createPositionDataHandler.js';
import { loginHandler } from './user/loginHandler.js';
import { createRoomHandler } from './room/createRoomHandler.js';
import { getRoomListHandler } from './room/getRoomListHandler.js';
import { joinRoomHandler } from './room/joinRoomHandler.js';
import { joinRandomRoomHandler } from './room/joinRandomRoomHandler.js';
import { leaveRoomHandler } from './room/leaveRoomHandler.js';
import { gamePrepareHandler } from './game/gamePrepareHandler.js';
import { gameStartHandler } from './game/gameStartHandler.js';
import { positionUpdateHandler } from './position/positionUpdateHandler.js';
import { useCardHandler } from './card/useCardHandler.js';
import { fleaMarketBuyOpenHandler } from './market/fleaMarketBuyOpenHandler.js';
import { fleaMarketSelectHandler } from './market/fleaMarketSelectHandler.js';
import { fleaMarketItemSell } from './market/fleaMarketSellHandler.js';
import { gameEndHandler } from './game/gameEndHandler.js';
import { fleaMarketItemSellOpenHandler } from './market/fleaMarketSellOpenHandler.js';

const handlers = {
  [config.packetType.REGISTER_REQUEST]: {
    handler: registerHandler
  },
  [config.packetType.LOGIN_REQUEST]: {
    handler: loginHandler
  },
  [config.packetType.CREATE_ROOM_REQUEST]: {
    handler: createRoomHandler
  },
  [config.packetType.GET_ROOM_LIST_REQUEST]: {
    handler: getRoomListHandler
  },
  [config.packetType.JOIN_ROOM_REQUEST]: {
    handler: joinRoomHandler
  },
  [config.packetType.JOIN_RANDOM_ROOM_REQUEST]: {
    handler: joinRandomRoomHandler
  },
  [config.packetType.LEAVE_ROOM_REQUEST]: {
    handler: leaveRoomHandler
  },
  [config.packetType.GAME_PREPARE_REQUEST]: {
    handler: gamePrepareHandler
  },
  [config.packetType.GAME_START_REQUEST]: {
    handler: gameStartHandler
  },
  [config.packetType.POSITION_UPDATE_REQUEST]: {
    handler: positionUpdateHandler
  },
  [config.packetType.USE_CARD_REQUEST]: {
    handler: useCardHandler
  },
  [config.packetType.FLEA_MARKET_PICK_REQUEST]: {
    handler: fleaMarketBuyOpenHandler
  },
  [config.packetType.FLEA_MARKET_SELL_REQUEST]: {
    handler: fleaMarketItemSellOpenHandler
  },
  [config.packetType.FLEA_MARKET_CARD_PICK_REQUEST]: {
    handler: fleaMarketSelectHandler
  },
  [config.packetType.RESULT_REQUEST]: {
    handler: gameEndHandler
  },
  [config.packetType.CARD_SELECT_REQUEST]: {
    handler: cardSelectHandler
  },
  [config.packetType.PASS_DEBUFF_REQUEST]: {
    handler: passDebuffHandler
  },
  [config.packetType.SPAWN_POSITION_SEND_REQUEST]: {
    handler: createPositionDataHandler
  }
};

export const getHandlerByPacketType = (packetType: number) => {
  if (!handlers[packetType]) {
    console.log(`해당 패킷타입의 핸들러를 찾을 수 없습니다. ${packetType}`);
    return;
  }

  return handlers[packetType].handler;
};
