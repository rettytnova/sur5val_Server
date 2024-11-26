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
import { socketSessions } from '../../session/socketSession.js';
import { animationDelay, monsterAiDatas } from '../coreMethod/monsterMove.js';

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

    // user의 캐릭터 스탯 정보 찾기
    const characterStats: { [roomId: number]: { [userId: number]: userStatusData } } | undefined =
      await getRedisData('userStatusData');
    if (characterStats === undefined) {
      console.error('userStatusData 정보가 존재하지 않습니다.');
      return;
    }
    const characterStat = characterStats[room.id][user.id];

    // target 정보 찾기
    let target: User | null = null;
    for (let i = 0; i < room.users.length; i++) {
      if (room.users[i].id === targetUserId) {
        target = room.users[i];
      }
    }

    // 삭제 ㄴㄴ
    // sendPacket(socket, config.packetType.USE_CARD_RESPONSE, {
    //   success: true,
    //   failCode: GlobalFailCode.NONE
    // });

    // 카드타입 별로 사용 효과 정의 (1~100: 스킬, 101~200: 소모품, 201~: 장비)
    switch (cardType) {
      // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 //

      // 이름: 쌍둥이 폭팔
      // 설명: 신비로운 마법의 에너지가 두 번 적을 빠르게 베어낸다. 두 번째 타격은 마법의 폭발로 적을 더 강하게 공격한다.
      case CardType.MAGICIAN_BASIC_SKILL:
        // 유효성 검사
        if (!target) return;
        if (characterStat.mp < 2) {
          console.log('마나가 부족합니다.');
          return;
        }
        characterStat.mp -= 2;
        await setRedisData('userStatusData', characterStats);

        // 스킬 실행1
        await attackTarget(user, rooms, room, 1, target, characterStats);
        let index: number | null = null;
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = animationDelay;
            index = i;
            break;
          }
        }
        if (index === null) return;
        sendAnimation(user, user, 1);
        sendAnimation(user, target, 2);

        // 스킬 실행2
        setTimeout(async () => {
          await attackTarget(user, rooms, room, 1.5, target, characterStats);
          monsterAiDatas[room.id][index].animationDelay = animationDelay;
          sendAnimation(user, user, 1);
          sendAnimation(user, target, 2);
        }, 600);
        break;

      // 이름: 전사 기본 스킬
      // 설명: 파티원의 방어력과 공격력을 올려주는 버프를 시전한다.
      case CardType.WARRIOR_BASIC_SKILL:
        await partyBuff(1, user, rooms, room, 0, 2, 1);
        break;

      // 이름: 궁수 기본 스킬
      // 설명:
      case CardType.ARCHER_BASIC_SKILL:
        console.log('궁수 기본 스킬 사용!!!!');
        break;

      // 이름: 팔라딘 기본 스킬
      // 설명:
      case CardType.PALADIN_BASIC_SKILL:
        console.log('팔라딘 기본 스킬 사용!!!!');
        break;

      // 이름: 마법사 강화 스킬
      // 설명:
      case CardType.MAGICIAN_EXTENDED_SKILL:
        console.log('마법사 강화 스킬 사용!!!!');
        break;

      // 이름: 전사 강화 스킬
      // 설명: 일시적(10초간)으로 방어력이 대폭 상승한다.
      case CardType.WARRIOR_EXTENDED_SKILL:
        if (!user) return;
        await changeStatus(1, user, rooms, room, 0, 8, -2);
        setTimeout(async () => {
          await changeStatus(1, user, rooms, room, 0, -8, 2);
        }, 10000);
        break;

      // 이름: 궁수 강화 스킬
      // 설명:
      case CardType.ARCHER_EXTENDED_SKILL:
        console.log('궁수 강화 스킬 사용!!!!');
        break;

      // 이름: 팔라딘 강화 스킬
      // 설명:
      case CardType.PALADIN_EXTENDED_SKILL:
        console.log('팔라딘 강화 스킬 사용!!!!');
        break;

      // 소모품 101 ~ 200 // 소모품 101 ~ 200 //  소모품 101 ~ 200 //  소모품 101 ~ 200 //  소모품 101 ~ 200 //  소모품 101 ~ 200 //  소모품 101 ~ 200 //

      // 이름:
      // 설명:
      case CardType.BASIC_HP_POTION:
        usePotion(user, 1, 1, rooms, room, CardType.BASIC_HP_POTION);
        // sendPacket(socket, config.packetType.USE_CARD_RESPONSE, {
        //   success: true,
        //   failCode: GlobalFailCode.NONE
        // });
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 장비 201 ~ 300 // 장비 201 ~ 300 // 장비 201 ~ 300 // 장비 201 ~ 300 // 장비 201 ~ 300 // 장비 201 ~ 300 // 장비 201 ~ 300 // 장비 201 ~ 300 //

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;

      // 이름:
      // 설명:
      case CardType.NONE:
        break;
    }

    console.log('남은 마나: ', characterStat.mp);
  } catch (error) {
    console.error(`useCardHandler ${error as Error}`);
  }

  // 클라이언트(자기 자신)에 데이터 보내기
  //sendPacket(socket, packetType.USE_CARD_RESPONSE, responseData);
};

