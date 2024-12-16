import { CHATTING_ROOM_MAX } from "../../../../config/config.js";
import ChattingRoom from "../../../class/chattingRoom.js";
import ChattingServer from "../../../class/chattingServer.js";
import ChattingUser from "../../../class/chattingUser.js";
import { Job } from "../../../interface/chattingServerInterface.js";

// 채팅 서버 방 생성
export const chattingCreateRoomJobHandler = (job: Job): void => {
    const chattingUser = job.payload[0] as ChattingUser;

    console.log(`채팅 방 생성 ${chattingUser.getEmail()}`);

    const roomId = ChattingServer.getInstance().getRoomId();
    ChattingServer.getInstance().increaseRoomId();

    const newChattingRoom = new ChattingRoom(roomId, chattingUser.getEmail(), CHATTING_ROOM_MAX);
    ChattingServer.getInstance().getRooms().push(newChattingRoom);

    chattingUser.setJoinRoomId(newChattingRoom.getRoomId());

    newChattingRoom.roomUserAdd(chattingUser);
}