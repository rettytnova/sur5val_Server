import { CustomSocket } from '../../../gameServer/interface/interface.js';
import { getUserBySocket } from '../handlerMethod.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { config } from '../../../config/config.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import UserSessions from '../../class/userSessions.js';
import Server from '../../class/server.js';
import MarketSessions from '../../class/marketSessions.js';

export const fleaMarketBuyOpenHandler = (socket: CustomSocket) => {
  // 유저 데이터 가져오기 (userId 용도)
  const user: UserSessions | null | undefined = getUserBySocket(socket);
  if (!user) {
    console.error('구매 시도하는 유저의 유저 정보가 없음');
    return;
  }

  // 유저가 속한 room 찾기
  const room = Server.getInstance()
    .getRooms()
    .find((room) => room.getUsers().find((user) => user.getId() === user.getId()));
  if (!room) {
    console.error('구매 시도하는 유저의 room 데이터를 찾을 수 없음');
    return;
  }

  // 해당 유저 정보 찾기
  let fleaMarketOpenUser: UserSessions | null = null;
  for (let i = 0; i < room.getUsers().length; i++) {
    if (room.getUsers()[i].getId() === user.getId()) {
      fleaMarketOpenUser = room.getUsers()[i];
      break;
    }
  }
  if (fleaMarketOpenUser === null) {
    console.error('fleaMarketOpen user가 없음');
    return;
  }

  // 캐릭터 유효성 검사
  if (!fleaMarketOpenUser.getCharacter() || fleaMarketOpenUser.getCharacter().hp === 0) {
    console.error('fleaMarketOpen 캐릭터 에러');
    return;
  }

  // 해당 roomId의 market 정보 찾아서 아이템 리스트 불러오기
  const market: MarketSessions | undefined = Server.getInstance()
    .getMarkets()
    .find((market) => market.getRoomId() === room.getRoomId());
  if (!market) {
    console.error('market 정보가 존재하지 않음');
    return;
  }
  const itemLists = market.getItemLists();

  // 구매중인 유저 목록에 추가
  let shoppingUserIds: [number, boolean][] | null = shoppingUserIdSessions[room.getRoomId()];
  if (!shoppingUserIds) shoppingUserIds = shoppingUserIdSessions[room.getRoomId()] = [];
  shoppingUserIds.push([user.getId(), true]);

  // 구매 packet 전달
  sendPacket(socket, config.packetType.FLEA_MARKET_PICK_RESPONSE, {
    fleaMarketCardTypes: itemLists
  });
};
