import { config } from "../../../../config/config.js";
import { CustomSocket } from "../../../../gameServer/interface/interface.js";
import ChattingServer from "../../../class/chattingServer.js";
import { ChattingChatSendRequestPayload, Job } from "../../../interface/chattingServerInterface.js";

export const chattingChatSendJobHandler = (job: Job): void => {
    const chattingChatSendPayload = job.payload[0] as ChattingChatSendRequestPayload;

    const chatSendUserSocket = job.payload[1] as CustomSocket;
    if (chatSendUserSocket === undefined) {
        console.log("chatSend userSocket이 없음");
        return;
    }

    const chatSendUser = ChattingServer.getInstance().getUserBySocket(chatSendUserSocket);
    if (chatSendUser === undefined) {
        console.log("chatSend user가 없음");
        return;
    }

    const chattingRoom = ChattingServer.getInstance().getRoomByRoomId(chatSendUser.getJoinRoomId());
    if (chattingRoom === undefined) {
        console.log("chatSend chattingRoom에 user가 참여중이지 않음");
        return;
    }

    const isFindUser = chattingRoom.userFind(chatSendUser.getId());
    if (isFindUser === undefined) {
        console.log("chattingChatSendJobHandler User 없음");
        return;
    }

    const chattingChatSendJob = new Job(config.chattingPacketType.CHATTING_CHAT_SEND_REQUEST, chatSendUser, chattingChatSendPayload.chatMessage);
    chattingRoom.roomJobQue.push(chattingChatSendJob);
}