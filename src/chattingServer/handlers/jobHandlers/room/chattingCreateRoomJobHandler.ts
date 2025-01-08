import { CHATTING_ROOM_MAX } from "../../../../config/config.js";
import ChattingRoom from "../../../class/chattingRoom.js";
import ChattingServer from "../../../class/chattingServer.js";
import ChattingUser from "../../../class/chattingUser.js";
import { ChattingCreateRoomPayload, Job } from "../../../interface/chattingServerInterface.js";

// 채팅 서버 방 생성
export const chattingCreateRoomJobHandler = (job: Job): void => {
    const chattingCreateRoomPayload = job.payload[0] as ChattingCreateRoomPayload;

    const chattingUser = ChattingServer.getInstance().getUserByEmail(chattingCreateRoomPayload.email);
    if (chattingUser === undefined) {
        console.log("채팅 방 생성 요청 loginUser가 없음");
        return;
    }

    console.log(`채팅 방 생성 방장 email ${chattingUser.getEmail()}`);

    const roomId = ChattingServer.getInstance().getRoomId();
    ChattingServer.getInstance().increaseRoomId();

    const newChattingRoom = new ChattingRoom(roomId, chattingUser.getEmail(), CHATTING_ROOM_MAX);
    ChattingServer.getInstance().getRooms().push(newChattingRoom);

    chattingUser.setJoinRoomId(newChattingRoom.getRoomId());

    newChattingRoom.roomUserAdd(chattingUser);
}