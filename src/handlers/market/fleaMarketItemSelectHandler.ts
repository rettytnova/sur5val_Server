import net from "net"
import { Card, CustomSocket, FleaMarketItemSelectPayload, RedisUserData, User } from "../../interface/interface.js"
import { getRedisData, getRoomByUserId, getUserBySocket, setRedisData } from "../handlerMethod.js";
import { sendPacket } from "../../packet/createPacket.js";
import { config } from "../../config/config.js";

export const fleaMarketItemSelectHandler = async (socket: net.Socket, payload: Object) => {
    const fleaMarketItemSelectPayload = payload as FleaMarketItemSelectPayload;

    const user: RedisUserData = await getUserBySocket(socket as CustomSocket);
    if (!user) {
        console.error("fleaMarketItemSelect 레디스에 유저가 없음");
        return;
    }

    const room = await getRoomByUserId(user.id);
    if (!room) {
        console.error("fleaMarketItemSelect 방이 없음");
        return;
    }

    let cardPickUser: User | null = null;

    for (let i = 0; i < room.users.length; i++) {
        if (room.users[i].id === user.id) {
            cardPickUser = room.users[i];
            break;
        }
    }

    if (cardPickUser === null) {
        console.error("fleaMarketItemSelect 유저가 없음");
        return;
    }

    if (!cardPickUser.character || cardPickUser.character.hp === 0 || !cardPickUser.character.handCards) {
        console.error("fleaMarketItemSelect 캐릭터 에러");
        return;
    }

    let redisFleaMarketCards = await getRedisData('fleaMarketCards');
    if (!redisFleaMarketCards) {
        console.error("fleaMarketItemSelect 레디스에 상점 카드가 없음")
        return;
    }

    const cards = redisFleaMarketCards[room.id];
    if (!cards || cards.length === 0 || cards.length < fleaMarketItemSelectPayload.pickIndex) {
        console.error("fleaMarketItemSelect 레디스 상점 카드에 선택한 카드가 없음");
        return;
    }

    const fleMarketPickCard = cards[fleaMarketItemSelectPayload.pickIndex];
    if (!fleMarketPickCard) {
        console.error("fleaMarketItemSelect PickCard empty");
        return;
    }

    const newCard: Card = {
        type: fleMarketPickCard,
        count: 1
    }

    cardPickUser.character.handCards.push(newCard);

    redisFleaMarketCards[room.id] = cards.filter((card: number) => card !== fleMarketPickCard);

    await setRedisData('fleaMarketCards', redisFleaMarketCards);

    sendPacket(socket, config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE,
        {
            userId: cardPickUser.id,
            handCards: cardPickUser.character.handCards
        }
    );
}