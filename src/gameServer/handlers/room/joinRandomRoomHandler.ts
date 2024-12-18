import Server from '../../class/server.js';
import { config } from '../../../config/config.js';
import { CustomSocket } from '../../interface/interface.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';
import GameRoom from '../../class/room.js';
import { convertSendRoomData, convertSendUserData, getRoomByUserId, getUserBySocket } from '../handlerMethod.js';
import { socketSessions } from '../../session/socketSession.js';

export const joinRandomRoomHandlerTwo = async (socket: CustomSocket) => {
    const joinRandomFailSendData = {
        success: false,
        room: {},
        failCode: GlobalFailCode.JOIN_ROOM_FAILED
    };

    const rooms = Server.getInstance().getRooms();
    if (!rooms) {
        console.log("joinRandomRoomHandler rooms가 없음");
        sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, joinRandomFailSendData);
        return;
    }

    if (rooms.length === 0) {
        console.log("joinRandomRoomHandler rooms count 0");
        sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, joinRandomFailSendData);
        return;
    }

    const user = getUserBySocket(socket);
    if (!user) {
        console.error('joinRandomRoomHandlerTwo user 없음');
        sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, joinRandomFailSendData);
        return;
    }

    const isAleadyJoinRoom = getRoomByUserId(user.getId());
    if (isAleadyJoinRoom) {
        console.error(`joinRandomRoomHandlerTwo 이미 참여중인 방이 존재합니다. id ${isAleadyJoinRoom.getRoomId()}`);
        sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, joinRandomFailSendData);
    }
    else {
        const randomRoom = rooms.find((room: GameRoom) => room.getRoomMaxUser() > room.getUsers().length);
        if (!randomRoom) {
            sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, joinRandomFailSendData);
            return;
        }

        if (randomRoom.getRoomState() !== RoomStateType.WAIT) {
            sendPacket(socket, config.packetType.JOIN_RANDOM_ROOM_RESPONSE, joinRandomFailSendData);
            return;
        }

        randomRoom.getUsers().push(user);

        const joinRandomSuccessSendData = {
            success: true,
            room: convertSendRoomData(randomRoom),
            failCode: GlobalFailCode.NONE
        }

        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, joinRandomSuccessSendData);

        Server.getInstance().chattingServerSend(
            config.chattingPacketType.CHATTING_JOIN_ROOM_REQUEST, { email: user.getEmail(), ownerEmail: randomRoom.getRoomOwnerEmail() });

        for (let i = 0; i < randomRoom.getUsers().length; i++) {
            const roomUser = randomRoom.getUsers()[i];
            if (!roomUser) {
                console.log("joinRandomRoomHandler roomUser를 찾을 수 없습니다.");
                break;
            }

            const roomUserSocket = socketSessions[roomUser.getId()];
            if (!roomUserSocket) {
                console.log("joinRandomRoomHandler roomUserSocket을 찾을 수 없습니다.");
                break;
            }

            sendPacket(roomUserSocket, config.packetType.JOIN_ROOM_NOTIFICATION,
                {
                    joinUser: convertSendUserData(user)
                }
            );
        }
    }
};
