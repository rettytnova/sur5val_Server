import net from 'net';
import { convertSendRoomData, getRoomByUserIdTwo, getUserBySocket } from '../handlerMethod.js';
import { CustomSocket } from '../../interface/interface.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { config } from '../../../config/config.js';
import { GlobalFailCode, RoomStateType } from '../enumTyps.js';
import { socketSessions } from '../../session/socketSession.js';
import Server from '../../class/server.js';
import UserSessions from '../../class/userSessions.js';
import GameRoom from '../../class/room.js';

export const leaveRoomHandlerTwo = async (socket: net.Socket) => {
    const leaveRoomFailSendData = {
        success: false,
        failCode: GlobalFailCode.LEAVE_ROOM_FAILED
    }

    const user = getUserBySocket(socket as CustomSocket);
    if (!user) {
        console.log('leaveRoomHandlerTwo user 없음');
        sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, leaveRoomFailSendData);
        return;
    }

    const leaveRoom = getRoomByUserIdTwo(user.getId());
    if (!leaveRoom) {
        console.log('leaveRoomHandlerTwo 방에 참여중이 아님');
        sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, leaveRoomFailSendData);
        return;
    }

    if (leaveRoom.getUsers().length === 0) {
        console.log('방에 유저가 없는데 방 나가기 시도함')
        sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, leaveRoomFailSendData);
        return;
    }

    if (leaveRoom.getRoomState() !== RoomStateType.WAIT) {
        return;
    }

    // 방에서 해당 유저 삭제
    const remainUsers = leaveRoom.getUsers().filter((roomUser: UserSessions) => roomUser.getId() !== user.getId());
    leaveRoom.setUsers(remainUsers);

    if (remainUsers.length > 0) {
        // 나가는 유저가 방장일 경우 방장 변경
        if (leaveRoom.getRoomOwnerId() === user.getId()) {
            leaveRoom.setRoomOwnerId(leaveRoom.getUsers()[0].getId());
            leaveRoom.setRoomOwnerEmail(leaveRoom.getUsers()[0].getEmail());
        }
    }

    Server.getInstance().chattingServerSend(
        config.chattingPacketType.CHATTING_LEAVE_ROOM_REQUEST, { email: user.getEmail() }
    );

    const leaveRoomSuccessSendData = {
        success: true,
        room: convertSendRoomData(leaveRoom),
        failCode: GlobalFailCode.NONE
    };

    // 유저에게 success response 전달
    sendPacket(socket, config.packetType.LEAVE_ROOM_RESPONSE, leaveRoomSuccessSendData);

    // 모든 유저에게 해당 데이터 기반으로 업데이트
    for (let i = 0; i < leaveRoom.getUsers().length; i++) {
        const roomUser = leaveRoom.getUsers()[i];
        if (!roomUser) {
            console.log("leaveRoom roomUser 없음");
            break;
        }

        const roomUserSocket = socketSessions[roomUser.getId()];
        if (!roomUserSocket) {
            console.log("leaveRoom roomUserSocket 없음");
            break;
        }

        sendPacket(roomUserSocket, config.packetType.LEAVE_ROOM_NOTIFICATION,
            {
                userId: user.getId()
            }
        );

        const room = getRoomByUserIdTwo(roomUser.getId());
        if (room === null) {
            console.log("leaveRoom 참여중인 방이 없음");
            break;
        }

        const joinRoomSendData = {
            success: true,
            room: convertSendRoomData(room),
            failCode: GlobalFailCode.NONE
        };
        sendPacket(roomUserSocket, config.packetType.JOIN_ROOM_RESPONSE, joinRoomSendData);
    }

    if (remainUsers.length === 0) {
        const rooms = Server.getInstance().getRooms();
        const remainRooms = rooms.filter((room: GameRoom) => room.getRoomId() !== leaveRoom.getRoomId());
        Server.getInstance().setRooms(remainRooms);
    }
};
