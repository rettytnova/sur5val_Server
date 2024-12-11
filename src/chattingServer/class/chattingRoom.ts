import { config } from "../../config/config.js";
import { sendChattingPacket } from "../../packet/createPacket.js";
import { Job } from "../interface/chattingServerInterface.js";
import ChattingServer from "./chattingServer.js";
import ChattingUser from "./chattingUser.js";

class ChattingRoom {
    private id: number;
    private ownerEmail: string;
    private users: ChattingUser[];
    private maxUser: number;

    public roomJobQue: Job[];

    constructor(id: number, ownerEmail: string, maxUser: number) {
        this.id = id;
        this.ownerEmail = ownerEmail;
        this.users = [];
        this.maxUser = maxUser;

        this.roomJobQue = [];
    }

    getRoomId() {
        return this.id;
    }

    getRoomOwnerEmail() {
        return this.ownerEmail;
    }

    userFind(userId: string) {
        return this.users.find((user: ChattingUser) => user.getId() === userId);
    }

    roomUserAdd(user: ChattingUser) {
        if (this.users.length === this.maxUser) {
            console.error("ChattingRoom roomUserAdd 방에 유저가 가득참");
            return;
        }

        this.users.push(user);
    }

    roomUserDelete(id: string) {
        if (this.users.length === 0) {
            console.error("ChattingRoom roomUserDelete 방에 유저가 없는데 삭제 하려고 들어옴");
            return;
        }

        this.users = this.users.filter((user) => user.getId() !== id);

        if (this.users.length == 0) {
            return true;
        }

        return false;
    }

    update() {
        // this.users.forEach((user: ChattingUser) => {
        //     console.log(`방 ${user.getEmail()}`);
        // });

        while (this.roomJobQue.length > 0) {
            const job = this.roomJobQue.shift();
            if (!job) {
                console.log("job이 없음");
                break;
            }

            switch (job.jobType) {
                case config.jobType.CHATTING_CHAT_SEND_REQUEST_JOB:
                    const chattingSendUser = job.payload[0] as ChattingUser;
                    const chatMessage = job.payload[1] as string;

                    const chatSendResponse = {
                        nickName: chattingSendUser.getNickName(),
                        chatMessage
                    }

                    this.users.forEach((user: ChattingUser) => {
                        const chattingPacket = ChattingServer.getInstance().getProtoMessages().packet.ChattingPacket;
                        sendChattingPacket(chattingPacket, user.getUserSocket(), config.chattingPacketType.CHATTING_CHAT_SEND_RESPONSE, chatSendResponse);
                    });
                    break;
            }
        }
    }
}

export default ChattingRoom;