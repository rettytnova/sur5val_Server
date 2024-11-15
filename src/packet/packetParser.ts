import Server from '../class/server.js';

export const packetParser = (packetType: Number, payload: Buffer): object => {
    try{
        // 정의한 프로토콜 버퍼들 다 담김(싱글톤 getInstance() 메서드)
        const protoMessages = Server.getInstance().getProtoMessages();
        // 그중에 .packet.GamePacket 가져옴
        const gamePacket = protoMessages.packet.GamePacket;                
                
        // 클라이언트가 보낸 payload를 gamePacket 형식으로 디코딩 함
        // 예) 회원가입 payload
        // registerRequse: {
        //     id: "a",
        //     password: '123',
        //     email: "a@a.com",
        // };
        const decodedGamePacket = gamePacket.decode(payload);    
        console.log('decodeGamePacket : ', decodedGamePacket);        

        // 디코딩 된 해당 payload가 어떤 형식인지(어떤 Field인지) 찾아서 payloadField에 넣어줌
        // 예) 클라가 보낸 payload가 회원가입이라면
        //     payloadField에는 registerRequest가 담줌줌
        const payloadField = gamePacket.oneofs['payload'].oneof.find(
            (field: any) => decodedGamePacket[field] != null,
        );                  

        console.log(`payloadField : [${payloadField}]`);        
        console.log("decodedGamePacket : ", decodedGamePacket[payloadField]);
        /**
         *  payloadField : [registerRequest]
            decodedGamePacket :  C2SRegisterRequest {
            id: 'sung_dummyClient_0 ',
            password: '123',
            email: 'sung_dummyClient_0@com'
         */
        return decodedGamePacket[payloadField];        
    }
    catch(error)
    {
        console.error(`패킷 파싱 중 에러 : ${error}`);
        return {};
    }   
}