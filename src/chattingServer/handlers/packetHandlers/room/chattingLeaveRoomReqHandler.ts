import { config } from "../../../../config/config.js";
import { CustomSocket } from "../../../../interface/interface.js";
import ChattingServer from "../../../class/chattingServer.js";
import { ChattingLeaveRoomPayload, Job } from "../../../interface/chattingServerInterface.js";

// 채팅 방 떠나기 요청
export const chattingLeaveRoomReqHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
    //console.log("채팅 방 나가기 요청");

    const chattingLeaveRoomPayload = payload as ChattingLeaveRoomPayload;

    //console.log(`chattingLeaveRoom ${chattingLeaveRoomPayload.email}`);

    const chattingUser = ChattingServer.getInstance().getUserByEmail(chattingLeaveRoomPayload.email);
    if (chattingUser === undefined) {
        console.log("채팅 방 떠나기 요청 유저 없음");
        return;
    }

    const chattingLeaveRoomJob = new Job(config.jobType.CHATTING_LEAVE_ROOM_REQUEST_JOB, chattingUser);
    ChattingServer.getInstance().chattingServerJobQue.push(chattingLeaveRoomJob);
}