// 스킬 애니메이션 패킷 보내기
const sendAnimation = (user: User, animationTarget: User, animationType: number) => {
  sendPacket(socketSessions[user.id], config.packetType.ANIMATION_NOTIFICATION, {
    userId: animationTarget.id,
    animationType: animationType
  });
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
  characterStat.mp -= manaCost;
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
  // 캐릭터 / 유저 정보 검사
  const characterStats: { [roomId: number]: { [userId: number]: userStatusData } } | undefined =
    await getRedisData('userStatusData');
  if (characterStats === undefined) {
    console.error('userStatusData 정보가 존재하지 않습니다.');
    return;
  }

  // 마나가 충분한지 검사
  const characterStat = characterStats[room.id][user.id];
  if (characterStat.mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 버프 스킬 실행
  characterStat.mp -= manaCost;
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === 2) {
      room.users[i].character.hp += hp;
      characterStats[room.id][room.users[i].id].armor += armor;
      characterStats[room.id][room.users[i].id].attack += attack;
    }
  }
  await setRedisData('userStatusData', characterStats);
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 타겟이 된 적 공격 (적군 체력 감소)
const attackTarget = async (
  attacker: User,
  rooms: Room[],
  room: Room,
  skillCoeffcient: number,
  target: User,
  characterStats: { [roomId: number]: { [userId: number]: userStatusData } }
) => {
  // 적군이 선택되었는지 검사
  if (target.character.roleType === 2) {
    console.error('적군에게만 사용할 수 있는 스킬입니다.');
    return;
  }

  // 공격 스킬 실행
  const damage = Math.round(characterStats[room.id][attacker.id].attack * skillCoeffcient);
  target.character.hp -= damage;
  if (target.character.hp < 0) target.character.hp = 0;
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 본인의 Hp / Mp 회복 - MaxHp, MaxMp 만들지 회의
const usePotion = async (
  user: User,
  restoreHp: number,
  restoreMp: number,
  rooms: Room[],
  room: Room,
  cardsType: number
) => {
  // 스탯 데이터가 존재하는지 검사
  const characterStats: { [roomId: number]: { [userId: number]: userStatusData } } | undefined =
    await getRedisData('userStatusData');
  if (characterStats === undefined) {
    console.error('userStatusData 정보가 존재하지 않습니다.');
    return;
  }
  const characterStat = characterStats[room.id][user.id];

  // 해당 아이템 보유여부 검사
  let isOwned: boolean = false;
  for (let i = 0; i < user.character.handCards.length; i++) {
    if (user.character.handCards[i].type === cardsType && user.character.handCards[i].count > 0) {
      user.character.handCards[i].count--;
      isOwned = true;
    }
  }
  if (isOwned === false) return;

  // 회복 실행
  user.character.hp += restoreHp;
  characterStat.mp += restoreMp;
  await setRedisData('userStatusData', characterStats);
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};
