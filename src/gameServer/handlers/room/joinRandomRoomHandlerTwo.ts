import Server from '../../class/server.js';
import { config } from '../../../config/config.js';
import { CustomSocket } from '../../interface/interface.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';
import GameRoom from '../../class/room.js';
import { getUserBySocket } from '../handlerMethod.js';
import UserSessions from '../../class/userSessions.js';
import { socketSessions } from '../../session/socketSession.js';

export const joinRandomRoomHandlerTwo = async (socket: CustomSocket) => {
    const rooms = Server.getInstance().getRooms();
    if (!rooms) {
        return;
    }

    const user = getUserBySocket(socket);
    if (!user) {
        console.error('요청한 클라이언트의 userData가 존재하지 않습니다.');
        const sendData = {
            success: false,
            room: {},
            failCode: GlobalFailCode.JOIN_ROOM_FAILED
        };
        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
        return;
    }

    const isAleadyJoinRoom = rooms.find((room: GameRoom) => room.getUsers().find((roomUser: UserSessions) => roomUser.getId() === user.getId()));
    if (isAleadyJoinRoom) {
        console.error('이미 참여중인 방이 존재합니다.');
        const sendData = {
            success: false,
            room: {},
            failCode: GlobalFailCode.JOIN_ROOM_FAILED
        };
        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
    }

    let roomFound = false;
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].getRoomMaxUser() > rooms[i].getUsers().length) {
            if (rooms[i].getRoomState() !== RoomStateType.WAIT) {
                const sendData = {
                    success: false,
                    room: {},
                    failCode: GlobalFailCode.JOIN_ROOM_FAILED
                };
                sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
                return;
            }

            rooms[i].getUsers().push(user);

            Server.getInstance().chattingServerSend(
                config.chattingPacketType.CHATTING_JOIN_ROOM_REQUEST, { email: user.getEmail(), ownerEmail: rooms[i].getRoomOwnerEmail() });

            const sendData = {
                success: true,
                room: rooms[i],
                failCode: GlobalFailCode.NONE
            };

            sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, sendData);

            for (let j = 0; j < rooms[i].getUsers().length; j++) {
                const roomUser = rooms[i].getUsers()[j];

                sendPacket(socketSessions[roomUser.getId()], config.packetType.JOIN_ROOM_NOTIFICATION, {
                    joinUser: roomUser
                });
            }

            roomFound = true;
            break;
        }
    }

    if (!roomFound) {
        const sendData = {
            success: false,
            room: {},
            failCode: GlobalFailCode.ROOM_NOT_FOUND
        };
        sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, sendData);
    }
    else {
        const sendData = {
            success: false,
            room: {},
            failCode: GlobalFailCode.ROOM_NOT_FOUND
        };
        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
    }
};
