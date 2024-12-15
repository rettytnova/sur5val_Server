import { CustomSocket } from "../../gameServer/interface/interface.js";

export const chattingOnError = (socket: CustomSocket) => (err: Error) => {
    console.error(`chattingServer Socket error ${socket.remoteAddress}:${socket.remotePort} [${err.message}] `);
}