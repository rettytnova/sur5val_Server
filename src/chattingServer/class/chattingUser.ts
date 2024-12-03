import { CustomSocket } from "../../interface/interface.js";
import { v4 as uuidv4 } from 'uuid';

class ChattingUser {
    private userSocket: CustomSocket;
    private id: string;
    private email: string;
    private nickName: string;
    private joinRoomId: number;
    constructor(userSocket: CustomSocket, email: string, nickName: string) {
        this.userSocket = userSocket;
        this.id = uuidv4();
        this.email = email;
        this.joinRoomId = 0;
        this.nickName = nickName;
    }

    getUserSocket() {
        return this.userSocket;
    }

    getId() {
        return this.id;
    }

    getEmail() {
        return this.email;
    }

    getNickName() {
        return this.nickName;
    }

    getJoinRoomId() {
        return this.joinRoomId;
    }

    setJoinRoomId(roomId: number) {
        this.joinRoomId = roomId;
    }
}

export default ChattingUser;