import { randomNumber } from "../../utils/utils.js";
import { CardType } from "../enumTyps.js";
import { getRedisData, setRedisData } from "../handlerMethod.js";


export const fleaMarketCardCreate = async (level: number, roomId: number, cardCount: number): Promise<void> => {
    const cards: CardType[] = [];

    let fleaMarketCards = await getRedisData('fleaMarketCards');
    if (!fleaMarketCards) {
        fleaMarketCards = { [roomId]: [] };
    } else if (!fleaMarketCards[roomId]) {
        fleaMarketCards[roomId] = [];
    }

    for (let i = 0; i < cardCount; i++) {
        const randomCardType = randomNumber(1, 23) as CardType;
        cards.push(randomCardType);
    }

    fleaMarketCards[roomId] = cards;

    await setRedisData('fleaMarketCards', fleaMarketCards);
}