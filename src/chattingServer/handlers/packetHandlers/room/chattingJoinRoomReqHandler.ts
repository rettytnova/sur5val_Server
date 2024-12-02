import { config } from "../../../../config/config.js";
import { CustomSocket } from "../../../../interface/interface.js";
import ChattingServer from "../../../class/chattingServer.js";
import { ChattingJoinRoomRequestPayload, Job } from "../../../interface/chattingServerInterface.js";

// 채팅 방 참여 요청
export const chattingJoinRoomReqHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
    console.log("채팅 방 참여 요청");

    const chattingUser = ChattingServer.getInstance().getUserBySocket(socket);
    if (chattingUser === undefined) {
        return;
    }

    const chattingJoinRoomPayload = payload as ChattingJoinRoomRequestPayload;

    const chattingJoinRoomJob = new Job(config.jobType.CHATTING_JOIN_ROOM_REQUEST_JOB, chattingUser, chattingJoinRoomPayload.ownerEmail);

    ChattingServer.getInstance().chattingServerJobQue.push(chattingJoinRoomJob);
}