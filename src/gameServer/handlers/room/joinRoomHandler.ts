import Server from '../../class/server.js';
import { config } from '../../../config/config.js';
import { CustomSocket, joinRoomPayload, } from '../../interface/interface.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { socketSessions } from '../../session/socketSession.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';
import { convertSendRoomData, convertSendUserData, getRoomByUserId, getUserBySocket } from '../handlerMethod.js';

export const joinRoomHandler = async (socket: CustomSocket, payload: Object) => {
    // payload로 roomId가 옴
    let { roomId } = payload as joinRoomPayload;

    console.log("roomId ", roomId);
    const rooms = Server.getInstance().getRooms();
    if (!rooms) {
        console.log("joinRoomHandler rooms가 없음");
        return;
    }

    if (rooms.length === 0) {
        console.log("joinRoomHandler rooms count 0");
        return;
    }

    const joinRoomFailSendData = {
        success: false,
        room: {},
        failCode: GlobalFailCode.JOIN_ROOM_FAILED
    };

    const user = getUserBySocket(socket);
    if (!user) {
        console.log("joinRoomHandler user 없음");
        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, joinRoomFailSendData);
        return;
    }

    const isAlreadyJoinRoom = getRoomByUserId(user.getId());
    if (isAlreadyJoinRoom) {
        console.error(`joinRoomHandler 이미 참여중인 방이 존재합니다. id ${isAlreadyJoinRoom.getRoomId()}`);
        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, joinRoomFailSendData);
        return;
    }
    else {
        const findRoom = Server.getInstance().getRoomByRoomId(roomId);
        // 참여하려는 방이 없으면 실패
        if (!findRoom) {
            sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, joinRoomFailSendData);
            return;
        }

        // 방 유저 인원이 꽉 차 있을 시 실패
        if (findRoom.getRoomMaxUser() <= findRoom.getUsers().length) {
            sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, joinRoomFailSendData);
            return;
        }

        if (findRoom.getRoomState() !== RoomStateType.WAIT) {
            sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, joinRoomFailSendData);
            return;
        }

        findRoom.getUsers().push(user);

        const joinRoomSuccessSendData = {
            success: true,
            room: convertSendRoomData(findRoom),
            failCode: GlobalFailCode.NONE
        }

        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, joinRoomSuccessSendData);

        Server.getInstance().chattingServerSend(
            config.chattingPacketType.CHATTING_JOIN_ROOM_REQUEST, { email: user.getEmail() }
        );

        for (let i = 0; i < findRoom.getUsers().length; i++) {
            const roomUser = findRoom.getUsers()[i];
            if (!roomUser) {
                console.log("joinRandomRoomHandler roomUser를 찾을 수 없습니다.");
                break;
            }

            const roomUserSocket = socketSessions[roomUser.getId()];
            if (!roomUserSocket) {
                console.error(`joinRoomHandler roomUserSocket을 찾을 수 없습니다.`);
                break;
            }

            sendPacket(roomUserSocket, config.packetType.JOIN_ROOM_NOTIFICATION,
                {
                    joinUser: convertSendUserData(user)
                }
            )
        }
    }
};
