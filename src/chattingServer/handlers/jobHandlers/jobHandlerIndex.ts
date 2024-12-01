import { config } from "../../../config/config.js";
import { chattingCreateRoomJobHandler } from "./room/chattingCreateRoomJobHandler.js";
import { chattingJoinRoomJobHandler } from "./room/chattingJoinRoomJobHandler.js";
import { chattingLoginJobHandler } from "./user/chattingLoginJobHandler.js";

const chattingJobHandlers = {
    [config.jobType.CHATTING_LOGIN_REQUEST_JOB]: {
        jobHandler: chattingLoginJobHandler
    },
    [config.jobType.CHATTING_CREATE_ROOM_REQUEST_JOB]: {
        jobHandler: chattingCreateRoomJobHandler
    },
    [config.jobType.CHATTING_JOIN_ROOM_REQUEST_JOB]: {
        jobHandler: chattingJoinRoomJobHandler
    }
}

export const getChattingServerJobHandlerByJobType = (jobType: number) => {
    if (!chattingJobHandlers[jobType]) {
        return;
    }

    return chattingJobHandlers[jobType].jobHandler;
}