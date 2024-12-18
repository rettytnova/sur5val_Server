import { sendPacket } from '../../../packet/createPacket.js';
import { config } from '../../../config/config.js';
import { convertSendRoomData, getRoomByUserIdTwo, getUserBySocket } from '../handlerMethod.js';
import { CustomSocket, Room } from '../../interface/interface.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';
import Server from '../../class/server.js';

export const getRoomListHandlerTwo = async (socket: CustomSocket) => {
    const rooms = Server.getInstance().getRooms();

    //console.log("방 목록 요청");    

    const user = getUserBySocket(socket);
    if (!user) {
        console.log("getRoomListHandlerTwo user 없음")
        return;
    }

    const room = getRoomByUserIdTwo(user.getId());
    if (room) {
        const sendRoomData = convertSendRoomData(room);
        const sendData = {
            success: true,
            room: sendRoomData,
            failCode: GlobalFailCode.NONE
        }

        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
        return;
    }

    const sendRooms: Room[] = [];
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].getRoomState() === RoomStateType.WAIT) {
            const sendRoomData = convertSendRoomData(rooms[i]);
            sendRooms.push(sendRoomData);
        }
    }

    sendPacket(socket, config.packetType.GET_ROOM_LIST_RESPONSE, { rooms: sendRooms });
};