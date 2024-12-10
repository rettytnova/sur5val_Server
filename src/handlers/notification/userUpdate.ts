import { config } from '../../config/config.js';
import { Room, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { socketSessions } from '../../session/socketSession.js';
import { getRedisData, getUserIdBySocket } from '../handlerMethod.js';

export const userUpdateNotification = async (room: Room | null) => {
  if (!room) {
    console.log('userUpdateNoti userSocket 방이 없음');
    return;
  }

  room.users.forEach((user) => {
    const userSocket = socketSessions[user.id];

    if (userSocket) {
      sendPacket(userSocket, config.packetType.USER_UPDATE_NOTIFICATION, {
        user: room.users
      });
    }
  });

  // 쇼핑중인 유저들에게 쇼핑 화면 다시 보여주기
  let redisFleaMarketCards: { [roomId: number]: number[] } | undefined = await getRedisData('fleaMarketCards');
  if (!redisFleaMarketCards) {
    console.error('fleaMarketItemSelect 레디스에 상점 카드가 없음');
    return;
  }
  for (let i = 0; i < shoppingUserIdSessions[room.id].length; i++) {
    const shoppingUserSocket = socketSessions[shoppingUserIdSessions[room.id][i][0]];
    if (shoppingUserIdSessions[room.id][i][1]) {
      console.log('구매 목록 다시 띄우기:', redisFleaMarketCards[room.id]);
      sendPacket(shoppingUserSocket, config.packetType.FLEA_MARKET_PICK_RESPONSE, {
        fleaMarketCardTypes: redisFleaMarketCards[room.id]
      });
    } else {
      const userId: number | null = await getUserIdBySocket(shoppingUserSocket);
      if (!userId) {
        console.error('fleaMarketItemSelect 레디스에 유저가 없음');
        return;
      }
      let cardPickUser: User | null = null;
      for (let i = 0; i < room.users.length; i++) {
        if (room.users[i].id === userId) {
          cardPickUser = room.users[i];
          break;
        }
      }

      if (cardPickUser === null) {
        console.error('fleaMarketItemSelect 유저가 없음');
        return;
      }

      if (!cardPickUser.character || cardPickUser.character.hp === 0 || !cardPickUser.character.handCards) {
        console.error('fleaMarketItemSelect 캐릭터 에러');
        return;
      }

      const cards: number[] = [];
      for (let i = 0; i < cardPickUser.character.handCards.length; i++) {
        if (cardPickUser.character.handCards[i].type > 200 && cardPickUser.character.handCards[i].count > 0) {
          cards.push(cardPickUser.character.handCards[i].type + 2000);
          cardPickUser.character.handCards[i].count--;
          i--;
          if (cards.length >= 7) break;
        }
      }
      cards.push(1000);

      sendPacket(shoppingUserSocket, config.packetType.FLEA_MARKET_PICK_RESPONSE, {
        fleaMarketCardTypes: cards
      });
    }
  }

  return;
};
