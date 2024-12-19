import { UserCharacterType, RoleType, CardType } from '../enumTyps.js';
import Server from '../../class/server.js';
import GameRoom from '../../class/room.js';
import UserSessions from '../../class/userSessions.js';

/***
 * - 몬스터 처치 보상 처리 함수
 *
 * 유저가 몬스터 처치시 보상을 받기 위한 함수(레벨업 포함)
 *
 * @param {GameRoom} room - - 데이터를 처리하는 방
 * @param {User} attacker - 유저
 * @param {User} target - 몬스터
 * @returns {Promise<void>} 별도의 반환 값은 없으며, 성공 여부와 메시지를 클라이언트에게 전송.
 */
export const monsterReward = (rooms: GameRoom[], room: GameRoom, attacker: UserSessions, target: UserSessions) => {
  // 데이터 초기화 ----------------------------------------------------------------------
  let logMessage: string = '';
  let rewardSuccess: boolean = true;

  try {
    // 유효성 검사 ----------------------------------------------------------------------
    // room, attacker, target이 존재하는지 확인
    if (!room || !attacker || !target) {
      logMessage = 'room, attacker, target 중 하나가 존재하지 않습니다.';
      rewardSuccess = false;
      return;
    }

    // 데이터 처리 ----------------------------------------------------------------------
    // 보상 처리 로직
    rewardSuccess = setRewards(attacker, target);

    // 보상 성공 유무 확인
    if (!rewardSuccess) {
      logMessage = 'Failed to set rewards';
      return;
    }
    // 보상 성공시 타겟을 죽은 상태로 변경(타겟 사망시 room에서 삭제하도록 바꿀 경우 이곳 수정)
    else {
      const isMonsterRemoved = removeMonsterFromRoom(target.getId(), room);
      if (!isMonsterRemoved) {
        logMessage = `room.monsters에서 몬스터(id:${target.getId()})를 찾을 수 없습니다.`;
        return;
      }
    }

    // 데이터 전송 및 로그 출력 ----------------------------------------------------------------------
  } catch (error) {
    // 에러 발생시 로그 출력
    console.error(`monsterRewardHandler ${error as Error}`);
  } finally {
    // 보상 성공 여부에 따라 로그 출력 및 데이터 저장
    if (rewardSuccess === false) console.error('monsterRewardHandler', logMessage);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////

/***
 * - 몬스터 삭제 함수
 *
 * 유저가 몬스터를 처치시 몬스터를 비활성화 하는 함수
 *
 * @param {number} monsterId - 삭제할 몬스터의 id
 * @param {GameRoom} room - 몬스터가 존재하는 방
 * @returns {boolean} 반환 값을 통해 보상 성공 여부를 알 수 있다.
 */
const removeMonsterFromRoom = (monsterId: number, room: GameRoom): boolean => {
  // users 배열에서 몬스터 찾기
  // monster.id와 mosterId는 같은 값이지만 타입이 다르기 때문에 toString()을 사용하여 비교
  const monsterIndex = room
    .getUsers()
    .findIndex((monster: UserSessions) => monster.getId().toString() === monsterId.toString());

  if (monsterIndex !== -1) {
    // 몬스터 죽은 상태로 변경
    room.getUsers()[monsterIndex].getCharacter().aliveState = false;
    return true;
  }
  return false;
};

/***
 * - 타겟 처치시 보상 처리 함수(필요시 보상 추가 및 수정)
 *
 * 유저가 타겟 처치시 얻는 보상과 관련된 값을 설정해 주는 함수.
 *
 * @param {UserSessions} attacker - 유저
 * @param {UserSessions} target - 처치 대상
 * @returns {boolean} 반환 값을 통해 보상 성공 여부를 알 수 있다.
 */
const setRewards = (attacker: UserSessions, target: UserSessions): boolean => {
  try {
    // 경험치 보상 ---------------------------------------------------------------
    const monsterDBInfo = Server.getInstance().monsterInfo;
    if (!monsterDBInfo) throw new Error('monsterInfo 정보를 불러오는데 실패하였습니다.');

    // 공격자가 SUR5VAL일 경우
    if (attacker.getCharacter().roleType == RoleType.SUR5VAL) {
      do {
        // 현재 경험치 >= 최대 경험치
        if (attacker.getCharacter().exp >= attacker.getCharacter().maxExp) {
          // 레벨업
          attacker.getCharacter().exp -= attacker.getCharacter().maxExp;
          attacker.getCharacter().level++;
          attacker.getCharacter().maxExp = 10 * attacker.getCharacter().level;

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
        }
        // 여전히 현재 경험치가 최대 경험치보다 크다면 반복
      } while (attacker.getCharacter().exp >= attacker.getCharacter().maxExp);

      // 골드 보상 ---------------------------------------------------------------
      // 타겟이 WEAK_MONSTER일 경우
      if ((target.getCharacter().roleType as RoleType) == RoleType.WEAK_MONSTER) {
        // 공격자 골드 획득
        attacker.getCharacter().gold += target.getCharacter().gold;
      } else {
        // console.error('골드 보상 실패');
        return false;
      }
    }
    // 공격자가 BOSS_MONSTER이고 타겟이 SUR5VAL일 경우
    else if (
      attacker.getCharacter().roleType == RoleType.BOSS_MONSTER &&
      target.getCharacter().roleType == RoleType.SUR5VAL
    ) {
      // SUR5VAL의 골드 감소
      target.getCharacter().gold -= Math.floor(target.getCharacter().gold / 2);
    } else {
      console.error('보상 값을 변경할 roleType이 존재하지 않습니다.');
      return false;
    }

    // 공격자가 WEAK_MONSTER가 아닐 경우
    if ((target.getCharacter().roleType as RoleType) !== RoleType.WEAK_MONSTER) {
      // 체력 및 마나 회복 보상 ---------------------------------------------------------------
      // 필요 데이터 선언 및 초기화
      const attackerMaxHp: number = attacker.getCharacter().maxHp;
      const monsterHpRecovery: number =
        monsterDBInfo.find(
          (data) =>
            data.monsterType === target.getCharacter().characterType && data.level === target.getCharacter().level
        )?.hpRecovery ?? 0;

      // 공격자가 SUR5VAL일 경우
      if (attacker.getCharacter().roleType === RoleType.SUR5VAL) {
        // 타겟이 WEAK_MONSTER일 경우
        if ((target.getCharacter().roleType as RoleType) === RoleType.WEAK_MONSTER) {
          // 몬스터 죽일시 체력 회복
          if (attackerMaxHp >= attacker.getCharacter().hp + monsterHpRecovery)
            attacker.getCharacter().hp += monsterHpRecovery;
          // 체력 회복시 체력 값이 최대 체력을 넘어가지 않도록 설정
          else if (attackerMaxHp < attacker.getCharacter().hp + monsterHpRecovery)
            attacker.getCharacter().hp = attackerMaxHp;
          else {
            console.error('생존자가 몬스터를 죽인 뒤 얻는 체력 회복 보상 실패');
            return false;
          }
        } else {
          console.error('생존자의 체력 및 마나 회복 보상 실패');
          return false;
        }
      }
      // 공격자가 BOSS_MONSTER이고 타겟이 SUR5VAL일 경우
      // else if (
      //   attacker.character.roleType === RoleType.BOSS_MONSTER &&
      //   target.character.roleType === RoleType.SUR5VAL
      // ) {
      //   // 인터페이스에 없는 값이므로 임의로 설정
      //   const HP_RECOVERY: number = 100;
      //   const MP_RECOVERY: number = 10;

      //   // 유저 죽일시 체력 회복
      //   if (attackerMaxHp >= attacker.character.hp + HP_RECOVERY) attacker.character.hp += HP_RECOVERY;
      //   // 체력 회복시 체력 값이 최대 체력을 넘어가지 않도록 설정
      //   else if (attackerMaxHp < attacker.character.hp + HP_RECOVERY) attacker.character.hp = attackerMaxHp;
      //   else {
      //     console.error('보스가 생존자를 죽인 뒤 얻는 체력 회복 보상 실패');
      //     return false;
      //   }

      //   // 유저 죽일시 마나 회복
      //   if (attackerMaxMp >= attacker.character.mp + MP_RECOVERY) attacker.character.mp += MP_RECOVERY;
      //   // 마나 회복시 마나 값이 최대 마나를 넘어가지 않도록 설정
      //   else if (attackerMaxMp < attacker.character.mp + MP_RECOVERY) attacker.character.mp = attackerMaxMp;
      //   else {
      //     console.error('보스가 생존자를 죽인 뒤 얻는 마나 회복 보상 실패');
      //     return false;
      //   }
      // }
      else {
        console.error('체력 및 마나 회복 보상 실패');
        return false;
      }
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
 * @param {UserSessions} attacker - 스탯을 증가시킬 유저
 * @param {UserCharacterData} attacker - 스탯을 증가시킬 유저의 데이터
 * @returns {boolean} 반환 값을 통해 스텟 보상 성공 여부를 알 수 있다.
 */

// 캐릭터 타입에 따라 스탯 증가
export const setStatRewards = (attacker: UserSessions): boolean => {
  const levelUpStatDBData = Server.getInstance().characterLevelUpStatInfo;
  if (!levelUpStatDBData) {
    console.error('CharacterLevelUpStatDBData 정보가 존재하지 않습니다.');
    return false;
  }

  // 마법사
  if (attacker.getCharacter().characterType == UserCharacterType.MASK) {
    const MagicianLevelUpStat = levelUpStatDBData.find((data) => data.characterType === UserCharacterType.MASK);
    if (!MagicianLevelUpStat) {
      console.error('마법사의 레벨업 추가 스탯 정보가 존재하지 않습니다.');
      return false;
    }
    attacker.getCharacter().attack += MagicianLevelUpStat.attack;
    attacker.getCharacter().armor += MagicianLevelUpStat.armor;
    attacker.getCharacter().maxHp += MagicianLevelUpStat.hp;
    attacker.getCharacter().hp += MagicianLevelUpStat.hp;

    // 궁수
  } else if (attacker.getCharacter().characterType == UserCharacterType.SWIM_GLASSES) {
    const ArcherLevelUpStat = levelUpStatDBData.find((data) => data.characterType === UserCharacterType.SWIM_GLASSES);
    if (!ArcherLevelUpStat) {
      console.error('궁수의 레벨업 추가 스탯 정보가 존재하지 않습니다.');
      return false;
    }
    attacker.getCharacter().attack += ArcherLevelUpStat.attack;
    attacker.getCharacter().armor += ArcherLevelUpStat.armor;
    attacker.getCharacter().maxHp += ArcherLevelUpStat.hp;
    attacker.getCharacter().hp += ArcherLevelUpStat.hp;

    // 도적
  } else if (attacker.getCharacter().characterType == UserCharacterType.FROGGY) {
    const RougeLevelUpStat = levelUpStatDBData.find((data) => data.characterType === UserCharacterType.FROGGY);
    if (!RougeLevelUpStat) {
      console.error('궁수의 레벨업 추가 스탯 정보가 존재하지 않습니다.');
      return false;
    }
    attacker.getCharacter().attack += RougeLevelUpStat.attack;
    attacker.getCharacter().armor += RougeLevelUpStat.armor;
    attacker.getCharacter().maxHp += RougeLevelUpStat.hp;
    attacker.getCharacter().hp += RougeLevelUpStat.hp;

    // 전사
  } else if (attacker.getCharacter().characterType == UserCharacterType.RED) {
    const WarriorLevelUpStat = levelUpStatDBData.find((data) => data.characterType === UserCharacterType.RED);
    if (!WarriorLevelUpStat) {
      console.error('궁수의 레벨업 추가 스탯 정보가 존재하지 않습니다.');
      return false;
    }
    attacker.getCharacter().attack += WarriorLevelUpStat.attack;
    attacker.getCharacter().armor += WarriorLevelUpStat.armor;
    attacker.getCharacter().maxHp += WarriorLevelUpStat.hp;
    attacker.getCharacter().hp += WarriorLevelUpStat.hp;

    // 예외
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
 * @param {UserSessions} attacker - 스탯을 증가시킬 유저
 * @returns {boolean} 반환 값을 통해 카드 보상 성공 여부를 알 수 있다.
 */
export const setCardRewards = (attacker: UserSessions) => {
  // 레벨업시 특정 레벨을 도달할 때 마다 캐릭터 타입에 따라 카드 보상 지급
  switch (attacker.getCharacter().level) {
    case 3: // 3레벨일 경우
      if (attacker.getCharacter().characterType == UserCharacterType.MASK) {
        attacker.getCharacter().handCards.push({ type: CardType.MAGICIAN_EXTENDED_SKILL, count: 1 });
        attacker.getCharacter().handCards.sort((a, b) => a.type - b.type);
      } else if (attacker.getCharacter().characterType == UserCharacterType.SWIM_GLASSES) {
        attacker.getCharacter().handCards.push({ type: CardType.ARCHER_EXTENDED_SKILL, count: 1 });
        attacker.getCharacter().handCards.sort((a, b) => a.type - b.type);
      } else if (attacker.getCharacter().characterType == UserCharacterType.FROGGY) {
        attacker.getCharacter().handCards.push({ type: CardType.ROGUE_EXTENDED_SKILL, count: 1 });
        attacker.getCharacter().handCards.sort((a, b) => a.type - b.type);
      } else if (attacker.getCharacter().characterType == UserCharacterType.RED) {
        attacker.getCharacter().handCards.push({ type: CardType.WARRIOR_EXTENDED_SKILL, count: 1 });
        attacker.getCharacter().handCards.sort((a, b) => a.type - b.type);
      } else {
        console.log('캐릭터 타입이 존재하지 않습니다.');
        return false;
      }
      break;
    case 5: // 5레벨일 경우
      if (attacker.getCharacter().characterType == UserCharacterType.MASK) {
        attacker.getCharacter().handCards.push({ type: CardType.MAGICIAN_FINAL_SKILL, count: 1 });
        attacker.getCharacter().handCards.sort((a, b) => a.type - b.type);
      } else if (attacker.getCharacter().characterType == UserCharacterType.SWIM_GLASSES) {
        attacker.getCharacter().handCards.push({ type: CardType.ARCHER_FINAL_SKILL, count: 1 });
        attacker.getCharacter().handCards.sort((a, b) => a.type - b.type);
      } else if (attacker.getCharacter().characterType == UserCharacterType.FROGGY) {
        attacker.getCharacter().handCards.push({ type: CardType.ROGUE_FINAL_SKILL, count: 1 });
        attacker.getCharacter().handCards.sort((a, b) => a.type - b.type);
      } else if (attacker.getCharacter().characterType == UserCharacterType.RED) {
        attacker.getCharacter().handCards.push({ type: CardType.WARRIOR_FINAL_SKILL, count: 1 });
        attacker.getCharacter().handCards.sort((a, b) => a.type - b.type);
      } else {
        console.log('캐릭터 타입이 존재하지 않습니다.');
        return false;
      }
      break;
    default:
      // console.log('카드 보상을 받을 수 레벨이 아닙니다.');
      break;
  }
  return true;
};
