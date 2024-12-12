import { config } from "../../../../config/config.js";
import { CustomSocket } from "../../../../gameServer/interface/interface.js";
import ChattingServer from "../../../class/chattingServer.js";
import { ChattingChatSendRequestPayload, Job } from "../../../interface/chattingServerInterface.js";

export const chattingChatSendReqHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
    const chattingChatSendUser = ChattingServer.getInstance().getUserBySocket(socket);
    if (chattingChatSendUser === undefined) {
        console.log("chattingChatSendReqHandler user 없음");
        return;
    }

    const chattingRoom = ChattingServer.getInstance().getRoomByRoomId(chattingChatSendUser.getJoinRoomId())
    if (chattingRoom === undefined) {
        console.log("chattingChatSendReqHandler room 없음");
        return;
    }

    const chattingChatSendPayload = payload as ChattingChatSendRequestPayload;
    const chattingChatSendJob = new Job(config.jobType.CHATTING_CHAT_SEND_REQUEST_JOB, chattingRoom, chattingChatSendUser, chattingChatSendPayload.chatMessage);

    ChattingServer.getInstance().chattingServerJobQue.push(chattingChatSendJob);
}