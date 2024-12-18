import MarketSessions from '../../class/marketSessions.js';
import Server from '../../class/server.js';
import { nonSameRandom } from '../handlerMethod.js';

const shopListNumber = 7;

export const fleaMarketCardCreateTwo = (round: number, roomId: number) => {
  // DB의 shopList 정보 가져오기
  const shopListDBInfo = Server.getInstance().shopListInfo;
  if (!shopListDBInfo) {
    console.error('shopListDBInfo 정보를 불러오는데 실패하였습니다.');
    return;
  }
  const shopList = shopListDBInfo.find((data) => data.round === round);
  if (!shopList) {
    console.error('해당 라운드의 shopListDBInfo를 찾지 못하였습니다.');
    return;
  }

  // 서버의 마켓 정보들 가져오기
  const serverMarkets = Server.getInstance().getMarkets();
  const marketCards = serverMarkets.find((markets) => markets.getRoomId() === roomId);

  // 해당 roomId에 해당하는 아이템 리스트 만들어주기
  let cards: number[] = [];
  const pickedIndex = nonSameRandom(0, shopList.itemList.length - 1, shopListNumber);
  for (let i = 0; i < shopListNumber; i++) {
    cards.push(shopList.itemList[pickedIndex[i]] + 1000);
  }
  cards.push(1000);

  // 서버의 마켓 정보에 만든 아이템 리스트 추가하기
  if (marketCards) {
    marketCards.setItemList(cards);
  } else {
    const newCards = new MarketSessions(roomId, cards);
    serverMarkets.push(newCards);
  }
};
