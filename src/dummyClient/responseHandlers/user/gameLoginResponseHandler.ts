import { UserClient } from "../../dummyClient.js"

export const gameLoginResponseHandler = (userClient: UserClient, payload: any): void => {
    if (!userClient) {
        return;
    }

    userClient.GameServerGetRoomList();
    userClient.setId(payload.myInfo.id);
    userClient.setEmail(payload.myInfo.email);
    userClient.setNickname(payload.myInfo.ninkname);

    console.log(`더미 로그인 성공 id ${userClient.getId()} email ${userClient.getEmail()} ninaname ${userClient.getNickname()}`);
}
