import ChattingServer from "../../../class/chattingServer.js";
import ChattingUser from "../../../class/chattingUser.js";
import { Job } from "../../../interface/chattingServerInterface.js";

export const chattingLeaveRoomJobHandler = (job: Job): void => {
    const chattingLeaveRoomUser = job.payload[0] as ChattingUser;

    const leaveChattingRoomId = chattingLeaveRoomUser.getJoinRoomId();

    const leaveChattingRoom = ChattingServer.getInstance().getRoomByRoomId(leaveChattingRoomId);
    if (leaveChattingRoom === undefined) {
        console.log("퇴장하려는 채팅방이 없음");
        return;
    }

    leaveChattingRoom.roomUserDelete(chattingLeaveRoomUser.getId());
}