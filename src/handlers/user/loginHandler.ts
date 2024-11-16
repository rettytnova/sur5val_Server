import { CustomSocket } from '../../interface/interface.js';
import jwt, { SignOptions } from 'jsonwebtoken';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { getRedis } from '../../database/redis.js';
import {
  findUserByEmail,
  findUserByEmailPw,
} from '../../database/user/user.db.js';
import { GlobalFailCode } from '../../utils/enumTyps.js';
import { timeConversion } from '../../utils/utils.js';

const { jwtToken, packetType } = config;

/* 로그인 응답 페이로드 타입 정의 */
interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  userData?: object;
  failCode: number;
}

/* 레디스 타입 정의 */
interface RedisResponse extends LoginResponse {
  refreshToken: string;
}

/***
 * - 로그인 요청(request) 함수
 *
 * 클라이언트에서 받은 로그인 정보를 통해 사용자를 인증(대소문자 구분)하고, 성공 시 JWT 토큰을 발급해주는 함수.
 *
 * @param {CustomSocket} socket - 요청 데이터의 소켓
 * @param {string} param.payload.email  - 유저의 email
 * @param {string} param.payload.password - 유저의 비밀번호
 * @returns {void} 별도의 반환 값은 없으며, 성공 여부와 메시지를 클라이언트에게 전송.
 */
export const loginHandler = async (
  socket: CustomSocket,
  payload: any,
): Promise<void> => {
  const { email, password } = payload;
  // 데이터 초기화
  let responseData: LoginResponse = {
    success: true,
    message: '',
    token: '',
    failCode: GlobalFailCode.NONE,
  };

  try {
    // 이메일 유효성 검사
    const userByEmail: any = await findUserByEmail(email);
    if (!userByEmail) {
      responseData.success = false;
      responseData.message = '이 유저는 존재하지 않습니다.';
      responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
      throw new Error(responseData.message);
    }

    // 비밀번호 유효성 검사
    const userByEmailPw: any = await findUserByEmailPw(email, password);
    if (!userByEmailPw) {
      responseData.success = false;
      responseData.message = '비밀번호를 틀렸습니다.';
      responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
      throw new Error(responseData.message);
    } else {
      // 이미 로그인 했는지 Redis의 캐싱 기록 검사
      const redisClient = await getRedis();
      redisClient.get(userByEmailPw.insertId);
      const alreadyUser = false; // 세션에 있는 아이디와 비교 필요
      console.warn('세션에 있는 아이디와 비교 필요(세션 추가되면 수정)');
      if (alreadyUser) {
        responseData.success = false;
        responseData.message = '이미 로그인되어 있는 계정입니다.';
        responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
        throw new Error(responseData.message);
      }
    }

    // 토큰 생성
    const options: SignOptions = { expiresIn: '30m', algorithm: 'HS256' };
    const refreshOptions: SignOptions = { expiresIn: '7d', algorithm: 'HS256' };
    let token = jwt.sign(userByEmailPw, jwtToken.secretKey as string, options);
    let refreshToken = jwt.sign(
      userByEmailPw,
      jwtToken.secretKey as string,
      refreshOptions,
    );
    responseData.token = token;

    console.log('userByEmailPw: ', userByEmailPw);

    // response 데이터
    responseData.message = '로그인에 성공 했습니다.';
    responseData.userData = {
      id: userByEmailPw.seq_no as number,
      nickname: userByEmailPw.nickname as string,
      character: null,
    };

    // 세션에 유저 정보 추가 필요
    console.warn('세션에 유저 정보 추가 필요(세션 추가되면 수정)');

    // 레디스에 유저 정보 추가
    const redisResponseData: RedisResponse = {
      ...responseData,
      refreshToken,
    };
    const redis = await getRedis();
    await redis.set(
      `user:${userByEmailPw.seq_no}:${socket.id}:accessToken`,
      JSON.stringify(redisResponseData),
      'EX',
      timeConversion(jwtToken.refreshExpiresIn as string) + 60,
    );
    console.info(`로그인 성공 : ${userByEmailPw.insertId}`);
  } catch (error) {
    console.error(`loginRequestHandler ${error as Error}`);
  }

  // 클라이언트에 데이터 보내기
  sendPacket(socket, packetType.LOGIN_RESPONSE, responseData);
};
