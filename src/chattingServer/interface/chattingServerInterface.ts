import { CustomSocket } from "../../gameServer/interface/interface.js";

export class Job {
    public jobType: number;
    public payload: (string | number | boolean | object)[];
    constructor(jobType: number, ...payload: (string | number | boolean | object)[]) {
        this.jobType = jobType;
        this.payload = payload;
    }
}

export class SendPacketData {
    public socket: CustomSocket;
    public packet: Buffer;
    constructor(socket: CustomSocket, packet: Buffer) {
        this.socket = socket;
        this.packet = packet;
    }
}

export interface ChattingLoginRequestPayload {
    email: string;
}

export interface ChattingLoginResponse {
    success: boolean;
    message: string;
}

export interface ChattingCreateRoomPayload {
    email: string;
}

export interface ChattingLeaveRoomPayload {
    email: string;
}

export interface ChattingJoinRoomRequestPayload {
    email: string;
    ownerEmail: string;
}

export interface ChattingChatSendRequestPayload {
    chatMessage: string;
}