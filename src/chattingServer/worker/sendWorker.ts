import { parentPort } from 'worker_threads';
import { SendPacketData } from "../interface/chattingServerInterface.js";
import { sendPacket } from '../../packet/createPacket.js';

class SendWorker {
    private sendQueue: SendPacketData[];
    constructor() {
        this.sendQueue = [];

        parentPort?.on('message', (sendPacketData: SendPacketData) => this.enquePacket(sendPacketData));
        this.send();
    }

    private enquePacket(sendPacketData: SendPacketData) {
        console.log(`sendWorker 패킷 인큐: ${sendPacketData.packetType}`);

        this.sendQueue.push(sendPacketData);
    }

    private send() {
        setInterval(() => {
            while (this.sendQueue.length > 0) {
                const packetData = this.sendQueue.shift(); // 큐에서 첫 번째 패킷 꺼냄
                if (packetData) {
                    //const { socket, packetType, data } = packetData;

                }
            }
        }, 100);
    }
}

new SendWorker();