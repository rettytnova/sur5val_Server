import { CHATTING_ROOM_MAX, config } from "../../../../config/config.js";
import { sendChattingPacket } from "../../../../packet/createPacket.js";
import ChattingRoom from "../../../class/chattingRoom.js";
import ChattingServer from "../../../class/chattingServer.js";
import ChattingUser from "../../../class/chattingUser.js";
import { Job, SendPacketData } from "../../../interface/chattingServerInterface.js";

// 채팅 서버 방 생성
export const chattingCreateRoomJobHandler = (job: Job): void => {
    const chattingUser = job.payload[0] as ChattingUser;

    const roomId = ChattingServer.getInstance().getRoomdId();
    ChattingServer.getInstance().increaseRoomId();


    const newChattingRoom = new ChattingRoom(roomId, CHATTING_ROOM_MAX);
    ChattingServer.getInstance().getRooms().push(newChattingRoom);

    const sendData = {
        chattingRoomId: roomId
    }

    sendChattingPacket(
        chattingUser.getUserSocket(),
        config.chattingPacketType.CHATTING_CREATE_ROOM_RESPONSE,
        sendData);
}