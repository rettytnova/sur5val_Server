import { Card, CustomSocket, FleaMarketItemSelectPayload } from '../../../gameServer/interface/interface.js';
import { getUserBySocket } from '../handlerMethod.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { config } from '../../../config/config.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import Server from '../../class/server.js';
import UserSessions from '../../class/userSessions.js';
import GameRoom from '../../class/room.js';
import { userUpdateNotification } from '../notification/userUpdate.js';

export const fleaMarketItemBuy = (socket: CustomSocket, payload: Object) => {
  const fleaMarketItemSelectPayload = payload as FleaMarketItemSelectPayload;

  // 장비 데이터 가져오기
  const equipCardDBInfo = Server.getInstance().equipItemInfo;
  if (!equipCardDBInfo) {
    console.error('장비아이템 데이터가 없습니다.');
    return;
  }

  // 소비 데이터 가져오기
  const consumableItemInfo = Server.getInstance().consumableItemInfo;
  if (!consumableItemInfo) {
    console.error('소비아이템 데이터가 없습니다.');
    return;
  }

  // 유저 데이터 가져오기 (userId 용도)
  const user: UserSessions | null | undefined = getUserBySocket(socket);
  if (!user) {
    console.error('구매 시도하는 유저의 유저 정보가 없음');
    return;
  }

  // 유저의 roomData 가져오기
  const rooms: GameRoom[] = Server.getInstance().getRooms();
  const room = rooms.find((room) => room.getUsers().some((user: UserSessions) => user.getId() === user.getId()));
  if (!room) {
    console.error('fleaMarketItemSelect 방이 없음');
    return;
  }

  // 유저의 데이터 가져오기
  let cardPickUser: UserSessions | null = null;
  for (let i = 0; i < room.getUsers().length; i++) {
    if (room.getUsers()[i].getId() === user.getId()) {
      cardPickUser = room.getUsers()[i];
      break;
    }
  }
  if (cardPickUser === null) {
    console.error('fleaMarketItemSelect 유저가 없음');
    return;
  }

  // 캐릭터 유효성 검사
  if (!cardPickUser.getCharacter() || cardPickUser.getCharacter().hp === 0 || !cardPickUser.getCharacter().handCards) {
    console.error('fleaMarketItemSelect 캐릭터 에러');
    return;
  }

  // market 가져오기
  const market = Server.getInstance()
    .getMarkets()
    .find((market) => market.getRoomId() === room.getRoomId());
  if (!market) {
    console.error('마켓 정보가저오기 실패');
    return;
  }
  const marketItemsLists = market.getItemLists();

  // 선택된 카드 가져오기
  const fleMarketPickCard = marketItemsLists[fleaMarketItemSelectPayload.pickIndex];
  if (!fleMarketPickCard) {
    console.error('fleaMarketItemSelect PickCard empty');
    return;
  }

  // Exit 버튼 눌렀을 경우
  if (fleMarketPickCard === 1000) {
    sendPacket(socket, config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE, {
      userId: cardPickUser.getId(),
      handCards: cardPickUser.getCharacter().handCards
    });
    for (let i = 0; i < shoppingUserIdSessions[room.getRoomId()].length; i++) {
      if (shoppingUserIdSessions[room.getRoomId()][i][0] === user.getId()) {
        shoppingUserIdSessions[room.getRoomId()].splice(i, 1);
        break;
      }
    }
    return;
  }

  // 돈이 부족할 경우
  const equipCardPrice = equipCardDBInfo.find((data) => data.cardType === fleMarketPickCard - 1000)?.price;
  const consumeCardPrice = consumableItemInfo.find((data) => data.cardType === fleMarketPickCard - 1000)?.price;
  const pickedCardPrice = equipCardPrice ? equipCardPrice : consumeCardPrice;
  if (!pickedCardPrice) {
    console.error('카드 가격을 알 수 없습니다.(해당 카드가 데이터에 존재하지 않습니다.');
    return;
  }
  if (cardPickUser.getCharacter().gold < pickedCardPrice) {
    sendPacket(socket, config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE, {
      userId: cardPickUser.getId(),
      handCards: cardPickUser.getCharacter().handCards
    });
    for (let i = 0; i < shoppingUserIdSessions[room.getRoomId()].length; i++) {
      if (shoppingUserIdSessions[room.getRoomId()][i][0] === user.getId()) {
        shoppingUserIdSessions[room.getRoomId()].splice(i, 1);
        break;
      }
    }
    console.log('돈이 부족합니다.');
    return;
  }

  // 해당 카드 보유 시 count++, 아닐 시 push 해주고 gold 차감
  const newCard: Card = {
    type: fleMarketPickCard - 1000,
    count: 1
  };
  let isOwned: boolean = false;
  for (let i = 0; i < cardPickUser.getCharacter().handCards.length; i++) {
    if (cardPickUser.getCharacter().handCards[i].type === newCard.type) {
      cardPickUser.getCharacter().handCards[i].count++;
      isOwned = true;
      break;
    }
  }
  if (isOwned === false) cardPickUser.getCharacter().handCards.push(newCard);

  // cardType 순서대로 인벤토리 정렬
  cardPickUser.getCharacter().handCards.sort((a, b) => a.type - b.type);
  cardPickUser.getCharacter().gold -= pickedCardPrice;

  // 상점 목록에서 해당 상품 삭제
  const removedCardIndex = marketItemsLists.indexOf(fleMarketPickCard);
  if (removedCardIndex !== -1) {
    marketItemsLists.splice(removedCardIndex, 1);
  }

  userUpdateNotification(room);
  sendPacket(socket, config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE, {
    userId: cardPickUser.getId(),
    handCards: cardPickUser.getCharacter().handCards
  });
};
