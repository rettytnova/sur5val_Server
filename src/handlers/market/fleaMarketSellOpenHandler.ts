import { config } from '../../config/config.js';
import { Card, CustomSocket, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { getRedisData, getRoomByUserId, getUserIdBySocket } from '../handlerMethod.js';

export const fleaMarketItemSellOpenHandler = async (socket: CustomSocket) => {
  const userId: number | null = await getUserIdBySocket(socket);
  if (!userId) {
    console.error('fleaMarketOpen 레디스에 유저가 없음');
    return;
  }

  const room = await getRoomByUserId(userId);
  if (!room) {
    console.error('fleaMarketOpen 방이 없음');
    return;
  }

  let fleaMarketOpenUser: User | null = null;
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].id === userId) {
      fleaMarketOpenUser = room.users[i];
      break;
    }
  }

  if (fleaMarketOpenUser === null) {
    console.error('fleaMarketOpen user가 없음');
    return;
  }

  if (!fleaMarketOpenUser.character || fleaMarketOpenUser.character.hp === 0) {
    console.error('fleaMarketOpen 캐릭터 에러');
    return;
  }

  const sellCards: number[] = [];
  for (let i = 0; i < fleaMarketOpenUser.character.handCards.length; i++) {
    if (fleaMarketOpenUser.character.handCards[i].type > 200 && fleaMarketOpenUser.character.handCards[i].count > 0) {
      sellCards.push(fleaMarketOpenUser.character.handCards[i].type + 2000);
      fleaMarketOpenUser.character.handCards[i].count--;
      i--;
      if (sellCards.length >= 7) break;
    }
  }
  sellCards.push(1000);

  let shoppingUserIds: [number, boolean][] | null = shoppingUserIdSessions[room.id];
  if (!shoppingUserIds) shoppingUserIds = shoppingUserIdSessions[room.id] = [];
  shoppingUserIds.push([userId, false]);

  sendPacket(socket, config.packetType.FLEA_MARKET_PICK_RESPONSE, {
    fleaMarketCardTypes: sellCards
  });
};
