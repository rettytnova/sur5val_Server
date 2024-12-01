import { config } from "../../../../config/config.js";
import { CustomSocket } from "../../../../interface/interface.js";
import ChattingServer from "../../../class/chattingServer.js";
import { Job } from "../../../interface/chattingServerInterface.js";

// 채팅 방 생성 요청
export const chattingCreateRoomReqHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
    const chattingUser = ChattingServer.getInstance().getUserBySocket(socket);
    if (chattingUser === undefined) {
        console.log("채팅 방 생성 요청 유저 없음");
        return;
    }

    const job = new Job(config.jobType.CHATTING_CREATE_ROOM_REQUEST_JOB, chattingUser);
    ChattingServer.getInstance().chattingServerJobQue.push(job);
}