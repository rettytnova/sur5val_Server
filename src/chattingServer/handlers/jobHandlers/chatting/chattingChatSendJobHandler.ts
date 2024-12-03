import { config } from "../../../../config/config.js";
import { sendChattingPacket } from "../../../../packet/createPacket.js";
import ChattingRoom from "../../../class/chattingRoom.js";
import ChattingServer from "../../../class/chattingServer.js";
import ChattingUser from "../../../class/chattingUser.js";
import { Job } from "../../../interface/chattingServerInterface.js";

export const chattingChatSendJobHandler = (job: Job): void => {
    const chattingRoom = job.payload[0] as ChattingRoom;
    const chatMessageSendUser = job.payload[1] as ChattingUser;
    const chatMessage = job.payload[2] as string;

    const isFindUser = chattingRoom.userFind(chatMessageSendUser.getId());
    if (isFindUser === undefined) {
        console.log("chattingChatSendJobHandler User 없음");
        return;
    }

    const chattingChatSendJob = new Job(config.jobType.CHATTING_CHAT_SEND_REQUEST_JOB, chatMessageSendUser, chatMessage);
    chattingRoom.roomJobQue.push(chattingChatSendJob);
}