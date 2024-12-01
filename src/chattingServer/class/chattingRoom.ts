import { User } from "../../interface/interface.js";

class ChattingRoom {
    private id: number;
    private ownerEmail: string;
    private users: User[];
    private maxUser: number;

    constructor(id: number, ownerEmail: string, maxUser: number) {
        this.id = id;
        this.ownerEmail = ownerEmail;
        this.users = [];
        this.maxUser = maxUser;
    }

    getRoomId() {
        return this.id;
    }

    getOwnerEmail() {
        return this.ownerEmail;
    }

    roomUserAdd(user: User) {
        if (this.users.length === this.maxUser) {
            console.error("ChattingRoom roomUserAdd 방에 유저가 가득참");
            return;
        }

        this.users.push(user);
    }

    roomUserDelete(id: number) {
        if (this.users.length === 0) {
            console.error("ChattingRoom roomUserDelete 방에 유저가 없는데 삭제 하려고 들어옴");
            return;
        }

        this.users = this.users.filter((user) => user.id !== id);
    }

    update() {
        //console.log(`${this.id} 방 업데이트`);
    }
}

export default ChattingRoom;