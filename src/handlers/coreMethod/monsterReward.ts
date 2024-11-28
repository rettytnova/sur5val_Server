import { UserCharacterType, MonsterCharacterType, CardType } from '../enumTyps.js';
import { Room, User, Card } from '../../interface/interface.js';

const MAX_MP = 10;

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
export const monsterReward = async (room: Room, user: User, monster: User): Promise<void> => {
  // 데이터 초기화 ----------------------------------------------------------------------
  let logMessage: string = '';
  let rewardSuccess: boolean = true;
  try {
    // 몬스터 처치 보상 처리 ----------------------------------------------------------------------
    // 몬스터의 종류에 따라 보상 값을 설정
    switch (monster.character.characterType) {
      case MonsterCharacterType.SHARK: // 상어군
        // rewardSuccess = setRewards(user, 10, 10, null, 1, 1);
        break;
      case MonsterCharacterType.MALANG: // 말랑이
        rewardSuccess = setRewards(user, 10, 10, null, 1, 1);
        break;
      case MonsterCharacterType.PINK: // 핑크군
        rewardSuccess = setRewards(
          user,
          10,
          10,
          [
            { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
            { type: CardType.BASIC_HP_POTION, count: 1 }
          ],
          1,
          1
        );
        break;
      case MonsterCharacterType.DINOSAUR: // 공룡이
        rewardSuccess = setRewards(
          user,
          20,
          20,
          [
            { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
            { type: CardType.BASIC_HP_POTION, count: 3 }
          ],
          2,
          2
        );
        break;
      case MonsterCharacterType.PINK_SLIME: // 핑크슬라임
        rewardSuccess = setRewards(
          user,
          30,
          30,
          [
            { type: CardType.MAGICIAN_BASIC_SKILL, count: 3 },
            { type: CardType.BASIC_HP_POTION, count: 5 }
          ],
          3,
          3
        );
        break;
      default: {
        logMessage = 'monster.character.characterType이 잘못되었습니다.';
        return;
      }
    }
    // 보상 실패시 실행
    if (!rewardSuccess) {
      logMessage = 'Failed to set rewards';
      return;
    }

    // 몬스터를 room에서 삭제 or 죽은 상태로 변경
    const isMonsterRemoved = removeMonsterFromRoom(monster.id, room);
    if (!isMonsterRemoved) {
      logMessage = `room.monsters에서 몬스터(id:${monster.id})를 찾을 수 없습니다.`;
      return;
    }

    // 데이터 전송 및 로그 출력 ----------------------------------------------------------------------
  } catch (error) {
    // 치명적 에러 발생시 로그 출력
    console.error(`monsterRewardHandler ${error as Error}`);
  } finally {
    // 보상 실패 로그 출력
    if (rewardSuccess === false) console.error('monsterRewardHandler', logMessage);
  }
  // 보상 성공 로그 출력
  console.info(
    `'${(user as User).nickname}(id:${(user as User).id})'가 몬스터 '${(monster as User).nickname}(id:${(monster as User).id})'로부터 보상을 받았습니다.`
  );
};

/////////////////////////////////////////////////////////////////////////////////////////////////

/***
 * - 몬스터 삭제 함수
 *
 * 유저가 몬스터를 처치시 몬스터를 삭제하는 함수
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
 * - 몬스터 처치 보상 값 설정 함수
 *
 * 유저가 몬스터 처치시 보상을 받기해 그 값을 설정 함수.
 * 주고 싶지 않은 값은 0으로 설정 하면 된다.(card의 경우 type: 0, count: 0)
 *
 * @param {User} user - 보상을 받을 유저
 * @param {number} gold - 보상으로 주는 골드
 * @param {number} exprience - 보상으로 주는 경험치
 * @param {Card} card - 보상으로 주는 카드
 * @param {number} healthPointRecoveryAmount - 보상으로 주는 체력 회복량
 * @param {number} manaPointRecoveryAmount - 보상으로 주는 마나 회복량
 * @returns {boolean} 반환 값을 통해 보상 성공 여부를 알 수 있다.
 */
const setRewards = (
  user: User,
  gold: number,
  exprience: number,
  cards: Card[] | null,
  healthPointRecoveryAmount: number,
  manaPointRecoveryAmount: number
) => {
  try {
    // 몬스터 죽일시 경험치 지급
    user.character.exp += exprience;

    // 유저의 경험치가 100 이상일 경우 레벨업
    if (user.character.exp >= 10) {
      // 레벨업
      user.character.level += 1;
      // 경험치 초기화
      user.character.exp -= 10;
      // 레벨업시 직업별 스탯 증가
      switch (user.character.characterType) {
        case UserCharacterType.PINK_SLIME: // 핑크슬라임 - 보스
          userLevelUp(user, 25, 10, 25);
          break;
        case UserCharacterType.MASK: // 가면군 - 마법사
          userLevelUp(user, 5, 20, 5);
          break;
        case UserCharacterType.SWIM_GLASSES: // 물안경군 - 궁수
          userLevelUp(user, 5, 15, 10);
          break;
        case UserCharacterType.FROGGY: // 개굴군 - 로그
          userLevelUp(user, 10, 10, 10);
          break;
        case UserCharacterType.RED: // 빨강이 - 성기사
          userLevelUp(user, 10, 5, 15);
          break;
        default: // user.character.characterType이 잘못된 경우 에러 발생
          user.character.level -= 1; // 레벨 업을 시키면 안되는 에러가 발생 했으므로 유저 레벨 -1
          throw new Error('레벨업시 user.character.characterType이 잘못되었습니다.');
      }
    }

    // 몬스터 죽일시 골드 지급
    user.character.gold += gold;

    // 몬스터 죽일시 카드 지급
    if (cards !== null) {
      for (let i = 0; i < cards.length; i++) {
        user.character.handCards.push(cards[i]);
      }
    }

    // 몬스터 죽일시 체력 회복
    if (user.character.maxHp >= user.character.hp + healthPointRecoveryAmount)
      user.character.hp += healthPointRecoveryAmount;
    // 체력 회복시 체력 값이 최대 체력을 넘어가지 않도록 설정
    else if (user.character.maxHp < user.character.hp + healthPointRecoveryAmount)
      user.character.hp = user.character.maxHp;

    // 몬스터 죽일시 마나 회복
    if (MAX_MP >= user.character.mp + manaPointRecoveryAmount) user.character.mp += manaPointRecoveryAmount;
    // 마나 회복시 마나 값이 최대 마나를 넘어가지 않도록 설정
    else if (MAX_MP < user.character.mp + manaPointRecoveryAmount) user.character.mp = MAX_MP;
  } catch (error) {
    // 에러 발생시 로그 출력 후 return false
    console.error(`setRewards ${error as Error}`);
    return false;
  }
  return true;
};

/***
 * - 유저가 레벨업시 스탯을 증가시켜주는 함수
 *
 * 유저가 몬스터 처치시 보상을 받기해 그 값을 설정 함수.
 * 주고 싶지 않은 값은 0으로 설정 하면 된다.
 *
 * @param {User} user - 스탯을 증가시킬 유저
 * @param {number} maxHp - 최대 체력
 * @param {number} attack - 공격력
 * @param {number} armor - 방어력
 * @returns {void} 별도의 반환 값이 존재하지 않는다.
 */
const userLevelUp = (user: User, maxHp: number, attack: number, armor: number) => {
  // 레벨업시 스탯 증가
  user.character.maxHp += maxHp;
  user.character.attack += attack;
  user.character.armor += armor;
};
