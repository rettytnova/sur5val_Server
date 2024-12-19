import { User } from "../interface/interface.js";

class UserSessions {
    private userInfo: User;

    constructor(userInfo: User) {
        this.userInfo = userInfo;
    }

    getUserInfo() {
        return this.userInfo;
    }

    getId() {
        return this.userInfo.id;
    }

    getNickname() {
        return this.userInfo.nickname;
    }

    getEmail() {
        return this.userInfo.email;
    }

    getCharacter() {
        return this.userInfo.character;
    }
}

export default UserSessions;