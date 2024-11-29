import { config } from '../../config/config.js';
import { Room } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { socketSessions } from '../../session/socketSession.js';
import { getRedisData } from '../handlerMethod.js';

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
  // let redisFleaMarketCards: { [roomId: number]: number[] } | undefined = await getRedisData('fleaMarketCards');
  // if (!redisFleaMarketCards) {
  //   console.error('fleaMarketItemSelect 레디스에 상점 카드가 없음');
  //   return;
  // }
  // for (let i = 0; i < shoppingUserIdSessions[room.id].length; i++) {
  //   const shoppingUserSocket = socketSessions[shoppingUserIdSessions[room.id][i]];
  //   sendPacket(shoppingUserSocket, config.packetType.FLEA_MARKET_PICK_RESPONSE, {
  //     fleaMarketCardTypes: redisFleaMarketCards[room.id]
  //   });
  //   console.log(`유저ID: ${shoppingUserIdSessions[room.id][i]}에게 플리마켓 보냄`);
  // }

  return;
};
