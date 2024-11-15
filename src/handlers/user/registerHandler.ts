import net from 'net';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { findUserById, createUser } from '../../database/user/user.db.js';
import { GlobalFailCode } from '../../utils/enumTyps.js';
import { getRedis } from '../../database/redis.js';

const { packetType } = config;

/* 회원가입 요청 페이로드 타입 정의 */
interface RegisterPayload {
  id: string;
  password: string;
  email: string;
}

/* 회원가입 응답 페이로드 타입 정의 */
interface RegisterResponse {
  success: boolean;
  message: string;
  failCode: number;
  userData?: object;
}

/**
 * - 회원가입 요청(request) 함수
 *
 * 클라이언트에서 받은 회원가입 정보를 등록해주는 함수.
 *
 * @param {net.Socket} socket - 요청 데이터의 소켓
 * @param {RegisterPayload} param.payload - 요청 데이터의 페이로드
 * @returns {Promise<void>} 회원가입 성공 여부와 메시지를 포함한 결과 반환 없음
 */
export const registerHandler = async (
  socket: net.Socket,
  payload: any,
): Promise<void> => {
  // 데이터 초기화
  const { id, password, email } = payload;
  let responseData: RegisterResponse = {
    success: true,
    message: '',
    failCode: GlobalFailCode.NONE,
  };

  try {
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

    // 아이디로 유저 조회
    const userByDB = await findUserById(id);
    if (userByDB) {
      responseData.success = false;
      responseData.message = '이미 존재하는 유저입니다.';
      responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
      throw new Error(responseData.message);
    }

    // 회원가입 처리
    if (responseData.success) {
      // AWS에 데이터 보내기
      const newUser = await createUser(id, email, password);

      // // Redis에 데이터 보내기
      // const redisClient = await getRedis();
      // await redisClient.set(
      //   `${newUser.insertId}`,
      //   `authID:${newUser.insertId}, password:${password}, email:${email}`,
      // );

      // 보낼 메세지 수정
      responseData.message = '회원가입을 완료했습니다.';

      // 서버에 로그 찍기
      console.info(`회원가입 완료: ${newUser.insertId}`);
    }
  } catch (error) {
    console.error(`registerRequestHandler ${error as Error}`);
  }

  // 클라이언트에 데이터 보내기
  sendPacket(socket, packetType.REGISTER_RESPONSE, responseData);
};
