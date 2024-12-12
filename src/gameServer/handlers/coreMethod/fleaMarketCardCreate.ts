import Server from '../../class/server.js';
import { getRedisData, nonSameRandom, setRedisData } from '../handlerMethod.js';

const shopListNumber = 7;

export const fleaMarketCardCreate = async (round: number, roomId: number): Promise<void> => {
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

  const cards: number[] = [];

  let fleaMarketCards = await getRedisData('fleaMarketCards');
  if (!fleaMarketCards) {
    fleaMarketCards = { [roomId]: [] };
  } else if (!fleaMarketCards[roomId]) {
    fleaMarketCards[roomId] = [];
  }

  const pickedIndex = nonSameRandom(0, shopList.itemList.length - 1, shopListNumber);
  for (let i = 0; i < shopListNumber; i++) {
    cards.push(shopList.itemList[pickedIndex[i]] + 1000);
  }
  cards.push(1000);

  fleaMarketCards[roomId] = cards;
  await setRedisData('fleaMarketCards', fleaMarketCards);
};
