import ChattingServer from "../class/chattingServer.js";

export const chattingPacketParser = (packetType: number, payload: Buffer): object => {
    try {
        const chattingProtoMessages = ChattingServer.getInstance().getProtoMessages();

        const chattingPacket = chattingProtoMessages.packet.ChattingPacket;

        const decodedChattingPacket = chattingPacket.decode(payload);
        const payloadField = chattingPacket.oneofs['chattingPayload'].oneof.find((field: any) => decodedChattingPacket[field] != null);

        return decodedChattingPacket[payloadField];
    } catch (err) {
        console.error(`패킷 파싱 중 에러 : ${err}`);
        return {};
    }
}