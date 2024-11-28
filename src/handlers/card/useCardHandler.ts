import { config } from '../../config/config.js';
import { CustomSocket, UseCardRequest, UseCardResponse, Room, User } from '../../interface/interface.js';
import { CardType, GlobalFailCode } from '../enumTyps.js';
import { sendPacket } from '../../packet/createPacket.js';
import { getRedisData, getRoomByUserId, getUserBySocket, setRedisData } from '../../handlers/handlerMethod.js';
import { userUpdateNotification } from '../notification/userUpdate.js';
import { socketSessions } from '../../session/socketSession.js';
import { monsterAiDatas } from '../coreMethod/monsterMove.js';

// DB에 들어갈 내용
const DBEquip: { [cardType: number]: { attack: number; armor: number; hp: number } } = {
  301: { attack: 0, armor: 0, hp: 0 },
  302: { attack: 0, armor: 0, hp: 0 },
  303: { attack: 0, armor: 0, hp: 0 },
  304: { attack: 0, armor: 0, hp: 0 },
  305: { attack: 0, armor: 0, hp: 0 },
  306: { attack: 2, armor: 0, hp: 0 },
  307: { attack: 0, armor: 0, hp: 8 },
  308: { attack: 0, armor: 2, hp: 2 },
  309: { attack: 0, armor: 1, hp: 5 },
  310: { attack: 1, armor: 1, hp: 0 },
  311: { attack: 4, armor: 0, hp: 0 },
  312: { attack: 0, armor: 0, hp: 16 },
  313: { attack: 0, armor: 4, hp: 4 },
  314: { attack: 0, armor: 2, hp: 10 },
  315: { attack: 2, armor: 2, hp: 0 }
};

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

    // 카드타입 별로 사용 효과 정의 (1~100: 스킬, 101~200: 소모품, 201~: 장비)
    switch (cardType) {
      // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 //

      // 이름: 쌍둥이 폭팔
      // 설명: 신비로운 마법의 에너지가 두 번 적을 빠르게 베어낸다. 두 번째 타격은 마법의 폭발로 적을 더 강하게 공격한다.
      case CardType.MAGICIAN_BASIC_SKILL: {
        // 유효성 검사
        if (!target) return;
        if (user.character.mp < 2) {
          console.log('마나가 부족합니다.');
          return;
        }

        // 스킬 실행1
        if (await attackTarget(user, rooms, room, 1, target)) return;
        let index: number | null = null;
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 5;
            index = i;
            break;
          }
        }
        if (index === null) return;
        sendAnimation(user, target, 1);

        // 스킬 실행2
        setTimeout(async () => {
          await attackTarget(user, rooms, room, 1.5, target);
          monsterAiDatas[room.id][index].animationDelay = 5;
          sendAnimation(user, target, 1);
        }, 800);

        // 마나 소모
        user.character.mp -= 2;
        await setRedisData('roomData', rooms);
        break;
      }
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

      // 이름: 삼중 타격
      // 설명: 푸른빛, 보랏빛, 붉은 폭발로 적을 강타한다. 타격마다 에너지가 증폭되어 최종 타격은 압도적인 파괴력을 발휘한다.
      case CardType.MAGICIAN_EXTENDED_SKILL: {
        // 유효성 검사
        if (!target) return;
        if (user.character.mp < 3) {
          console.log('마나가 부족합니다.');
          return;
        }

        // 스킬 실행1
        if (await attackTarget(user, rooms, room, 1.2, target)) return;
        let index: number | null = null;
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 4;
            index = i;
            break;
          }
        }
        if (index === null) return;
        sendAnimation(user, target, 1);

        // 스킬 실행2
        setTimeout(async () => {
          await attackTarget(user, rooms, room, 1.8, target);
          monsterAiDatas[room.id][index].animationDelay = 4;
          sendAnimation(user, target, 1);
        }, 600);

        // 스킬 실행3
        setTimeout(async () => {
          await attackTarget(user, rooms, room, 2.7, target);
          monsterAiDatas[room.id][index].animationDelay = 4;
          sendAnimation(user, target, 1);
        }, 1200);

        // 마나 소모
        user.character.mp -= 3;
        await setRedisData('roomData', rooms);
        break;
      }
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
      case CardType.BASIC_WEAPON:
        equipWeapon(user, rooms, room, CardType.BASIC_WEAPON);
        break;

      // 이름: 초심자의 투구
      // 설명:
      case CardType.BASIC_HEAD:
        equipItem(user, rooms, room, 0, CardType.BASIC_HEAD);
        break;

      // 이름: 초심자의 갑옷
      // 설명:
      case CardType.BASIC_ARMOR:
        equipItem(user, rooms, room, 1, CardType.BASIC_ARMOR);
        break;

      // 이름: 초심자의 망토
      // 설명:
      case CardType.BASIC_CLOAK:
        equipItem(user, rooms, room, 2, CardType.BASIC_CLOAK);
        break;

      // 이름: 초심자의 장갑
      // 설명:
      case CardType.BASIC_GLOVE:
        equipItem(user, rooms, room, 3, CardType.BASIC_GLOVE);
        break;

      // 이름:
      // 설명:
      case CardType.ADVANCED_WEAPON:
        equipWeapon(user, rooms, room, CardType.ADVANCED_WEAPON);
        break;

      // 이름:
      // 설명:
      case CardType.ADVANCED_HEAD:
        equipItem(user, rooms, room, 0, CardType.ADVANCED_HEAD);
        break;

      // 이름:
      // 설명:
      case CardType.ADVANCED_ARMOR:
        equipItem(user, rooms, room, 1, CardType.ADVANCED_ARMOR);
        break;

      // 이름:
      // 설명:
      case CardType.ADVANCED_CLOAK:
        equipItem(user, rooms, room, 2, CardType.ADVANCED_CLOAK);
        break;

      // 이름:
      // 설명:
      case CardType.ADVANCED_GLOVE:
        equipItem(user, rooms, room, 3, CardType.ADVANCED_GLOVE);
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

    console.log('남은 마나: ', user.character.mp);
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
  if (user.character.mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 버프 스킬 실행
  user.character.mp -= manaCost;
  if (user.character.hp + hp <= user.character.maxHp) {
    user.character.hp += hp;
  } else {
    user.character.hp = user.character.maxHp;
  }
  user.character.mp += armor;
  user.character.mp += attack;

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
  // 마나가 충분한지 검사
  if (user.character.mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 버프 스킬 실행
  user.character.mp -= manaCost;
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === 2) {
      if (user.character.hp + hp <= user.character.maxHp) {
        user.character.hp += hp;
      } else {
        user.character.hp = user.character.maxHp;
      }
      user.character.armor += armor;
      user.character.attack += attack;
    }
  }
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 타겟이 된 적 공격 (적군 체력 감소)
const attackTarget = async (attacker: User, rooms: Room[], room: Room, skillCoeffcient: number, target: User) => {
  // 적군이 선택되었는지 검사
  if (target.character.roleType === 2) {
    console.error('적군에게만 사용할 수 있는 스킬입니다.');
    return true;
  }

  // 살아있는 적이 맞는지 검사
  if (target.character.hp <= 0) {
    return true;
  }

  // 공격 실행 중 라운드가 바뀌지 않았는지 검사
  let isChanged: boolean = true;
  const roomNow = await getRoomByUserId(attacker.id);
  if (!roomNow) return;
  for (let i = 0; i < roomNow.users.length; i++) {
    if (roomNow.users[i].id === target.id) isChanged = false;
  }
  if (isChanged) {
    console.log('공격 실행 중 라운드 바뀌어서 몬스터 사라짐');
    return;
  }

  // 공격 스킬 실행
  const damage = Math.round(attacker.character.attack * skillCoeffcient - target.character.armor);
  target.character.hp -= Math.max(damage, 0);
  if (target.character.hp < 0) target.character.hp = 0;
  userUpdateNotification(room);
  await setRedisData('roomData', rooms);
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
  if (user.character.hp + restoreHp <= user.character.maxHp) {
    user.character.hp += restoreHp;
  } else {
    user.character.hp = user.character.maxHp;
  }
  user.character.mp += restoreMp;
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 방어구 장착 equipType (0: 투구, 1: 갑옷, 2: 망토, 3: 장갑)
const equipItem = async (user: User, rooms: Room[], room: Room, equipIndex: number, cardsType: number) => {
  // 해당 아이템 보유여부 검사
  let isOwned: boolean = false;
  for (let i = 0; i < user.character.handCards.length; i++) {
    if (user.character.handCards[i].type === cardsType && user.character.handCards[i].count > 0) {
      user.character.handCards[i].count--;
      isOwned = true;
    }
  }
  if (isOwned === false) return;

  // equipIndex 검사
  if (equipIndex !== 0 && equipIndex !== 1 && equipIndex !== 2 && equipIndex !== 3) {
    console.log('올바르지 않은 equipIndex입니다.');
  }

  // 장착중이던 방어구 해제
  if (![302, 303, 304, 305].includes(user.character.equips[equipIndex]) && user.character.equips[equipIndex]) {
    // 장착칸 → handCards로 옮기기
    let isInHandCards: boolean = false;
    for (let i = 0; i < user.character.handCards.length; i++) {
      if (user.character.handCards[i].type === user.character.equips[equipIndex]) {
        user.character.handCards[i].count++;
        isInHandCards = true;
        break;
      }
    }
    if (isInHandCards === false) user.character.handCards.push({ type: user.character.equips[equipIndex], count: 1 });

    // 능력치 하락
    user.character.attack -= DBEquip[user.character.equips[equipIndex]].attack;
    user.character.armor -= DBEquip[user.character.equips[equipIndex]].armor;
    user.character.maxHp -= DBEquip[user.character.equips[equipIndex]].hp;
    user.character.hp -= DBEquip[user.character.equips[equipIndex]].hp;
  }

  // 새로운 방어구 장착 및 능력치 상승
  user.character.equips[equipIndex] = cardsType;
  user.character.attack += DBEquip[cardsType].attack;
  user.character.armor += DBEquip[cardsType].armor;
  user.character.maxHp += DBEquip[cardsType].hp;
  user.character.hp += DBEquip[cardsType].hp;

  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 무기 장착
const equipWeapon = async (user: User, rooms: Room[], room: Room, cardsType: number) => {
  // 해당 아이템 보유여부 검사
  let isOwned: boolean = false;
  for (let i = 0; i < user.character.handCards.length; i++) {
    if (user.character.handCards[i].type === cardsType && user.character.handCards[i].count > 0) {
      user.character.handCards[i].count--;
      isOwned = true;
    }
  }
  if (isOwned === false) return;

  // // 장착중이던 무기 해제
  if (user.character.weapon !== 301 && user.character.weapon) {
    // 장착칸 → handCards로 옮기기
    let isInHandCards: boolean = false;
    for (let i = 0; i < user.character.handCards.length; i++) {
      if (user.character.handCards[i].type === user.character.weapon) {
        user.character.handCards[i].count++;
        isInHandCards = true;
        break;
      }
    }
    if (isInHandCards === false) user.character.handCards.push({ type: user.character.weapon, count: 1 });

    // 능력치 하락
    user.character.attack -= DBEquip[user.character.weapon].attack;
    user.character.armor -= DBEquip[user.character.weapon].armor;
    user.character.maxHp -= DBEquip[user.character.weapon].hp;
    user.character.hp -= DBEquip[user.character.weapon].hp;
  }

  // 새로운 무기 장착 및 능력치 상승
  user.character.weapon = cardsType;
  user.character.attack += DBEquip[cardsType].attack;
  user.character.armor += DBEquip[cardsType].armor;
  user.character.maxHp += DBEquip[cardsType].hp;
  user.character.hp += DBEquip[cardsType].hp;

  await setRedisData('roomData', rooms);
  userUpdateNotification(room);
};
