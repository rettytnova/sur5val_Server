import { config } from "../../../../config/config.js";
import { CustomSocket } from "../../../../interface/interface.js";
import ChattingServer from "../../../class/chattingServer.js";
import { Job } from "../../../interface/chattingServerInterface.js";

export const chattingLeaveRoomReqHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
    console.log("채팅 방 나가기 요청");

    const chattingUser = ChattingServer.getInstance().getUserBySocket(socket);
    if (chattingUser === undefined) {
        return;
    }

    const chattingLeaveRoomJob = new Job(config.jobType.CHATTING_LEAVE_ROOM_REQUEST_JOB, chattingUser);
    ChattingServer.getInstance().chattingServerJobQue.push(chattingLeaveRoomJob);
}