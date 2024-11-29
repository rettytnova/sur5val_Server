import { UserCharacterType, MonsterCharacterType, RoleType, CardType } from '../enumTyps.js';
import { UserCharacterInitData, MonsterInitData, Room, User, Card } from '../../interface/interface.js';
import { userCharacterData } from '../../handlers/game/gamePrepareHandler.js';
import { monsterDatas } from '../../handlers/coreMethod/monsterSpawn.js';
import { monsterLevel } from '../../handlers/game/gameStartHandler.js';

/***
 * - 몬스터 처치 보상 처리 함수
 *
 * 유저가 몬스터 처치시 보상을 받기 위한 함수(레벨업 포함)
 *
 * @param {Room} room - - 데이터를 처리하는 방
 * @param {User} user - 유저
 * @param {User} monster - 몬스터
 * @returns {Promise<void>} 별도의 반환 값은 없으며, 성공 여부와 메시지를 클라이언트에게 전송.
 */
export const monsterReward = async (room: Room, attacker: User, target: User): Promise<void> => {
  // 데이터 초기화 ----------------------------------------------------------------------
  let logMessage: string = '';
  let rewardSuccess: boolean = true;
  let attackerInitData: UserCharacterInitData | null = null;
  let targetInitData: UserCharacterInitData | MonsterInitData | null = null;

  try {
    // 유효성 검사 ----------------------------------------------------------------------
    // room, attacker, target이 존재하는지 확인
    if (!room || !attacker || !target) {
      logMessage = 'room, attacker, target 중 하나가 존재하지 않습니다.';
      rewardSuccess = false;
      return;
    }

    // 데이터 처리 ----------------------------------------------------------------------
    // attacker의 characterType에 따라 attacker의 초기 데이터를 가져옴
    attackerInitData = userCharacterData[attacker.character.characterType]
      ? userCharacterData[attacker.character.characterType]
      : null;

    // attacker의 roleType에 따라 target의 초기 데이터를 가져옴
    if (attacker.character.roleType === RoleType.SUR5VAL) {
      targetInitData = monsterDatas[target.character.characterType][monsterLevel]
        ? monsterDatas[target.character.characterType][monsterLevel]
        : null;
    } else if (attacker.character.roleType === RoleType.BOSS_MONSTER) {
      targetInitData = userCharacterData[target.character.characterType]
        ? userCharacterData[target.character.characterType]
        : null;
    }

    // 보상 처리 로직
    rewardSuccess = setRewards(
      attacker,
      target,
      attackerInitData as UserCharacterInitData,
      targetInitData as UserCharacterInitData | MonsterInitData
    );

    // 보상 성공 유무 확인
    if (!rewardSuccess) {
      logMessage = 'Failed to set rewards';
      return;
    }
    // 보상 성공시 몬스터를 죽은 상태로 변경(몬스터 사망시 room에서 삭제하게될 경우 이곳 수정)
    else {
      const isMonsterRemoved = removeMonsterFromRoom(target.id, room);
      if (!isMonsterRemoved) {
        logMessage = `room.monsters에서 몬스터(id:${target.id})를 찾을 수 없습니다.`;
        return;
      }
    }

    // 데이터 전송 및 로그 출력 ----------------------------------------------------------------------
  } catch (error) {
    // 에러 발생시 로그 출력
    console.error(`monsterRewardHandler ${error as Error}`);
  } finally {
    // 보상 실패 로그 출력
    if (rewardSuccess === false) console.error('monsterRewardHandler', logMessage);
    // 보상 성공 로그 출력
    else
      console.info(
        `'${(attacker as User).nickname}(id:${(attacker as User).id})'가 타겟 '${(target as User).nickname}(id:${(target as User).id})'로부터 보상을 받았습니다.`
      );
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////

/***
 * - 몬스터 삭제 함수
 *
 * 유저가 몬스터를 처치시 몬스터를 비활성화 하는 함수
 *
 * @param {number} monsterId - 삭제할 몬스터의 id
 * @param {Room} room - 몬스터가 존재하는 방
 * @returns {boolean} 반환 값을 통해 보상 성공 여부를 알 수 있다.
 */
const removeMonsterFromRoom = (monsterId: number, room: Room): boolean => {
  // users 배열에서 몬스터 찾기
  // monster.id와 mosterId는 같은 값이지만 타입이 다르기 때문에 toString()을 사용하여 비교
  const monsterIndex = room.users.findIndex((monster) => monster.id.toString() === monsterId.toString());

  if (monsterIndex !== -1) {
    // 몬스터 죽은 상태로 변경
    room.users[monsterIndex].character.aliveState = false;
    return true;
  }
  return false;
};

/***
 * - 타겟 처치시 보상 처리 함수(필요시 보상 추가 및 수정)
 *
 * 유저가 타겟 처치시 얻는 보상과 관련된 값을 설정해 주는 함수.
 *
 * @param {User} attacker - 유저
 * @param {UserCharacterInitData} target - 처치 대상
 * @param {UserCharacterInitData} attackerInitData - 보상 받을 유저의 초기 데이터
 * @param {UserCharacterInitData | MonsterInitData} targetInitData - 처치 대상의 초기 데이터
 * @returns {boolean} 반환 값을 통해 보상 성공 여부를 알 수 있다.
 */
const setRewards = (
  attacker: User,
  target: User,
  attackerInitData: UserCharacterInitData,
  targetInitData: UserCharacterInitData | MonsterInitData
): boolean => {
  try {
    // 경험치 보상 ---------------------------------------------------------------
    if (attacker.character.roleType == RoleType.SUR5VAL) {
      let maxExp: number = 0;
      do {
        // 최대 경험치 = 유저의 초기 경험치 * 유저의 레벨
        maxExp = attackerInitData.exp * attacker.character.level;
        // 현재 경험치 = 현재 경험치 + 초기 값으로 설정된 몬스터가 주는 경험치
        attacker.character.exp += targetInitData.exp;

        // 현재 경험치 >= 최대 경험치
        if (attacker.character.exp >= maxExp) {
          // 현재 경험치 = 현재 경험치 - 최대 경험치
          attacker.character.exp -= maxExp;
          // 레벨업
          attacker.character.level += 1;
          // 레벨업시 직업별 스탯 증가
          if (!setStatRewards(attacker)) {
            console.error('setStatRewards 실패');
            return false;
          }
          // 레벨업시 직업별 카드 보상 지급
          else if (!setCardRewards(attacker)) {
            console.error('setCardRewards 실패');
            return false;
          }

          console.log(
            `레벨업! '${(attacker as User).nickname}(id:${(attacker as User).id})'가 ${attacker.character.level}레벨이 되었습니다.`
          );
        }
        // 여전히 현재 경험치가 최대 경험치보다 크다면 반복
      } while (attacker.character.exp > maxExp);
    }

    // 골드 보상 ---------------------------------------------------------------
    // 공격자가 SUR5VAL이고 타겟이 WEAK_MONSTER일 경우
    if (attacker.character.roleType == RoleType.SUR5VAL && target.character.roleType == RoleType.WEAK_MONSTER)
      attacker.character.gold += targetInitData.gold;
    // 공격자가 SUR5VAL이고 타겟이 BOSS_MONSTER이고 경우
    else if (attacker.character.roleType == RoleType.SUR5VAL && target.character.roleType == RoleType.BOSS_MONSTER)
      attacker.character.gold += targetInitData.gold;

    // 체력 및 마나 회복 보상 ---------------------------------------------------------------
    // 공격자가 SUR5VAL일 경우
    if (attacker.character.roleType == RoleType.SUR5VAL) {
      // 타겟이 WEAK_MONSTER일 경우
      if (target.character.roleType == RoleType.WEAK_MONSTER) {
        // 몬스터 죽일시 체력 회복
        if (attackerInitData.hp >= attacker.character.hp + (targetInitData as MonsterInitData).hpRecovery)
          attacker.character.hp += (targetInitData as MonsterInitData).hpRecovery;
        // 체력 회복시 체력 값이 최대 체력을 넘어가지 않도록 설정
        else if (attackerInitData.hp < attacker.character.hp + (targetInitData as MonsterInitData).hpRecovery)
          attacker.character.hp = attackerInitData.hp;

        // 몬스터 죽일시 마나 회복
        if (attackerInitData.mp >= attacker.character.mp + (targetInitData as MonsterInitData).mpRecovery)
          attacker.character.mp += (targetInitData as MonsterInitData).mpRecovery;
        // 마나 회복시 마나 값이 최대 마나를 넘어가지 않도록 설정
        else if (attackerInitData.mp < attacker.character.mp + (targetInitData as MonsterInitData).mpRecovery)
          attacker.character.mp = attackerInitData.mp;
      }
      // 타겟이 BOSS_MONSTER일 경우
      else if (target.character.roleType == RoleType.BOSS_MONSTER) {
        // 인터페이스에 없는 값이므로 임의로 설정
        const HP_RECOVERY: number = 100;
        const MP_RECOVERY: number = 10;

        // 보스 죽일시 체력 회복
        if (attackerInitData.hp >= attacker.character.hp + HP_RECOVERY) attacker.character.hp += HP_RECOVERY;
        // 체력 회복시 체력 값이 최대 체력을 넘어가지 않도록 설정
        else if (attackerInitData.hp < attacker.character.hp + HP_RECOVERY) attacker.character.hp = attackerInitData.hp;

        // 보스 죽일시 마나 회복
        if (attackerInitData.mp >= attacker.character.mp + MP_RECOVERY) attacker.character.mp += MP_RECOVERY;
        // 마나 회복시 마나 값이 최대 마나를 넘어가지 않도록 설정
        else if (attackerInitData.mp < attacker.character.mp + MP_RECOVERY) attacker.character.mp = attackerInitData.mp;
      }
    }
    // 공격자가 BOSS_MONSTER이고 타겟이 SUR5VAL일 경우
    else if (attacker.character.roleType == RoleType.BOSS_MONSTER && target.character.roleType == RoleType.SUR5VAL) {
      // 인터페이스에 없는 값이므로 임의로 설정
      const HP_RECOVERY: number = 100;
      const MP_RECOVERY: number = 10;

      // 유저 죽일시 체력 회복
      if (attackerInitData.hp >= attacker.character.hp + HP_RECOVERY) attacker.character.hp += HP_RECOVERY;
      // 체력 회복시 체력 값이 최대 체력을 넘어가지 않도록 설정
      else if (attackerInitData.hp < attacker.character.hp + HP_RECOVERY) attacker.character.hp = attackerInitData.hp;

      // 유저 죽일시 마나 회복
      if (attackerInitData.mp >= attacker.character.mp + MP_RECOVERY) attacker.character.mp += MP_RECOVERY;
      // 마나 회복시 마나 값이 최대 마나를 넘어가지 않도록 설정
      else if (attackerInitData.mp < attacker.character.mp + MP_RECOVERY) attacker.character.mp = attackerInitData.mp;
    }
  } catch (error) {
    // 에러 발생시 로그 출력 후 return false
    console.error(`setRewards ${error as Error}`);
    return false;
  }
  return true;
};

/***
 * - 유저가 레벨업시 스탯을 증가시켜주는 함수(필요시 레벨업 스탯 추가 및 수정)
 *
 * 유저가 레벨업시 변화가 일어나는 값을 설정해주는 함수
 *
 * @param {User} attacker - 스탯을 증가시킬 유저
 * @returns {boolean} 반환 값을 통해 스텟 보상 성공 여부를 알 수 있다.
 */
const setStatRewards = (attacker: User): boolean => {
  // 캐릭터 타입에 따라 스탯 증가
  if (attacker.character.characterType == UserCharacterType.MASK) {
    attacker.character.maxHp += attacker.character.level * 3;
    attacker.character.attack += 10;
    attacker.character.armor += 1;
  } else if (attacker.character.characterType == UserCharacterType.SWIM_GLASSES) {
    attacker.character.maxHp += attacker.character.level * 5;
    attacker.character.attack += 8;
    attacker.character.armor += 3;
  } else if (attacker.character.characterType == UserCharacterType.FROGGY) {
    attacker.character.maxHp += attacker.character.level * 8;
    attacker.character.attack += 6;
    attacker.character.armor += 5;
  } else if (attacker.character.characterType == UserCharacterType.RED) {
    attacker.character.maxHp += attacker.character.level * 10;
    attacker.character.attack += 3;
    attacker.character.armor += 8;
  } else {
    console.log('캐릭터 타입이 존재하지 않습니다.');
    return false;
  }
  return true;
};

/***
 * - 유저가 레벨업시 카드 보상을 지급 해주는 함수(필요시 카드 추가 및 수정)
 *
 * 유저가 레벨업시 보상 받는 카드의 값을 설정해주는 함수
 *
 * @param {User} attacker - 스탯을 증가시킬 유저
 * @returns {boolean} 반환 값을 통해 카드 보상 성공 여부를 알 수 있다.
 */
const setCardRewards = (attacker: User) => {
  // 레벨업시 특정 레벨을 도달할 때 마다 캐릭터 타입에 따라 카드 보상 지급
  switch (attacker.character.level) {
    case 3: // 3레벨일 경우
      if (attacker.character.characterType == UserCharacterType.MASK) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else if (attacker.character.characterType == UserCharacterType.SWIM_GLASSES) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else if (attacker.character.characterType == UserCharacterType.FROGGY) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else if (attacker.character.characterType == UserCharacterType.RED) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else {
        console.log('캐릭터 타입이 존재하지 않습니다.');
        return false;
      }
      break;
    case 5: // 5레벨일 경우
      if (attacker.character.characterType == UserCharacterType.MASK) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else if (attacker.character.characterType == UserCharacterType.SWIM_GLASSES) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else if (attacker.character.characterType == UserCharacterType.FROGGY) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else if (attacker.character.characterType == UserCharacterType.RED) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else {
        console.log('캐릭터 타입이 존재하지 않습니다.');
        return false;
      }
      break;
    case 7: // 7레벨일 경우
      if (attacker.character.characterType == UserCharacterType.MASK) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else if (attacker.character.characterType == UserCharacterType.SWIM_GLASSES) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else if (attacker.character.characterType == UserCharacterType.FROGGY) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else if (attacker.character.characterType == UserCharacterType.RED) {
        attacker.character.handCards.push({ type: CardType.MAGICIAN_BASIC_SKILL, count: 1 });
      } else {
        console.log('캐릭터 타입이 존재하지 않습니다.');
        return false;
      }
      break;
    default: // 카드 보상을 받을 수 있는 레벨이 아닐 경우
      console.log('카드 보상을 받을 수 레벨이 아닙니다.');
      break;
  }
  return true;
};
