import { CustomSocket } from "../../gameServer/interface/interface.js";
import ChattingServer from "../class/chattingServer.js";

export const chattingOnClose = (socket: CustomSocket) => async (hadError: boolean) => {
    ChattingServer.getInstance().connectingClientCount--;
    console.log(`채팅 서버 연결 종료 ${socket.remoteAddress}:${socket.remotePort} 연결 중인 클라 ${ChattingServer.getInstance().connectingClientCount}`);

    const chattingServerLeaveUser = ChattingServer.getInstance().getUserBySocket(socket);
    if (!chattingServerLeaveUser) {
        return;
    }
};