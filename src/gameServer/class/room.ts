import { RoomStateType } from '../handlers/enumTyps.js';
import { Room } from '../interface/interface.js';
import UserSessions from './userSessions.js';

class GameRoom {
  private roomInfo: RoomData;

  constructor(roomInfo: RoomData) {
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

  setRoomState(state: RoomStateType) {
    this.roomInfo.state = state;
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
