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
    // responseMessage = `카드 사용 성공 : ${cardType}`;
    // redisUser 정보 찾기
    const redisUser: User | null = await getUserBySocket(socket);
    if (redisUser === null) {
      console.error('카드 사용자의 정보를 찾을 수 없습니다.');
      return;
    }

    // room 정보 찾기
    const rooms: Room[] | undefined = await getRedisData('roomData');
    if (rooms === undefined) {
      console.error('서버에 Rooms정보가 존재하지 않습니다.');
      return;
    }
    let room: Room | undefined;
    for (let i = 0; i < rooms.length; i++) {
      for (let j = 0; j < rooms[i].users.length; j++) {
        if (rooms[i].users[j].id === redisUser.id) {
          room = rooms[i];
        }
      }
    }
    if (!room) {
      console.error('카드 사용자가 속한 room 정보를 찾을 수 없습니다.');
      return;
    }

    // room 의 user정보 찾기
    let user: User | null = null;
    for (let i = 0; i < room.users.length; i++) {
      if (room.users[i].id === redisUser.id) {
        user = room.users[i];
      }
    }
    if (user === null) return;

    // target 정보 찾기
    let target: User | null = null;
    for (let i = 0; i < room.users.length; i++) {
      if (room.users[i].id === targetUserId) {
        target = room.users[i];
      }
    }

    // sendPacket(socket, config.packetType.USE_CARD_RESPONSE, {
    //   success: true,
    //   failCode: GlobalFailCode.NONE
    // });

    // 카드타입 별로 사용 효과 정의
    switch (cardType) {
      case CardType.BBANG:
        if (!target) return;
        // await changeStatus(1, target, rooms, room, -1, 0, 0);
        // await partyBuff(1, user, rooms, room, -1, 0, 0);
        await attackTarget(1, user, rooms, room, 1, target);
        break;
      case CardType.BIG_BBANG:
        usePotion(user, 1, 1, rooms, room);
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

/////////////////////////////////////////////////////////////////////////////////////////////////
// 해당 캐릭터(아군) 능력치 변동
const changeStatus = async (
  manaCost: number,
  user: User,
  rooms: Room[],
  room: Room,
  hp: number,
  armor: number,
  attack: number
) => {
  // 제대로된 대상이 지정되었는지 검사
  if (user.character.roleType !== 2) {
    console.error('아군에게만 사용할 수 있는 스킬입니다.');
    return;
  }

  // 마나가 충분한지 검사
  const characterStats: { [roomId: number]: { [userId: number]: userStatusData } } | undefined =
    await getRedisData('userStatusData');
  if (characterStats === undefined) {
    console.error('userStatusData 정보가 존재하지 않습니다.');
    return;
  }
  const characterStat = characterStats[room.id][user.id];
  if (characterStat.mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 버프 스킬 실행
  user.character.hp += hp;
  characterStat.armor += armor;
  characterStat.attack += attack;

  await setRedisData('userStatusData', characterStats);
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 파티 버프 (모든 아군 캐릭터 능력치 변동)
const partyBuff = async (
  manaCost: number,
  user: User,
  rooms: Room[],
  room: Room,
  hp: number,
  armor: number,
  attack: number
) => {
  const characterStats: { [roomId: number]: { [userId: number]: userStatusData } } | undefined =
    await getRedisData('userStatusData');
  if (characterStats === undefined) {
    console.error('userStatusData 정보가 존재하지 않습니다.');
    return;
  }
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === 2) {
      room.users[i].character.hp += hp;
      characterStats[room.id][room.users[i].id].armor += armor;
      characterStats[room.id][room.users[i].id].attack += attack;
    }
  }

  // 마나가 충분한지 검사
  const characterStat = characterStats[room.id][user.id];
  if (characterStat.mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 버프 스킬 실행
  await setRedisData('userStatusData', characterStats);
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 타겟이 된 적 공격 (적군 체력 감소) - 팀킬 가능하게 할지 회의
const attackTarget = async (
  manaCost: number,
  attacker: User,
  rooms: Room[],
  room: Room,
  skillCoeffcient: number,
  target: User
) => {
  // 적군이 선택되었는지 검사
  // if (target.character.roleType === 2) {
  //   console.error('적군에게만 사용할 수 있는 스킬입니다.');
  //   return;
  // }

  // 마나가 충분한지 검사
  const characterStats: { [roomId: number]: { [userId: number]: userStatusData } } | undefined =
    await getRedisData('userStatusData');
  if (characterStats === undefined) {
    console.error('userStatusData 정보가 존재하지 않습니다.');
    return;
  }
  const characterStat = characterStats[room.id][attacker.id];
  if (characterStat.mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 공격 스킬 실행
  const damage = Math.round(characterStats[room.id][attacker.id].attack * skillCoeffcient);
  target.character.hp -= damage;
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 본인의 Hp / Mp 회복 - MaxHp, MaxMp 만들지 회의
const usePotion = async (user: User, restoreHp: number, restoreMp: number, rooms: Room[], room: Room) => {
  // 스탯 데이터가 존재하는지 검사
  const characterStats: { [roomId: number]: { [userId: number]: userStatusData } } | undefined =
    await getRedisData('userStatusData');
  if (characterStats === undefined) {
    console.error('userStatusData 정보가 존재하지 않습니다.');
    return;
  }
  const characterStat = characterStats[room.id][user.id];

  // 회복 실행
  user.character.hp += restoreHp;
  characterStat.mp += restoreMp;
  await setRedisData('userStatusData', characterStats);
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};
