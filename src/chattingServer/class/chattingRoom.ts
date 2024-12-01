import ChattingUser from "./chattingUser.js";

class ChattingRoom {
    private id: number;
    private users: ChattingUser[];
    private maxUser: number;

    constructor(id: number, maxUser: number) {
        this.id = id;
        this.users = [];
        this.maxUser = maxUser;
    }

    getRoomId() {
        return this.id;
    }

    roomUserAdd(user: ChattingUser) {
        if (this.users.length === this.maxUser) {
            console.error("ChattingRoom roomUserAdd 방에 유저가 가득참");
            return;
        }

        this.users.push(user);
    }

    roomUserDelete(email: string) {
        if (this.users.length === 0) {
            console.error("ChattingRoom roomUserDelete 방에 유저가 없는데 삭제 하려고 들어옴");
            return;
        }

        this.users = this.users.filter((user) => user.getEmail() !== email);
    }

    update() {
        this.users.forEach((user: ChattingUser) => {
            console.log(`room User ${user.getEmail()}`);
        });
    }
}

export default ChattingRoom;