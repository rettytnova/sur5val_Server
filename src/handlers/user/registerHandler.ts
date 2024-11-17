import { CustomSocket } from '../../interface/interface.js';
import { sendPacket } from '../../packet/sendPacket.js';
import { config } from '../../config/config.js';
import { dbManager } from '../../database/user/user.db.js';
import { GlobalFailCode } from '../enumTyps.js';
import {
  RegisterRequest,
  RegisterResponse,
} from '../../interface/interface.js';

const { packetType } = config;

/**
 * - 회원가입 요청(request) 함수
 *
 * 클라이언트에서 받은 회원가입 정보를 등록해주는 함수.
 *
 * @param {CustomSocket} socket - 요청 데이터의 소켓
 * @param {Object} param.payload - 요청 데이터의 페이로드
 * @returns {Promise<void>} 별도의 반환 값은 없으며, 성공 여부와 메시지를 클라이언트에게 전송.
 */
export const registerHandler = async (
  socket: CustomSocket,
  payload: Object,
): Promise<void> => {
  // 데이터 초기화 ----------------------------------------------------------------------
  const { nickname, password, email } = payload as RegisterRequest;
  let responseData: RegisterResponse = {
    success: true,
    message: '',
    failCode: GlobalFailCode.NONE,
  };

  try {
    // 유효성 검사 ----------------------------------------------------------------------
    // 비밀번호 유효성 검사
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?!.*[ㄱ-ㅎ가-힣]).{6,}$/;
    if (!passwordRegex.test(password)) {
      responseData.success = false;
      responseData.message =
        '비밀번호는 최소 대문자 1개와 특수문자 1개를 포함해야 하며, 한글을 포함할 수 없고, 최소 6자 이상이어야 합니다.';
      responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
      throw new Error(responseData.message);
    }

    // 닉네임 유효성 검사
    const userByNickname = await dbManager.findUserByNickname(nickname);
    if (userByNickname) {
      responseData.success = false;
      responseData.message = '이 닉네임은 이미 사용되고 있습니다.';
      responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
      throw new Error(responseData.message);
    }

    // 이메일 유효성 검사
    const userByEmail = await dbManager.findUserByEmail(email);
    if (userByEmail) {
      responseData.success = false;
      responseData.message = '이 이메일은 이미 사용되고 있습니다.';
      responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
      throw new Error(responseData.message);
    }

    // 회원가입 처리 ----------------------------------------------------------------------
    // AWS에 데이터 보내기
    const newUser = await dbManager.createUser(nickname, email, password);

    // 로그 처리 ----------------------------------------------------------------------
    responseData.message = '회원가입을 완료했습니다.';
    console.info(`회원가입 완료: ${newUser.insertId}`);
  } catch (error) {
    console.error(`registerRequestHandler ${error as Error}`);
  }

  // 클라이언트에 데이터 보내기
  sendPacket(socket, packetType.REGISTER_RESPONSE, responseData);
};
