import net from "net"
import { Card, CustomSocket, RedisUserData } from '../../interface/interface.js';
import { randomNumber } from "../../utils/utils.js";
import { getRedisData, getUserBySocket, setRedisData } from "../handlerMethod.js";
import { sendPacket } from "../../packet/createPacket.js";
import { config } from "../../config/config.js";
import { CardType } from "../enumTyps.js";

function cardCreate(cardCount: number): CardType[] {
    const cards: CardType[] = [];

    for (let i = 0; i < cardCount; i++) {
        const randomCardType = randomNumber(1, 23) as CardType;
        cards.push(randomCardType);
    }

    return cards;
}

export const fleaMarketPickHandler = async (socket: CustomSocket, payload: Object) => {
    // 카드 생성
    const newCards: CardType[] = cardCreate(8);

    console.dir(newCards, { depth: null });

    const user: RedisUserData = await getUserBySocket(socket);
    if (!user) {
        console.log("fleaMarketPick user가 없음");
        return;
    }

    // if (user.character.hp === 0) {
    //     console.log("fleaMarketPick charcter hp 0");
    //     return;
    // }

    let fleaMarketCards = await getRedisData('fleaMarketCards');
    if (!fleaMarketCards) {
        fleaMarketCards = { [user.id]: [] };
    } else if (!fleaMarketCards[user.id]) {
        fleaMarketCards[user.id] = [];
    }

    fleaMarketCards[user.id] = newCards;

    await setRedisData('fleaMarketCards', fleaMarketCards);

    sendPacket(socket, config.packetType.FLEA_MARKET_PICK_RESPONSE, {
        fleaMarketCardTypes: newCards
    });
}