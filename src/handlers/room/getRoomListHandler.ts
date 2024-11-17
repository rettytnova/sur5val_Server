import net from "net"
import { getRooms, getUserBySocket } from "../handlerMethod.js"
import { CustomSocket, RedisUserData } from "../../interface/interface.js";
import { sendPacket } from "../../packet/createPacket.js";
import { config } from "../../config/config.js";

export const getRoomListHandler = async (socket: net.Socket, payload: Object) => {    
    const rooms = await getRooms();
    if (!rooms) {
        console.error("getRoomListHandler 방 목록을 찾을 수 없음");     
        return;   
    }
    
    sendPacket(socket, config.packetType.GET_ROOM_LIST_RESPONSE, { rooms });
}