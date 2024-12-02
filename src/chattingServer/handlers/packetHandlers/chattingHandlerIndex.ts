import { config } from "../../../config/config.js";
import { chattingCreateRoomReqHandler } from "./room/chattingCreateRoomReqHandler.js";
import { chattingJoinRoomReqHandler } from "./room/chattingJoinRoomReqHandler.js";
import { chattingLeaveRoomReqHandler } from "./room/chattingLeaveRoomReqHandler.js";
import { chattingLoginReqHandler } from "./user/chattingLoginReqHandler.js";

const chattingHandlers = {
    [config.chattingPacketType.CHATTING_LOGIN_REQUEST]: {
        handler: chattingLoginReqHandler
    },
    [config.chattingPacketType.CHATTING_CREATE_ROOM_REQUEST]: {
        handler: chattingCreateRoomReqHandler
    },
    [config.chattingPacketType.CHATTING_JOIN_ROOM_REQUEST]: {
        handler: chattingJoinRoomReqHandler
    },
    [config.chattingPacketType.CHATTING_LEAVE_ROOM_REQUEST]: {
        handler: chattingLeaveRoomReqHandler
    }
}

export const getChattingServerHandlerByPacketType = (packetType: number) => {
    if (!chattingHandlers[packetType]) {
        return;
    }

    return chattingHandlers[packetType].handler;
}