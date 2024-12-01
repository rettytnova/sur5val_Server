import { CustomSocket } from "../../interface/interface.js";

class ChattingUser {
    private userSocket: CustomSocket;
    private id: number;
    private email: string;
    constructor(userSocket: CustomSocket, id: number, email: string) {
        this.userSocket = userSocket;
        this.id = id;
        this.email = email;
    }
}

export default ChattingUser;