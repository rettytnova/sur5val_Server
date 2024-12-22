import { DummyRoomData } from "../../../gameServer/interface/interface.js";
import { DummyGameRoom, UserClient } from "../../dummyClient.js"

export const createRoomResponseHandler = (userClient: UserClient, payload: any): void => {
    if (payload.success === true) {
        const dummyGameRoomData: DummyRoomData = {
            id: payload.room.id,
            ownerId: payload.room.ownerId,
            ownerEmail: payload.room.ownerEmail,
            name: payload.room.name,
            maxUserNum: payload.room.maxUserNum,
            state: payload.room.state,
            users: [],
        }

        dummyGameRoomData.users.push(userClient);

        const createGameRoom = new DummyGameRoom(dummyGameRoomData);
        //console.log("방 생성 성공 id", createGameRoom);
        userClient.gameRoomId = payload.room.id;
        userClient.dummyClientRoom.push(createGameRoom);
    }
    else {
        console.log(`방 생성 실패`);
    }
}