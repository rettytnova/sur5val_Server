import { DummyGameRoom, UserClient, getGDummyGameRooms, setGDummyGameRoomsInit } from "../../dummyClient.js"

export const getRoomListResponseHandler = (userClient: UserClient, payload: any): void => {
    setGDummyGameRoomsInit();
    const gDummyGameRooms = getGDummyGameRooms();

    const rooms = payload.rooms;
    if (!rooms) {
        return;
    }

    rooms.forEach((room: any) => {
        const dummyGameRoom = new DummyGameRoom(room);
        console.log(`dummy ${userClient.getEmail()} 방 ${dummyGameRoom.getRoomData().name}`);
        gDummyGameRooms.push(dummyGameRoom);
    });
}