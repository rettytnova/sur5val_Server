import Server from '../../class/server.js';
import { config } from '../../../config/config.js';
import { CustomSocket, joinRoomPayload, Room, User } from '../../interface/interface.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { socketSessions } from '../../session/socketSession.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';
import { getUserBySocket } from '../handlerMethod.js';
import GameRoom from '../../class/room.js';

export const joinRoomHandlerTwo = async (socket: CustomSocket, payload: Object) => {
    // payload로 roomId가 옴
    let { roomId } = payload as joinRoomPayload;

    const rooms = Server.getInstance().getRooms();
    if (!rooms) {
        return;
    }

    const user = getUserBySocket(socket);
    if (!user) {
        console.log("joinRoomHandlerTwo user 없음");
        const sendData = {
            success: false,
            room: {},
            failCode: GlobalFailCode.JOIN_ROOM_FAILED
        }
        sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, sendData);
        return;
    }

    for (let i = 0; i < rooms.length; i++) {
        for (let j = 0; j < rooms[i].getUsers().length; j++) {
            if (rooms[i].getUsers()[j].getId() === user.getId()) {
                console.error('이미 참여중인 방이 존재');
                const sendData = {
                    success: false,
                    room: {},
                    failCode: GlobalFailCode.JOIN_ROOM_FAILED
                };
                sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, sendData);
                return;
            }
        }
    }

    let findRoom: GameRoom | null = null;

    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].getRoomId() === roomId) {
            findRoom = rooms[i];
            if (findRoom.getRoomMaxUser() <= findRoom.getUsers().length) {
                const sendData = {
                    success: false,
                    room: {},
                    failCode: GlobalFailCode.JOIN_ROOM_FAILED
                };

                sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, sendData);
                return;
            }

            if (findRoom.getRoomState() !== RoomStateType.WAIT) {
                const sendData = {
                    success: false,
                    room: {},
                    failCode: GlobalFailCode.JOIN_ROOM_FAILED
                };

                sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, sendData);
                return;
            }


            findRoom.getUsers().push(user);

            const sendData = {
                success: true,
                room: findRoom,
                failCode: GlobalFailCode.NONE
            }
            sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);

            Server.getInstance().chattingServerSend(
                config.chattingPacketType.CHATTING_JOIN_ROOM_REQUEST, { email: user.getEmail(), ownerEmail: findRoom.getRoomOwnerEmail() }
            );

            for (let j = 0; j < findRoom.getUsers().length; j++) {
                for (let k = 0; k < findRoom.getUsers().length; k++) {
                    sendPacket(socketSessions[findRoom.getUsers()[k].getId()], config.packetType.JOIN_ROOM_NOTIFICATION, {
                        joinUser: user
                    });
                }
            }

            break;
        }
    }

    if (findRoom === null) {
        // 존재하지 않는 방 번호 요청 시 실패 response
        const sendData = {
            success: false,
            room: {},
            failCode: GlobalFailCode.ROOM_NOT_FOUND
        };
        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
    }
};
