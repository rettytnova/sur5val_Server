import net from "net";
import path from 'path';
import fs from 'fs';
import protobuf from 'protobufjs';
import { fileURLToPath } from 'url';
import { packetNames } from "./protobuf/packetNames.js";
import { config, packetMaps } from "./config/config.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
const protoDir = path.join(__dirname, '../src/protobuf');

const protoMessages: { [key: string]: any } = {};

export const GetAllProtoFiles = (dir: string, fileList: string[] = []) => {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);

        if (fs.statSync(filePath).isDirectory()) {
            GetAllProtoFiles(filePath, fileList);
        }
        else if (path.extname(file) === '.proto') {
            fileList.push(filePath);
        }
    });

    return fileList;
};

export const LoadProtos = async () => {
    try {
        const root = new protobuf.Root();

        await Promise.all(protoFiles.map((file) => {
            return root.load(file)
        }));

        for (const [packageName, types] of Object.entries(packetNames)) {
            protoMessages[packageName] = {};
            for (const [type, typeName] of Object.entries(types)) {
                protoMessages[packageName][type] = root.lookupType(typeName);
            }
        }

        console.log("protobuf 파일 로드 완료");
    } catch (err) {
        console.error(`Protobuf 파일 로드 중 오류 발생 : ${err}`);
    }
};

const protoFiles = GetAllProtoFiles(protoDir);
LoadProtos();

function CreatePacket(packetType: number, version: string, sequence: number, payload: object) {
    let versionLength = version.length;

    const typeBuffer = Buffer.alloc(config.packet.typeLength);
    typeBuffer.writeUInt16BE(packetType, 0);

    const versionLengthBuf = Buffer.alloc(config.packet.versionLength);
    versionLengthBuf.writeUInt8(versionLength, 0);

    const versionBuffer = Buffer.from(version, 'utf-8');

    const sequenceBuffer = Buffer.alloc(config.packet.sequenceLength);
    sequenceBuffer.writeUint32BE(sequence, 0);

    const gamePacket = protoMessages.packet.GamePacket;
    const packet: { [key: string]: object } = {};

    packet[packetMaps[packetType]] = payload;
    const payloadBuffer = gamePacket.encode(packet).finish();

    const payloadLengthBuffer = Buffer.alloc(config.packet.payloadLength);
    payloadLengthBuffer.writeUInt32BE(payloadBuffer.length, 0);

    return Buffer.concat([
        typeBuffer,
        versionLengthBuf,
        versionBuffer,
        sequenceBuffer,
        payloadLengthBuffer,
        payloadBuffer,
    ]);
}

class Client {
    private clientSocket: any;

    constructor() {
        this.clientSocket = new net.Socket();
    }

    connect() {
        this.clientSocket.connect(5555, "127.0.0.1", async () => {
            console.log(`"127.0.0.1" : 5555 서버와 연결`);

            setTimeout(() => {
                const registerPacket = CreatePacket(config.packetType.REGISTER_REQUEST, "1.0.0", 1, {
                    id: "123",
                    password: '123',
                    email: '123'
                });

                this.clientSocket.write(registerPacket);
            }, 2000);

            this.clientSocket.on('data', (data: Buffer) => {
                let offset = 0;

                const packetType = data.readUInt16BE(offset);
                offset += 2;

                const versionLength = data.readUInt8(offset);
                offset += 1;

                const version = data.subarray(offset, offset + versionLength).toString('utf-8');
                offset += versionLength;

                const sequence = data.readUInt32BE(offset);
                offset += 4;

                const payloadLength = data.readUInt32BE(offset);
                offset += 4;

                const payload = data.subarray(offset, offset + payloadLength);
                const packet = protoMessages.packet.GamePacket;

                const payloadData = packet.decode(payload);

                switch (packetType) {
                    case config.packetType.REGISTER_RESPONSE:
                        console.log("payloadData", payloadData);
                        break;
                }

            });
        });
    }
}

const dummyClient = new Client();
dummyClient.connect();