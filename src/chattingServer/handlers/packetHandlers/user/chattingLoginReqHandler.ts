import { config } from "../../../../config/config.js";
import { CustomSocket } from "../../../../gameServer/interface/interface.js";
import ChattingServer from "../../../class/chattingServer.js";
import { ChattingLoginRequestPayload, Job } from "../../../interface/chattingServerInterface.js";

// 채팅 서버 로그인
export const chattingLoginReqHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
    const chattingLoginPayload = payload as ChattingLoginRequestPayload;

    const job = new Job(config.jobType.CHATTING_LOGIN_REQUEST_JOB, chattingLoginPayload.email, socket);

    ChattingServer.getInstance().chattingServerJobQue.push(job);
}