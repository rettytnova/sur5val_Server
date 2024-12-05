import { config } from '../../config/config.js';
import {
  CustomSocket,
  UseCardRequest,
  UseCardResponse,
  Room,
  User,
  CharacterPositionData,
  positionUpdatePayload
} from '../../interface/interface.js';
import { CardType, GlobalFailCode, RoleType } from '../enumTyps.js';
import { sendPacket } from '../../packet/createPacket.js';
import { getRedisData, getRoomByUserId, getUserIdBySocket, setRedisData } from '../../handlers/handlerMethod.js';
import { userUpdateNotification } from '../notification/userUpdate.js';
import { socketSessions } from '../../session/socketSession.js';
import { monsterAiDatas } from '../coreMethod/monsterMove.js';
import { monsterReward, setCardRewards, setStatRewards } from '../coreMethod/monsterReward.js';
import { gameEndNotification } from '../notification/gameEnd.js';
import Server from '../../class/server.js';

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
  let responseData: UseCardResponse = {
    success: true,
    failCode: GlobalFailCode.NONE
  };

  try {
    // redisUser 정보 찾기
    const userId: number | null = await getUserIdBySocket(socket);
    if (userId === null) {
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
        if (rooms[i].users[j].id === userId) {
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
      if (room.users[i].id === userId) {
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

      // 이름: 기본 공격
      // 설명: 그냥 기본 공격 입니다.
      case CardType.SUR5VER_BASIC_SKILL: {
        // 공격 유효성 검증
        if (!target) return;
        if (!attackPossible(user, target, 0)) return;

        // 공격 실행
        attackTarget(user, rooms, room, 1, target);
        sendAnimation(user, target, 2);
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 5;
            break;
          }
        }

        // 공격 완료 처리
        user.character.coolDown = Date.now();
        await setRedisData('roomData', rooms);
        await userUpdateNotification(room);
        break;
      }
      // 이름: 쌍둥이 폭팔
      // 설명: 신비로운 마법의 에너지가 두 번 적을 빠르게 베어낸다. 두 번째 타격은 마법의 폭발로 적을 더 강하게 공격한다.
      case CardType.MAGICIAN_BASIC_SKILL: {
        // 공격 유효성 검증
        if (!target) return;
        if (!attackPossible(user, target, 2)) return;

        // 스킬 실행1
        await attackTarget(user, rooms, room, 1, target);
        let index: number | null = null;
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 5;
            index = i;
            break;
          }
        }
        sendAnimation(user, target, 1);

        // 스킬 실행2
        setTimeout(async () => {
          await attackTarget(user, rooms, room, 1.5, target);
          if (index) monsterAiDatas[room.id][index].animationDelay = 5;
          sendAnimation(user, target, 1);
        }, 800);

        // 보스를 죽였는지 검사
        if (target.character.roleType === RoleType.BOSS_MONSTER && target.character.hp <= 0) {
          await gameEndNotification(room.id, 3);
          return;
        }

        // 공격 완료 처리
        user.character.coolDown = Date.now();
        user.character.mp -= 2;
        await setRedisData('roomData', rooms);
        await userUpdateNotification(room);
        break;
      }

      // 이름: 차지 샷 (궁수 기본 스킬) , 애니메이션 번호 : 4번
      // 설명: 활시위에 집중하여 강력한 화살을 한 방 쏘아낸다.
      case CardType.ARCHER_BASIC_SKILL:
        if (!target) return;
        if (!attackPossible(user, target, 1)) return;
        await attackTarget(user, rooms, room, 1.5, target);
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 4;
            break;
          }
        }
        user.character.coolDown = Date.now();
        user.character.mp -= 1;
        sendAnimation(user, target, 4);
        if (target.character.roleType === RoleType.BOSS_MONSTER && target.character.hp <= 0) {
          await gameEndNotification(room.id, 3);
          return;
        }
        await setRedisData('roomData', rooms);
        await userUpdateNotification(room);

        break;

      // 이름: 급습 (도적 기본 스킬) , 애니메이션 번호 : 10번
      // 설명: 급소에 강력한 공격을 가한다.
      case CardType.ROGUE_BASIC_SKILL:
        if (!target) return;
        if (!attackPossible(user, target, 3)) return;
        //await movePosition(user, target, room);
        await attackTarget(user, rooms, room, 3, target);
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 6;
            break;
          }
        }
        user.character.coolDown = Date.now();
        user.character.mp -= 3;
        sendAnimation(user, target, 10);
        if (target.character.roleType === RoleType.BOSS_MONSTER && target.character.hp <= 0) {
          await gameEndNotification(room.id, 3);
          return;
        }
        await setRedisData('roomData', rooms);
        userUpdateNotification(room);

        break;

      // 이름: 워 드럼 (전사 기본 스킬), 애니메이션 번호 : 7
      // 설명: 전투를 준비하기 위해 파티원들의 사기를 북돋는다. 파티원들의 능력치 20초간 소폭 증가
      case CardType.WARRIOR_BASIC_SKILL:
        await partyBuff(2, user, rooms, room, 0, 2, 2);

        user.character.coolDown = Date.now();

        for (let i = 0; i < room.users.length; i++) {
          if (room.users[i].character.roleType === RoleType.SUR5VAL) {
            sendAnimation(room.users[i], room.users[i], 7);
          }
        }

        setTimeout(async () => {
          await partyBuff(0, user, rooms, room, 0, -2, -2);
        }, 20000);

        break;

      // 이름: 삼중 타격 (마법사 강화 스킬), 애니메이션 번호 : 1
      // 설명: 푸른빛, 보랏빛, 붉은 폭발로 적을 강타한다. 타격마다 에너지가 증폭되어 최종 타격은 압도적인 파괴력을 발휘한다.
      case CardType.MAGICIAN_EXTENDED_SKILL: {
        // 공격 유효성 검증
        if (!target) return;
        if (!attackPossible(user, target, 3)) return;

        // 스킬 실행1
        await attackTarget(user, rooms, room, 1.2, target);
        let index: number | null = null;
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 4;
            index = i;
            break;
          }
        }
        sendAnimation(user, target, 1);

        // 스킬 실행2
        setTimeout(async () => {
          await attackTarget(user, rooms, room, 1.8, target);
          if (index) monsterAiDatas[room.id][index].animationDelay = 4;
          sendAnimation(user, target, 1);
        }, 600);

        // 스킬 실행3
        setTimeout(async () => {
          await attackTarget(user, rooms, room, 2.7, target);
          if (index) monsterAiDatas[room.id][index].animationDelay = 4;
          sendAnimation(user, target, 1);
        }, 1200);

        // 공격 완료 처리
        user.character.mp -= 3;
        user.character.coolDown = Date.now();
        await setRedisData('roomData', rooms);
        await userUpdateNotification(room);
        break;
      }
      // 이름: 궁수 강화 스킬
      // 설명: 일시적(10초간)으로 방어력이 대폭 상승한다.
      case CardType.ARCHER_EXTENDED_SKILL:
        console.log('궁수 강화 스킬 사용!!!!');
        break;

      // 이름: 도적 강화 스킬
      // 설명:
      case CardType.ROGUE_EXTENDED_SKILL:
        console.log('도적 강화 스킬 사용!!!!');
        break;

      // 이름: 전사 강화 스킬
      // 설명:
      case CardType.WARRIOR_EXTENDED_SKILL:
        if (!user) return;
        await changeStatus(1, user, rooms, room, 0, 8, -2);
        setTimeout(async () => {
          await changeStatus(1, user, rooms, room, 0, -8, 2);
        }, 10000);
        break;

      // 이름: 불멸의 폭풍
      // 설명: 강력한 마법 폭풍이 적을 덮친다. 번개와 화염이 뒤엉켜 적에게 치명적인 피해를 입힌다.
      case CardType.MAGICIAN_FINAL_SKILL:
        // 공격 유효성 검증
        if (!target) return;
        if (!attackPossible(user, target, 4)) return;

        // 스킬 실행
        await attackTarget(user, rooms, room, 7, target);
        let index: number | null = null;
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 6;
            index = i;
            break;
          }
        }
        // sendAnimation(user, target, 1);
        // sendAnimation(user, target, 2);
        sendAnimation(user, target, 3);

        // 마나 소모
        user.character.coolDown = Date.now();
        user.character.mp -= 4;
        await setRedisData('roomData', rooms);
        await userUpdateNotification(room);
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
      case CardType.BOSS_RANGE_SKILL:
        attackRagne(user, user, rooms, room, 1, 5, 3);
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

      // 소모품 201 ~ 300 // 소모품 201 ~ 300 //  소모품 201 ~ 300 //  소모품 201 ~ 300 //  소모품 201 ~ 300 //  소모품 201 ~ 300 //  소모품 201 ~ 300 //

      // 이름: 순수한 이슬
      // 설명: 맑고 순수한 이슬 한 방울이 체력을 3 회복해준다! 지친 몸에 활력을 더해 다시 전투에 나설 수 있도록 돕는다.
      case CardType.BASIC_HP_POTION:
        usePotion(user, rooms, room, CardType.BASIC_HP_POTION);
        break;

      // 이름: 마력의 이슬
      // 설명: 맑고 순수한 이슬 한 방울이 마력을 1 회복해준다! 고갈된 마법 에너지를 되살려 새로운 주문을 준비하자.
      case CardType.BASIC_MP_POTION:
        usePotion(user, rooms, room, CardType.BASIC_MP_POTION);
        break;

      // 이름: 치유의 빛
      // 설명: 은은한 치유의 빛이 체력을 6 회복해준다! 깊은 상처를 어루만지고 전투의 피로를 씻어내는 신비한 물약.
      case CardType.ADVANCED_HP_POTION:
        usePotion(user, rooms, room, CardType.ADVANCED_HP_POTION);
        break;

      // 이름: 마력의 빛
      // 설명: 은은한 마나의 빛이 마력을 2 회복해준다! 흐릿했던 마법의 기운을 선명하게 채워주는 신비한 물약.
      case CardType.ADVANCED_MP_POTION:
        usePotion(user, rooms, room, CardType.ADVANCED_MP_POTION);
        break;

      // 이름: 생명의 숨결
      // 설명: 신비로운 생명의 기운이 체력을 10 회복해준다! 생명의 근원이 담긴 이 물약은 가장 극한의 상황에서도 새로운 힘을 불어넣는다.
      case CardType.MASTER_HP_POTION:
        usePotion(user, rooms, room, CardType.MASTER_HP_POTION);
        break;

      // 이름: 마력의 숨결
      // 설명: 신비로운 마력의 기운이 마력을 4 회복해준다! 극한의 상황에서도 강력한 주문을 사용할 수 있는 힘을 불어넣는다.
      case CardType.MASTER_MP_POTION:
        usePotion(user, rooms, room, CardType.MASTER_MP_POTION);
        break;

      // 이름: 성장의 작은 불꽃
      // 설명: 작은 불꽃이 당신의 성장을 돕습니다. 경험치 +10
      case CardType.BASIC_EXP_POTION:
        usePotion(user, rooms, room, CardType.BASIC_EXP_POTION);
        break;

      // 이름: 무한 성장의 불길
      // 설명: 끝없는 불길로 압도적인 성장을 경험하세요. 경험치 +30
      case CardType.MASTER_EXP_POTION:
        usePotion(user, rooms, room, CardType.MASTER_EXP_POTION);
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

      // 장비 301 ~ 400 // 장비 301 ~ 400  / 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 //

      // 이름: 탐험가의 무기
      // 설명: 야생에서 빛을 발하는 무기. 공격력+2
      case CardType.EXPLORER_WEAPON:
        equipWeapon(user, rooms, room, CardType.EXPLORER_WEAPON);
        break;

      // 이름: 탐험가의 투구
      // 설명: 거친 환경을 견디는 투구. 체력+16
      case CardType.EXPLORER_HEAD:
        equipItem(user, rooms, room, 0, CardType.EXPLORER_HEAD);
        break;

      // 이름: 탐험가의 갑옷
      // 설명: 유연성과 보호력을 겸비한 갑옷. 방어력+1, 체력+12
      case CardType.EXPLORER_ARMOR:
        equipItem(user, rooms, room, 1, CardType.EXPLORER_ARMOR);
        break;

      // 이름: 탐험가의 망토
      // 설명: 바람과 비를 막아주는 견고한 망토. 방어력+2, 체력+8
      case CardType.EXPLORER_CLOAK:
        equipItem(user, rooms, room, 2, CardType.EXPLORER_CLOAK);
        break;

      // 이름: 탐험가의 장갑
      // 설명: 정밀한 손놀림을 돕는 장갑. 공격력+1, 방어력+1, 체력+2
      case CardType.EXPLORER_GLOVE:
        equipItem(user, rooms, room, 3, CardType.EXPLORER_GLOVE);
        break;

      // 이름: 영웅의 무기
      // 설명: 강력한 적도 제압 가능한 놀라운 무기. 공격력+4
      case CardType.HERO_WEAPON:
        equipWeapon(user, rooms, room, CardType.HERO_WEAPON);
        break;

      // 이름: 영웅의 투구
      // 설명: 영광스러운 전투를 상징하는 투구. 체력+32
      case CardType.HERO_HEAD:
        equipItem(user, rooms, room, 0, CardType.HERO_HEAD);
        break;

      // 이름: 영웅의 갑옷
      // 설명: 방어와 위엄을 겸비한 갑옷. 방어력+2, 체력+24
      case CardType.HERO_ARMOR:
        equipItem(user, rooms, room, 1, CardType.HERO_ARMOR);
        break;

      // 이름: 영웅의 망토
      // 설명: 마법의 힘이 깃든 망토. 방어력+4, 체력+16
      case CardType.HERO_CLOAK:
        equipItem(user, rooms, room, 2, CardType.HERO_CLOAK);
        break;

      // 이름: 영웅의 장갑
      // 설명: 전투 기술을 극대화하는 장갑. 공격력+2, 방어력+2, 체력+4
      case CardType.HERO_GLOVE:
        equipItem(user, rooms, room, 3, CardType.HERO_GLOVE);
        break;

      // 이름: 전설의 무기
      // 설명: 신화적 힘이 담긴 무기, 적에게 파멸을 선사한다. 공격력+6
      case CardType.LEGENDARY_WEAPON:
        equipWeapon(user, rooms, room, CardType.LEGENDARY_WEAPON);
        break;

      // 이름: 전설의 투구
      // 설명: 신성한 보호막을 제공하는 투구, 사용자를 불멸로 이끈다. 체력+48
      case CardType.LEGENDARY_HEAD:
        equipItem(user, rooms, room, 0, CardType.LEGENDARY_HEAD);
        break;

      // 이름: 전설의 갑옷
      // 설명: 황금빛 문양과 마법이 깃든 최강의 갑옷. 방어력+3, 체력+36
      case CardType.LEGENDARY_ARMOR:
        equipItem(user, rooms, room, 1, CardType.LEGENDARY_ARMOR);
        break;

      // 이름: 전설의 망토
      // 설명: 우주의 에너지가 깃든 최강의 망토. 방어력+6, 체력+24
      case CardType.LEGENDARY_CLOAK:
        equipItem(user, rooms, room, 2, CardType.LEGENDARY_CLOAK);
        break;

      // 이름: 전설의 장갑
      // 설명: 신화의 기술과 힘을 담은 승리의 장갑. 공격력+3, 방어력+3, 체력+6
      case CardType.LEGENDARY_GLOVE:
        equipItem(user, rooms, room, 3, CardType.LEGENDARY_GLOVE);
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
  if (user.character.roleType !== RoleType.SUR5VAL) {
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
  await userUpdateNotification(room);
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
    if (room.users[i].character.roleType === RoleType.SUR5VAL) {
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
  await userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 공격 유효성 검증
const attackPossible = (attacker: User, target: User, needMp: number) => {
  const initGameInfo = Server.getInstance().initGameInfo;
  if (!initGameInfo) return;
  const attackCool = initGameInfo[0].attackCool;
  if (Date.now() - attacker.character.coolDown < attackCool) {
    // console.log('공격 쿨타임 중입니다.');
    return false;
  }
  if (attacker.character.mp < needMp) {
    // console.log('마나가 부족합니다.');
    return false;
  }
  if (target.character.roleType === RoleType.SUR5VAL) {
    console.log('아군을 공격할 수는 없습니다.');
    return false;
  }
  if (target.character.hp <= 0) {
    console.log('살아있는 적만 공격할 수 있습니다.');
    return false;
  }

  return true;
};

// 보스스킬: 범위 적 공격
const attackRagne = async (
  attacker: User,
  center: User,
  rooms: Room[],
  room: Room,
  skillCoeffcient: number,
  range: number,
  maxTarget: number
) => {
  // 살아있는 플레이어 추출
  const alivePlayers: [User, number][] = [];
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === RoleType.SUR5VAL && room.users[i].character.hp > 0) {
      alivePlayers.push([room.users[i], 0]);
    }
  }

  // 중심 위치 조회
  const characterPositions: { [roomId: number]: CharacterPositionData[] | undefined } | undefined =
    await getRedisData('characterPositionDatas');
  if (characterPositions === undefined) return;
  const positionDatas: CharacterPositionData[] | undefined = characterPositions[room.id];
  if (positionDatas === undefined) return;
  let bossPosition: positionUpdatePayload | null = null;
  for (let i = 0; i < positionDatas.length; i++) {
    if (center.id === positionDatas[i].id) {
      bossPosition = { x: positionDatas[i].x, y: positionDatas[i].y };
      break;
    }
  }
  if (!bossPosition) return;

  // 보스와의 거리가 너무 먼 alivePlayer를 splice 처리
  for (let i = 0; i < alivePlayers.length; i++) {
    for (let j = 0; j < positionDatas.length; j++) {
      if (alivePlayers[i][0].id === positionDatas[j].id) {
        const distance = (bossPosition.x - positionDatas[j].x) ** 2 + (bossPosition.y - positionDatas[j].y) ** 2;
        if (distance > range ** 2) {
          alivePlayers.splice(i, 1);
          i--;
        } else {
          alivePlayers[i][1] = distance;
        }
        break;
      }
    }
  }

  // 타겟 수 제한을 넘었을 경우 거리가 먼 순서대로 삭제
  if (alivePlayers.length > maxTarget) {
    alivePlayers.sort((a, b) => a[1] - b[1]);
    alivePlayers.splice(maxTarget);
  }

  // 남아있는 alivePlayer 공격 및 애니메이션 재생
  for (let i = 0; i < alivePlayers.length; i++) {
    const damage = Math.max(attacker.character.attack * skillCoeffcient - alivePlayers[i][0].character.armor, 0);
    alivePlayers[i][0].character.hp -= Math.round(damage);
    if (alivePlayers[i][0].character.hp <= 0) {
      alivePlayers[i][0].character.aliveState = false;
      alivePlayers[i][0].character.stateInfo.state = 15;
      alivePlayers[i][0].character.hp = 0;
    }
    sendAnimation(attacker, alivePlayers[i][0], 1);
  }

  await setRedisData('roomData', rooms);
  await userUpdateNotification(room);
};

