import Server from '../../class/server.js';
import { config } from '../../../config/config.js';
import { CustomSocket, FleaMarketItemSelectPayload } from '../../../gameServer/interface/interface.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { getUserBySocket } from '../handlerMethod.js';
import UserSessions from '../../class/userSessions.js';
import GameRoom from '../../class/room.js';
import { userUpdateNotificationTwo } from '../notification/userUpdateTwo.js';

export const fleaMarketItemSellTwo = (socket: CustomSocket, payload: Object) => {
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
    console.error('판매 시도하는 유저의 유저 정보가 없음');
    return;
  }

  // 유저의 roomData 가져오기
  const rooms: GameRoom[] = Server.getInstance().getRooms();
  const room = rooms.find((room) => room.getUsers().some((user) => user.getId() === user.getId()));
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

  // 보유중인 카드 목록 만들기
  const cards: number[] = [];
  const handCards = JSON.parse(JSON.stringify(cardPickUser.getCharacter().handCards));
  for (let i = 0; i < handCards.length; i++) {
    if (handCards[i].type > 200 && handCards[i].count > 0) {
      cards.push(handCards[i].type);
      handCards[i].count--;
      i--;
      if (cards.length >= 7) break;
    }
  }
  cards.push(1000);

  // 선택된 카드 가져오기
  const fleMarketPickCard = cards[fleaMarketItemSelectPayload.pickIndex];
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
    console.log(shoppingUserIdSessions[room.getRoomId()]);
    return;
  }

  // 해당 카드 count--
  const equipCardPrice = equipCardDBInfo.find((data) => data.cardType === fleMarketPickCard)?.price;
  const consumeCardPrice = consumableItemInfo.find((data) => data.cardType === fleMarketPickCard)?.price;
  let pickedCardPrice = equipCardPrice ? equipCardPrice : consumeCardPrice;
  if (!pickedCardPrice) {
    console.error('카드 가격을 알 수 없습니다.(해당 카드가 데이터에 존재하지 않습니다.');
    return;
  }
  pickedCardPrice /= 2;
  let isOwned: boolean = false;
  for (let i = 0; i < cardPickUser.getCharacter().handCards.length; i++) {
    if (cardPickUser.getCharacter().handCards[i].type === fleMarketPickCard) {
      cardPickUser.getCharacter().handCards[i].count--;
      if (cardPickUser.getCharacter().handCards[i].count <= 0) {
        cardPickUser.getCharacter().handCards.splice(i, 1);
      }
      isOwned = true;
      break;
    }
  }
  if (isOwned === false) {
    console.error('판매하려는 카드를 소유하고 있지 않습니다.');
    return;
  }

  // cardType 순서대로 인벤토리 정렬
  cardPickUser.getCharacter().handCards.sort((a, b) => a.type - b.type);
  cardPickUser.getCharacter().gold += pickedCardPrice;
  userUpdateNotificationTwo(room);
  sendPacket(socket, config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE, {
    userId: cardPickUser.getId(),
    handCards: cardPickUser.getCharacter().handCards
  });
};
