import { sendPacket } from '../../../packet/createPacket.js';
import { config } from '../../../config/config.js';
import { getUserBySocket } from '../handlerMethod.js';
import { CustomSocket } from '../../interface/interface.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';
import Server from '../../class/server.js';

export const getRoomListHandlerTwo = async (socket: CustomSocket) => {
    const rooms = Server.getInstance().getRooms();

    //console.log("방 목록 요청");    

    const user = getUserBySocket(socket);
    if (!user) {
        console.log("getRoomListHandlerTwo user없음")
        return;
    }

    for (let i = 0; i < rooms.length; i++) {
        for (let j = 0; j < rooms[i].getUsers().length; j++) {
            if (rooms[i].getUsers()[j].getId() === user.getId()
                && rooms[i].getRoomState() == RoomStateType.WAIT) {
                const sendData = {
                    success: true,
                    room: rooms[i],
                    failCode: GlobalFailCode.NONE
                };

                sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
            }
        }
    }

    const waitRooms = [];
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].getRoomState() === RoomStateType.WAIT) {
            waitRooms.push(rooms[i]);
        }
    }

    sendPacket(socket, config.packetType.GET_ROOM_LIST_RESPONSE, { rooms: waitRooms });
};
