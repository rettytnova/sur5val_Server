import { VERSION_START, TOTAL_LENGTH, config } from '../config/config.js';
import { CustomSocket } from '../interface/interface.js';
import { packetParser } from '../packet/packetParser.js';
import { getHandlerByPacketType } from '../handlers/handlerIndex.js';

export const onData = (socket: CustomSocket) => async (data: Buffer) => {
  socket.buffer = Buffer.concat([socket.buffer, data]);

  const initialHeaderLength = VERSION_START;

  while (socket.buffer.length > initialHeaderLength) {
    //console.log(socket.buffer);

    let offset: number = 0;

    const packetType = socket.buffer.readUInt16BE(offset);
    offset += config.packet.typeLength;

    //console.log(`packetType: ${packetType}`);

    const versionLength = socket.buffer.readUInt8(offset);
    offset += config.packet.versionLength;

    const totalHeaderLength = TOTAL_LENGTH + versionLength;

    while (socket.buffer.length >= totalHeaderLength) {
      const version = socket.buffer.toString('utf8', offset, offset + versionLength);
      offset += versionLength;
      //console.log(`version: ${version}`);
      // version 검증하는 코드 만들어야함!!!!!!!!!!!!!!

      // sequence: 4바이트 읽기
      const sequence = socket.buffer.readUInt32BE(offset);
      offset += config.packet.sequenceLength;

      //console.log(`sequence: ${sequence}`);

      // payloadLength: 4바이트 읽기
      const payloadLength = socket.buffer.readUInt32BE(offset);
      offset += config.packet.payloadLength;

      // 패킷의 전체 길이 (헤더와 payload 길이를 포함)
      const length = totalHeaderLength + payloadLength;
      if (socket.buffer.length >= length) {
        // 헤더부터 끝까지
        let payload = socket.buffer.subarray(offset, offset + payloadLength);
        //console.log (`payload: ${payload}`)

        const parsedData = packetParser(packetType, payload);

        socket.buffer = socket.buffer.subarray(offset + payloadLength);

        try {
          const handler = getHandlerByPacketType(packetType);
          handler?.(socket, parsedData);
        } catch (error) {
          console.error(error);
        }
      }
      break;
    }
  }
};
