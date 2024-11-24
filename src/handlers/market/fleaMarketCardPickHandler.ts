import net from "net"
import { Card, CustomSocket, FleaMarketCardPickPayload, RedisUserData, User } from "../../interface/interface.js"
import { getRedisData, getRoomByUserId, getUserBySocket, setRedisData } from "../handlerMethod.js";
import { userUpdateNotification } from "../notification/userUpdate.js";
import { sendPacket } from "../../packet/createPacket.js";
import { config } from "../../config/config.js";

export const fleaMarketCardPickHandler = async (socket: net.Socket, payload: Object) => {
    const fleaMarketCardPickPayload = payload as FleaMarketCardPickPayload;

    const user: RedisUserData = await getUserBySocket(socket as CustomSocket);
    if (!user) {
        console.log("fleaMarketCardPick user가 없음");
        return;
    }

    const room = await getRoomByUserId(user.id);
    if (!room) {
        console.log("fleaMarketCardPick room이 없음");
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
        console.log("방에 카드를 선택한 유저가 없음");
        return;
    }

    if (!cardPickUser.character || cardPickUser.character.hp === 0 || !cardPickUser.character.handCards) {
        console.log("fleMarketCardPick character error");
        return;
    }

    let fleaMarketCards = await getRedisData('fleaMarketCards');
    if (!fleaMarketCards) {
        console.log("fleaMarketCards가 없음")
        return;
    }

    const cards = fleaMarketCards[cardPickUser.id];
    if (!cards || cards.length === 0 || cards.length < fleaMarketCardPickPayload.pickIndex) {
        console.log("fleaMarketCardPick cards error");
        return;
    }

    const fleMarketPickCard = fleaMarketCards[cardPickUser.id][fleaMarketCardPickPayload.pickIndex];
    if (!fleMarketPickCard) {
        console.log("fleMarketCardPick PickCard empty");
        return;
    }

    const userRoom = await getRoomByUserId(cardPickUser.id);
    if (!userRoom) {
        console.log("fleMarketCardPick userRoom empty");
        return;
    }

    let isExistPickCard = false;

    for (let i = 0; i < cardPickUser.character.handCards.length; i++) {
        if (cardPickUser.character.handCards[i].type === fleMarketPickCard) {
            cardPickUser.character.handCards[i].count++;
            isExistPickCard = true;
            break;
        }
    }

    if (isExistPickCard === false) {
        const newCard: Card = {
            type: fleMarketPickCard,
            count: 1
        }

        cardPickUser.character.handCards.push(newCard);
    }

    let redisFleaMarketCards = await getRedisData('fleaMarketCards');
    if (!redisFleaMarketCards) {
        console.log("fleMarketCardPick 카드 없음");
        return;
    }

    delete redisFleaMarketCards[cardPickUser.id];

    await setRedisData('fleaMarketCards', redisFleaMarketCards);

    sendPacket(socket, config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE,
        {
            userId: cardPickUser.id,
            handCards: cardPickUser.character.handCards
        }
    );
}