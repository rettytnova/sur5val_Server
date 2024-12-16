import { UserClient } from "../../dummyClient.js"

export const gameRegisterResponseHandler = (userClient: UserClient, payload: any): void => {
    if (payload.success) {
        console.log(`회원가입 성공 ${payload.message}`);
    }
    else {
        console.log(`회원가입 실패 ${payload.message}`);
    }
}