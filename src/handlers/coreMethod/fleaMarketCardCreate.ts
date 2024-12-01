import { CardType } from '../enumTyps.js';
import { getRedisData, nonSameRandom, setRedisData } from '../handlerMethod.js';

// DB에 들어갈 내용
const shopItems: { [level: number]: CardType[] } = {
  1: [201, 201, 201, 201, 201, 201, 201, 201],
  2: [201, 201, 201, 201, 307, 308, 309, 310],
  3: [306, 307, 308, 309, 310, 306, 307, 308, 309, 310],
  4: [306, 307, 308, 309, 310, 311, 312, 313, 314, 315],
  5: [311, 312, 313, 314, 315, 311, 312, 313, 314, 315]
};
const shopListNumber = 7;

export const fleaMarketCardCreate = async (level: number, roomId: number): Promise<void> => {
  const cards: CardType[] = [];

  let fleaMarketCards = await getRedisData('fleaMarketCards');
  if (!fleaMarketCards) {
    fleaMarketCards = { [roomId]: [] };
  } else if (!fleaMarketCards[roomId]) {
    fleaMarketCards[roomId] = [];
  }

  const pickedIndex = nonSameRandom(0, shopItems[level].length - 1, shopListNumber);
  for (let i = 0; i < shopListNumber; i++) {
    cards.push(shopItems[level][pickedIndex[i]]);
  }
  cards.push(1000);

  fleaMarketCards[roomId] = cards;

  await setRedisData('fleaMarketCards', fleaMarketCards);
};
