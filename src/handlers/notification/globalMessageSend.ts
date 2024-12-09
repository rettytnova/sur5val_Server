import { config } from "../../config/config.js";
import { Room, User } from "../../interface/interface.js";
import { sendPacket } from "../../packet/createPacket.js";
import { socketSessions } from "../../session/socketSession.js";

export const globalMessageSend = (room: Room | null, globalMessage: string) => {
    if (!room) {
        console.log(`globalMessageSend room이 없음`);
        return;
    }

    room.users.forEach((user: User) => {
        const userSocket = socketSessions[user.id];

        if (userSocket) {
            sendPacket(userSocket, config.packetType.GLOBAL_MESSAGE_RESPONSE,
                {
                    globalMessage
                });
        }
    });
}