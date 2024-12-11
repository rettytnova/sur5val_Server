import { CustomSocket } from "../../interface/interface.js";
import ChattingServer from "../class/chattingServer.js";
import { chattingLeaveRoomReqHandler } from "../handlers/packetHandlers/room/chattingLeaveRoomReqHandler.js";

export const chattingOnEnd = (socket: CustomSocket) => async () => {
    const chattingServerLeaveUser = ChattingServer.getInstance().getUserBySocket(socket);
    if (!chattingServerLeaveUser) {
        console.log("chattingOnEnd User 없음");
        return;
    }
};