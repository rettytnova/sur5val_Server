import { config } from '../../../config/config.js';
import {
  CustomSocket,
  UseCardRequest,
  CharacterPositionData,
  skillCardDBData,
  position
} from '../../../gameServer/interface/interface.js';
import { CardType, RoleType } from '../enumTyps.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { getUserBySocket } from '../handlerMethod.js';
import { socketSessions } from '../../session/socketSession.js';
import { monsterAiDatas } from '../coreMethod/monsterMove.js';
import { gameEndNotification } from '../notification/gameEnd.js';
import Server from '../../class/server.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { dbManager } from '../../../database/user/user.db.js';
import GameRoom from '../../class/room.js';
import UserSessions from '../../class/userSessions.js';
import { userUpdateNotification } from '../notification/userUpdate.js';
import { monsterReward, setCardRewards, setStatRewards } from '../coreMethod/monsterReward.js';

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

  const targetUserId = Number(targetUserIdRaw);
  console.log('cardType: ', cardType);
  try {
    // redisUser 정보 찾기
    const user = getUserBySocket(socket);
    if (!user) {
      console.error('카드 사용자의 정보를 찾을 수 없습니다.');
      return;
    }

    // room 정보 찾기
    const room: GameRoom | undefined = Server.getInstance()
      .getRooms()
      .find((room: GameRoom) => room.getUsers().some((roomUser: UserSessions) => roomUser.getId() === user.getId()));
    if (!room) {
      console.error('카드 사용자가 속한 room 정보를 찾을 수 없습니다.');
      return;
    }

    if (!user || !user.getCharacter()) return;
    if (user.getCharacter().aliveState === false || user.getCharacter().hp <= 0) {
      console.log(
        `죽어있는 대상은 행동을 할 수 없습니다. 상태: ${user.getCharacter().aliveState}, 체력: ${user.getCharacter().hp}`
      );
      return;
    }

    // target 정보 찾기
    let target: UserSessions | null = null;
    for (let i = 0; i < room.getUsers().length; i++) {
      if (room.getUsers()[i].getId() === targetUserId) {
        target = room.getUsers()[i];
      }
    }

    // 캐릭터 위치 정보 찾기
    if (user.getCharacter().roleType === RoleType.SUR5VAL) {
      const characterPositions = Server.getInstance()
        .getPositions()
        .find((PositionSessions) => PositionSessions.getPositionRoomId() === room.getRoomId());
      if (!characterPositions) {
        console.error('characterPositions를 찾지 못하였습니다.');
        return;
      }
      // 공격 가능 여부 확인
      for (let i = 0; i < characterPositions.getCharacterPositions().length; i++) {
        let userPos: CharacterPositionData = characterPositions.getCharacterPositions()[i];
        if (user !== null && userPos.id === user.getId()) {
          if (
            // 공격자가 실외에 위치해 있는 경우
            !(-23 <= userPos.x && userPos.x <= -12 && 5 <= userPos.y && userPos.y <= 10) && // 건물 1
            !(-7 <= userPos.x && userPos.x <= 0 && 5 <= userPos.y && userPos.y <= 10) && // 건물 2
            !(3 <= userPos.x && userPos.x <= 13 && 5 <= userPos.y && userPos.y <= 10) && // 건물 3
            !(16 <= userPos.x && userPos.x <= 23 && 5 <= userPos.y && userPos.y <= 10) && // 건물 4
            !(-23 <= userPos.x && userPos.x <= -14 && -9 <= userPos.y && userPos.y <= -2.5) && // 건물 5
            !(-12 <= userPos.x && userPos.x <= -2.5 && -9 <= userPos.y && userPos.y <= -2.5) && // 건물 6
            !(6 <= userPos.x && userPos.x <= 13 && -9 <= userPos.y && userPos.y <= -2.5) && // 건물 7
            !(16 <= userPos.x && userPos.x <= 23 && -9 <= userPos.y && userPos.y <= -2.5) && // 건물 8
            !(-21 <= userPos.x && userPos.x <= -20 && 2.5 <= userPos.y && userPos.y <= 3.5) && // 부쉬 1
            !(-15 <= userPos.x && userPos.x <= -14 && 2.5 <= userPos.y && userPos.y <= 3.5) && // 부쉬 2
            !(11 <= userPos.x && userPos.x <= 12 && 0.5 <= userPos.y && userPos.y <= 1.5) && // 부쉬 3
            !(21 <= userPos.x && userPos.x <= 22 && 0.5 <= userPos.y && userPos.y <= 1.5) && // 부쉬 4
            !(-2 <= userPos.x && userPos.x <= -1 && -8.5 <= userPos.y && userPos.y <= -7.5) && // 부쉬 5
            !(4 <= userPos.x && userPos.x <= 5 && -8.5 <= userPos.y && userPos.y <= -7.5) // 부쉬 6
          ) {
            for (let j = 0; j < characterPositions.getCharacterPositions().length; j++) {
              let characterPos: CharacterPositionData = characterPositions.getCharacterPositions()[j];
              if (target !== null && characterPos.id === target.getId()) {
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
                  // 타겟이 실내에 위치해 있는 경우
                  return;
                } else {
                  // 타겟이 실외에 위치해 있는 경우
                  break;
                }
              }
            }
          } else {
            // 공격자가 실내에 위치해 있는 경우
            break;
          }
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
        if (!(await attackPossible(CardType.SUR5VER_BASIC_SKILL, user, target, 0))) return;

        // 공격 자원 처리
        user.getCharacter().coolDown = Date.now();

        // 공격 실행
        attackTarget(user.getId(), room.getRoomId(), 1, target.getId());
        sendAnimation(room, target, 1);
        for (let i = 0; i < monsterAiDatas[room.getRoomId()].length; i++) {
          if (monsterAiDatas[room.getRoomId()][i].id === target.getId()) {
            monsterAiDatas[room.getRoomId()][i].animationDelay = 5;
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
        if (!(await attackPossible(CardType.MAGICIAN_BASIC_SKILL, user, target, 2))) return;

        // 공격 자원 처리
        user.getCharacter().coolDown = Date.now();
        user.getCharacter().mp -= 2;

        // 스킬 실행1
        attackTarget(user.getId(), room.getRoomId(), 1, target.getId());
        let index: number | null = null;
        for (let i = 0; i < monsterAiDatas[room.getRoomId()].length; i++) {
          if (monsterAiDatas[room.getRoomId()][i].id === target.getId()) {
            monsterAiDatas[room.getRoomId()][i].animationDelay = 5;
            index = i;
            break;
          }
        }
        sendAnimation(room, target, 3);

        // 스킬 실행2
        setTimeout(async () => {
          attackTarget(user.getId(), room.getRoomId(), 1.5, target.getId());
          if (index) monsterAiDatas[room.getRoomId()][index].animationDelay = 5;
          sendAnimation(room, target, 3);
        }, 800);

        break;
      }

      // 이름: 차지 샷 (궁수 기본 스킬)
      // 설명: MP소모: 2, 활시위에 집중하여 강력한 화살을 한 방 쏘아낸다.
      case CardType.ARCHER_BASIC_SKILL:
        if (!target) return;
        if (!(await attackPossible(CardType.ARCHER_BASIC_SKILL, user, target, 2))) return;

        // 공격 자원 처리
        user.getCharacter().coolDown = Date.now();
        user.getCharacter().mp -= 2;

        // 공격 실행
        attackTarget(user.getId(), room.getRoomId(), 2, target.getId());
        for (let i = 0; i < monsterAiDatas[room.getRoomId()].length; i++) {
          if (monsterAiDatas[room.getRoomId()][i].id === target.getId()) {
            monsterAiDatas[room.getRoomId()][i].animationDelay = 4;
            break;
          }
        }
        sendAnimation(room, target, 5);

        break;

      // 이름: 급습 (도적 기본 스킬)
      // 설명: MP소모: 3, 적의 급소를 노려 치명적인 공격을 한 방 가한다.
      case CardType.ROGUE_BASIC_SKILL:
        if (!target) return;
        if (!(await attackPossible(CardType.ROGUE_BASIC_SKILL, user, target, 3))) return;

        // 공격 자원 처리
        user.getCharacter().coolDown = Date.now();
        user.getCharacter().mp -= 3;

        // 공격 실행
        attackTarget(user.getId(), room.getRoomId(), 2.5, target.getId());
        for (let i = 0; i < monsterAiDatas[room.getRoomId()].length; i++) {
          if (monsterAiDatas[room.getRoomId()][i].id === target.getId()) {
            monsterAiDatas[room.getRoomId()][i].animationDelay = 6;
            break;
          }
        }
        sendAnimation(room, target, 8);

        break;

      // 이름: 투사의 결단 (전사 기본 스킬), 애니메이션 번호 : 7
      // 설명: MP소모: 2, 투사의 의지로 방패는 견고해지고 검은 강력해집니다.
      case CardType.WARRIOR_BASIC_SKILL:
        // 공격 유효성 검증
        if (user.getCharacter().mp < 2) {
          console.log('마나가 부족합니다.');
          return;
        }

        // 버프 스킬 실행
        if (changeStatus(2, user, room, 0, 2, 2, 15000, CardType.WARRIOR_BASIC_SKILL)) {
          sendAnimation(room, user, 6);
        }

        break;

      // 이름: 삼중 타격 (마법사 강화 스킬), 애니메이션 번호 : 1
      // 설명: Mp소모: 3, 푸른빛, 보랏빛, 붉은 폭발로 적을 강타한다. 타격마다 에너지가 증폭되어 최종 타격은 압도적인 파괴력을 발휘한다.
      case CardType.MAGICIAN_EXTENDED_SKILL: {
        // 공격 유효성 검증
        if (!target) return;
        if (!(await attackPossible(CardType.MAGICIAN_EXTENDED_SKILL, user, target, 3))) return;

        // 공격 자원 처리
        user.getCharacter().coolDown = Date.now();
        user.getCharacter().mp -= 3;

        // 스킬 실행1
        attackTarget(user.getId(), room.getRoomId(), 1.2, target.getId());
        let index: number | null = null;
        for (let i = 0; i < monsterAiDatas[room.getRoomId()].length; i++) {
          if (monsterAiDatas[room.getRoomId()][i].id === target.getId()) {
            monsterAiDatas[room.getRoomId()][i].animationDelay = 4;
            index = i;
            break;
          }
        }
        sendAnimation(room, target, 1);

        // 스킬 실행2
        setTimeout(async () => {
          attackTarget(user.getId(), room.getRoomId(), 1.4, target.getId());
          if (index) monsterAiDatas[room.getRoomId()][index].animationDelay = 4;
          sendAnimation(room, target, 1);
        }, 600);

        // 스킬 실행3
        setTimeout(async () => {
          attackTarget(user.getId(), room.getRoomId(), 1.7, target.getId());
          if (index) monsterAiDatas[room.getRoomId()][index].animationDelay = 4;
          sendAnimation(room, target, 1);
        }, 1200);

        break;
      }

      // 이름: 폭풍의 눈 (궁수 강화 스킬), 애니메이션 번호 : ??
      // 설명: Mp소모: 4, 강력한 회오리 바람의 정령을 소환합니다. 정령은 캐릭터를 따라다니며 주변 적을 지속적으로 공격합니다.
      case CardType.ARCHER_EXTENDED_SKILL:
        // 공격 유효성 검증
        if (user.getCharacter().mp < 4) {
          console.log('마나가 부족합니다.');
          return;
        }

        // 정령 버프 실행
        if (await summonSpiritBuff(4, user, room, 0.8, 5, 2, 15000, 4000, CardType.ARCHER_EXTENDED_SKILL)) {
          sendAnimation(room, user, 6);
        }

        break;

      // 이름: 그림자의 춤 (도적 강화 스킬), 애니메이션 번호 : ??
      // 설명: Mp소모: 4, 날카로운 그림자 칼날의 정령을 소환합니다. 정령은 캐릭터를 따라다니며 주변 적을 지속적으로 공격합니다.
      case CardType.ROGUE_EXTENDED_SKILL:
        // 공격 유효성 검증
        if (user.getCharacter().mp < 4) {
          console.log('마나가 부족합니다.');
          return;
        }

        // 정령 버프 실행
        if (await summonSpiritBuff(4, user, room, 1.2, 5, 1, 15000, 4000, CardType.ROGUE_EXTENDED_SKILL)) {
          sendAnimation(room, user, 6);
        }

        break;

      // 이름: 천둥의 강타 (전사 강화 스킬), 애니메이션 번호 : ??
      // 설명: Mp소모: 3, 천둥의 힘으로 방어를 돌파하고 강력한 일격을 날립니다.
      case CardType.WARRIOR_EXTENDED_SKILL:
        // 공격 유효성 검증
        if (!target) return;
        if (!(await attackPossible(CardType.WARRIOR_EXTENDED_SKILL, user, target, 3))) return;

        // 공격 자원 처리
        user.getCharacter().coolDown = Date.now();
        user.getCharacter().mp -= 3;

        // 공격 실행
        attackTargetTrueDamage(user.getId(), room.getRoomId(), 3, target.getId());
        for (let i = 0; i < monsterAiDatas[room.getRoomId()].length; i++) {
          if (monsterAiDatas[room.getRoomId()][i].id === target.getId()) {
            monsterAiDatas[room.getRoomId()][i].animationDelay = 6;
            break;
          }
        }
        sendAnimation(room, target, 10);
        break;

      // 이름: 불멸의 폭풍
      // 설명: Mp소모: 4, 강력한 마법 폭풍이 적을 덮친다. 번개와 화염이 뒤엉켜 적에게 치명적인 피해를 입힌다.
      case CardType.MAGICIAN_FINAL_SKILL:
        // 공격 유효성 검증
        if (!target) return;
        if (!(await attackPossible(CardType.MAGICIAN_FINAL_SKILL, user, target, 4))) return;

        // 공격 자원 처리
        user.getCharacter().coolDown = Date.now();
        user.getCharacter().mp -= 4;

        // 스킬 실행
        attackTarget(user.getId(), room.getRoomId(), 6, target.getId());
        for (let i = 0; i < monsterAiDatas[room.getRoomId()].length; i++) {
          if (monsterAiDatas[room.getRoomId()][i].id === target.getId()) {
            monsterAiDatas[room.getRoomId()][i].animationDelay = 6;
            break;
          }
        }
        sendAnimation(room, target, 4);

        break;

      // 이름: 수호의 결단
      // 설명: Mp소모: 5, 전장의 수호자로서 모든 아군에게 일정시간동안 유지되는 불굴의 힘과 방어력을 부여합니다.
      case CardType.ARCHER_FINAL_SKILL:
        // 공격 자원 처리
        user.getCharacter().coolDown = Date.now();

        // 버프 실행
        partyBuff(5, user, room, 0, 3, 3, 15000, CardType.WARRIOR_FINAL_SKILL);
        for (let i = 0; i < room.getUsers().length; i++) {
          if (room.getUsers()[i].getCharacter().roleType === RoleType.SUR5VAL) {
            sendAnimation(room, room.getUsers()[i], 6);
          }
        }
        break;

      // 이름: 무력화 단검
      // 설명: Mp소모: 5, 단검의 독이 적의 근력을 서서히 마비시킵니다. (일정시간 동안 대상 공격력 감소)
      case CardType.ROGUE_FINAL_SKILL:
        // 공격 유효성 검증
        if (!target) return;
        if (!(await attackPossible(CardType.ROGUE_FINAL_SKILL, user, target, 5))) return;

        // 공격 자원 처리
        user.getCharacter().coolDown = Date.now();
        user.getCharacter().mp -= 5;

        // 스킬 실행
        changeStatus(0, target, room, 0, 0, -user.getCharacter().attack, 10000, CardType.ROGUE_FINAL_SKILL);
        attackTarget(user.getId(), room.getRoomId(), 4, target.getId());
        for (let i = 0; i < monsterAiDatas[room.getRoomId()].length; i++) {
          if (monsterAiDatas[room.getRoomId()][i].id === target.getId()) {
            monsterAiDatas[room.getRoomId()][i].animationDelay = 6;
            break;
          }
        }
        sendAnimation(room, target, 9);

        break;

      // 이름: 흡혈의 검
      // 설명: Mp소모: 4, 흡혈의 검이 적의 생명력을 흡수하여 전사의 힘을 유지합니다
      case CardType.WARRIOR_FINAL_SKILL:
        // 공격 유효성 검증
        if (!target) return;
        if (!(await attackPossible(CardType.WARRIOR_FINAL_SKILL, user, target, 4))) return;

        // 공격 자원 처리
        user.getCharacter().coolDown = Date.now();
        user.getCharacter().mp -= 4;

        // 스킬 실행
        user.getCharacter().hp = Math.min(
          user.getCharacter().hp + user.getCharacter().attack * 2,
          user.getCharacter().maxHp
        );
        attackTarget(user.getId(), room.getRoomId(), 3, target.getId());
        for (let i = 0; i < monsterAiDatas[room.getRoomId()].length; i++) {
          if (monsterAiDatas[room.getRoomId()][i].id === target.getId()) {
            monsterAiDatas[room.getRoomId()][i].animationDelay = 6;
            break;
          }
        }
        sendAnimation(room, target, 9);

        break;

      // 이름: 보스 기본 공격
      // 설명: 본인 주위의 적들을 공격합니다.
      case CardType.BOSS_BASIC_SKILL:
        attackRagne(user, user, room, 1, 5, 3);
        break;

      // 이름: 대재앙의 강타
      // 설명: Mp소모: 10, 치명적인 일격으로 적을 공격하고, 충격파로 광범위한 피해를 줍니다.
      case CardType.BOSS_EXTENDED_SKILL:
        // 공격 유효성 검증
        if (!target) return;
        // 캐릭터의 공격 쿨타임 검사
        const initGameInfo: skillCardDBData = await dbManager.skillCardInfo(cardType);
        if (!initGameInfo) return;

        const characterAttackCool = initGameInfo.coolTime;
        if (Date.now() - user.getCharacter().coolDown < characterAttackCool) {
          console.log('공격 쿨타임 중입니다.');
          return;
        }
        if (user.getCharacter().mp < 10) {
          console.log('마나가 부족합니다.');
          return;
        }
        if (target.getCharacter().roleType !== RoleType.SUR5VAL) {
          console.log('아군을 공격할 수는 없습니다.');
          return;
        }
        if (target.getCharacter().hp <= 0) {
          console.log('살아있는 적만 공격할 수 있습니다.');
          return;
        }

        // 공격 자원 처리
        user.getCharacter().coolDown = Date.now();
        user.getCharacter().mp -= 10;

        // 스킬 실행
        let isRange = attackRagne(user, target, room, 0.6, 4, 3);
        if (isRange) attackTarget(user.getId(), room.getRoomId(), 0.8, target.getId());
        sendAnimation(room, target, 11);
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
        usePotion(user, room, CardType.BASIC_HP_POTION);
        break;

      // 이름: 마력의 이슬
      // 설명: 맑고 순수한 이슬 한 방울이 마력을 4 회복해준다! 고갈된 마법 에너지를 되살려 새로운 주문을 준비하자.
      case CardType.BASIC_MP_POTION:
        usePotion(user, room, CardType.BASIC_MP_POTION);
        break;

      // 이름: 치유의 빛
      // 설명: 은은한 치유의 빛이 체력을 30 회복해준다! 깊은 상처를 어루만지고 전투의 피로를 씻어내는 신비한 물약.
      case CardType.ADVANCED_HP_POTION:
        usePotion(user, room, CardType.ADVANCED_HP_POTION);
        break;

      // 이름: 마력의 빛
      // 설명: 은은한 마나의 빛이 마력을 6 회복해준다! 흐릿했던 마법의 기운을 선명하게 채워주는 신비한 물약.
      case CardType.ADVANCED_MP_POTION:
        usePotion(user, room, CardType.ADVANCED_MP_POTION);
        break;

      // 이름: 생명의 숨결
      // 설명: 신비로운 생명의 기운이 체력을 50 회복해준다! 생명의 근원이 담긴 이 물약은 가장 극한의 상황에서도 새로운 힘을 불어넣는다.
      case CardType.MASTER_HP_POTION:
        usePotion(user, room, CardType.MASTER_HP_POTION);
        break;

      // 이름: 마력의 숨결
      // 설명: 신비로운 마력의 기운이 마력을 10 회복해준다! 극한의 상황에서도 강력한 주문을 사용할 수 있는 힘을 불어넣는다.
      case CardType.MASTER_MP_POTION:
        usePotion(user, room, CardType.MASTER_MP_POTION);
        break;

      // 이름: 성장의 작은 불꽃
      // 설명: 작은 불꽃이 당신의 성장을 돕습니다. 경험치 +20
      case CardType.BASIC_EXP_POTION:
        usePotion(user, room, CardType.BASIC_EXP_POTION);
        break;

      // 이름: 무한 성장의 불길
      // 설명: 끝없는 불길로 압도적인 성장을 경험하세요. 경험치 +50
      case CardType.MASTER_EXP_POTION:
        usePotion(user, room, CardType.MASTER_EXP_POTION);
        break;

      // 이름: 용기의 정수
      // 설명: 한 모금 마시면 두려움이 사라지고 무한한 힘이 깨어납니다. 30초간 공격력 +5
      case CardType.ATTACK_POTION: {
        // 해당 아이템 보유여부 검사 및 개수 차감
        let isOwned: boolean = false;
        for (let i = 0; i < user.getCharacter().handCards.length; i++) {
          if (user.getCharacter().handCards[i].type === cardType && user.getCharacter().handCards[i].count > 0) {
            user.getCharacter().handCards[i].count--;
            isOwned = true;
            break;
          }
        }
        if (isOwned === false) {
          console.error('보유중이지 않은 버프 아이템 요청');
          return;
        }

        // 버프 실행
        changeStatus(0, user, room, 0, 0, 5, 30000, CardType.ATTACK_POTION);
        break;
      }

      // 이름: 강철의 비약
      // 설명: 한 모금 마시면 몸이 강철처럼 단단해져 적의 공격을 견뎌냅니다. 30초간 방어력 +6
      case CardType.DEFENSE_PORTION:
        // 해당 아이템 보유여부 검사 및 개수 차감
        let isOwned: boolean = false;
        for (let i = 0; i < user.getCharacter().handCards.length; i++) {
          if (user.getCharacter().handCards[i].type === cardType && user.getCharacter().handCards[i].count > 0) {
            user.getCharacter().handCards[i].count--;
            isOwned = true;
            break;
          }
        }
        if (isOwned === false) {
          console.error('보유중이지 않은 버프 아이템 요청');
          return;
        }

        // 버프 실행
        changeStatus(0, user, room, 0, 6, 0, 30000, CardType.DEFENSE_PORTION);
        break;

      // 장비 301 ~ 400 // 장비 301 ~ 400  / 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 // 장비 301 ~ 400 //

      // 이름: 탐험가의 무기
      // 설명: 야생에서 빛을 발하는 무기. 공격력+3
      case CardType.EXPLORER_WEAPON:
        equipWeapon(user, room, CardType.EXPLORER_WEAPON);
        break;

      // 이름: 탐험가의 투구
      // 설명: 거친 환경을 견디는 투구. 체력+21
      case CardType.EXPLORER_HEAD:
        equipItem(user, room, 0, CardType.EXPLORER_HEAD);
        break;

      // 이름: 탐험가의 갑옷
      // 설명: 유연성과 보호력을 겸비한 갑옷. 방어력+1, 체력+17
      case CardType.EXPLORER_ARMOR:
        equipItem(user, room, 1, CardType.EXPLORER_ARMOR);
        break;

      // 이름: 탐험가의 망토
      // 설명: 바람과 비를 막아주는 견고한 망토. 방어력+2, 체력+13
      case CardType.EXPLORER_CLOAK:
        equipItem(user, room, 2, CardType.EXPLORER_CLOAK);
        break;

      // 이름: 탐험가의 장갑
      // 설명: 정밀한 손놀림을 돕는 장갑. 공격력+1, 방어력+1, 체력+10
      case CardType.EXPLORER_GLOVE:
        equipItem(user, room, 3, CardType.EXPLORER_GLOVE);
        break;

      // 이름: 영웅의 무기
      // 설명: 강력한 적도 제압 가능한 놀라운 무기. 공격력+6
      case CardType.HERO_WEAPON:
        equipWeapon(user, room, CardType.HERO_WEAPON);
        break;

      // 이름: 영웅의 투구
      // 설명: 영광스러운 전투를 상징하는 투구. 체력+30
      case CardType.HERO_HEAD:
        equipItem(user, room, 0, CardType.HERO_HEAD);
        break;

      // 이름: 영웅의 갑옷
      // 설명: 방어와 위엄을 겸비한 갑옷. 방어력+2, 체력+22
      case CardType.HERO_ARMOR:
        equipItem(user, room, 1, CardType.HERO_ARMOR);
        break;

      // 이름: 영웅의 망토
      // 설명: 마법의 힘이 깃든 망토. 방어력+4, 체력+14
      case CardType.HERO_CLOAK:
        equipItem(user, room, 2, CardType.HERO_CLOAK);
        break;

      // 이름: 영웅의 장갑
      // 설명: 전투 기술을 극대화하는 장갑. 공격력+2, 방어력+2, 체력+12
      case CardType.HERO_GLOVE:
        equipItem(user, room, 3, CardType.HERO_GLOVE);
        break;

      // 이름: 전설의 무기
      // 설명: 신화적 힘이 담긴 무기, 적에게 파멸을 선사한다. 공격력+10
      case CardType.LEGENDARY_WEAPON:
        equipWeapon(user, room, CardType.LEGENDARY_WEAPON);
        break;

      // 이름: 전설의 투구
      // 설명: 신성한 보호막을 제공하는 투구, 사용자를 불멸로 이끈다. 체력+40
      case CardType.LEGENDARY_HEAD:
        equipItem(user, room, 0, CardType.LEGENDARY_HEAD);
        break;

      // 이름: 전설의 갑옷
      // 설명: 황금빛 문양과 마법이 깃든 최강의 갑옷. 방어력+3, 체력+28
      case CardType.LEGENDARY_ARMOR:
        equipItem(user, room, 1, CardType.LEGENDARY_ARMOR);
        break;

      // 이름: 전설의 망토
      // 설명: 우주의 에너지가 깃든 최강의 망토. 방어력+6, 체력+16
      case CardType.LEGENDARY_CLOAK:
        equipItem(user, room, 2, CardType.LEGENDARY_CLOAK);
        break;

      // 이름: 전설의 장갑
      // 설명: 신화의 기술과 힘을 담은 승리의 장갑. 공격력+3, 방어력+3, 체력+16
      case CardType.LEGENDARY_GLOVE:
        equipItem(user, room, 3, CardType.LEGENDARY_GLOVE);
        break;
    }
  } catch (error) {
    console.error(`useCardHandler ${error as Error}`);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 범위 공격
const attackRagne = (
  attacker: UserSessions,
  center: UserSessions,
  room: GameRoom,
  skillCoeffcient: number,
  range: number,
  maxTarget: number
) => {
  // 살아있는 플레이어 추출
  const alivePlayers: [UserSessions, number][] = [];
  for (let i = 0; i < room.getUsers().length; i++) {
    if (room.getUsers()[i].getCharacter().roleType === RoleType.SUR5VAL && room.getUsers()[i].getCharacter().hp > 0) {
      alivePlayers.push([room.getUsers()[i], 0]);
    }
  }

  // 중심 위치 조회
  const characterPositions = Server.getInstance()
    .getPositions()
    .find((PositionSessions) => PositionSessions.getPositionRoomId() === room.getRoomId());
  if (characterPositions === undefined) return false;
  const positionDatas: CharacterPositionData[] | undefined = characterPositions.getCharacterPositions();
  if (positionDatas === undefined) return false;
  let bossPosition: position | null = null;
  for (let i = 0; i < positionDatas.length; i++) {
    if (center.getId() === positionDatas[i].id) {
      bossPosition = { x: positionDatas[i].x, y: positionDatas[i].y };
      break;
    }
  }
  if (!bossPosition) return false;

  // 보스와의 거리가 너무 먼 alivePlayer를 splice 처리
  for (let i = 0; i < alivePlayers.length; i++) {
    for (let j = 0; j < positionDatas.length; j++) {
      if (alivePlayers[i][0].getId() === positionDatas[j].id) {
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
  let isAttack: boolean = false;
  for (let i = 0; i < alivePlayers.length; i++) {
    // 공격 가능 여부 확인
    for (let j = 0; j < characterPositions.getCharacterPositions().length; j++) {
      let attackerPos: CharacterPositionData = characterPositions.getCharacterPositions()[j];
      if (attacker !== null && attackerPos.id === attacker.getId()) {
        if (
          // 공격자가 실외에 위치해 있는 경우
          !(-23 <= attackerPos.x && attackerPos.x <= -12 && 5 <= attackerPos.y && attackerPos.y <= 10) && // 건물 1
          !(-7 <= attackerPos.x && attackerPos.x <= 0 && 5 <= attackerPos.y && attackerPos.y <= 10) && // 건물 2
          !(3 <= attackerPos.x && attackerPos.x <= 13 && 5 <= attackerPos.y && attackerPos.y <= 10) && // 건물 3
          !(16 <= attackerPos.x && attackerPos.x <= 23 && 5 <= attackerPos.y && attackerPos.y <= 10) && // 건물 4
          !(-23 <= attackerPos.x && attackerPos.x <= -14 && -9 <= attackerPos.y && attackerPos.y <= -2.5) && // 건물 5
          !(-12 <= attackerPos.x && attackerPos.x <= -2.5 && -9 <= attackerPos.y && attackerPos.y <= -2.5) && // 건물 6
          !(6 <= attackerPos.x && attackerPos.x <= 13 && -9 <= attackerPos.y && attackerPos.y <= -2.5) && // 건물 7
          !(16 <= attackerPos.x && attackerPos.x <= 23 && -9 <= attackerPos.y && attackerPos.y <= -2.5) && // 건물 8
          !(-21 <= attackerPos.x && attackerPos.x <= -20 && 2.5 <= attackerPos.y && attackerPos.y <= 3.5) && // 부쉬 1
          !(-15 <= attackerPos.x && attackerPos.x <= -14 && 2.5 <= attackerPos.y && attackerPos.y <= 3.5) && // 부쉬 2
          !(11 <= attackerPos.x && attackerPos.x <= 12 && 0.5 <= attackerPos.y && attackerPos.y <= 1.5) && // 부쉬 3
          !(21 <= attackerPos.x && attackerPos.x <= 22 && 0.5 <= attackerPos.y && attackerPos.y <= 1.5) && // 부쉬 4
          !(-2 <= attackerPos.x && attackerPos.x <= -1 && -8.5 <= attackerPos.y && attackerPos.y <= -7.5) && // 부쉬 5
          !(4 <= attackerPos.x && attackerPos.x <= 5 && -8.5 <= attackerPos.y && attackerPos.y <= -7.5) // 부쉬 6
        ) {
          for (let k = 0; k < characterPositions.getCharacterPositions().length; k++) {
            let characterPos: CharacterPositionData = characterPositions.getCharacterPositions()[k];
            if (alivePlayers[i][0] !== null && characterPos.id === alivePlayers[i][0].getId()) {
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
                // 타겟이 실내에 위치해 있는 경우
                isAttack = false;
              } else {
                // 타겟이 실외에 위치해 있는 경우
                isAttack = true;
                break;
              }
            }
          }
        } else {
          // 공격자가 실내에 위치해 있는 경우
          isAttack = true;
          break;
        }
      }
    }

    if (isAttack) {
      const damage = Math.max(
        attacker.getCharacter().attack * skillCoeffcient - alivePlayers[i][0].getCharacter().armor,
        0
      );
      alivePlayers[i][0].getCharacter().hp -= Math.round(damage);
      if (alivePlayers[i][0].getCharacter().hp <= 0) {
        alivePlayers[i][0].getCharacter().aliveState = false;
        alivePlayers[i][0].getCharacter().stateInfo.state = 15;
        alivePlayers[i][0].getCharacter().hp = 0;
        for (let i = 0; i < shoppingUserIdSessions[room.getRoomId()].length; i++) {
          if (shoppingUserIdSessions[room.getRoomId()][i][0] === attacker.getId()) {
            shoppingUserIdSessions[room.getRoomId()].splice(i, 1);
            break;
          }
        }
      }
      sendAnimation(room, alivePlayers[i][0], 2);
    }
  }

  userUpdateNotification(room);

  return true;
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 타겟이 된 적 공격
const attackTarget = (attackerId: number, roomId: number, skillCoeffcient: number, targetId: number) => {
  // 공격 실행 중 라운드가 바뀌지 않았는지 검사
  const nowRooms = Server.getInstance().getRooms();
  let isChanged: boolean = true;
  let nowRoom: GameRoom | null = null;
  for (let i = 0; i < nowRooms.length; i++) {
    if (nowRooms[i].getRoomId() === roomId) {
      nowRoom = nowRooms[i];
      break;
    }
  }
  if (!nowRoom) return;
  for (let i = 0; i < nowRoom.getUsers().length; i++) {
    if (nowRoom.getUsers()[i].getId() === targetId) isChanged = false;
  }
  if (isChanged) {
    console.log('공격 실행 중 라운드 바뀌어서 몬스터 사라짐');
    return;
  }

  // 공격자의 정보 가져오기
  let attacker: UserSessions | null = null;
  for (let i = 0; i < nowRoom.getUsers().length; i++) {
    if (nowRoom.getUsers()[i].getId() === attackerId) {
      attacker = nowRoom.getUsers()[i];
      break;
    }
  }
  if (!attacker) {
    console.error('공격자의 정보 가져오기에 실패하였습니다.');
    return;
  }

  // 타겟 정보 가져오기
  let target: UserSessions | null = null;
  for (let i = 0; i < nowRoom.getUsers().length; i++) {
    if (nowRoom.getUsers()[i].getId() === targetId) {
      target = nowRoom.getUsers()[i];
      break;
    }
  }
  if (!target) {
    console.error('타겟의 정보 가져오기에 실패하였습니다.');
    return;
  }

  // 공격 스킬 실행
  const damage = Math.round(attacker.getCharacter().attack * skillCoeffcient - target.getCharacter().armor);
  target.getCharacter().hp = Math.max(target.getCharacter().hp - damage, 0);
  if (target.getCharacter().aliveState && target.getCharacter().hp <= 0) {
    attacker.getCharacter().exp += target.getCharacter().exp;
    monsterReward(nowRooms, nowRoom, attacker, target);
  }

  // 보스를 죽였는지 검사
  if (target.getCharacter().roleType === RoleType.BOSS_MONSTER && target.getCharacter().hp <= 0) {
    gameEndNotification(roomId, 3);
    return;
  }

  // 생존자를 죽였는지 검사
  if (target.getCharacter().roleType === RoleType.SUR5VAL && target.getCharacter().hp <= 0) {
    for (let i = 0; i < shoppingUserIdSessions[roomId].length; i++) {
      if (shoppingUserIdSessions[roomId][i][0] === attacker.getId()) {
        shoppingUserIdSessions[roomId].splice(i, 1);
        break;
      }
    }
    return;
  }

  userUpdateNotification(nowRoom);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 타겟이 된 적 공격 (방어력 무시 공격)
const attackTargetTrueDamage = (attackerId: number, roomId: number, skillCoeffcient: number, targetId: number) => {
  // 공격 실행 중 라운드가 바뀌지 않았는지 검사
  const nowRooms = Server.getInstance().getRooms();
  let isChanged: boolean = true;
  let nowRoom: GameRoom | null = null;
  for (let i = 0; i < nowRooms.length; i++) {
    if (nowRooms[i].getRoomId() === roomId) {
      nowRoom = nowRooms[i];
      break;
    }
  }
  if (!nowRoom) return;
  for (let i = 0; i < nowRoom.getUsers().length; i++) {
    if (nowRoom.getUsers()[i].getId() === targetId) isChanged = false;
  }
  if (isChanged) {
    console.log('공격 실행 중 라운드 바뀌어서 몬스터 사라짐');
    return;
  }

  // 공격자의 정보 가져오기
  let attacker: UserSessions | null = null;
  for (let i = 0; i < nowRoom.getUsers().length; i++) {
    if (nowRoom.getUsers()[i].getId() === attackerId) {
      attacker = nowRoom.getUsers()[i];
      break;
    }
  }
  if (!attacker) {
    console.error('공격자의 정보 가져오기에 실패하였습니다.');
    return;
  }

  // 타겟 정보 가져오기
  let target: UserSessions | null = null;
  for (let i = 0; i < nowRoom.getUsers().length; i++) {
    if (nowRoom.getUsers()[i].getId() === targetId) {
      target = nowRoom.getUsers()[i];
      break;
    }
  }
  if (!target) {
    console.error('타겟의 정보 가져오기에 실패하였습니다.');
    return;
  }

  // 공격 스킬 실행
  const damage = Math.round(attacker.getCharacter().attack * skillCoeffcient);
  target.getCharacter().hp = Math.max(target.getCharacter().hp - damage, 0);
  if (target.getCharacter().aliveState && target.getCharacter().hp <= 0) {
    attacker.getCharacter().exp += target.getCharacter().exp;
    monsterReward(nowRooms, nowRoom, attacker, target);
  }

  // 보스를 죽였는지 검사
  if (target.getCharacter().roleType === RoleType.BOSS_MONSTER && target.getCharacter().hp <= 0) {
    gameEndNotification(roomId, 3);
    return;
  }

  userUpdateNotification(nowRoom);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 해당 캐릭터(아군) 버프
const changeStatus = (
  manaCost: number,
  user: UserSessions,
  room: GameRoom,
  hp: number,
  armor: number,
  attack: number,
  buffTime: number,
  cardType: number
) => {
  // 마나가 충분한지 검사
  if (user.getCharacter().mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 이미 버프 상태인지 검사
  if (characterBuffStatus[user.getId()]) {
    for (let i = 0; i < characterBuffStatus[user.getId()].length; i++) {
      if (characterBuffStatus[user.getId()][i] === cardType) {
        console.log('이미 버프 상태입니다.');
        return;
      }
    }
  } else {
    characterBuffStatus[user.getId()] = [];
  }

  // 버프 스킬 실행
  characterBuffStatus[user.getId()].push(cardType);
  user.getCharacter().mp -= manaCost;
  user.getCharacter().hp += hp;
  user.getCharacter().maxHp += hp;
  user.getCharacter().attack += attack;
  user.getCharacter().armor += armor;
  console.log('버프 사용 후: ', characterBuffStatus);
  userUpdateNotification(room);

  // 버프 해제
  setTimeout(async () => {
    // 버프 목록에서 제거
    deleteBuff(user, cardType);

    // 버프 끝나는 시점의 room 정보 찾기
    const nowRooms: GameRoom[] | undefined = Server.getInstance().getRooms();
    if (nowRooms === undefined) {
      console.error('서버에 Rooms정보가 존재하지 않습니다.');
      return;
    }
    let nowRoom: GameRoom | undefined;
    for (let i = 0; i < nowRooms.length; i++) {
      for (let j = 0; j < nowRooms[i].getUsers().length; j++) {
        if (nowRooms[i].getUsers()[j].getId() === user.getId()) {
          nowRoom = nowRooms[i];
        }
      }
    }
    if (!nowRoom) {
      console.error('카드 사용자가 속한 room 정보를 찾을 수 없습니다.');
      return;
    }

    // 버프 해제 시점에 기존 게임이 종료된 상태일 경우
    if (nowRoom.getRoomId() !== room.getRoomId()) return;

    // 버프 해제 시점의 유저 찾기
    let skillUser: UserSessions | null = null;
    for (let i = 0; i < nowRoom.getUsers().length; i++) {
      if (nowRoom.getUsers()[i].getId() === user.getId()) {
        skillUser = nowRoom.getUsers()[i];
        break;
      }
    }
    if (!skillUser) {
      console.error('버프 해제 중 유저 정보를 찾지 못하였습니다.');
      return;
    }

    // 버프 해제 실행
    skillUser.getCharacter().hp -= hp;
    skillUser.getCharacter().maxHp -= hp;
    skillUser.getCharacter().attack -= attack;
    skillUser.getCharacter().armor -= armor;
    skillUser.getCharacter().hp = Math.min(skillUser.getCharacter().hp, skillUser.getCharacter().maxHp);

    userUpdateNotification(nowRoom);
  }, buffTime);

  return true;
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 파티 버프 (모든 아군 캐릭터 능력치 변동)
const partyBuff = (
  manaCost: number,
  user: UserSessions,
  room: GameRoom,
  hp: number,
  armor: number,
  attack: number,
  buffTime: number,
  cardType: number
) => {
  // 마나가 충분한지 검사
  if (user.getCharacter().mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 이미 버프 상태인지 검사
  if (characterBuffStatus[user.getId()]) {
    for (let i = 0; i < characterBuffStatus[user.getId()].length; i++) {
      if (characterBuffStatus[user.getId()][i] === cardType) {
        console.log('이미 버프 상태입니다.');
        return;
      }
    }
  } else {
    characterBuffStatus[user.getId()] = [];
  }

  // 버프 스킬 실행
  characterBuffStatus[user.getId()].push(cardType);
  user.getCharacter().mp -= manaCost;
  for (let i = 0; i < room.getUsers().length; i++) {
    if (room.getUsers()[i].getCharacter().roleType === RoleType.SUR5VAL) {
      room.getUsers()[i].getCharacter().hp += hp;
      room.getUsers()[i].getCharacter().maxHp += hp;
      room.getUsers()[i].getCharacter().attack += attack;
      room.getUsers()[i].getCharacter().armor += armor;
    }
  }
  console.log('버프 사용 후: ', characterBuffStatus);
  userUpdateNotification(room);

  // 버프 해제
  setTimeout(async () => {
    // 버프 목록에서 제거
    deleteBuff(user, cardType);

    // 버프 끝나는 시점의 room 정보 찾기
    const nowRooms: GameRoom[] | undefined = Server.getInstance().getRooms();
    if (nowRooms === undefined) {
      console.error('서버에 Rooms정보가 존재하지 않습니다.');
      return;
    }
    let nowRoom: GameRoom | undefined;
    for (let i = 0; i < nowRooms.length; i++) {
      for (let j = 0; j < nowRooms[i].getUsers().length; j++) {
        if (nowRooms[i].getUsers()[j].getId() === user.getId()) {
          nowRoom = nowRooms[i];
        }
      }
    }
    if (!nowRoom) {
      console.error('카드 사용자가 속한 room 정보를 찾을 수 없습니다.');
      return;
    }

    // 버프 해제 시점에 기존 게임이 종료된 상태일 경우
    if (nowRoom.getRoomId() !== room.getRoomId()) {
      console.error('게임이 이미 종료되었습니다.');
      return;
    }

    // 버프 해제 실행
    for (let i = 0; i < nowRoom.getUsers().length; i++) {
      if (nowRoom.getUsers()[i].getCharacter().roleType === RoleType.SUR5VAL) {
        nowRoom.getUsers()[i].getCharacter().hp -= hp;
        nowRoom.getUsers()[i].getCharacter().maxHp -= hp;
        nowRoom.getUsers()[i].getCharacter().attack -= attack;
        nowRoom.getUsers()[i].getCharacter().armor -= armor;
        nowRoom.getUsers()[i].getCharacter().hp = Math.min(
          nowRoom.getUsers()[i].getCharacter().hp,
          nowRoom.getUsers()[i].getCharacter().maxHp
        );
      }
    }

    userUpdateNotification(nowRoom);
  }, buffTime);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 자신 주변을 일정시간동안 공격하는 버프 (정령 소환 버프)
const summonSpiritBuff = async (
  manaCost: number,
  attacker: UserSessions,
  room: GameRoom,
  skillCoeffcient: number,
  range: number,
  targetNumber: number,
  duration: number,
  attackCool: number,
  cardType: number
) => {
  // 캐릭터의 공격 쿨타임 검사
  const initGameInfo: skillCardDBData = await dbManager.skillCardInfo(cardType);
  if (!initGameInfo) return;

  const characterAttackCool = initGameInfo.coolTime;
  if (Date.now() - attacker.getCharacter().coolDown < characterAttackCool) {
    console.log('공격 쿨타임 중입니다.');
    return;
  }

  // 마나가 충분한지 검사
  if (attacker.getCharacter().mp < manaCost) {
    console.log('마나가 부족합니다.');
    return;
  }

  // 이미 버프 상태인지 검사
  if (characterBuffStatus[attacker.getId()]) {
    for (let i = 0; i < characterBuffStatus[attacker.getId()].length; i++) {
      if (characterBuffStatus[attacker.getId()][i] === cardType) {
        console.log('이미 버프 상태입니다.');
        return;
      }
    }
  } else {
    characterBuffStatus[attacker.getId()] = [];
  }

  // 버프 상태 추가
  characterBuffStatus[attacker.getId()].push(cardType);

  // 마나 소모
  attacker.getCharacter().mp -= manaCost;
  userUpdateNotification(room);

  // 스킬 정보 생성
  let lastAttack: number = 0;
  let skillFinishTime: number = Date.now() + duration;

  // 버프 스킬 실행
  const attackSkill = setInterval(async () => {
    // 소환된 정령의 스킬 쿨타임 검사
    if (Date.now() - lastAttack < attackCool) return;

    // 스킬 지속시간 종료되었는지 확인 및 종료
    if (skillFinishTime < Date.now()) {
      deleteBuff(attacker, cardType);
      clearInterval(attackSkill);
      return;
    }

    // 스킬이 끝나기 전에 게임이 종료되었는지 확인 및 종료
    const nowRooms: GameRoom[] | undefined = Server.getInstance().getRooms();
    if (nowRooms === undefined) {
      deleteBuff(attacker, cardType);
      clearInterval(attackSkill);
      console.log('스킬 사용자가 속한 room 정보를 찾을 수 없습니다.');
      return;
    }
    let nowRoom: GameRoom | undefined;
    for (let i = 0; i < nowRooms.length; i++) {
      for (let j = 0; j < nowRooms[i].getUsers().length; j++) {
        if (nowRooms[i].getUsers()[j].getId() === attacker.getId()) {
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
    if (nowRoom.getRoomId() !== room.getRoomId()) {
      deleteBuff(attacker, cardType);
      clearInterval(attackSkill);
      console.log('게임이 이미 종료되어서 스킬을 종료합니다.');
      return;
    }

    // 공격자의 상태 값 얻기
    let skillUser: UserSessions | null = null;
    for (let i = 0; i < nowRoom.getUsers().length; i++) {
      if (nowRoom.getUsers()[i].getId() === attacker.getId()) {
        skillUser = nowRoom.getUsers()[i];
      }
    }
    if (!skillUser) return;

    // 공격자가 죽어있으면 종료
    if (skillUser.getCharacter().hp <= 0) {
      deleteBuff(attacker, cardType);
      clearInterval(attackSkill);
      console.log('버프 스킬 시전자가 사망하여 정령 버프가 종료되었습니다.');
    }

    // 공격자의 위치 값 얻기
    const positionSessions = Server.getInstance()
      .getPositions()
      .find((PositionSessions) => PositionSessions.getPositionRoomId() === room.getRoomId());
    if (!positionSessions) {
      console.error('characterPositionData를 찾지 못하였습니다.');
      return;
    }
    const characterPositionData = positionSessions.getCharacterPositions();
    let attackerPosition: CharacterPositionData | null = null;
    for (let i = 0; i < characterPositionData.length; i++) {
      if (characterPositionData[i].id === attacker.getId()) {
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
    for (let i = 0; i < nowRoom.getUsers().length; i++) {
      if (
        (nowRoom.getUsers()[i].getCharacter().roleType === RoleType.WEAK_MONSTER ||
          nowRoom.getUsers()[i].getCharacter().roleType === RoleType.BOSS_MONSTER) &&
        nowRoom.getUsers()[i].getCharacter().hp > 0
      ) {
        let enemyPosition: CharacterPositionData | null = null;
        for (let j = 0; j < characterPositionData.length; j++) {
          if (characterPositionData[j].id === nowRoom.getUsers()[i].getId()) {
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
            monster: nowRoom.getUsers()[i],
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
      const target = targetMonsters[i].monster.getCharacter();
      target.hp = Math.max(target.hp - skillUser.getCharacter().attack * skillCoeffcient + target.armor, 0);
      sendAnimation(room, targetMonsters[i].monster, 7);
      for (let j = 0; j < monsterAiDatas[room.getRoomId()].length; j++) {
        if (monsterAiDatas[room.getRoomId()][j].id === targetMonsters[i].monster.getId()) {
          monsterAiDatas[room.getRoomId()][j].animationDelay = 5;
          break;
        }
      }

      // 처치 검사 하여 보상 획득
      if (target.hp <= 0 && target.aliveState) {
        skillUser.getCharacter().exp += target.exp;
        monsterReward(nowRooms, nowRoom, skillUser, targetMonsters[i].monster);
      }

      // 보스를 죽였는지 검사
      if (target.roleType === RoleType.BOSS_MONSTER && target.hp <= 0) {
        gameEndNotification(nowRoom.getRoomId(), 3);
        return;
      }
    }
    lastAttack = Date.now();
    await userUpdateNotification(nowRoom);
  }, 200);

  return true;
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 본인의 Hp, Mp 회복 / Exp 획득
const usePotion = (user: UserSessions, room: GameRoom, cardsType: number) => {
  // 해당 아이템 보유여부 검사 및 개수 차감
  let isOwned: boolean = false;
  for (let i = 0; i < user.getCharacter().handCards.length; i++) {
    if (user.getCharacter().handCards[i].type === cardsType && user.getCharacter().handCards[i].count > 0) {
      user.getCharacter().handCards[i].count--;
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
  const characterStatInfo = characterStatInfos.find((data) => data.characterType === user.getCharacter().characterType);
  if (!characterStatInfo) {
    console.error('유저 캐릭터 초기 정보를 찾을 수 없습니다.');
    return;
  }
  user.getCharacter().hp = Math.min(user.getCharacter().hp + potionData.hp, user.getCharacter().maxHp);
  user.getCharacter().mp = Math.min(user.getCharacter().mp + potionData.mp, characterStatInfo.mp);
  user.getCharacter().exp += potionData.exp;

  // 레벨업 확인
  while (user.getCharacter().exp >= user.getCharacter().maxExp) {
    user.getCharacter().exp -= user.getCharacter().maxExp;
    user.getCharacter().level += 1;
    user.getCharacter().maxExp += 10;
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

  userUpdateNotification(room);
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 방어구 장착 equipType (0: 투구, 1: 갑옷, 2: 망토, 3: 장갑)
const equipItem = (
  user: UserSessions,

  room: GameRoom,
  equipIndex: number,
  cardsType: number
) => {
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
  for (let i = 0; i < user.getCharacter().handCards.length; i++) {
    if (user.getCharacter().handCards[i].type === cardsType && user.getCharacter().handCards[i].count > 0) {
      user.getCharacter().handCards[i].count--;
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
  if (
    ![302, 303, 304, 305].includes(user.getCharacter().equips[equipIndex]) &&
    user.getCharacter().equips[equipIndex]
  ) {
    // 장착칸 → handCards로 옮기기
    let isInHandCards: boolean = false;
    for (let i = 0; i < user.getCharacter().handCards.length; i++) {
      if (user.getCharacter().handCards[i].type === user.getCharacter().equips[equipIndex]) {
        user.getCharacter().handCards[i].count++;
        isInHandCards = true;
        break;
      }
    }
    if (isInHandCards === false)
      user.getCharacter().handCards.push({ type: user.getCharacter().equips[equipIndex], count: 1 });

    // 능력치 하락
    const prevEquipCard = equipCardDBInfo.find((data) => data.cardType === user.getCharacter().equips[equipIndex]);
    if (prevEquipCard) {
      user.getCharacter().attack -= prevEquipCard.attack;
      user.getCharacter().armor -= prevEquipCard.armor;
      user.getCharacter().maxHp -= prevEquipCard.hp;
      user.getCharacter().hp -= prevEquipCard.hp;
    }
  }

  // 새로운 방어구 장착 및 능력치 상승
  user.getCharacter().equips[equipIndex] = cardsType;
  user.getCharacter().attack += equipCard.attack;
  user.getCharacter().armor += equipCard.armor;
  user.getCharacter().maxHp += equipCard.hp;
  user.getCharacter().hp += equipCard.hp;

  userUpdateNotification(room);
  sendPacket(socketSessions[user.getId()], config.packetType.USE_CARD_RESPONSE, {
    success: true,
    failCode: 0
  });
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 무기 장착
const equipWeapon = (user: UserSessions, room: GameRoom, cardsType: number) => {
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
  for (let i = 0; i < user.getCharacter().handCards.length; i++) {
    if (user.getCharacter().handCards[i].type === cardsType && user.getCharacter().handCards[i].count > 0) {
      user.getCharacter().handCards[i].count--;
      isOwned = true;
      break;
    }
  }
  if (isOwned === false) return;

  // // 장착중이던 무기 해제
  if (user.getCharacter().weapon !== 301 && user.getCharacter().weapon) {
    // 장착칸 → handCards로 옮기기
    let isInHandCards: boolean = false;
    for (let i = 0; i < user.getCharacter().handCards.length; i++) {
      if (user.getCharacter().handCards[i].type === user.getCharacter().weapon) {
        user.getCharacter().handCards[i].count++;
        isInHandCards = true;
        break;
      }
    }
    if (isInHandCards === false) user.getCharacter().handCards.push({ type: user.getCharacter().weapon, count: 1 });

    // 능력치 하락
    const prevEquipCard = equipCardDBInfo.find((data) => data.cardType === user.getCharacter().weapon);
    if (prevEquipCard) {
      user.getCharacter().attack -= prevEquipCard.attack;
      user.getCharacter().armor -= prevEquipCard.armor;
      user.getCharacter().maxHp -= prevEquipCard.hp;
      user.getCharacter().hp -= prevEquipCard.hp;
    }
  }

  // 새로운 무기 장착 및 능력치 상승
  user.getCharacter().weapon = cardsType;
  user.getCharacter().attack += weaponCard.attack;
  user.getCharacter().armor += weaponCard.armor;
  user.getCharacter().maxHp += weaponCard.hp;
  user.getCharacter().hp += weaponCard.hp;

  userUpdateNotification(room);
  sendPacket(socketSessions[user.getId()], config.packetType.USE_CARD_RESPONSE, {
    success: true,
    failCode: 0
  });
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 버프 사용자 목록에서 제거
const deleteBuff = (user: UserSessions, buffType: number) => {
  for (let i = 0; i < characterBuffStatus[user.getId()].length; i++) {
    if (characterBuffStatus[user.getId()][i] === buffType) {
      characterBuffStatus[user.getId()].splice(i, 1);
      console.log('삭제 후 남은 버프', characterBuffStatus[user.getId()]);
      if (characterBuffStatus[user.getId()].length === 0) {
        delete characterBuffStatus[user.getId()];
        break;
      }
    }
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 공격 유효성 검증
const attackPossible = async (cardType: CardType, attacker: UserSessions, target: UserSessions, needMp: number) => {
  // 캐릭터의 공격 쿨타임 검사
  const initGameInfo: skillCardDBData = await dbManager.skillCardInfo(cardType);
  if (!initGameInfo) return false;

  const characterAttackCool = initGameInfo.coolTime;
  if (Date.now() - attacker.getCharacter().coolDown < characterAttackCool) {
    console.log('공격 쿨타임 중입니다.');
    return false;
  }
  if (attacker.getCharacter().mp < needMp) {
    console.log('마나가 부족합니다.');
    return false;
  }
  if (target.getCharacter().roleType === RoleType.SUR5VAL) {
    console.log('아군을 공격할 수는 없습니다.');
    return false;
  }
  if (target.getCharacter().hp <= 0) {
    console.log('살아있는 적만 공격할 수 있습니다.');
    return false;
  }

  return true;
};

/////////////////////////////////////////////////////////////////////////////////////////////////
// 스킬 애니메이션 패킷 보내기
const sendAnimation = (room: GameRoom, animationTarget: UserSessions, animationType: number) => {
  for (let i = 0; i < room.getUsers().length; i++) {
    const socket: CustomSocket | undefined = socketSessions[room.getUsers()[i].getId()];
    if (socket) {
      sendPacket(socket, config.packetType.ANIMATION_NOTIFICATION, {
        userId: animationTarget.getId(),
        animationType: animationType
      });
    }
  }
};
