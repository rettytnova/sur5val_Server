import { DummyGameRoom, UserClient, getGDummyGameRooms, setGDummyGameRoomsInit } from "../../dummyClient.js"

export const getRoomListResponseHandler = (userClient: UserClient, payload: any): void => {

    setGDummyGameRoomsInit();
    const gDummyGameRooms = getGDummyGameRooms();

    const rooms = payload.rooms;
    if (rooms.length === 0) {
        userClient.GameServerCreateRoom();
    }
    else {
        rooms.forEach((room: any) => {
            const dummyGameRoom = new DummyGameRoom(room);
            gDummyGameRooms.push(dummyGameRoom);
        });
    }
}