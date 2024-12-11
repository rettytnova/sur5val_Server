import Server from '../class/server.js';
import { CLIENT_VERSION, config, TOTAL_LENGTH, VERSION_START } from '../config/config.js';
import { CustomSocket } from '../interface/interface.js';

export const onChattingServerOnData = (socket: CustomSocket) => async (data: Buffer) => {
    socket.buffer = Buffer.concat([socket.buffer, data]);

    const initialHeaderLength = VERSION_START;

    while (socket.buffer.length > initialHeaderLength) {
        let offset: number = 0;

        const packetType = data.readUInt16BE(offset);
        offset += 2;

        const versionLength = data.readUInt8(offset);
        offset += 1;

        const totalHeaderLength = TOTAL_LENGTH + versionLength;

        while (socket.buffer.length >= TOTAL_LENGTH + versionLength) {
            const version = socket.buffer.toString('utf8', offset, offset + versionLength);
            offset += versionLength;
            if (version !== CLIENT_VERSION) {
                console.error('버전이 다릅니다.');
                break;
            }

            const sequence = data.readUInt32BE(offset);
            offset += config.packet.sequenceLength;

            const payloadLength = data.readUInt32BE(offset);
            offset += config.packet.payloadLength;

            const length = totalHeaderLength + payloadLength;
            if (socket.buffer.length >= length) {
                let payload = socket.buffer.subarray(offset, offset + payloadLength);

                const packet = Server.getInstance().getProtoMessages();

                const payloadData = packet.decode(payload);

                switch (packetType) {

                }

                socket.buffer = socket.buffer.subarray(offset + payloadLength);
            }
        }
    }
};