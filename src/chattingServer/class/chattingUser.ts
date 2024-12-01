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

    getUserSocket() {
        return this.userSocket;
    }

    getId() {
        return this.id;
    }

    getEmail() {
        return this.email;
    }
}

export default ChattingUser;