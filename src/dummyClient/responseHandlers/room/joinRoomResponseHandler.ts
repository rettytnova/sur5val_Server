import Long from "long";
import { Room } from "../../../gameServer/interface/interface.js";
import { gDummyClients, UserClient } from "../../dummyClient.js"

export const joinRoomResponseHandler = (userClient: UserClient, payload: any): void => {
    if (payload.success === true) {

        const room: Room = payload.room as Room;

        let leaderDummy: UserClient | undefined;

        for (let i = 0; i < gDummyClients.length; i++) {
            const dummyId: Long = Long.fromNumber(gDummyClients[i].getId());
            const ownerId: Long = Long.fromNumber(room.ownerId);

            //console.log(`joinRoomResponse 더미 방참여 id ${dummyId} ownerId ${ownerId}`);

            if (dummyId.equals(ownerId)) {
                leaderDummy = gDummyClients[i];
                break;
            }
        }

        if (leaderDummy) {
            //console.log(`joinRoomResponse 방 ${room.ownerId} 방장 email ${leaderDummy.getEmail()}`);

            leaderDummy.dummyClientRoom[0].getRoomData().users.push(userClient);
        }
        else {
            console.log("joinRoomResponse 방장 더미가 없음");
        }
    }
    else {
        //console.log(`joinRoomResponse 더미 방 참여 실패`);
    }
}