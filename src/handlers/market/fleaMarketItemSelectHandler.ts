import net from 'net';
import { Card, CustomSocket, FleaMarketItemSelectPayload, Room, User } from '../../interface/interface.js';
import { getRedisData, getUserIdBySocket, setRedisData } from '../handlerMethod.js';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { userUpdateNotification } from '../notification/userUpdate.js';
import Server from '../../class/server.js';

export const fleaMarketItemSelectHandler = async (socket: net.Socket, payload: Object) => {
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

  const fleaMarketItemSelectPayload = payload as FleaMarketItemSelectPayload;

  const userId: number | null = await getUserIdBySocket(socket as CustomSocket);
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

  let redisFleaMarketCards: { [roomId: number]: number[] } | undefined = await getRedisData('fleaMarketCards');
  if (!redisFleaMarketCards) {
    console.error('fleaMarketItemSelect 레디스에 상점 카드가 없음');
    return;
  }

  const cards = redisFleaMarketCards[room.id];
  if (!cards || cards.length === 0 || cards.length < fleaMarketItemSelectPayload.pickIndex) {
    console.error('fleaMarketItemSelect 레디스 상점 카드에 선택한 카드가 없음');
    return;
  }

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
      if (shoppingUserIdSessions[room.id][i] === userId) {
        shoppingUserIdSessions[room.id].splice(i, 1);
        break;
      }
    }
    return;
  }

  // 돈이 부족할 경우
  const equipCardPrice = equipCardDBInfo.find((data) => data.cardType === fleMarketPickCard)?.price;
  const consumeCardPrice = consumableItemInfo.find((data) => data.cardType === fleMarketPickCard)?.price;
  const pickedCardPrice = equipCardPrice ? equipCardPrice : consumeCardPrice;
  if (!pickedCardPrice) {
    console.error('카드 가격을 알 수 없습니다.(해당 카드가 데이터에 존재하지 않습니다.');
    return;
  }
  if (cardPickUser.character.gold < pickedCardPrice) {
    sendPacket(socket, config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE, {
      userId: cardPickUser.id,
      handCards: cardPickUser.character.handCards
    });
    for (let i = 0; i < shoppingUserIdSessions[room.id].length; i++) {
      if (shoppingUserIdSessions[room.id][i] === userId) {
        shoppingUserIdSessions[room.id].splice(i, 1);
        break;
      }
    }
    console.log('돈이 부족합니다.');
    return;
  }

  // 해당 카드 보유 시 count++, 아닐 시 push 해주고 gold 차감
  const newCard: Card = {
    type: fleMarketPickCard,
    count: 1
  };
  let isOwned: boolean = false;
  for (let i = 0; i < cardPickUser.character.handCards.length; i++) {
    if (cardPickUser.character.handCards[i].type === fleMarketPickCard) {
      cardPickUser.character.handCards[i].count++;
      isOwned = true;
      break;
    }
  }
  if (isOwned === false) cardPickUser.character.handCards.push(newCard);

  // cardType 순서대로 인벤토리 정렬
  cardPickUser.character.handCards.sort((a, b) => a.type - b.type);
  cardPickUser.character.gold -= pickedCardPrice;

  // 상점 목록에서 해당 상품 삭제
  const removedCardIndex = cards.indexOf(fleMarketPickCard);
  if (removedCardIndex !== -1) {
    cards.splice(removedCardIndex, 1);
  }
  redisFleaMarketCards[room.id] = cards;
  await setRedisData('fleaMarketCards', redisFleaMarketCards);
  await userUpdateNotification(room);
  await setRedisData('roomData', rooms);
  sendPacket(socket, config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE, {
    userId: cardPickUser.id,
    handCards: cardPickUser.character.handCards
  });
};
