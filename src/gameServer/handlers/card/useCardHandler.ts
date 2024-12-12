import { config } from '../../../config/config.js';
import {
  CustomSocket,
  UseCardRequest,
  UseCardResponse,
  Room,
  User,
  CharacterPositionData,
  position
} from '../../../gameServer/interface/interface.js';
import { CardType, GlobalFailCode, RoleType } from '../enumTyps.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { getRedisData, getUserIdBySocket, setRedisData } from '../handlerMethod.js';
import { userUpdateNotification } from '../notification/userUpdate.js';
import { socketSessions } from '../../session/socketSession.js';
import { monsterAiDatas } from '../coreMethod/monsterMove.js';
import { monsterReward, setCardRewards, setStatRewards } from '../coreMethod/monsterReward.js';
import { gameEndNotification } from '../notification/gameEnd.js';
import Server from '../../class/server.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';

const characterBuffStatus: { [characterId: number]: number[] } = {};

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
  console.log(cardType);
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
    if (user.character.aliveState === false || user.character.hp <= 0) {
      console.log(
        `죽어있는 대상은 행동을 할 수 없습니다. 상태: ${user.character.aliveState}, 체력: ${user.character.hp}`
      );
      return;
    }

    // target 정보 찾기
    let target: User | null = null;
    for (let i = 0; i < room.users.length; i++) {
      if (room.users[i].id === targetUserId) {
        target = room.users[i];
      }
    }

    // 캐릭터 위치 정보 찾기
    const characterPositions: { [roomId: number]: CharacterPositionData[] } =
      await getRedisData('characterPositionDatas');

    // 공격 가능 여부 확인
    for (let i = 0; i < characterPositions[room.id].length; i++) {
      let characterPos: CharacterPositionData = characterPositions[room.id][i];
      if (target !== null && characterPos.id === target.id) {
        if (
          (-23 <= characterPos.x && characterPos.x <= -12 && 5 <= characterPos.y && characterPos.y <= 10) || // 건물 1
          (-7 <= characterPos.x && characterPos.x <= 0 && 5 <= characterPos.y && characterPos.y <= 10) || // 건물 2
          (3 <= characterPos.x && characterPos.x <= 13 && 5 <= characterPos.y && characterPos.y <= 10) || // 건물 3
          (16 <= characterPos.x && characterPos.x <= 23 && 5 <= characterPos.y && characterPos.y <= 10) || // 건물 4
          (-23 <= characterPos.x && characterPos.x <= -14 && -9 <= characterPos.y && characterPos.y <= -2.5) || // 건물 5
          (-12 <= characterPos.x && characterPos.x <= -2.5 && -9 <= characterPos.y && characterPos.y <= -2.5) || // 건물 6
          (6 <= characterPos.x && characterPos.x <= 13 && -9 <= characterPos.y && characterPos.y <= -2.5) || // 건물 7
          (16 <= characterPos.x && characterPos.x <= 23 && -9 <= characterPos.y && characterPos.y <= -2.5) || // 건물 8
          (-21 <= characterPos.x && characterPos.x <= -20 && 2.5 <= characterPos.y && characterPos.y <= 3.5) || // 부쉬 1
          (-15 <= characterPos.x && characterPos.x <= -14 && 2.5 <= characterPos.y && characterPos.y <= 3.5) || // 부쉬 2
          (11 <= characterPos.x && characterPos.x <= 12 && 0.5 <= characterPos.y && characterPos.y <= 1.5) || // 부쉬 3
          (21 <= characterPos.x && characterPos.x <= 22 && 0.5 <= characterPos.y && characterPos.y <= 1.5) || // 부쉬 4
          (-2 <= characterPos.x && characterPos.x <= -1 && -8.5 <= characterPos.y && characterPos.y <= -7.5) || // 부쉬 5
          (4 <= characterPos.x && characterPos.x <= 5 && -8.5 <= characterPos.y && characterPos.y <= -7.5) // 부쉬 6
        ) {
          //console.log('대상이 공격 불가능한 위치에 있어 공격자가 공격할 수 없습니다.');
          return;
        }
      }
    }

    // 카드타입 별로 사용 효과 정의 (1~100: 스킬, 101~200: 소모품, 201~: 장비)
    switch (cardType) {
      // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 // 스킬 1 ~ 100 //

      // 이름: 기본 공격
      // 설명: 그냥 기본 공격 입니다.
      case CardType.SUR5VER_BASIC_SKILL: {
        // 공격 유효성 검증
        if (!target) return;
        if (!attackPossible(user, target, 0)) return;

        // 공격 자원 처리
        user.character.coolDown = Date.now();
        await setRedisData('roomData', rooms);

        // 공격 실행
        await attackTarget(user.id, room.id, 1, target.id);
        sendAnimation(room, target, 1);
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 5;
            break;
          }
        }

        break;
      }
      // 이름: 쌍둥이 폭팔 (마법사 기본 스킬)
      // 설명: Mp소모: 2, 신비로운 마법의 에너지가 적은 두 번 타격한다. 두 번째 타격은 적을 더 강하게 공격한다.
      case CardType.MAGICIAN_BASIC_SKILL: {
        // 공격 유효성 검증
        if (!target) return;
        if (!attackPossible(user, target, 2)) return;

        // 공격 자원 처리
        user.character.coolDown = Date.now();
        user.character.mp -= 2;
        await setRedisData('roomData', rooms);

        // 스킬 실행1
        await attackTarget(user.id, room.id, 1, target.id);
        let index: number | null = null;
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 5;
            index = i;
            break;
          }
        }
        sendAnimation(room, target, 4);

        // 스킬 실행2
        setTimeout(async () => {
          await attackTarget(user.id, room.id, 1.5, target.id);
          if (index) monsterAiDatas[room.id][index].animationDelay = 5;
          sendAnimation(room, target, 4);
        }, 800);

        break;
      }

      // 이름: 차지 샷 (궁수 기본 스킬)
      // 설명: MP소모: 2, 활시위에 집중하여 강력한 화살을 한 방 쏘아낸다.
      case CardType.ARCHER_BASIC_SKILL:
        if (!target) return;
        if (!attackPossible(user, target, 2)) return;

        // 공격 자원 처리
        user.character.coolDown = Date.now();
        user.character.mp -= 2;
        await setRedisData('roomData', rooms);

        // 공격 실행
        await attackTarget(user.id, room.id, 2, target.id);
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 4;
            break;
          }
        }
        sendAnimation(room, target, 5);

        break;

      // 이름: 급습 (도적 기본 스킬) , 애니메이션 번호 : 10번
      // 설명: MP소모: 3, 적의 급소를 노려 치명적인 공격을 한 방 가한다.
      case CardType.ROGUE_BASIC_SKILL:
        if (!target) return;
        if (!attackPossible(user, target, 3)) return;

        // 공격 자원 처리
        user.character.coolDown = Date.now();
        user.character.mp -= 3;
        await setRedisData('roomData', rooms);

        // 공격 실행
        await attackTarget(user.id, room.id, 2.5, target.id);
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 6;
            break;
          }
        }
        sendAnimation(room, target, 6);

        break;

      // 이름: 투사의 결단 (전사 기본 스킬), 애니메이션 번호 : 7
      // 설명: MP소모: 2, 투사의 의지로 방패는 견고해지고 검은 강력해집니다.
      case CardType.WARRIOR_BASIC_SKILL:
        // 공격 유효성 검증
        if (user.character.mp < 2) {
          console.log('마나가 부족합니다.');
          return;
        }

        // 버프 스킬 실행
        await changeStatus(2, user, rooms, room, 0, 2, 2, 15000, CardType.WARRIOR_BASIC_SKILL);
        sendAnimation(room, user, 9);

        break;

      // 이름: 삼중 타격 (마법사 강화 스킬), 애니메이션 번호 : 1
      // 설명: Mp소모: 3, 푸른빛, 보랏빛, 붉은 폭발로 적을 강타한다. 타격마다 에너지가 증폭되어 최종 타격은 압도적인 파괴력을 발휘한다.
      case CardType.MAGICIAN_EXTENDED_SKILL: {
        // 공격 유효성 검증
        if (!target) return;
        if (!attackPossible(user, target, 3)) return;

        // 공격 자원 처리
        user.character.coolDown = Date.now();
        user.character.mp -= 3;
        await setRedisData('roomData', rooms);

        // 스킬 실행1
        await attackTarget(user.id, room.id, 1.2, target.id);
        let index: number | null = null;
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 4;
            index = i;
            break;
          }
        }
        sendAnimation(room, target, 1);

        // 스킬 실행2
        setTimeout(async () => {
          await attackTarget(user.id, room.id, 1.4, target.id);
          if (index) monsterAiDatas[room.id][index].animationDelay = 4;
          sendAnimation(room, target, 1);
        }, 600);

        // 스킬 실행3
        setTimeout(async () => {
          await attackTarget(user.id, room.id, 1.7, target.id);
          if (index) monsterAiDatas[room.id][index].animationDelay = 4;
          sendAnimation(room, target, 1);
        }, 1200);

        break;
      }

      // 이름: 폭풍의 눈 (궁수 강화 스킬), 애니메이션 번호 : ??
      // 설명: Mp소모: 4, 강력한 회오리 바람의 정령을 소환합니다. 정령은 캐릭터를 따라다니며 주변 적을 지속적으로 공격합니다.
      case CardType.ARCHER_EXTENDED_SKILL:
        // 공격 유효성 검증
        if (user.character.mp < 4) {
          console.log('마나가 부족합니다.');
          return;
        }

        // 정령 버프 실행
        await summonSpiritBuff(4, user, room, rooms, 0.8, 5, 2, 15000, 4000, CardType.ARCHER_EXTENDED_SKILL);
        sendAnimation(room, user, 9);
        break;

      // 이름: 그림자의 춤 (도적 강화 스킬), 애니메이션 번호 : ??
      // 설명: Mp소모: 4, 날카로운 그림자 칼날의 정령을 소환합니다. 정령은 캐릭터를 따라다니며 주변 적을 지속적으로 공격합니다.
      case CardType.ROGUE_EXTENDED_SKILL:
        // 공격 유효성 검증
        if (user.character.mp < 4) {
          console.log('마나가 부족합니다.');
          return;
        }

        // 정령 버프 실행
        await summonSpiritBuff(4, user, room, rooms, 1.2, 5, 1, 15000, 4000, CardType.ROGUE_EXTENDED_SKILL);
        sendAnimation(room, user, 9);
        break;

      // 이름: 천둥의 강타 (전사 강화 스킬), 애니메이션 번호 : ??
      // 설명: Mp소모: 3, 천둥의 힘으로 방어를 돌파하고 강력한 일격을 날립니다.
      case CardType.WARRIOR_EXTENDED_SKILL:
        // 공격 유효성 검증
        if (!target) return;
        if (!attackPossible(user, target, 3)) return;

        // 공격 자원 처리
        user.character.coolDown = Date.now();
        user.character.mp -= 3;
        await setRedisData('roomData', rooms);

        // 공격 실행
        await attackTargetTrueDamage(userId, room.id, 3, target.id);
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 6;
            break;
          }
        }
        sendAnimation(room, user, 7);
        break;

      // 이름: 불멸의 폭풍
      // 설명: Mp소모: 4, 강력한 마법 폭풍이 적을 덮친다. 번개와 화염이 뒤엉켜 적에게 치명적인 피해를 입힌다.
      case CardType.MAGICIAN_FINAL_SKILL:
        // 공격 유효성 검증
        if (!target) return;
        if (!attackPossible(user, target, 4)) return;

        // 공격 자원 처리
        user.character.coolDown = Date.now();
        user.character.mp -= 4;
        await setRedisData('roomData', rooms);

        // 스킬 실행
        await attackTarget(user.id, room.id, 6, target.id);
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 6;
            break;
          }
        }
        sendAnimation(room, target, 3);

        break;

      // 이름: 수호의 결단
      // 설명: Mp소모: 5, 전장의 수호자로서 모든 아군에게 일정시간동안 유지되는 불굴의 힘과 방어력을 부여합니다.
      case CardType.ARCHER_FINAL_SKILL:
        // 공격 자원 처리
        user.character.coolDown = Date.now();

        // 버프 실행
        await partyBuff(5, user, rooms, room, 0, 3, 3, 15000, CardType.WARRIOR_FINAL_SKILL);
        for (let i = 0; i < room.users.length; i++) {
          if (room.users[i].character.roleType === RoleType.SUR5VAL) {
            sendAnimation(room, room.users[i], 9);
          }
        }
        break;

      // 이름: 무력화 단검
      // 설명: Mp소모: 5, 단검의 독이 적의 근력을 서서히 마비시킵니다. (일정시간 동안 대상 공격력 감소)
      case CardType.ROGUE_FINAL_SKILL:
        // 공격 유효성 검증
        if (!target) return;
        if (!attackPossible(user, target, 5)) return;

        // 공격 자원 처리
        user.character.coolDown = Date.now();
        user.character.mp -= 5;
        await setRedisData('roomData', rooms);

        // 스킬 실행
        await changeStatus(0, target, rooms, room, 0, 0, -user.character.attack, 10000, CardType.ROGUE_FINAL_SKILL);
        await attackTarget(user.id, room.id, 4, target.id);
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 6;
            break;
          }
        }
        sendAnimation(room, target, 6);
        sendAnimation(room, target, 1);

        break;

      // 이름: 흡혈의 검
      // 설명: Mp소모: 4, 흡혈의 검이 적의 생명력을 흡수하여 전사의 힘을 유지합니다
      case CardType.WARRIOR_FINAL_SKILL:
        // 공격 유효성 검증
        if (!target) return;
        if (!attackPossible(user, target, 4)) return;

        // 공격 자원 처리
        user.character.coolDown = Date.now();
        user.character.mp -= 4;

        // 스킬 실행
        user.character.hp = Math.min(user.character.hp + user.character.attack * 2, user.character.maxHp);
        await setRedisData('roomData', rooms);
        await attackTarget(user.id, room.id, 3, target.id);
        for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
          if (monsterAiDatas[room.id][i].id === target.id) {
            monsterAiDatas[room.id][i].animationDelay = 6;
            break;
          }
        }
        sendAnimation(room, target, 7);
        sendAnimation(room, target, 1);

        break;

      // 이름: 보스 기본 공격
      // 설명: 본인 주위의 적들을 공격합니다.
      case CardType.BOSS_BASIC_SKILL:
        await attackRagne(user, user, rooms, room, 1, 5, 3);
        break;

      // 이름: 대재앙의 강타
      // 설명: Mp소모: 10, 치명적인 일격으로 적을 공격하고, 충격파로 광범위한 피해를 줍니다.
      case CardType.BOSS_EXTENDED_SKILL:
        // 공격 유효성 검증
        if (!target) return;
        const initGameInfo = Server.getInstance().initGameInfo;
        if (!initGameInfo) return;
        const attackCool = initGameInfo[0].attackCool;
        if (Date.now() - user.character.coolDown < attackCool) {
          console.log('공격 쿨타임 중입니다.');
          return;
        }
        if (user.character.mp < 10) {
          console.log('마나가 부족합니다.');
          return;
        }
        if (target.character.roleType !== RoleType.SUR5VAL) {
          console.log('아군을 공격할 수는 없습니다.');
          return;
        }
        if (target.character.hp <= 0) {
          console.log('살아있는 적만 공격할 수 있습니다.');
          return;
        }

        // 공격 자원 처리
        user.character.coolDown = Date.now();
        user.character.mp -= 10;

        // 스킬 실행
        await attackRagne(user, target, rooms, room, 0.6, 4, 3);
        await attackTarget(user.id, room.id, 0.8, target.id);
        sendAnimation(room, target, 4);
        break;

      // 이름: 보스 스킬 더 만들고 싶을 경우
      // 설명: 보스 스킬 더 만들고 싶을 경우
      case CardType.BOSS_FINAL_SKILL:
        console.log('굳이 만들게?');
        break;

      // 소모품 201 ~ 300 // 소모품 201 ~ 300 //  소모품 201 ~ 300 //  소모품 201 ~ 300 //  소모품 201 ~ 300 //  소모품 201 ~ 300 //  소모품 201 ~ 300 //

      // 이름: 순수한 이슬
      // 설명: 맑고 순수한 이슬 한 방울이 체력을 20 회복해준다! 지친 몸에 활력을 더해 다시 전투에 나설 수 있도록 돕는다.
      case CardType.BASIC_HP_POTION:
        await usePotion(user, rooms, room, CardType.BASIC_HP_POTION);
        break;

      // 이름: 마력의 이슬
      // 설명: 맑고 순수한 이슬 한 방울이 마력을 4 회복해준다! 고갈된 마법 에너지를 되살려 새로운 주문을 준비하자.
      case CardType.BASIC_MP_POTION:
        await usePotion(user, rooms, room, CardType.BASIC_MP_POTION);
        break;

      // 이름: 치유의 빛
      // 설명: 은은한 치유의 빛이 체력을 30 회복해준다! 깊은 상처를 어루만지고 전투의 피로를 씻어내는 신비한 물약.
      case CardType.ADVANCED_HP_POTION:
        await usePotion(user, rooms, room, CardType.ADVANCED_HP_POTION);
        break;

      // 이름: 마력의 빛
      // 설명: 은은한 마나의 빛이 마력을 6 회복해준다! 흐릿했던 마법의 기운을 선명하게 채워주는 신비한 물약.
      case CardType.ADVANCED_MP_POTION:
        await usePotion(user, rooms, room, CardType.ADVANCED_MP_POTION);
        break;

      // 이름: 생명의 숨결
      // 설명: 신비로운 생명의 기운이 체력을 50 회복해준다! 생명의 근원이 담긴 이 물약은 가장 극한의 상황에서도 새로운 힘을 불어넣는다.
      case CardType.MASTER_HP_POTION:
        await usePotion(user, rooms, room, CardType.MASTER_HP_POTION);
        break;

      // 이름: 마력의 숨결
      // 설명: 신비로운 마력의 기운이 마력을 10 회복해준다! 극한의 상황에서도 강력한 주문을 사용할 수 있는 힘을 불어넣는다.
      case CardType.MASTER_MP_POTION:
        await usePotion(user, rooms, room, CardType.MASTER_MP_POTION);
        break;

      // 이름: 성장의 작은 불꽃
      // 설명: 작은 불꽃이 당신의 성장을 돕습니다. 경험치 +20
      case CardType.BASIC_EXP_POTION:
        await usePotion(user, rooms, room, CardType.BASIC_EXP_POTION);
        break;

      // 이름: 무한 성장의 불길
      // 설명: 끝없는 불길로 압도적인 성장을 경험하세요. 경험치 +50
      case CardType.MASTER_EXP_POTION:
        await usePotion(user, rooms, room, CardType.MASTER_EXP_POTION);
        break;

      // 이름: 용기의 정수
      // 설명: 한 모금 마시면 두려움이 사라지고 무한한 힘이 깨어납니다. 30초간 공격력 +5
      case CardType.ATTACK_POTION: {
        // 해당 아이템 보유여부 검사 및 개수 차감
        let isOwned: boolean = false;
        for (let i = 0; i < user.character.handCards.length; i++) {
          if (user.character.handCards[i].type === cardType && user.character.handCards[i].count > 0) {
            user.character.handCards[i].count--;
            isOwned = true;
            break;
          }
        }
        if (isOwned === false) {
          console.error('보유중이지 않은 버프 아이템 요청');
          return;
        }

        // 버프 실행
        await changeStatus(0, user, rooms, room, 0, 0, 5, 30000, CardType.ATTACK_POTION);
        break;
      }

      // 이름: 강철의 비약
      // 설명: 한 모금 마시면 몸이 강철처럼 단단해져 적의 공격을 견뎌냅니다. 30초간 방어력 +6
      case CardType.DEFENSE_PORTION:
        // 해당 아이템 보유여부 검사 및 개수 차감
        let isOwned: boolean = false;
        for (let i = 0; i < user.character.handCards.length; i++) {
          if (user.character.handCards[i].type === cardType && user.character.handCards[i].count > 0) {
            user.character.handCards[i].count--;
            isOwned = true;
            break;
          }
        }
        if (isOwned === false) {
          console.error('보유중이지 않은 버프 아이템 요청');
          return;
        }

        // 버프 실행
        await changeStatus(0, user, rooms, room, 0, 6, 0, 30000, CardType.DEFENSE_PORTION);
        break;

      // 장비 301 ~ 400 // 장비 301 ~ 400  / 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 //

      // 이름: 탐험가의 무기
      // 설명: 야생에서 빛을 발하는 무기. 공격력+3
      case CardType.EXPLORER_WEAPON:
        await equipWeapon(user, rooms, room, CardType.EXPLORER_WEAPON);
        break;

      // 이름: 탐험가의 투구
      // 설명: 거친 환경을 견디는 투구. 체력+21
      case CardType.EXPLORER_HEAD:
        await equipItem(user, rooms, room, 0, CardType.EXPLORER_HEAD);
        break;

      // 이름: 탐험가의 갑옷
      // 설명: 유연성과 보호력을 겸비한 갑옷. 방어력+1, 체력+17
      case CardType.EXPLORER_ARMOR:
        await equipItem(user, rooms, room, 1, CardType.EXPLORER_ARMOR);
        break;

      // 이름: 탐험가의 망토
      // 설명: 바람과 비를 막아주는 견고한 망토. 방어력+2, 체력+13
      case CardType.EXPLORER_CLOAK:
        await equipItem(user, rooms, room, 2, CardType.EXPLORER_CLOAK);
        break;

      // 이름: 탐험가의 장갑
      // 설명: 정밀한 손놀림을 돕는 장갑. 공격력+1, 방어력+1, 체력+10
      case CardType.EXPLORER_GLOVE:
        await equipItem(user, rooms, room, 3, CardType.EXPLORER_GLOVE);
        break;

      // 이름: 영웅의 무기
      // 설명: 강력한 적도 제압 가능한 놀라운 무기. 공격력+6
      case CardType.HERO_WEAPON:
        await equipWeapon(user, rooms, room, CardType.HERO_WEAPON);
        break;

      // 이름: 영웅의 투구
      // 설명: 영광스러운 전투를 상징하는 투구. 체력+30
      case CardType.HERO_HEAD:
        await equipItem(user, rooms, room, 0, CardType.HERO_HEAD);
        break;

      // 이름: 영웅의 갑옷
      // 설명: 방어와 위엄을 겸비한 갑옷. 방어력+2, 체력+22
      case CardType.HERO_ARMOR:
        await equipItem(user, rooms, room, 1, CardType.HERO_ARMOR);
        break;

      // 이름: 영웅의 망토
      // 설명: 마법의 힘이 깃든 망토. 방어력+4, 체력+14
      case CardType.HERO_CLOAK:
        await equipItem(user, rooms, room, 2, CardType.HERO_CLOAK);
        break;

      // 이름: 영웅의 장갑
      // 설명: 전투 기술을 극대화하는 장갑. 공격력+2, 방어력+2, 체력+12
      case CardType.HERO_GLOVE:
        await equipItem(user, rooms, room, 3, CardType.HERO_GLOVE);
        break;

      // 이름: 전설의 무기
      // 설명: 신화적 힘이 담긴 무기, 적에게 파멸을 선사한다. 공격력+10
      case CardType.LEGENDARY_WEAPON:
        await equipWeapon(user, rooms, room, CardType.LEGENDARY_WEAPON);
        break;

      // 이름: 전설의 투구
      // 설명: 신성한 보호막을 제공하는 투구, 사용자를 불멸로 이끈다. 체력+40
      case CardType.LEGENDARY_HEAD:
        await equipItem(user, rooms, room, 0, CardType.LEGENDARY_HEAD);
        break;

      // 이름: 전설의 갑옷
      // 설명: 황금빛 문양과 마법이 깃든 최강의 갑옷. 방어력+3, 체력+28
      case CardType.LEGENDARY_ARMOR:
        await equipItem(user, rooms, room, 1, CardType.LEGENDARY_ARMOR);
        break;

      // 이름: 전설의 망토
      // 설명: 우주의 에너지가 깃든 최강의 망토. 방어력+6, 체력+16
      case CardType.LEGENDARY_CLOAK:
        await equipItem(user, rooms, room, 2, CardType.LEGENDARY_CLOAK);
        break;

      // 이름: 전설의 장갑
      // 설명: 신화의 기술과 힘을 담은 승리의 장갑. 공격력+3, 방어력+3, 체력+16
      case CardType.LEGENDARY_GLOVE:
        await equipItem(user, rooms, room, 3, CardType.LEGENDARY_GLOVE);
        break;
    }
  } catch (error) {
    console.error(`useCardHandler ${error as Error}`);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 범위 공격
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
  let bossPosition: position | null = null;
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
      for (let i = 0; i < shoppingUserIdSessions[room.id].length; i++) {
        if (shoppingUserIdSessions[room.id][i][0] === attacker.id) {
          shoppingUserIdSessions[room.id].splice(i, 1);
          break;
        }
      }
    }
    sendAnimation(room, alivePlayers[i][0], 2);
  }

  await setRedisData('roomData', rooms);
  await userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 타겟이 된 적 공격
