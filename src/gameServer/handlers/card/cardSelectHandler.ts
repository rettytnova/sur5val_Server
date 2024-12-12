import { config } from '../../../config/config.js';
import { CustomSocket, CardSelectRequest, CardSelectResponse } from '../../../gameServer/interface/interface.js';
import { GlobalFailCode } from '../enumTyps.js';
import { sendPacket } from '../../../packet/createPacket.js';

const { packetType } = config;
/***
 * - 카드 선택 요청(request) 함수
 *
 * 클라이언트에서 받은 로그인 정보를 통해 사용자를 인증(대소문자 구분)하고, 성공 시 JWT 토큰을 발급해주는 함수.
 *
 * @param {CustomSocket} socket - 요청 데이터의 소켓
 * @param {Object} param.payload - 요청 데이터의 페이로드
 * @returns {Promise<void>} 별도의 반환 값은 없으며, 성공 여부와 메시지를 클라이언트에게 전송.
 */
export const cardSelectHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
  // response 데이터 초기화 ----------------------------------------------------------------------
  const { selectType, selectCardType } = payload as CardSelectRequest;
  let responseMessage: string = '';
  let responseData: CardSelectResponse = {
    success: true,
    failCode: GlobalFailCode.NONE
  };

  try {
    // 유효성 검사 ----------------------------------------------------------------------
    // 유효성 구현은 추후 생각해볼 문제

    // 카드 선택 처리 ----------------------------------------------------------------------
    responseMessage = `카드 선택 성공 : ${selectType}`;

    // 로그 처리 ----------------------------------------------------------------------
    console.info(responseMessage);
  } catch (error) {
    console.error(`useCardHandler ${error as Error}`);
  }

  // 클라이언트(자기 자신)에 데이터 보내기
  sendPacket(socket, packetType.CARD_SELECT_RESPONSE, responseData);
};