// 타겟이 된 적 공격 (적군 체력 감소)
const attackTarget = async (attacker: User, rooms: Room[], room: Room, skillCoeffcient: number, target: User) => {
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
  target.character.hp = Math.max(target.character.hp - damage, 0);
  if (target.character.aliveState && target.character.hp <= 0) {
    attacker.character.exp += target.character.exp;
    await monsterReward(rooms, room, attacker, target);
  }

  // 보스를 죽였는지 검사
  if (target.character.roleType === RoleType.BOSS_MONSTER && target.character.hp <= 0) {
    await gameEndNotification(room.id, 3);
    return;
  }

  await setRedisData('roomData', rooms);
  await userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 본인의 Hp, Mp 회복 / Exp 획득
const usePotion = async (user: User, rooms: Room[], room: Room, cardsType: number) => {
  // 해당 아이템 보유여부 검사
  let isOwned: boolean = false;
  for (let i = 0; i < user.character.handCards.length; i++) {
    if (user.character.handCards[i].type === cardsType && user.character.handCards[i].count > 0) {
      user.character.handCards[i].count--;
      isOwned = true;
      break;
    }
  }
  if (isOwned === false) return;

  const consumableItemInfo = Server.getInstance().consumableItemInfo;
  if (!consumableItemInfo) {
    console.error('소비아이템 데이터가 없습니다.');
    return;
  }
  const potionData = consumableItemInfo.find((data) => data.cardType === cardsType);
  if (!potionData) {
    console.error('해당 소비아이템이 존재하지 않습니다.');
    return;
  }

  // 회복 실행
  const characterStatInfos = Server.getInstance().characterStatInfo;
  if (!characterStatInfos) {
    console.error('유저 캐릭터 초기 정보를 찾을 수 없습니다.');
    return;
  }
  const characterStatInfo = characterStatInfos.find((data) => data.characterType === user.character.characterType);
  if (!characterStatInfo) {
    console.error('유저 캐릭터 초기 정보를 찾을 수 없습니다.');
    return;
  }
  user.character.hp = Math.min(user.character.hp + potionData.hp, user.character.maxHp);
  user.character.mp = Math.min(user.character.mp + potionData.mp, characterStatInfo.mp);
  user.character.exp += potionData.exp;

  // 레벨업 확인
  while (user.character.exp >= user.character.maxExp) {
    user.character.exp -= user.character.maxExp;
    user.character.level += 1;
    user.character.maxExp += 10;
    // 직업별 스탯 증가
    if (!setStatRewards(user)) {
      console.error('setStatRewards 실패');
      return false;
    }
    // 직업별 카드 보상 지급
    else if (!setCardRewards(user)) {
      console.error('setCardRewards 실패');
      return false;
    }
  }

  await setRedisData('roomData', rooms);
  await userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 방어구 장착 equipType (0: 투구, 1: 갑옷, 2: 망토, 3: 장갑)
const equipItem = async (user: User, rooms: Room[], room: Room, equipIndex: number, cardsType: number) => {
  // DB의 카드 생성 정보 가져오기
  const equipCardDBInfo = Server.getInstance().equipItemInfo;
  if (!equipCardDBInfo) {
    console.error('장비아이템 데이터가 없습니다.');
    return;
  }
  const equipCard = equipCardDBInfo.find((data) => data.cardType === cardsType);
  if (!equipCard) {
    console.error('해당 장비 카드의 정보를 찾을 수 없스니다.');
    return;
  }

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
    const prevEquipCard = equipCardDBInfo.find((data) => data.cardType === user.character.equips[equipIndex]);
    if (prevEquipCard) {
      user.character.attack -= prevEquipCard.attack;
      user.character.armor -= prevEquipCard.armor;
      user.character.maxHp -= prevEquipCard.hp;
      user.character.hp -= prevEquipCard.hp;
    }
  }

  // 새로운 방어구 장착 및 능력치 상승
  user.character.equips[equipIndex] = cardsType;
  user.character.attack += equipCard.attack;
  user.character.armor += equipCard.armor;
  user.character.maxHp += equipCard.hp;
  user.character.hp += equipCard.hp;

  await setRedisData('roomData', rooms);
  await userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 무기 장착
const equipWeapon = async (user: User, rooms: Room[], room: Room, cardsType: number) => {
  // 해당 아이템 보유여부 검사
  const equipCardDBInfo = Server.getInstance().equipItemInfo;
  if (!equipCardDBInfo) {
    console.error('무기카드 정보가 존재하지 않습니다.', equipCardDBInfo);
    return;
  }
  const weaponCard = equipCardDBInfo.find((data) => data.cardType === cardsType);
  if (!weaponCard) {
    console.error('해당 카드가 존재하지 않습니다.');
    return;
  }
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
    const prevEquipCard = equipCardDBInfo.find((data) => data.cardType === user.character.weapon);
    if (prevEquipCard) {
      user.character.attack -= prevEquipCard.attack;
      user.character.armor -= prevEquipCard.armor;
      user.character.maxHp -= prevEquipCard.hp;
      user.character.hp -= prevEquipCard.hp;
    }
  }

  // 새로운 무기 장착 및 능력치 상승
  user.character.weapon = cardsType;
  user.character.attack += weaponCard.attack;
  user.character.armor += weaponCard.armor;
  user.character.maxHp += weaponCard.hp;
  user.character.hp += weaponCard.hp;

  await setRedisData('roomData', rooms);
  await userUpdateNotification(room);
};

// // 스킬 사용시 해당 타겟 근접이동하기
// const movePosition = async (user: User, target: User, room: Room) => {
//   if (!target) return;

//   let positionDatas: CharacterPositionData[] = await getRedisData('chracterPositionDatas');

//   if (positionDatas[user.id].x > positionDatas[target.id].x + 2) {
//     positionDatas[user.id].x = positionDatas[target.id].x + 2;
//   } else if (positionDatas[user.id].x < positionDatas[target.id].x - 2) {
//     positionDatas[user.id].x = positionDatas[target.id].x - 2;
//   }

//   if (positionDatas[user.id].y > positionDatas[target.id].y + 2) {
//     positionDatas[user.id].y = positionDatas[target.id].y + 2;
//   } else if (positionDatas[user.id].y < positionDatas[target.id].y - 2) {
//     positionDatas[user.id].y = positionDatas[target.id].y - 2;
//   }
// };
