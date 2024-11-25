import { config } from '../../config/config.js';
import {
  CustomSocket,
  UseCardRequest,
  UseCardResponse,
  Room,
  User,
  userStatusData
} from '../../interface/interface.js';
import { CardType, GlobalFailCode } from '../enumTyps.js';
import { sendPacket } from '../../packet/createPacket.js';
import { getRedisData, getUserBySocket, setRedisData } from '../../handlers/handlerMethod.js';
import { userUpdateNotification } from '../notification/userUpdate.js';

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
    const rooms = await getRedisData('roomData');
    let room: Room | undefined;
    for (let i = 0; i < rooms.length; i++) {
      for (let j = 0; j < rooms[i].users.length; j++) {
        if (rooms[i].users[j].id === userData.id) {
          room = rooms[i];
        }
      }
    }
    if (!room) {
      console.error('useCardHandler: room not found');
      return;
    }

    let target: User | null = null;
    for (let i = 0; i < room.users.length; i++) {
      if (room.users[i].id === targetUserId) {
        target = room.users[i];
      }
    }

    sendPacket(socket, config.packetType.USE_CARD_RESPONSE, {
      success: true,
      failCode: GlobalFailCode.NONE
    });
    switch (cardType) {
      case CardType.BBANG:
        if (!target) return;
        await changeStatus(target, rooms, room, -1, 0, 0);
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
    // 로그 처리 ----------------------------------------------------------------------
    //console.info(responseMessage);
  } catch (error) {
    console.error(`useCardHandler ${error as Error}`);
  }

  // 클라이언트(자기 자신)에 데이터 보내기
  //sendPacket(socket, packetType.USE_CARD_RESPONSE, responseData);
};

// 해당 캐릭터 능력치 변동
const changeStatus = async (user: User, rooms: Room[], room: Room, hp: number, armor: number, attack: number) => {
  const characterStats: { [roomId: number]: { [userId: number]: userStatusData } } =
    await getRedisData('userStatusData');
  const characterStat = characterStats[room.id];
  user.character.hp += hp;
  characterStat[user.id].armor += armor;
  characterStat[user.id].attack += attack;

  await setRedisData('userStatusData', characterStats);
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};

const attackTarget = async (attacker: User, rooms: Room[], room: Room, skillCoeffcient: number, targets: User[]) => {
  const characterStats: { [roomId: number]: { [userId: number]: userStatusData } } =
    await getRedisData('userStatusData');
  const damage = Math.round(characterStats[room.id][attacker.id].attack * skillCoeffcient);

  for (let i = 0; i < targets.length; i++) {
    for (let j = 0; j < room.users.length; j++) {
      if (targets[i].id === room.users[j].id) {
        targets[i].character.hp -= damage;
      }
    }
  }
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};

// 파티 버프 (모든 캐릭터 능력치 변동)
const partyBuff = async (rooms: Room[], room: Room, hp: number, armor: number, attack: number) => {
  const characterStats: { [roomId: number]: { [userId: number]: userStatusData } } =
    await getRedisData('userStatusData');
  for (let i = 0; i < room.users.length; i++) {
    room.users[i].character.hp += hp;
    characterStats[room.id][room.users[i].id].armor += armor;
    characterStats[room.id][room.users[i].id].attack += attack;
  }
  await setRedisData('userStatusData', characterStats);
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};
