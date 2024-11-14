import net from "net"
import { VERSION_START, SEQUENCE_SIZE, TOTAL_LENGTH } from "../config/config.js";
import { CustomSocket } from "../interface/interface.js";

export const onData = (socket: CustomSocket) => async (data: Buffer) => {       
    socket.buffer = Buffer.concat([socket.buffer, data]);
    
    const initialHeaderLength = VERSION_START;
  
    while (socket.buffer.length > initialHeaderLength) {
      console.log(socket.buffer);
  
      const packetType = socket.buffer.readUInt16BE(0);
      console.log(`packetType: ${packetType}`);
  
      const versionLength = socket.buffer.readUInt8(2);
      const totalHeaderLength = TOTAL_LENGTH + versionLength;
  
      while (socket.buffer.length >= totalHeaderLength) {
        const version = socket.buffer.toString('utf8', VERSION_START, VERSION_START + versionLength);
        console.log(`version: ${version}`)
        // version 검증하는 코드 만들어야함!!!!!!!!!!!!!!
  
        // sequence: 4바이트 읽기
        const sequence = socket.buffer.readUInt32BE(VERSION_START + versionLength);
        console.log(`sequence: ${sequence}`)
  
        // payloadLength: 4바이트 읽기
        const payloadLengthPosition = VERSION_START + versionLength + SEQUENCE_SIZE;
        const payloadLength = socket.buffer.readUInt32BE(payloadLengthPosition);
  
        // 패킷의 전체 길이 (헤더와 payload 길이를 포함)
        const length = totalHeaderLength + payloadLength;
        if (socket.buffer.length >= length) {
          // 헤더부터 끝까지
          const payloadStart = totalHeaderLength;
          let payload = socket.buffer.subarray(payloadStart, payloadStart + payloadLength);
          console.log(`payload: ${payload}`)
  
          socket.buffer = socket.buffer.subarray(length);
          try {
            // const handler = getHandlerByPacketType(packetType);
            // handler( socket, payload );
          } catch (error) {
            console.error(error);
          }
        }
        break;
      }
    }
  };