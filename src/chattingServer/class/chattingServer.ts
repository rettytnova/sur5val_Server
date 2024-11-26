import fs from 'fs';
import path from 'path';
import net from 'net';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import protobuf from 'protobufjs';
import { chattingPacketNames } from '../../chattingProtobuf/chattingPacketNames.js';
import { CustomSocket } from '../../interface/interface.js';
import { chattingOnData } from '../events/chattingOnData.js';
import { chattingOnEnd } from '../events/chattingOnEnd.js';
import { chattingOnError } from '../events/chattingOnError.js';
import { config } from '../../config/config.js';

class ChattingServer {
    private static gInstance: ChattingServer | null = null;
    private chattingProtoMessages: { [key: string]: any } = {};
    private server: net.Server;

    private frame: number;
    private updateTime: number;
    private lastExecutionTime: number;
    private fps: number;
    private lastFpsTime: number;

    private constructor() {
        this.server = net.createServer();
        this.frame = 60;
        this.updateTime = Math.round((1000 / this.frame) * 10) / 10;
        this.lastExecutionTime = performance.now();
        this.fps = 0;
        this.lastFpsTime = performance.now();

        console.log(this.updateTime);
    }

    static getInstance() {
        if (ChattingServer.gInstance === null) {
            ChattingServer.gInstance = new ChattingServer();
        }

        return ChattingServer.gInstance;
    }

    getDir(): string {
        const __filename: string = fileURLToPath(import.meta.url);
        const __dirname: string = path.dirname(__filename);
        const protoDir = path.join(__dirname, '../../../src/chattingProtobuf');

        return protoDir;
    }

    getAllFiles(
        dir: string,
        findFileName: string,
        fileList: string[] = [],
    ): string[] {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
            const filePath = path.join(dir, file);

            if (fs.statSync(filePath).isDirectory()) {
                this.getAllFiles(filePath, findFileName, fileList);
            } else if (path.extname(file) === findFileName) {
                fileList.push(filePath);
            }
        });

        return fileList;
    }

    async initializeProto() {
        try {
            const chattingProtoDir: string = this.getDir();
            const chattingProtoFiles: string[] = this.getAllFiles(chattingProtoDir, '.proto');

            const root = new protobuf.Root();

            await Promise.all(
                chattingProtoFiles.map((file: string) => {
                    return root.load(file);
                })
            );

            for (const [packetName, types] of Object.entries(chattingPacketNames)) {
                this.chattingProtoMessages[packetName] = {};
                for (const [type, typeName] of Object.entries(types)) {
                    this.chattingProtoMessages[packetName][type] = root.lookupType(typeName);
                }
            }

            console.log('ChattingServer Protobuf 파일을 로드 했습니다.');
        } catch (err) {
            console.error('ChattingServer Protobuf 파일 로드 중 오류가 발생', err);
        }
    }

    getProtoMessages() {
        return { ... this.chattingProtoMessages };
    }

    clientConnection(socket: net.Socket) {
        const customSocket = socket as CustomSocket;

        console.log(
            `Chatting Client Connected from: ${customSocket.remoteAddress}:${customSocket.remotePort}`
        );

        customSocket.id = uuidv4();
        customSocket.buffer = Buffer.alloc(0);

        customSocket.on('data', chattingOnData(customSocket));
        customSocket.on('end', chattingOnEnd(customSocket));
        customSocket.on('error', chattingOnError(customSocket));
    }

    listen() {
        this.server.listen(config.chattingServer.chattingServerPort, config.server.host, () => {
            console.log(
                `채팅 서버가 [${config.server.host}:${config.chattingServer.chattingServerPort}] 에서 실행 중입니다.`
            );
            console.log(this.server.address());
        })
    }

    start() {
        this.initializeProto();

        this.listen();

        this.update();
    }

    update() {
        const now = performance.now();

        // elapsed는 현재 시간과 마지막 실행 시간 사이의 경과 시간을 의미한다.
        // 예를 들어 this.updateTime이 16.67인데, 타이머가 약간 지연되어 17ms정도라면 elapsed는 17ms가 된다.
        const elapsed = now - this.lastExecutionTime;

        if (elapsed >= this.updateTime) {

            this.fps++;
            if (now - this.lastFpsTime >= 1000) {
                console.log(`FPS: ${this.fps} time : ${now - this.lastFpsTime}`);
                this.fps = 0;
                this.lastFpsTime = now;
            }

            // elapsed % this.updateTime은 elapsed와 this.updateTime 사이의 나머지 부분을 계산한다.
            // 예를 들어 목표 주기가 16.67ms 인데, 실제 실행 시간이 17ms인 경우
            // elapsed % this.updateTime은 17 % 16.67 이 되고, 결과 값은 0.33 이다.
            // 이 값은 타이머가 목표 시간(16.67ms)보다 0.33ms 만큼(17ms) 지연되었다는 것을 의미한다.    

            // now - (elapsed % this.updateTime) 는 실제 실행된 시간이 목표 주기를 초과한 만큼 보정한 값을 계산한다.
            // 다시말해, 지연된 시간을 제거해 정확한 주기로 작업을 실행할 수 있도록 기대하게 되는것
            this.lastExecutionTime = now - (elapsed % this.updateTime);
        }

        // this.updateTime은 update 함수가 실행되어야 하는 주기를 의미한다.        
        // now - this.lastExecutionTime은 현재 시간과 update함수를 호출했을때의 경과 시간을 나타낸다.
        // 즉 this.updateTime - (now - this.lastExecutionTime)은 현재까지의 경과 시간을 제외한 남은 시간을 의미한다.
        // 다시 말해 다음 업데이트까지 기다려야 할 시간을 게산해 저장해두는것                        
        const delay = this.updateTime - (now - this.lastExecutionTime); // 다음 실행을 위해 기다려야 할 시간을 의미

        // this.update가 16.67ms 라면 this.update는 16.67ms마다 실행되어야한다.
        // now - this.lastExecutionTime 이 10ms 즉, update 함수가 실행된 후 10ms가 지났다면
        // 다음 update함수는 6.67ms 이후에 실행되어야 한다. 왜냐면 update는 16.67ms 마다 실행이 되어야 하니까

        // 반대로 now - this.lastExecutionTime 이 20ms 라면,
        // 이미 16.67ms라는 주기를 넘어버렸으므로 음수 값이 나와 setTimeout을 즉시 실행 할 수 있도록 한다.
        setTimeout(() => this.update(), delay);
    }
}

export default ChattingServer;