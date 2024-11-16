import { CustomSocket, UserData } from '../../interface/interface.js';
import jwt, { SignOptions } from 'jsonwebtoken';
import { sendPacket } from '../../packet/createPacket.js';
import { config } from '../../config/config.js';
import { getRedis } from '../../database/redis.js';
import { getRedisData, setRedisData } from '../../handlers/handlerMethod.js';
import { dbManager } from '../../database/user/user.db.js';
import { GlobalFailCode } from '../enumTyps.js';
import { timeConversion } from '../../utils/utils.js';
import {
  LoginRequest,
  LoginResponse,
  RedisResponse,
  CharacterData,
} from '../../interface/interface.js';

const { jwtToken, packetType } = config;

/***
 * - 로그인 요청(request) 함수
 *
 * 클라이언트에서 받은 로그인 정보를 통해 사용자를 인증(대소문자 구분)하고, 성공 시 JWT 토큰을 발급해주는 함수.
 *
 * @param {CustomSocket} socket - 요청 데이터의 소켓
 * @param {Object} param.payload - 요청 데이터의 페이로드
 * @returns {Promise<void>} 별도의 반환 값은 없으며, 성공 여부와 메시지를 클라이언트에게 전송.
 */
export const loginHandler = async (
  socket: CustomSocket,
  payload: Object,
): Promise<void> => {
  const { email, password } = payload as LoginRequest;
  // 데이터 초기화 ----------------------------------------------------------------------
  let responseData: LoginResponse = {
    success: true,
    message: '',
    token: '',
    myInfo: null,
    failCode: GlobalFailCode.NONE,
  };

  try {
    // 유효성 검사 ----------------------------------------------------------------------
    // 이메일 유효성 검사
    const userByEmail: any = await dbManager.findUserByEmail(email);
    if (!userByEmail) {
      responseData.success = false;
      responseData.message = '이 유저는 존재하지 않습니다.';
      responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
      throw new Error(responseData.message);
    }

    // 비밀번호 유효성 검사
    const userByEmailPw: any = await dbManager.findUserByEmailPw(
      email,
      password,
    );
    if (!userByEmailPw) {
      responseData.success = false;
      responseData.message = '비밀번호를 틀렸습니다.';
      responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
      throw new Error(responseData.message);
    }

    // 이미 로그인 했는지 Redis의 캐싱 기록 검사
    const userDatas: RedisResponse[] = await getRedisData('userData');
    if (userDatas) {
      const userData = userDatas.find(
        (userData: any) => userData.myInfo.id === userByEmailPw.id,
      );
      if (userData) {
        responseData.success = false;
        responseData.message = '이미 로그인한 유저입니다.';
        responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
        throw new Error(responseData.message);
      }
    }

    // 로그인 처리 ----------------------------------------------------------------------
    // 토큰 생성
    const options: SignOptions = { expiresIn: '30m', algorithm: 'HS256' };
    const refreshOptions: SignOptions = { expiresIn: '7d', algorithm: 'HS256' };
    let accessToken = jwt.sign(
      userByEmailPw,
      jwtToken.secretKey as string,
      options,
    );
    let refreshToken = jwt.sign(
      userByEmailPw,
      jwtToken.secretKey as string,
      refreshOptions,
    );

    // 클라이언트에 보낼 데이터 정리
    responseData.message = '로그인에 성공 했습니다.';
    responseData.token = accessToken;
    responseData.myInfo = {
      id: userByEmailPw.id as number,
      nickname: userByEmailPw.nickname as string,
      character: {
        roleType: 0,
        hp: 0,
        weapon: 0,
        stateInfo: 0,
        equips: null,
        debuffs: null,
        handCards: null,
        bbangCount: 0,
        handCardsCount: 0,
        socketId: 0,
      } as CharacterData,
    };

    // Redis에 보낼 데이터 정리
    const redisResponseData: RedisResponse = {
      myInfo: responseData.myInfo,
      refreshToken,
    };

    // Redis에 데이터 보내기
    if (!userDatas) {
      await setRedisData('userData', [redisResponseData]);
    } else {
      userDatas.push(redisResponseData);
      await setRedisData('userData', userDatas);
    }

    // 로그 처리 ----------------------------------------------------------------------
    console.info(`로그인 성공 : ${userByEmailPw.id}`);
  } catch (error) {
    console.error(`loginRequestHandler ${error as Error}`);
  }

  // 클라이언트에 데이터 보내기
  sendPacket(socket, packetType.LOGIN_RESPONSE, responseData);
};
// - 이후 다른 로직 구현시 특이사항
// 게임 종료시 Redis에 있는 유저 정보 삭제
// Access Token 및 Refresh Token 만료기간 갱신
