import ChattingServer from "../../../class/chattingServer.js";
import ChattingUser from "../../../class/chattingUser.js";
import { ChattingLeaveRoomPayload, Job } from "../../../interface/chattingServerInterface.js";

export const chattingLeaveRoomJobHandler = (job: Job): void => {
    const chattingLeaveRoomPayload = job.payload[0] as ChattingLeaveRoomPayload;

    const chattingLeaveRoomUser = ChattingServer.getInstance().getUserByEmail(chattingLeaveRoomPayload.email);
    if (chattingLeaveRoomUser === undefined) {
        console.log("채팅 방 떠나기 요청 user 없음");
        return;
    }

    const leaveChattingRoomId = chattingLeaveRoomUser.getJoinRoomId();

    console.log(`채팅 방 나가기 ${chattingLeaveRoomUser.getEmail()}`);

    const leaveChattingRoom = ChattingServer.getInstance().getRoomByRoomId(leaveChattingRoomId);
    if (leaveChattingRoom === undefined) {
        console.log("퇴장하려는 채팅방이 없음");
        return;
    }

    const isRoomRemove = leaveChattingRoom.roomUserDelete(chattingLeaveRoomUser.getId());
    if (isRoomRemove == true) {
        console.log("방 삭제");
        ChattingServer.getInstance().roomDelete(leaveChattingRoom.getRoomId());
    }
    else {
        if (leaveChattingRoom.getRoomOwnerEmail() == chattingLeaveRoomUser.getEmail()) {
            leaveChattingRoom.setRoomOwnerEmail();
            console.log(`채팅방 방장이 ${chattingLeaveRoomUser.getEmail()}에서 ${leaveChattingRoom.getRoomOwnerEmail()}로 변경`);
        }
    }
}