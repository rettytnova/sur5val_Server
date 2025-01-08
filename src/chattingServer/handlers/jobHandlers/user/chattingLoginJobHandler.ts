import DatabaseManager from "../../../../database/databaseManager.js";
import { CustomSocket } from "../../../../gameServer/interface/interface.js";
import ChattingRoom from "../../../class/chattingRoom.js";
import ChattingServer from "../../../class/chattingServer.js";
import ChattingUser from "../../../class/chattingUser.js";
import { ChattingLoginRequestPayload, Job } from "../../../interface/chattingServerInterface.js";

// 채팅 서버 로그인
export const chattingLoginJobHandler = async (job: Job): Promise<void> => {
    const loginPayload = job.payload[0] as ChattingLoginRequestPayload;

    const userEmail = loginPayload.email;

    const userSocket = job.payload[1] as CustomSocket;

    // 로그인 요청한 유저가 db에 저장되어 있는 유저인지 확인
    const user: any = await DatabaseManager.getInstance().findUserByEmail(userEmail);
    if (!user) {
        console.log('채팅 로그인 요청 유저가 DB에 없음');
        return;
    }

    const loginUserNickName = user.nickname as string;

    console.log(`채팅 로그인 성공 email ${userEmail} ninkname ${loginUserNickName}`);

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