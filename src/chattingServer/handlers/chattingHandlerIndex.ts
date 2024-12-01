import { config } from "../../config/config.js";
import { chattingLoginHandler } from "./user/chattingLoginHandler.js";

const chattingHandlers = {
    [config.chattingPacketType.CHATTING_LOGIN_REQUEST]: {
        handler: chattingLoginHandler,
        protoType: 'request.C2SChattingServerLoginRequest'
    }
}

export const getChattingServerHandlerByPacketType = (packetType: number) => {
    if (!chattingHandlers[packetType]) {
        return;
    }

    return chattingHandlers[packetType].handler;
}