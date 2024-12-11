import { config } from "../../../../config/config.js";
import { CustomSocket } from "../../../../interface/interface.js";
import ChattingServer from "../../../class/chattingServer.js";
import { ChattingJoinRoomRequestPayload, Job } from "../../../interface/chattingServerInterface.js";

// 채팅 방 참여 요청
export const chattingJoinRoomReqHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
    console.log("채팅 방 참여 요청");

    const chattingJoinRoomPayload = payload as ChattingJoinRoomRequestPayload;

    console.log(`chattingJoinUser ${chattingJoinRoomPayload.email}`);

    const chattingUser = ChattingServer.getInstance().getUserByEmail(chattingJoinRoomPayload.email);
    if (chattingUser === undefined) {
        console.log("채팅 방 참여 요청 유저 없음");
        return;
    }

    const chattingJoinRoomJob = new Job(config.jobType.CHATTING_JOIN_ROOM_REQUEST_JOB, chattingUser, chattingJoinRoomPayload.ownerEmail);
    ChattingServer.getInstance().chattingServerJobQue.push(chattingJoinRoomJob);
}