import ChattingServer from "../../../class/chattingServer.js";
import ChattingUser from "../../../class/chattingUser.js";
import { ChattingJoinRoomRequestPayload, Job } from "../../../interface/chattingServerInterface.js";

// 채팅 방 참여
export const chattingJoinRoomJobHandler = (job: Job): void => {
    const chattingJoinRoomPayload = job.payload[0] as ChattingJoinRoomRequestPayload;

    const chattingJoinRoomUser = ChattingServer.getInstance().getUserByEmail(chattingJoinRoomPayload.email);
    if (chattingJoinRoomUser === undefined) {
        console.log("채팅 방 참여 요청 user가 없음")
        return;
    }

    const chattingRoomOwnerEmail = chattingJoinRoomPayload.ownerEmail;

    console.log(`채팅 방 참여 방장 email :  ${chattingRoomOwnerEmail}`);

    const chattingRoom = ChattingServer.getInstance().getRoomByOwnerEmail(chattingRoomOwnerEmail);
    if (chattingRoom === undefined) {
        console.log("참여할 채팅 방이 없음");
        return;
    }

    chattingJoinRoomUser.setJoinRoomId(chattingRoom.getRoomId());

    chattingRoom.roomUserAdd(chattingJoinRoomUser);
}