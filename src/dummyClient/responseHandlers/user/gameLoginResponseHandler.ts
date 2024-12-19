import { UserClient } from "../../dummyClient.js"

export const gameLoginResponseHandler = (userClient: UserClient, payload: any): void => {
    if (!userClient) {
        console.log("userClient 없음");
        return;
    }

    if (!payload) {
        console.log("payload없음");
        return;
    }

    if (!payload.myInfo) {
        console.log("payload myInfo 없음");
        return;
    }

    userClient.setId(payload.myInfo.id);
    userClient.setEmail(payload.myInfo.email);
    userClient.setNickname(payload.myInfo.ninkname);

    console.log(`더미 로그인 성공 id ${userClient.getId()} email ${userClient.getEmail()}}`);
}
