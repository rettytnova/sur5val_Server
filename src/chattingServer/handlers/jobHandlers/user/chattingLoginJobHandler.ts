import { CustomSocket } from "../../../../interface/interface.js";
import ChattingServer from "../../../class/chattingServer.js";
import ChattingUser from "../../../class/chattingUser.js";
import { Job } from "../../../interface/chattingServerInterface.js";

// 채팅 서버 로그인
export const chattingLoginJobHandler = (job: Job): void => {
    const userEmail = job.payload[0] as string;
    const userSocket = job.payload[1] as CustomSocket;

    const newChattingUser = new ChattingUser(userSocket, 0, userEmail);
    ChattingServer.getInstance().getUsers().push(newChattingUser);
}