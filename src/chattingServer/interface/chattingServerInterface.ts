import { CustomSocket } from "../../interface/interface.js";

export class Job {
    public jobType: number;
    public payload: (string | number | boolean | object)[];
    constructor(jobType: number, ...payload: (string | number | boolean | object)[]) {
        this.jobType = jobType;
        this.payload = payload;
    }
}

export class SendPacketData {
    //public socket: CustomSocket;
    public packetType: number;
    public data: Object;
    constructor(packetType: number, data: Object) {
        //this.socket = socket;
        this.packetType = packetType;
        this.data = data;
    }
}

export interface ChattingLoginRequestPayload {
    email: string;
}

export interface ChattingLoginResponse {
    success: boolean;
    message: string;
}

export interface ChattingCreateRoomRequestPayload {
    email: string;
}