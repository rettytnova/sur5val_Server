import { config } from '../../config/config.js';
import { CustomSocket, UseCardRequest, UseCardResponse, CardEffectNotification } from '../../interface/interface.js';
import { GlobalFailCode } from '../enumTyps.js';
import { sendPacket } from '../../packet/createPacket.js';
import { getUserBySocket } from '../../handlers/handlerMethod.js';

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
  const { cardType, targetUserId } = payload as UseCardRequest;
  let responseMessage: string = '';
  let responseData: UseCardResponse = {
    success: true,
    failCode: GlobalFailCode.NONE
  };
  let cardEffectNotificationData: CardEffectNotification = {
    cardType: 0,
    userId: 0,
    success: true
  };

  try {
    // 유효성 검사 ----------------------------------------------------------------------
    // 유효성 구현은 추후 생각해볼 문제

    // 카드 사용 성공 처리 ----------------------------------------------------------------------
    responseMessage = `카드 사용 성공 : ${cardType}`;
    const userData = await getUserBySocket(socket);
    cardEffectNotificationData = {
      cardType: cardType,
      userId: userData.id,
      success: true
    };

    // 로그 처리 ----------------------------------------------------------------------
    console.info(responseMessage);
  } catch (error) {
    console.error(`useCardHandler ${error as Error}`);
  }

  // 클라이언트(자기 자신)에 데이터 보내기
  sendPacket(socket, packetType.USE_CARD_RESPONSE, responseData);

  // 클라이언트(자신 제외)에 데이터 보내기
  sendPacket(socket, packetType.CARD_EFFECT_NOTIFICATION, cardEffectNotificationData);
};
