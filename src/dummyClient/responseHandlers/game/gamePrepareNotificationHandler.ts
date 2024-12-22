import Long from "long";
import { Room } from "../../../gameServer/interface/interface.js"
import { gDummyClients, UserClient } from "../../dummyClient.js"

export const gamePrepareNotificationHandler = (userClient: UserClient, payload: any): void => {
    const room: Room = payload.room as Room;
    //console.log(`게임 준비 완료 방 id ${room.id} ownerId ${room.ownerId}`);

    const leaderDummy = gDummyClients.find((dummy: UserClient) => {
        const dummyId: Long = Long.fromNumber(dummy.getId());
        const ownerId: Long = Long.fromNumber(room.ownerId);

        return dummyId.equals(ownerId);
    });

    if (leaderDummy) {
        const leaderDummyId: Long = Long.fromNumber(leaderDummy.getId());
        const userId: Long = Long.fromNumber(userClient.getId());

        if (leaderDummyId.equals(userId)) {
            leaderDummy.GameServerGameStart();
        }

        userClient.DummyRandomMoveStart();
    }
    else {
        console.log(`gamePrepareNoti 방장 더미가 없음`);
    }
}