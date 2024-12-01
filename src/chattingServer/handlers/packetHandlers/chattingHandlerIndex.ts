import { config } from "../../../config/config.js";
import { chattingCreateRoomReqHandler } from "./room/chattingCreateRoomReqHandler.js";
import { chattingLoginReqHandler } from "./user/chattingLoginReqHandler.js";

const chattingHandlers = {
    [config.chattingPacketType.CHATTING_LOGIN_REQUEST]: {
        handler: chattingLoginReqHandler
    },
    [config.chattingPacketType.CHATTING_CREATE_ROOM_REQUEST]: {
        handler: chattingCreateRoomReqHandler
    }
}

export const getChattingServerHandlerByPacketType = (packetType: number) => {
    if (!chattingHandlers[packetType]) {
        return;
    }

    return chattingHandlers[packetType].handler;
}