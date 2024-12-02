import ChattingServer from "../../../class/chattingServer.js";
import ChattingUser from "../../../class/chattingUser.js";
import { Job } from "../../../interface/chattingServerInterface.js";

// 채팅 방 참여
export const chattingJoinRoomJobHandler = (job: Job): void => {
    const chattingJoinRoomUser = job.payload[0] as ChattingUser;
    const chattingRoomOwnerEmail = job.payload[1] as string;

    const chattingRoom = ChattingServer.getInstance().getRoomByOwnerEmail(chattingRoomOwnerEmail);
    if (chattingRoom === undefined) {
        console.log("참여할 채팅 방이 없음");
        return;
    }

    chattingJoinRoomUser.setJoinRoomId(chattingRoom.getRoomId());

    chattingRoom.roomUserAdd(chattingJoinRoomUser);
}