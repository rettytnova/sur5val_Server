import { CustomSocket, User } from '../../interface/interface.js';
import { getRedisData, getRoomByUserId, getUserIdBySocket } from '../handlerMethod.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';

export const fleaMarketBuyOpenHandler = async (socket: CustomSocket) => {
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

  let redisFleaMarketCards = await getRedisData('fleaMarketCards');
  if (!redisFleaMarketCards) {
    console.error('fleaMarketOpen 레디스에 플리 마켓 카드 없음');
    return;
  }

  const fleaMarketCards: number[] | undefined = redisFleaMarketCards[room.id];
  if (!fleaMarketCards) {
    console.error('fleaMarketOpen 방에 생성된 플리 마켓 카드 없음');
    return;
  }

  let shoppingUserIds: [number, boolean][] | null = shoppingUserIdSessions[room.id];
  if (!shoppingUserIds) shoppingUserIds = shoppingUserIdSessions[room.id] = [];
  shoppingUserIds.push([userId, true]);

  sendPacket(socket, config.packetType.FLEA_MARKET_PICK_RESPONSE, {
    fleaMarketCardTypes: fleaMarketCards
  });
};
