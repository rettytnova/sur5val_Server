import { config } from "../../../config/config.js";
import { chattingChatSendJobHandler } from "./chatting/chattingChatSendJobHandler.js";
import { chattingCreateRoomJobHandler } from "./room/chattingCreateRoomJobHandler.js";
import { chattingJoinRoomJobHandler } from "./room/chattingJoinRoomJobHandler.js";
import { chattingLeaveRoomJobHandler } from "./room/chattingLeaveRoomJobHandler.js";
import { chattingLoginJobHandler } from "./user/chattingLoginJobHandler.js";

const chattingJobHandlers = {
    [config.chattingPacketType.CHATTING_LOGIN_REQUEST]: {
        jobHandler: chattingLoginJobHandler
    },
    [config.chattingPacketType.CHATTING_CREATE_ROOM_REQUEST]: {
        jobHandler: chattingCreateRoomJobHandler
    },
    [config.chattingPacketType.CHATTING_JOIN_ROOM_REQUEST]: {
        jobHandler: chattingJoinRoomJobHandler
    },
    [config.chattingPacketType.CHATTING_LEAVE_ROOM_REQUEST]: {
        jobHandler: chattingLeaveRoomJobHandler
    },
    [config.chattingPacketType.CHATTING_CHAT_SEND_REQUEST]: {
        jobHandler: chattingChatSendJobHandler
    }
}

export const getChattingServerJobHandlerByJobType = (jobType: number) => {
    if (!chattingJobHandlers[jobType]) {
        return;
    }

    return chattingJobHandlers[jobType].jobHandler;
}