import { DummyGameRoom, UserClient } from "../../dummyClient.js"

export const getRoomListResponseHandler = (userClient: UserClient, payload: any): void => {
    const rooms = payload.rooms;
    if (!rooms) {
        return;
    }

    userClient.dummyClientRoom = [];

    //console.log("dummy response room len", rooms.length);
    rooms.forEach((room: any) => {
        const dummyGameRoom = new DummyGameRoom(room);
        //console.log(`dummy ${userClient.getEmail()} 방 ${dummyGameRoom.getRoomData().name}`);

        if (room.maxUserNum > room.users.length) {
            //console.log(`더미 방 입장 요청 ${room.id}`);
            userClient.GameServerJoinRoom(room.id);
            userClient.GameServerGetRoomListReqIntervalClear();
        }

        userClient.dummyClientRoom.push(dummyGameRoom);
    });
}