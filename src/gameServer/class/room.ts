import { RoomTwo } from "../interface/interface.js";
import UserSessions from "./userSessions.js";

class GameRoom {
    private roomInfo: RoomTwo;

    constructor(roomInfo: RoomTwo) {
        this.roomInfo = roomInfo;
    }

    getRoomId() {
        return this.roomInfo.id;
    }

    getRoomOwnerId() {
        return this.roomInfo.ownerId;
    }

    getRoomOwnerEmail() {
        return this.roomInfo.ownerEmail;
    }

    setUsers(users: UserSessions[]) {
        this.roomInfo.users = users;
    }

    getUsers() {
        return this.roomInfo.users;
    }

    getRoomState() {
        return this.roomInfo.state;
    }

    getRoomMaxUser() {
        return this.roomInfo.maxUserNum;
    }
}

export default GameRoom;