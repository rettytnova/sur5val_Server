import { CustomSocket } from "../../gameServer/interface/interface.js";
import ChattingServer from "../class/chattingServer.js";

export const chattingOnClose = (socket: CustomSocket) => async (hadError: boolean) => {
    console.log(`채팅 서버 연결 종료 ${socket.remoteAddress}:${socket.remotePort}`);

    const chattingServerLeaveUser = ChattingServer.getInstance().getUserBySocket(socket);
    if (!chattingServerLeaveUser) {
        return;
    }
};