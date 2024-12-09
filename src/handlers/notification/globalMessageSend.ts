import { config } from "../../config/config.js";
import { Room, User } from "../../interface/interface.js";
import { sendPacket } from "../../packet/createPacket.js";
import { socketSessions } from "../../session/socketSession.js";
import { GlobalMessageType } from "../enumTyps.js";

export const globalMessageRoomSend = (room: Room | null, globalMessageType: GlobalMessageType, globalMessage: string) => {
    if (!room) {
        console.log(`globalMessageSend room이 없음`);
        return;
    }

    room.users.forEach((user: User) => {
        const userSocket = socketSessions[user.id];

        if (userSocket) {
            sendPacket(userSocket, config.packetType.GLOBAL_MESSAGE_RESPONSE,
                {
                    globalMessageType,
                    globalMessage
                });
        }
    });
}

export const globalMessageUserSend = (user: User | null, globalMessageType: GlobalMessageType, globalMessage: string) => {
    if (!user) {
        console.log(`globalMessageSend User가 없음`);
        return;
    }

    const userSocket = socketSessions[user.id];

    if (userSocket) {
        sendPacket(userSocket, config.packetType.GLOBAL_MESSAGE_RESPONSE,
            {
                globalMessageType,
                globalMessage
            });
    }
}