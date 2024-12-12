import DatabaseManager from "../../../../database/databaseManager.js";
import { CustomSocket } from "../../../../gameServer/interface/interface.js";
import ChattingRoom from "../../../class/chattingRoom.js";
import ChattingServer from "../../../class/chattingServer.js";
import ChattingUser from "../../../class/chattingUser.js";
import { Job } from "../../../interface/chattingServerInterface.js";

// 채팅 서버 로그인
export const chattingLoginJobHandler = async (job: Job): Promise<void> => {
    const userEmail = job.payload[0] as string;
    const userSocket = job.payload[1] as CustomSocket;

    const user: any = await DatabaseManager.getInstance().findUserByEmail(userEmail);
    if (!user) {
        return;
    }

    const loginUserNickName = user.nickname as string;

    const newChattingUser = new ChattingUser(userSocket, userEmail, loginUserNickName);
    ChattingServer.getInstance().getUsers().push(newChattingUser);

    const rooms: ChattingRoom[] = ChattingServer.getInstance().getRooms();
    const room = rooms.find((room: ChattingRoom) => room.getUsers().some((user: ChattingUser) => user.getEmail() == userEmail));
    if (room) {
        console.log("이미 참여중인 방이 있음");
        const existUser = room.getUsers().find((user: ChattingUser) => user.getEmail() === userEmail);
        if (existUser) {
            room.roomUserDelete(existUser.getId());
            newChattingUser.setJoinRoomId(room.getRoomId());
            room.roomUserAdd(newChattingUser);
        }
    }
}