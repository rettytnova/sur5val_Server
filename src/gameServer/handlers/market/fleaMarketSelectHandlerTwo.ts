import { CustomSocket, Room } from '../../../gameServer/interface/interface.js';
import GameRoom from '../../class/room.js';
import Server from '../../class/server.js';
import UserSessions from '../../class/userSessions.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { getUserBySocket } from '../handlerMethod.js';
import { fleaMarketItemBuyTwo } from './fleaMarketItemBuyHandlerTwo.js';
import { fleaMarketItemSellTwo } from './fleaMarketSellHandlerTwo.js';

export const fleaMarketSelectHandlerTwo = (socket: CustomSocket, payload: object) => {
  // 유저 데이터 가져오기 (userId 용도)
  const user: UserSessions | null | undefined = getUserBySocket(socket);
  if (!user) {
    console.error('구매 시도하는 유저의 유저 정보가 없음');
    return;
  }

  // 유저의 roomData 가져오기
  const rooms: GameRoom[] = Server.getInstance().getRooms();
  const room = rooms.find((room) => room.getUsers().some((user) => user.getId() === user.getId()));
  if (!room) {
    console.error('fleaMarketItemSelect 방이 없음');
    return;
  }

  // 쇼핑 정보 확인
  if (!shoppingUserIdSessions[room.getRoomId()]) {
    console.error('해당 유저의 room이 속한 쇼핑 정보를 찾을 수 없습니다.');
    return;
  }

  // 구매 중인지 판매중인지 판단
  let isBuy: boolean | null = null;
  for (let i = 0; i < shoppingUserIdSessions[room.getRoomId()].length; i++) {
    if (shoppingUserIdSessions[room.getRoomId()][i][0] === user.getId()) {
      isBuy = shoppingUserIdSessions[room.getRoomId()][i][1];
    }
  }
  if (isBuy === null) {
    console.error('해당 유저의 쇼핑 정보를 찾을 수 없습니다.');
    return;
  }

  // 구매,판매 handler로 보내주기
  if (isBuy) {
    fleaMarketItemBuyTwo(socket, payload);
  } else {
    fleaMarketItemSellTwo(socket, payload);
  }
};
