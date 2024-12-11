import { config } from "../../../../config/config.js";
import { CustomSocket } from "../../../../interface/interface.js";
import ChattingServer from "../../../class/chattingServer.js";
import { ChattingCreateRoomPayload, Job } from "../../../interface/chattingServerInterface.js";

// 채팅 방 생성 요청
export const chattingCreateRoomReqHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
    console.log("채팅 방 생성 요청");

    const chattingCreateRoomPayload = payload as ChattingCreateRoomPayload;

    console.log(`chattingCreateRoom ${chattingCreateRoomPayload.email}`);

    const chattingUser = ChattingServer.getInstance().getUserByEmail(chattingCreateRoomPayload.email);
    if (chattingUser === undefined) {
        console.log("채팅 방 생성 요청 유저 없음");
        return;
    }

    const chattingCreateRoomJob = new Job(config.jobType.CHATTING_CREATE_ROOM_REQUEST_JOB, chattingUser);
    ChattingServer.getInstance().chattingServerJobQue.push(chattingCreateRoomJob);
}