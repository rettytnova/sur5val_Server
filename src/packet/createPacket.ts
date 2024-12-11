import { chattingPacketMaps, CLIENT_VERSION, packetMaps } from '../config/config.js';
import Server from '../class/server.js';
import net from 'net';

export const sendPacket = (socket: net.Socket, packetType: number, data: Object) => {
  try {
    const protoMessages = Server.getInstance().getProtoMessages();
    const gamePacket = protoMessages.packet.GamePacket;

    const packet: { [key: string]: object } = {};
    packet[packetMaps[packetType]] = data;

    //const responseGamePacket = gamePacket.create(packet);
    // console.log(gamePacket.verify(packet));
    const gamePacketBuffer = gamePacket.encode(packet).finish();

    const serializedPacket = serializer(gamePacketBuffer, packetType);
    socket.write(serializedPacket);

    // const deserializedPacket = gamePacket.decode(gamePacketBuffer);

    // console.dir(deserializedPacket, { depth: null });
  } catch (error) {
    console.error('Error sending response packet', error);
  }
};

export const sendChattingPacket = (
  chattingPacket: any,
  socket: net.Socket,
  packetType: number,
  data: Object
) => {
  try {
    const packet: { [key: string]: object } = {};
    packet[chattingPacketMaps[packetType]] = data;

    const chattingPacketBuffer = chattingPacket.encode(packet).finish();
    const serializedChattingPacket = serializer(chattingPacketBuffer, packetType);
    socket.write(serializedChattingPacket);
  } catch (error) {
    console.error('Error send Chatting response packet', error);
  }
};

export const serializer = (gamePacketBuffer: Buffer, packetType: number, sequence = 1) => {
  // packetType (2 bytes)
  const packetTypeBuffer = Buffer.alloc(2);
  packetTypeBuffer.writeUInt16BE(packetType, 0);

  // versionLength (1 byte)
  const versionLengthBuffer = Buffer.alloc(1);
  versionLengthBuffer.writeUInt8(CLIENT_VERSION.length, 0);

  // version (string to buffer)
  const versionBuffer = Buffer.from(CLIENT_VERSION, 'utf8');

  // sequence (4 bytes) 안쓰임
  const sequenceBuffer = Buffer.alloc(4);
  sequenceBuffer.writeUInt32BE(sequence, 0);

  // payloadLength (4 bytes)
  const payloadLengthBuffer = Buffer.alloc(4);
  payloadLengthBuffer.writeUInt32BE(gamePacketBuffer.length, 0);

  // 최종 패킷 결합 (header + message)
  return Buffer.concat([
    packetTypeBuffer,
    versionLengthBuffer,
    versionBuffer,
    sequenceBuffer,
    payloadLengthBuffer,
    gamePacketBuffer
  ]);
};
