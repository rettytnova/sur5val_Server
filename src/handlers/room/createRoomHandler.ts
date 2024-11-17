import net from "net"
import { sendPacket } from "../../packet/createPacket.js";
import { config } from "../../config/config.js";
import { getRedisData, getUserBySocket, setRedisData } from "../handlerMethod.js";
import { CreateRoomPayload, CustomSocket, RedisUserData, Room, User } from "../../interface/interface.js";

let gRoomId = 1;

export const createRoomHandler = async (socket: net.Socket, payload: Object) => {
    let failCode = 0;
    let success = true;

    const createRoomPayload = payload as CreateRoomPayload;

    const redisUserData: RedisUserData | null = await getUserBySocket(socket as CustomSocket);
    if (!redisUserData) {
        success = false;
        failCode = 4;
    }
    else {
        // 클라로부터 받은 roomName과 maxUserNum이 undefine과 null이 아닐 경우        
        if ((!createRoomPayload.name || !createRoomPayload.maxUserNum)) {
            success = false;
            failCode = 4;
        }
        else {
            const user: User = {
                id: redisUserData?.id,
                nickName: redisUserData?.nickName,
                character: redisUserData?.character
            }

            let existRoom = false;

            const users: User[] = [];
            users.push(user);

            const rooms = await getRedisData('roomData');           
            if (!rooms) {
                const newRoom: Room[] = [{
                    id: gRoomId,
                    ownerId: user.id,
                    name: createRoomPayload.name,
                    maxUserNum: createRoomPayload.maxUserNum,
                    state: 0,
                    users: users
                }]

                await setRedisData('roomData', newRoom);
            }
            else {
                // 방을 이미 만들었는지 검사
                for (let i = 0; i < rooms.length; i++) {
                    if (rooms[i].ownerId === user.id) {
                        existRoom = true;
                        break;
                    }
                }

                if (existRoom === false) {
                    const newRoom: Room = {
                        id: gRoomId,
                        ownerId: user.id,
                        name: createRoomPayload.name,
                        maxUserNum: createRoomPayload.maxUserNum,
                        state: 0,
                        users: users
                    }

                    rooms.push(newRoom);

                    await setRedisData('roomData', rooms);

                    gRoomId++;
                }
                else {
                    success = false;
                    failCode = 4;
                }
            }
        }
    }

    sendPacket(socket, config.packetType.CREATE_ROOM_RESPONSE, {
        success,
        room: createRoomPayload.name,
        failCode
    });
}