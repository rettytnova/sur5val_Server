import { config } from '../../../config/config.js';
import { sendPacket } from '../../../packet/createPacket.js';
import MarketSessions from '../../class/marketSessions.js';
import GameRoom from '../../class/room.js';
import Server from '../../class/server.js';
import UserSessions from '../../class/userSessions.js';
import { User } from '../../interface/interface.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { socketSessions } from '../../session/socketSession.js';
import { getUserBySocket } from '../handlerMethod.js';

// 유저 상태 업데이트 전달
export const userUpdateNotification = (room: GameRoom | null) => {
  if (!room) {
    console.log('userUpdateNoti userSocket 방이 없음');
    return;
  }

  // notification 보내기
  const sendUsers: User[] = [];
  room.getUsers().forEach((user: UserSessions) => {
    sendUsers.push(user.getUserInfo());
  });
  room.getUsers().forEach((user: UserSessions) => {
    const userSocket = socketSessions[user.getId()];

    if (userSocket) {
      sendPacket(userSocket, config.packetType.USER_UPDATE_NOTIFICATION, {
        user: sendUsers
      });
    }
  });

  // 쇼핑중인 유저들에게 쇼핑 화면 다시 보여주기
  const itemLists: MarketSessions | undefined = Server.getInstance()
    .getMarkets()
    .find((markets) => markets.getRoomId() === room.getRoomId());
  if (itemLists === undefined) {
    console.error('마켓 정보를 찾아오지 못함', Server.getInstance().getMarkets());
    return;
  }
  for (let i = 0; i < shoppingUserIdSessions[room.getRoomId()].length; i++) {
    const shoppingUserSocket = socketSessions[shoppingUserIdSessions[room.getRoomId()][i][0]];

    // 구매중인 유저의 구매화면 유지시키기
    if (shoppingUserIdSessions[room.getRoomId()][i][1]) {
      sendPacket(shoppingUserSocket, config.packetType.FLEA_MARKET_PICK_RESPONSE, {
        fleaMarketCardTypes: itemLists.getItemLists()
      });

      // 판매중이 유저의 판매화면 유지시키기
    } else {
      const user: UserSessions | null | undefined = getUserBySocket(shoppingUserSocket);
      if (!user) {
        console.error('유저 정보 찾지 못함');
        return;
      }
      let sellingUser: UserSessions | null = null;
      for (let i = 0; i < room.getUsers().length; i++) {
        if (room.getUsers()[i].getId() === user.getId()) {
          sellingUser = room.getUsers()[i];
          break;
        }
      }

      if (sellingUser === null) {
        console.error('판매중인 유저의 유저정보를 찾을 수 없음');
        return;
      }

      if (!sellingUser.getCharacter() || sellingUser.getCharacter().hp === 0 || !sellingUser.getCharacter().handCards) {
        console.error('판매 캐릭터 상태가 판매를 진행할 수 없음');
        return;
      }

      const cards: number[] = [];
      const handCards = JSON.parse(JSON.stringify(sellingUser.getCharacter().handCards));
      for (let i = 0; i < handCards.length; i++) {
        if (handCards[i].type > 200 && handCards[i].count > 0) {
          cards.push(handCards[i].type + 2000);
          handCards[i].count--;
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
