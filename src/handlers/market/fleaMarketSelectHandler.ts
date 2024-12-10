import { CustomSocket, Room } from '../../interface/interface.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { getRoomByUserId, getUserIdBySocket } from '../handlerMethod.js';
import { fleaMarketItemBuy } from './fleaMarketItemBuyHandler.js';
import { fleaMarketItemSell } from './fleaMarketSellHandler.js';

export const fleaMarketSelectHandler = async (socket: CustomSocket, payload: object) => {
  const userId: number | null = await getUserIdBySocket(socket);
  if (!userId) {
    console.error('userId 정보를 찾을 수 없습니다.');
    return;
  }

  const room: Room | null = await getRoomByUserId(userId);
  if (!room) {
    console.error('room 정보를 찾을 수 없습니다.');
    return;
  }

  if (!shoppingUserIdSessions[room.id]) {
    console.error('해당 유저의 room이 속한 쇼핑 정보를 찾을 수 없습니다.');
    return;
  }

  let isBuy: boolean | null = null;
  for (let i = 0; i < shoppingUserIdSessions[room.id].length; i++) {
    if (shoppingUserIdSessions[room.id][i][0] === userId) {
      isBuy = shoppingUserIdSessions[room.id][i][1];
    }
  }
  if (isBuy === null) {
    console.error('해당 유저의 쇼핑 정보를 찾을 수 없습니다.');
    return;
  }

  if (isBuy) {
    await fleaMarketItemBuy(socket, payload);
  } else {
    await fleaMarketItemSell(socket, payload);
  }
};
