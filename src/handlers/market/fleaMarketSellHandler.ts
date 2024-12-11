import Server from '../../class/server.js';
import { config } from '../../config/config.js';
import { Card, CustomSocket, FleaMarketItemSelectPayload, Room, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { getRedisData, getUserIdBySocket, setRedisData } from '../handlerMethod.js';
import { userUpdateNotification } from '../notification/userUpdate.js';

export const fleaMarketItemSell = async (socket: CustomSocket, payload: Object) => {
  const fleaMarketItemSelectPayload = payload as FleaMarketItemSelectPayload;

  const equipCardDBInfo = Server.getInstance().equipItemInfo;
  if (!equipCardDBInfo) {
    console.error('장비아이템 데이터가 없습니다.');
    return;
  }
  const consumableItemInfo = Server.getInstance().consumableItemInfo;
  if (!consumableItemInfo) {
    console.error('소비아이템 데이터가 없습니다.');
    return;
  }

  const userId: number | null = await getUserIdBySocket(socket);
  if (!userId) {
    console.error('fleaMarketItemSelect 레디스에 유저가 없음');
    return;
  }

  const rooms: Room[] = await getRedisData('roomData');
  const room = rooms.find((room) => room.users.some((user) => user.id === userId));

  if (!room) {
    console.error('fleaMarketItemSelect 방이 없음');
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
  const handCards = JSON.parse(JSON.stringify(cardPickUser.character.handCards));
  for (let i = 0; i < handCards.length; i++) {
    if (handCards[i].type > 200 && handCards[i].count > 0) {
      cards.push(handCards[i].type);
      handCards[i].count--;
      i--;
      if (cards.length >= 7) break;
    }
  }
  cards.push(1000);

  const fleMarketPickCard = cards[fleaMarketItemSelectPayload.pickIndex];
  if (!fleMarketPickCard) {
    console.error('fleaMarketItemSelect PickCard empty');
    return;
  }

  // Exit 버튼 눌렀을 경우
  if (fleMarketPickCard === 1000) {
    sendPacket(socket, config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE, {
      userId: cardPickUser.id,
      handCards: cardPickUser.character.handCards
    });
    for (let i = 0; i < shoppingUserIdSessions[room.id].length; i++) {
      if (shoppingUserIdSessions[room.id][i][0] === userId) {
        shoppingUserIdSessions[room.id].splice(i, 1);
        break;
      }
    }
    console.log(shoppingUserIdSessions[room.id]);
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
  for (let i = 0; i < cardPickUser.character.handCards.length; i++) {
    if (cardPickUser.character.handCards[i].type === fleMarketPickCard) {
      cardPickUser.character.handCards[i].count--;
      if (cardPickUser.character.handCards[i].count <= 0) {
        cardPickUser.character.handCards.splice(i, 1);
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
  cardPickUser.character.handCards.sort((a, b) => a.type - b.type);
  cardPickUser.character.gold += pickedCardPrice;
  await setRedisData('roomData', rooms);
  await userUpdateNotification(room);
  sendPacket(socket, config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE, {
    userId: cardPickUser.id,
    handCards: cardPickUser.character.handCards
  });
};
