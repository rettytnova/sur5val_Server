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

    setRoomOwnerId(newOwnerId: number) {
        this.roomInfo.ownerId = newOwnerId;
    }

    getRoomOwnerEmail() {
        return this.roomInfo.ownerEmail;
    }

    setRoomOwnerEmail(newOwnerEmail: string) {
        this.roomInfo.ownerEmail = newOwnerEmail;
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

    getRoomName() {
        return this.roomInfo.name;
    }
}

export default GameRoom;