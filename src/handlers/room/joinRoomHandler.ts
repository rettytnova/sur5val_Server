import { config } from '../../config/config.js';
import { CustomSocket, joinRoomPayload } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { GlobalFailCode } from '../enumTyps.js';
import {
  getRedisData,
  getSocketByUser,
  getUserBySocket,
  setRedisData,
} from '../handlerMethod.js';

export const joinRoomHandler = async (
  socket: CustomSocket,
  payload: Object,
) => {
  // payload로 roomId가 옴
  let { roomId } = payload as joinRoomPayload;

  // redisClient.get 으로 roomdata들 가지고 오기
  const redisRoomDatas = await getRedisData('roomData');

  // 해당 id의 roomdata 찾기
  if (redisRoomDatas) {
    for (let i = 0; i < redisRoomDatas.length; i++) {
      if (redisRoomDatas[i].id === roomId) {
        // 존재하는 방 번호지만 인원이 꽉 차 있을 시 실패 response
        if (redisRoomDatas[i].maxUserNum <= redisRoomDatas[i].users.length) {
          const sendData = {
            success: 0,
            room: {},
            failCode: GlobalFailCode.JOIN_ROOM_FAILED,
          };
          sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
          return;
        }

        // userData가 존재하지 않는 오류 발생 시
        const userData = await getUserBySocket(socket);
        if (!userData) {
          console.error('요청한 클라이언트의 userData가 존재하지 않습니다.');
          const sendData = {
            success: 0,
            room: {},
            failCode: GlobalFailCode.JOIN_ROOM_FAILED,
          };
          sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
          return;
        }

        // 방 참가 성공 시 : 해당 유저의 정보를 roomData에 추가하고, 성공 response
        redisRoomDatas[i].users.push(userData);
        setRedisData('roomData', redisRoomDatas);

        const sendData = {
          success: 1,
          room: redisRoomDatas[i],
          failCode: GlobalFailCode.NONE,
        };
        sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);

        // 방에 있는 모든 인원에게 새로운 유저가 참가했다는 notification 전달 (본인 포함)
        for (let x = 0; x < redisRoomDatas[i].users.length; x++) {
          const roomUserSocket = await getSocketByUser(
            redisRoomDatas[i].users[x],
          );
          if (!roomUserSocket) {
            console.error('socket을 찾을 수 없습니다.');
            return;
          }

          sendPacket(roomUserSocket, config.packetType.JOIN_ROOM_NOTIFICATION, {
            joinUser: userData,
          });
        }
        break;
      }
    }
  } else {
    // 존재하지 않는 방 번호 요청 시 실패 response
    const sendData = {
      success: 0,
      room: {},
      failCode: GlobalFailCode.ROOM_NOT_FOUND,
    };
    sendPacket(socket, config.packetType.JOIN_ROOM_RESPONSE, sendData);
  }
};
