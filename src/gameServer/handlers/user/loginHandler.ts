import { CustomSocket, LoginRequest, LoginResponse, Room } from '../../interface/interface.js';
import jwt, { SignOptions } from 'jsonwebtoken';
import { sendPacket } from '../../../packet/createPacket.js';
import { config } from '../../../config/config.js';
import { dbManager } from '../../../database/user/user.db.js';
import { GlobalFailCode, PhaseType, RoleType } from '../enumTyps.js';
import { socketSessions } from '../../session/socketSession.js';
import { inGameTimeSessions } from '../../session/inGameTimeSession.js';
import Server from '../../class/server.js';
import bcrypt from 'bcrypt';
import UserSessions from '../../class/userSessions.js';
import GameRoom from '../../class/room.js';
import PositionSessions from '../../class/positionSessions.js';
import { convertSendRoomData } from '../handlerMethod.js';

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
export const loginHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
  const { email, password } = payload as LoginRequest;

  let responseData: LoginResponse = {
    success: true,
    message: '',
    token: '',
    myInfo: null,
    failCode: GlobalFailCode.NONE
  };

  const userByEmail: any = await dbManager.findUserByEmail(email);
  try {
    // 유효성 검사 ----------------------------------------------------------------------
    // 이메일 유효성 검사

    if (!userByEmail) {
      responseData.success = false;
      responseData.message = '이 유저는 존재하지 않습니다.';
      responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
      throw new Error(responseData.message);
    }

    // 비밀번호 유효성 검사 (bcrypt 비교)
    const isPasswordValid = await bcrypt.compare(password, userByEmail.password);
    if (!isPasswordValid) {
      responseData.success = false;
      responseData.message = '비밀번호를 틀렸습니다.';
      responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
      throw new Error(responseData.message);
    }

    // 이미 로그인 했는지 확인
    const users: UserSessions[] | null = Server.getInstance().getUsers();
    if (users) {
      const userData = users.find((userData: UserSessions) => userData.getId() === userByEmail.id);
      if (userData) {
        responseData.success = false;
        responseData.message = '이미 로그인한 유저입니다.';
        responseData.failCode = GlobalFailCode.AUTHENTICATION_FAILED;
        console.error(responseData.message);
        return;
      }
    }

    // 로그인 처리 ----------------------------------------------------------------------
    // 토큰 생성
    const options: SignOptions = { expiresIn: '30m', algorithm: 'HS256' };
    const refreshOptions: SignOptions = { expiresIn: '7d', algorithm: 'HS256' };
    let accessToken = jwt.sign(userByEmail, jwtToken.secretKey as string, options);
    let refreshToken = jwt.sign(userByEmail, jwtToken.secretKey as string, refreshOptions);

    // 클라이언트에 보낼 데이터 정리
    responseData.message = '로그인에 성공 했습니다.';
    responseData.token = accessToken;
    responseData.myInfo = {
      id: userByEmail.id as number,
      email: userByEmail.email as string,
      nickname: userByEmail.nickname as string,
      character: {
        characterType: 0,
        roleType: RoleType.SUR5VAL,
        aliveState: true,
        coolDown: 0,
        level: 1,
        maxExp: 0,
        exp: 0,
        gold: 20,
        maxHp: 0,
        hp: 0,
        mp: 0,
        attack: 0,
        armor: 0,
        weapon: 0,
        potion: 0,
        stateInfo: {
          state: 0,
          nextState: 0,
          nextStateAt: 0,
          stateTargetUserId: 0
        },
        equips: [],
        debuffs: [],
        handCards: []
      }
    };

    const newGameUser = new UserSessions(responseData.myInfo);
    Server.getInstance().getUsers().push(newGameUser);

    socketSessions[userByEmail.id] = socket;

    console.info(
      `로그인 성공 id : ${userByEmail.id} email : ${userByEmail.email} 로그인 중인 클라 ${Server.getInstance().getUsers().length}`
    );
  } catch (error) {
    console.error(`loginRequestHandler ${error as Error}`);
  }

  // 클라이언트에 데이터 보내기
  sendPacket(socket, packetType.LOGIN_RESPONSE, responseData);

  const rooms = Server.getInstance().getRooms();
  const room = rooms.find((room: GameRoom) =>
    room.getUsers().some((roomUser: UserSessions) => roomUser.getId() === userByEmail.id)
  );
  if (room) {
    const initGameInfo = Server.getInstance().initGameInfo;
    if (!initGameInfo) {
      return;
    }
    const inGameTime = initGameInfo[0].normalRoundTime;
    const normalRound = initGameInfo[0].normalRoundNumber;
    const leftTime = (inGameTime * normalRound - (Date.now() - inGameTimeSessions[room.getRoomId()])) % inGameTime;
    const characterPositions = Server.getInstance().getPositions();
    if (characterPositions.length > 0) {
      const characterPosition = characterPositions.find(
        (characterPosition: PositionSessions) => characterPosition.getPositionRoomId() === room.getRoomId()
      );
      if (!characterPosition) {
        return;
      }
      const roomData: Room = convertSendRoomData(room);
      const gameStateData = { phaseType: PhaseType.NORMAL_ROUND_1, nextPhaseAt: Date.now() + leftTime };
      const notifiData = {
        gameState: gameStateData,
        users: roomData.users,
        characterPositions: characterPosition.getCharacterPositions()
      };

      sendPacket(socket, config.packetType.GAME_START_NOTIFICATION, notifiData);
      sendPacket(socket, config.packetType.USER_UPDATE_NOTIFICATION, {
        user: roomData.users
      });
    } else {
      console.error('characterPositions데이터를 찾지 못하였습니다.');
    }
  }
};
