import { config } from '../../config/config.js';
import {
  CustomSocket,
  UseCardRequest,
  UseCardResponse,
  UseCardNotification,
  UserUpdateNotification,
  Room
} from '../../interface/interface.js';
import { CardType, GlobalFailCode } from '../enumTyps.js';
import { sendPacket } from '../../packet/createPacket.js';
import { getRoomByUserId, getUserBySocket } from '../../handlers/handlerMethod.js';
import { socketSessions } from '../../session/socketSession.js';

const { packetType } = config;
/***
 * - 카드 사용 요청(request) 함수
 *
 * 클라이언트에서 받은 로그인 정보를 통해 사용자를 인증(대소문자 구분)하고, 성공 시 JWT 토큰을 발급해주는 함수.
 *
 * @param {CustomSocket} socket - 요청 데이터의 소켓
 * @param {Object} param.payload - 요청 데이터의 페이로드
 * @returns {Promise<void>} 별도의 반환 값은 없으며, 성공 여부와 메시지를 클라이언트에게 전송.
 */
export const useCardHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
  // response 데이터 초기화 ----------------------------------------------------------------------
  const { cardType, targetUserId: targetUserIdRaw } = payload as UseCardRequest;
  const targetUserId = Number(targetUserIdRaw);
  let responseMessage: string = '';
  let responseData: UseCardResponse = {
    success: true,
    failCode: GlobalFailCode.NONE
  };

  try {
    // 유효성 검사 ----------------------------------------------------------------------
    // 유효성 구현은 추후 생각해볼 문제

    // 카드 사용 성공 처리 ----------------------------------------------------------------------
    responseMessage = `카드 사용 성공 : ${cardType}`;
    const userData = await getUserBySocket(socket);
    const room = await getRoomByUserId(userData.id);
    if (!room) {
      console.error('useCardHandler: room not found');
      return;
    }
    const useCardNotificationData: UseCardNotification = {
      cardType: cardType,
      userId: userData.id,
      targetUserId: targetUserId
    };

    switch (cardType) {
      case CardType.BBANG:
        sendUseCardNotification(useCardNotificationData, room);
        const userIndex = room.users.findIndex((user) => user.id === userData.id);
        const targetUserIndex = room.users.findIndex((user) => user.id === targetUserId);
        if (userIndex === -1) {
          console.error('useCardHandler: user not found');
          return;
        }
        if (targetUserIndex === -1) {
          console.error('useCardHandler: user not found');
          return;
        }
        // // 빵야 사용자
        room.users[userIndex].character.hp -= 1;
        // // 빵야 타겟
        room.users[targetUserIndex].character.hp -= 1;

        sendUserUpdateNotification(room);
        break;
      case CardType.BIG_BBANG:
        break;
      case CardType.SHIELD:
        break;
      case CardType.VACCINE:
        break;
      case CardType.CALL_119:
        break;
      case CardType.DEATH_MATCH:
        break;
      case CardType.GUERRILLA:
        break;
      case CardType.HALLUCINATION:
        break;
      case CardType.ABSORB:
        break;
      case CardType.FLEA_MARKET:
        break;
      case CardType.MATURED_SAVINGS:
        break;
      case CardType.WIN_LOTTERY:
        break;
      case CardType.SNIPER_GUN:
        break;
      case CardType.HAND_GUN:
        break;
      case CardType.DESERT_EAGLE:
        break;
      case CardType.AUTO_RIFLE:
        break;
      case CardType.LASER_POINTER:
        break;
      case CardType.RADAR:
        break;
      case CardType.AUTO_SHIELD:
        break;
      case CardType.STEALTH_SUIT:
        break;
      case CardType.CONTAINMENT_UNIT:
        break;
      case CardType.SATELLITE_TARGET:
        break;
      case CardType.BOMB:
        break;
      default:
        break;
    }

    // // 방에있는 유저들에게 notifi 보내기
    // for (let i = 0; i < room.users.length; i++) {
    //   if (room.users[i].character.roleType != 2) {
    //     const userSocket = await getSocketByUser(room.users[i]);
    //     if (!userSocket) {
    //       console.error('useCardHandler: socket not found');
    //       return;
    //     }
    //     sendPacket(userSocket, config.packetType.USE_CARD_NOTIFICATION, useCardNotificationData);
    //   }
    // }
    //sendPacket(socket, config.packetType.USE_CARD_NOTIFICATION, useCardNotificationData);
    // 로그 처리 ----------------------------------------------------------------------
    console.info(responseMessage);
  } catch (error) {
    console.error(`useCardHandler ${error as Error}`);
  }

  // 클라이언트(자기 자신)에 데이터 보내기
  //sendPacket(socket, packetType.USE_CARD_RESPONSE, responseData);
};

/** 방에있는 유저들에게 카드 사용 알림 보내기
 * @param {UseCardNotification} useCardNotificationData - 카드 사용 알림 데이터
 * @param {Room} room - 방 데이터
 */
const sendUseCardNotification = (useCardNotificationData: UseCardNotification, room: Room) => {
  const sockets = Object.values(socketSessions);
  for (const socket of sockets) {
    sendPacket(socket, config.packetType.USE_CARD_NOTIFICATION, useCardNotificationData);
  }
};

const sendUserUpdateNotification = (room: Room) => {
  const userUpdateNotificationData: UserUpdateNotification = {
    user: room.users
  };
  const sockets = Object.values(socketSessions);
  for (const socket of sockets) {
    sendPacket(socket, config.packetType.USER_UPDATE_NOTIFICATION, userUpdateNotificationData);
  }
};
