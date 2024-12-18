import { UserClient } from "../../dummyClient.js"

export const createRoomResponseHandler = (userClient: UserClient, payload: any): void => {
    if (payload.success === true) {
        console.log(`방 생성 성공 id ${payload.room.id}`);
    }
    else {
        console.log(`방 생성 실패`);
    }
}