const attackTarget = async (attackerId: number, roomId: number, skillCoeffcient: number, targetId: number) => {
  // 공격 실행 중 라운드가 바뀌지 않았는지 검사
  const nowRooms = await getRedisData('roomData');
  let isChanged: boolean = true;
  let nowRoom: Room | null = null;
  for (let i = 0; i < nowRooms.length; i++) {
    if (nowRooms[i].id === roomId) {
      nowRoom = nowRooms[i];
      break;
    }
  }
  if (!nowRoom) return;
  for (let i = 0; i < nowRoom.users.length; i++) {
    if (nowRoom.users[i].id === targetId) isChanged = false;
  }
  if (isChanged) {
    console.log('공격 실행 중 라운드 바뀌어서 몬스터 사라짐');
    return;
  }

  // 공격자의 정보 가져오기
  let attacker: User | null = null;
  for (let i = 0; i < nowRoom.users.length; i++) {
    if (nowRoom.users[i].id === attackerId) {
      attacker = nowRoom.users[i];
      break;
    }
  }
  if (!attacker) {
    console.error('공격자의 정보 가져오기에 실패하였습니다.');
    return;
  }

  // 타겟 정보 가져오기
  let target: User | null = null;
  for (let i = 0; i < nowRoom.users.length; i++) {
    if (nowRoom.users[i].id === targetId) {
      target = nowRoom.users[i];
      break;
    }
  }
  if (!target) {
    console.error('타겟의 정보 가져오기에 실패하였습니다.');
    return;
  }

  // 공격 스킬 실행
  const damage = Math.round(attacker.character.attack * skillCoeffcient - target.character.armor);
  target.character.hp = Math.max(target.character.hp - damage, 0);
  if (target.character.aliveState && target.character.hp <= 0) {
    attacker.character.exp += target.character.exp;
    await monsterReward(nowRooms, nowRoom, attacker, target);
  }

  // 보스를 죽였는지 검사
  if (target.character.roleType === RoleType.BOSS_MONSTER && target.character.hp <= 0) {
    await gameEndNotification(roomId, 3);
    return;
  }

  // 생존자를 죽였는지 검사
  if (target.character.roleType === RoleType.SUR5VAL && target.character.hp <= 0) {
    for (let i = 0; i < shoppingUserIdSessions[roomId].length; i++) {
      if (shoppingUserIdSessions[roomId][i][0] === attacker.id) {
        shoppingUserIdSessions[roomId].splice(i, 1);
        break;
      }
    }
    return;
  }

  await setRedisData('roomData', nowRooms);
  await userUpdateNotification(nowRoom);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 타겟이 된 적 공격 (방어력 무시 공격)
const attackTargetTrueDamage = async (
  attackerId: number,
  roomId: number,
  skillCoeffcient: number,
  targetId: number
) => {
  // 공격 실행 중 라운드가 바뀌지 않았는지 검사
  const nowRooms = await getRedisData('roomData');
  let isChanged: boolean = true;
  let nowRoom: Room | null = null;
  for (let i = 0; i < nowRooms.length; i++) {
    if (nowRooms[i].id === roomId) {
      nowRoom = nowRooms[i];
      break;
    }
  }
  if (!nowRoom) return;
  for (let i = 0; i < nowRoom.users.length; i++) {
    if (nowRoom.users[i].id === targetId) isChanged = false;
  }
  if (isChanged) {
    console.log('공격 실행 중 라운드 바뀌어서 몬스터 사라짐');
    return;
  }

  // 공격자의 정보 가져오기
  let attacker: User | null = null;
  for (let i = 0; i < nowRoom.users.length; i++) {
    if (nowRoom.users[i].id === attackerId) {
      attacker = nowRoom.users[i];
      break;
    }
  }
  if (!attacker) {
    console.error('공격자의 정보 가져오기에 실패하였습니다.');
    return;
  }

  // 타겟 정보 가져오기
  let target: User | null = null;
  for (let i = 0; i < nowRoom.users.length; i++) {
    if (nowRoom.users[i].id === targetId) {
      target = nowRoom.users[i];
      break;
    }
  }
  if (!target) {
    console.error('타겟의 정보 가져오기에 실패하였습니다.');
    return;
  }

  // 공격 스킬 실행
  const damage = Math.round(attacker.character.attack * skillCoeffcient);
  target.character.hp = Math.max(target.character.hp - damage, 0);
  if (target.character.aliveState && target.character.hp <= 0) {
    attacker.character.exp += target.character.exp;
    await monsterReward(nowRooms, nowRoom, attacker, target);
  }

  // 보스를 죽였는지 검사
  if (target.character.roleType === RoleType.BOSS_MONSTER && target.character.hp <= 0) {
    await gameEndNotification(roomId, 3);
    return;
  }

  await setRedisData('roomData', nowRooms);
  await userUpdateNotification(nowRoom);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 해당 캐릭터(아군) 버프
const changeStatus = async (
  manaCost: number,
  user: User,
  rooms: Room[],
  room: Room,
  hp: number,
  armor: number,
  attack: number,
  buffTime: number,
  cardType: number
) => {
  // 마나가 충분한지 검사
  if (user.character.mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 이미 버프 상태인지 검사
  if (characterBuffStatus[user.id]) {
    for (let i = 0; i < characterBuffStatus[user.id].length; i++) {
      if (characterBuffStatus[user.id][i] === cardType) {
        console.log('이미 버프 상태입니다.');
        return;
      }
    }
  } else {
    characterBuffStatus[user.id] = [];
  }

  // 버프 스킬 실행
  characterBuffStatus[user.id].push(cardType);
  user.character.mp -= manaCost;
  user.character.hp += hp;
  user.character.maxHp += hp;
  user.character.attack += attack;
  user.character.armor += armor;
  console.log('버프 사용 후: ', characterBuffStatus);
  await setRedisData('roomData', rooms);
  await userUpdateNotification(room);

  // 버프 해제
  setTimeout(async () => {
    // 버프 목록에서 제거
    deleteBuff(user, cardType);

    // 버프 끝나는 시점의 room 정보 찾기
    const nowRooms: Room[] | undefined = await getRedisData('roomData');
    if (nowRooms === undefined) {
      console.error('서버에 Rooms정보가 존재하지 않습니다.');
      return;
    }
    let nowRoom: Room | undefined;
    for (let i = 0; i < nowRooms.length; i++) {
      for (let j = 0; j < nowRooms[i].users.length; j++) {
        if (nowRooms[i].users[j].id === user.id) {
          nowRoom = nowRooms[i];
        }
      }
    }
    if (!nowRoom) {
      console.error('카드 사용자가 속한 room 정보를 찾을 수 없습니다.');
      return;
    }

    // 버프 해제 시점에 기존 게임이 종료된 상태일 경우
    if (nowRoom.id !== room.id) return;

    // 버프 해제 시점의 유저 찾기
    let skillUser: User | null = null;
    for (let i = 0; i < nowRoom.users.length; i++) {
      if (nowRoom.users[i].id === user.id) {
        skillUser = nowRoom.users[i];
        break;
      }
    }
    if (!skillUser) {
      console.error('버프 해제 중 유저 정보를 찾지 못하였습니다.');
      return;
    }

    // 버프 해제 실행
    skillUser.character.hp -= hp;
    skillUser.character.maxHp -= hp;
    skillUser.character.attack -= attack;
    skillUser.character.armor -= armor;
    skillUser.character.hp = Math.min(skillUser.character.hp, skillUser.character.maxHp);

    await setRedisData('roomData', nowRooms);
    await userUpdateNotification(nowRoom);
  }, buffTime);
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
  attack: number,
  buffTime: number,
  cardType: number
) => {
  // 마나가 충분한지 검사
  if (user.character.mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 이미 버프 상태인지 검사
  if (characterBuffStatus[user.id]) {
    for (let i = 0; i < characterBuffStatus[user.id].length; i++) {
      if (characterBuffStatus[user.id][i] === cardType) {
        console.log('이미 버프 상태입니다.');
        return;
      }
    }
  } else {
    characterBuffStatus[user.id] = [];
  }

  // 버프 스킬 실행
  characterBuffStatus[user.id].push(cardType);
  user.character.mp -= manaCost;
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === RoleType.SUR5VAL) {
      room.users[i].character.hp += hp;
      room.users[i].character.maxHp += hp;
      room.users[i].character.attack += attack;
      room.users[i].character.armor += armor;
    }
  }
  console.log('버프 사용 후: ', characterBuffStatus);
  await setRedisData('roomData', rooms);
  await userUpdateNotification(room);

  // 버프 해제
  setTimeout(async () => {
    // 버프 목록에서 제거
    deleteBuff(user, cardType);

    // 버프 끝나는 시점의 room 정보 찾기
    const nowRooms: Room[] | undefined = await getRedisData('roomData');
    if (nowRooms === undefined) {
      console.error('서버에 Rooms정보가 존재하지 않습니다.');
      return;
    }
    let nowRoom: Room | undefined;
    for (let i = 0; i < nowRooms.length; i++) {
      for (let j = 0; j < nowRooms[i].users.length; j++) {
        if (nowRooms[i].users[j].id === user.id) {
          nowRoom = nowRooms[i];
        }
      }
    }
    if (!nowRoom) {
      console.error('카드 사용자가 속한 room 정보를 찾을 수 없습니다.');
      return;
    }

    // 버프 해제 시점에 기존 게임이 종료된 상태일 경우
    if (nowRoom.id !== room.id) {
      console.error('게임이 이미 종료되었습니다.');
      return;
    }

    // 버프 해제 실행
    for (let i = 0; i < nowRoom.users.length; i++) {
      if (nowRoom.users[i].character.roleType === RoleType.SUR5VAL) {
        nowRoom.users[i].character.hp -= hp;
        nowRoom.users[i].character.maxHp -= hp;
        nowRoom.users[i].character.attack -= attack;
        nowRoom.users[i].character.armor -= armor;
        nowRoom.users[i].character.hp = Math.min(nowRoom.users[i].character.hp, nowRoom.users[i].character.maxHp);
      }
    }

    await setRedisData('roomData', nowRooms);
    await userUpdateNotification(nowRoom);
  }, buffTime);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 자신 주변을 일정시간동안 공격하는 버프 (정령 소환 버프)
const summonSpiritBuff = async (
  manaCost: number,
  attacker: User,
  room: Room,
  rooms: Room[],
  skillCoeffcient: number,
  range: number,
  targetNumber: number,
  duration: number,
  attackCool: number,
  cardType: number
) => {
  // 캐릭터의 공격 쿨타임 검사
  const initGameInfo = Server.getInstance().initGameInfo;
  if (!initGameInfo) return;
  const characterAttackCool = initGameInfo[0].attackCool;
  if (Date.now() - attacker.character.coolDown < characterAttackCool) {
    console.log('공격 쿨타임 중입니다.');
    return false;
  }

  // 마나가 충분한지 검사
  if (attacker.character.mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 이미 버프 상태인지 검사
  if (characterBuffStatus[attacker.id]) {
    for (let i = 0; i < characterBuffStatus[attacker.id].length; i++) {
      if (characterBuffStatus[attacker.id][i] === cardType) {
        console.log('이미 버프 상태입니다.');
        return;
      }
    }
  } else {
    characterBuffStatus[attacker.id] = [];
  }

  // 버프 상태 추가
  characterBuffStatus[attacker.id].push(cardType);

  // 마나 소모
  attacker.character.mp -= manaCost;
  await setRedisData('roomData', rooms);
  userUpdateNotification(room);

  // 스킬 정보 생성
  let lastAttack: number = 0;
  let skillFinishTime: number = Date.now() + duration;

  // 버프 스킬 실행
  const attackSkill = setInterval(async () => {
    // 해당 스킬의 쿨타임 검사
    if (Date.now() - lastAttack < attackCool) return;

    // 스킬 지속시간 종료되었는지 확인 및 종료
    if (skillFinishTime < Date.now()) {
      deleteBuff(attacker, cardType);
      clearInterval(attackSkill);
      return;
    }

    // 스킬이 끝나기 전에 게임이 종료되었는지 확인 및 종료
    const nowRooms: Room[] | undefined = await getRedisData('roomData');
    if (nowRooms === undefined) {
      deleteBuff(attacker, cardType);
      clearInterval(attackSkill);
      console.log('스킬 사용자가 속한 room 정보를 찾을 수 없습니다.');
      return;
    }
    let nowRoom: Room | undefined;
    for (let i = 0; i < nowRooms.length; i++) {
      for (let j = 0; j < nowRooms[i].users.length; j++) {
        if (nowRooms[i].users[j].id === attacker.id) {
          nowRoom = nowRooms[i];
        }
      }
    }
    if (!nowRoom) {
      deleteBuff(attacker, cardType);
      clearInterval(attackSkill);
      console.log('스킬 사용자가 속한 room 정보를 찾을 수 없습니다.');
      return;
    }
    if (nowRoom.id !== room.id) {
      deleteBuff(attacker, cardType);
      clearInterval(attackSkill);
      console.log('게임이 이미 종료되어서 스킬을 종료합니다.');
      return;
    }

    // 공격자의 상태 값 얻기
    let skillUser: User | null = null;
    for (let i = 0; i < nowRoom.users.length; i++) {
      if (nowRoom.users[i].id === attacker.id) {
        skillUser = nowRoom.users[i];
      }
    }
    if (!skillUser) return;

    // 공격자가 죽어있으면 종료
    if (skillUser.character.hp <= 0) {
      deleteBuff(attacker, cardType);
      clearInterval(attackSkill);
      console.log('버프 스킬 시전자가 사망하여 정령 버프가 종료되었습니다.');
    }

    // 공격자의 위치 값 얻기
    const characterPositionDatas = await getRedisData('characterPositionDatas');
    const characterPositionData: CharacterPositionData[] = characterPositionDatas[room.id];
    let attackerPosition: CharacterPositionData | null = null;
    for (let i = 0; i < characterPositionData.length; i++) {
      if (characterPositionData[i].id === attacker.id) {
        attackerPosition = characterPositionData[i];
        break;
      }
    }
    if (!attackerPosition) {
      console.error('공격자의 position 값을 찾지 못하였습니다.');
      return;
    }

    const targetMonsters = [];
    // 체력 0 초과의 적 정보 얻기
    for (let i = 0; i < nowRoom.users.length; i++) {
      if (
        (nowRoom.users[i].character.roleType === RoleType.WEAK_MONSTER ||
          nowRoom.users[i].character.roleType === RoleType.BOSS_MONSTER) &&
        nowRoom.users[i].character.hp > 0
      ) {
        let enemyPosition: CharacterPositionData | null = null;
        for (let j = 0; j < characterPositionData.length; j++) {
          if (characterPositionData[j].id === nowRoom.users[i].id) {
            enemyPosition = characterPositionData[j];
            break;
          }
        }

        // 범위 안에 있는 적인지 검사
        if (!enemyPosition) {
          console.error('몬스터의 position 값을 찾지 못하였습니다.');
          return;
        }
        if ((enemyPosition.x - attackerPosition.x) ** 2 + (enemyPosition.y - attackerPosition.y) ** 2 < range ** 2) {
          targetMonsters.push({
            monster: nowRoom.users[i],
            distance: (enemyPosition.x - attackerPosition.x) ** 2 + (enemyPosition.y - attackerPosition.y) ** 2
          });
        }
      }
    }

    // 거리가 가까운 순으로 정렬 후 먼 순서로 삭제
    if (!targetMonsters) return;
    if (targetMonsters.length > targetNumber) {
      targetMonsters.sort((a, b) => a.distance - b.distance);
      targetMonsters.splice(targetNumber);
    }

    // 공격 실행
    for (let i = 0; i < targetMonsters.length; i++) {
      // 딜링 및 애니메이션 재생
      const target = targetMonsters[i].monster.character;
      target.hp = Math.max(target.hp - skillUser.character.attack * skillCoeffcient + target.armor, 0);
      sendAnimation(room, targetMonsters[i].monster, 8);
      for (let j = 0; j < monsterAiDatas[room.id].length; j++) {
        if (monsterAiDatas[room.id][j].id === targetMonsters[i].monster.id) {
          monsterAiDatas[room.id][j].animationDelay = 5;
          break;
        }
      }

      // 처치 검사 하여 보상 획득
      if (target.hp <= 0 && target.aliveState) {
        skillUser.character.exp += target.exp;
        await monsterReward(nowRooms, nowRoom, skillUser, targetMonsters[i].monster);
      }

      // 보스를 죽였는지 검사
      if (target.roleType === RoleType.BOSS_MONSTER && target.hp <= 0) {
        await gameEndNotification(nowRoom.id, 3);
        return;
      }
    }
    lastAttack = Date.now();
    await setRedisData('roomData', nowRooms);
    await userUpdateNotification(nowRoom);
  }, 200);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 본인의 Hp, Mp 회복 / Exp 획득
const usePotion = async (user: User, rooms: Room[], room: Room, cardsType: number) => {
  // 해당 아이템 보유여부 검사 및 개수 차감
  let isOwned: boolean = false;
  for (let i = 0; i < user.character.handCards.length; i++) {
    if (user.character.handCards[i].type === cardsType && user.character.handCards[i].count > 0) {
      user.character.handCards[i].count--;
      isOwned = true;
      break;
    }
  }
  if (isOwned === false) {
    console.error('보유중이지 않은 아이템 요청');
    return;
  }

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
      break;
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
  sendPacket(socketSessions[user.id], config.packetType.USE_CARD_RESPONSE, {
    success: true,
    failCode: 0
  });
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 무기 장착
const equipWeapon = async (user: User, rooms: Room[], room: Room, cardsType: number) => {
  // DB의 카드 생성 정보 가져오기
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
  sendPacket(socketSessions[user.id], config.packetType.USE_CARD_RESPONSE, {
    success: true,
    failCode: 0
  });
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 버프 사용자 목록에서 제거
const deleteBuff = (user: User, buffType: number) => {
  for (let i = 0; i < characterBuffStatus[user.id].length; i++) {
    if (characterBuffStatus[user.id][i] === buffType) {
      characterBuffStatus[user.id].splice(i, 1);
      console.log('삭제 후 남은 버프', characterBuffStatus[user.id]);
      if (characterBuffStatus[user.id].length === 0) {
        delete characterBuffStatus[user.id];
        break;
      }
    }
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 공격 유효성 검증
const attackPossible = (attacker: User, target: User, needMp: number) => {
  const initGameInfo = Server.getInstance().initGameInfo;
  if (!initGameInfo) return;
  const attackCool = initGameInfo[0].attackCool;
  if (Date.now() - attacker.character.coolDown < attackCool) {
    console.log('공격 쿨타임 중입니다.');
    return false;
  }
  if (attacker.character.mp < needMp) {
    console.log('마나가 부족합니다.');
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

/////////////////////////////////////////////////////////////////////////////////////////////////
// 스킬 애니메이션 패킷 보내기
const sendAnimation = (room: Room, animationTarget: User, animationType: number) => {
  for (let i = 0; i < room.users.length; i++) {
    const socket: CustomSocket | undefined = socketSessions[room.users[i].id];
    if (socket) {
      sendPacket(socket, config.packetType.ANIMATION_NOTIFICATION, {
        userId: animationTarget.id,
        animationType: animationType
      });
    }
  }
};
