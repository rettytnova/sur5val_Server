import { config } from '../../config/config.js';
import { getUserBySocket, getRedisData, setRedisData } from '../../handlers/handlerMethod.js';
import { sendPacket } from '../../packet/createPacket.js';
import { GlobalFailCode, UserCharacterType, MonsterCharacterType } from '../enumTyps.js';
import {
  CustomSocket,
  Room,
  User,
  Card,
  MonsterDeathRewardRequest,
  MonsterDeathRewardResponse
} from '../../interface/interface.js';
import { userUpdateNotification } from '../notification/userUpdate.js';

const MAX_MP = 10;

const { packetType } = config;
const isProcessing = new Map<string, boolean>();

/***
 * - 몬스터 처치 보상 요청(request) 함수
 *
 * 유저가 몬스터 처치시 보상을 받기 위한 요청을 처리하는 함수.
 *
 * @param {CustomSocket} socket - 요청 데이터의 소켓
 * @param {Object} param.payload - 요청 데이터의 페이로드
 * @returns {Promise<void>} 별도의 반환 값은 없으며, 성공 여부와 메시지를 클라이언트에게 전송.
 */
export const monsterRewardHandler = async (socket: CustomSocket, payload: Object): Promise<void> => {
  // 데이터 초기화 ----------------------------------------------------------------------
  // 요청 데이터 초기화
  const { user: monster } = payload as MonsterDeathRewardRequest;
  // Redis 데이터들 초기화
  let redisUser: User | null = null;
  let rooms: Room[] | null = null;
  let room: Room | null = null;
  let user: User | null = null;
  let characterStats: { [roomId: number]: { [userId: number]: userStatusData } } | null = null;
  // 응답 데이터들 초기화
  let logMessage: string = '';
  let responseData: MonsterDeathRewardResponse = {
    success: true,
    failCode: GlobalFailCode.NONE
  };

  // 데이터 처리 --------------------------------------------------------------------------------
  try {
    // 유효성 검사 ----------------------------------------------------------------------
    // 이미 처리 중인 몬스터인지 확인
    // 치명적이지 않은 버그의 방어 코드이므로 함수는 종료하되 응답은 하지 않는다
    if (isProcessing.get(monster.id.toString())) {
      console.warn(`Monster ${monster.id.toString()} is already being processed.`);
      return;
    }
    isProcessing.set(monster.id.toString(), true);
    console.log('isProcessing:', isProcessing);

    // Redis에서 socket으로 유저 정보 찾기
    redisUser = await getUserBySocket(socket);
    if (!redisUser) {
      // 유저 정보가 없을 경우
      logMessage = 'Redis에서 유저의 정보를 찾을 수 없습니다.';
      responseData = await errorMessages(false, GlobalFailCode.INVALID_REQUEST);
      return;
    }

    // Redis에 roomData가 존재하는지 찾기
    rooms = await getRedisData('roomData');
    if (!rooms) {
      // roomData가 없을 경우
      logMessage = 'Redis에서 roomData를 불러올 수 없습니다.';
      responseData = await errorMessages(false, GlobalFailCode.ROOM_NOT_FOUND);
      return;
    }

    // redisUser에 존재하는 id 값으로 유저가 속한 room 정보 찾기
    for (let i = 0; i < rooms.length; i++) {
      for (let j = 0; j < rooms[i].users.length; j++) {
        // rooms 에 속한 유저들 중에서 redisUser의 id와 같은 id를 가진 유저 찾기
        if (rooms[i].users[j].id === redisUser.id) {
          // 찾은 유저의 room 정보와 user 정보 저장
          room = rooms[i];
          user = room.users[j];
        }
      }
      // room과 user 정보가 있을 경우 반복문 탈출
      if (room && user) break;
    }
    // room 또는 user 정보가 없을 경우(이후 로직의 null 체크를 위해 반복문 바깥에 추가)
    if (!room || !user) {
      logMessage = 'room 또는 user의 정보를 찾을 수 없습니다.';
      responseData = await errorMessages(false, GlobalFailCode.INVALID_REQUEST);
      return;
    }

    // Redis에 userStatusData가 존재하는지 찾기
    characterStats = await getRedisData('userStatusData');
    if (!characterStats) {
      // userStatusData가 없을 경우
      logMessage = 'userStatusData 정보가 존재하지 않습니다.';
      responseData = await errorMessages(false, GlobalFailCode.INVALID_REQUEST);
      return;
    }

    // monster.aliveState가 true 경우(살아있냐를 판단하기 보단 로직상 아직 살아있는 판정인지 확인용)
    // if (!monster.aliveState) {
    //   logMessage = `monster ${monster.id}:${monster.nickname}은(는) 이미 죽었습니다.`;
    //   responseData = await errorMessages(false, GlobalFailCode.INVALID_REQUEST);
    //   return;
    // }

    // 몬스터 처치 보상 처리 ----------------------------------------------------------------------
    // 몬스터의 종류에 따라 보상 값을 설정
    switch (monster.character.characterType) {
      case MonsterCharacterType.SHARK: // 상어군
        // 몬스터 스폰시 존재하지 않아서 미설정
        // setRewardsSuccessState = await setRewards(user, characterStats[room.id][user.id], 10, 10, null, 1, 1);
        break;
      case MonsterCharacterType.MALANG: // 말랑이
        responseData.success = setRewards(user, characterStats[room.id][user.id], 10, 10, null, 1, 1);
        break;
      case MonsterCharacterType.PINK: // 핑크군
        responseData.success = setRewards(
          user,
          characterStats[room.id][user.id],
          10,
          10,
          [
            { type: 101, count: 1 },
            { type: 201, count: 1 }
          ],
          1,
          1
        );
        break;
      case MonsterCharacterType.DINOSAUR: // 공룡이
        responseData.success = setRewards(
          user,
          characterStats[room.id][user.id],
          20,
          20,
          [
            { type: 101, count: 1 },
            { type: 201, count: 3 }
          ],
          2,
          2
        );
        break;
      case MonsterCharacterType.PINK_SLIME: // 핑크슬라임
        responseData.success = setRewards(
          user,
          characterStats[room.id][user.id],
          30,
          30,
          [
            { type: 101, count: 3 },
            { type: 201, count: 5 }
          ],
          3,
          3
        );
        break;
      default: {
        logMessage = 'monster.character.characterType이 잘못되었습니다.';
        responseData = await errorMessages(false, GlobalFailCode.INVALID_REQUEST);
        return;
      }
    }
    // 보상 실패시 실행
    if (!responseData.success) {
      logMessage = 'Failed to set rewards';
      responseData = await errorMessages(false, GlobalFailCode.INVALID_REQUEST);
      return;
    }

    // 몬스터를 room에서 삭제 or 죽은 상태로 변경
    const isMonsterRemoved = removeMonsterFromRoom(monster.id, room);
    if (!isMonsterRemoved) {
      logMessage = `room.monsters에서 몬스터(id:${monster.id})를 찾을 수 없습니다.`;
      responseData = await errorMessages(false, GlobalFailCode.INVALID_REQUEST);
      return;
    }

    // 데이터 전송 및 로그 출력 ----------------------------------------------------------------------
  } catch (error) {
    // 치명적 에러 발생시 로그 출력
    console.error(`monsterRewardHandler ${error as Error}`);
  } finally {
    // 보상 실패 로그 출력
    if (responseData.success === false) console.error('monsterRewardHandler', logMessage);

    // 클라이언트에 데이터 전송
    sendPacket(socket, packetType.MONSTER_REWARD_RESPONSE, responseData);
  }
  // 보상 성공 로그 출력
  console.info(
    `'${(user as User).nickname}(id:${(user as User).id})'가 몬스터 '${(monster as User).nickname}(id:${(monster as User).id})'로부터 보상을 받았습니다.`
  );
  // Redis에 데이터 전송
  await setRedisData('roomData', rooms);
  await setRedisData('userStatusData', characterStats);

  // 유저 업데이트 데이터 전송
  userUpdateNotification(room);
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
    // 몬스터 삭제
    //room.users.splice(monsterIndex, 1);
    // 몬스터 죽은 상태로 변경
    //room.users[monsterIndex].aliveState = false;
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
 * @param {userStatusData} userStatus - 보상을 받을 유저의 스탯
 * @param {number} gold - 보상으로 주는 골드
 * @param {number} exprience - 보상으로 주는 경험치
 * @param {Card} card - 보상으로 주는 카드
 * @param {number} healthPointRecoveryAmount - 보상으로 주는 체력 회복량
  * @param {number} manaPointRecoveryAmount - 보상으로 주는 마나 회복량
 
 * @returns {boolean} 반환 값을 통해 보상 성공 여부를 알 수 있다.
 */
const setRewards = (
  user: User,
  userStatus: userStatusData,
  gold: number,
  exprience: number,
  cards: Card[] | null,
  healthPointRecoveryAmount: number,
  manaPointRecoveryAmount: number
) => {
  try {
    user.character.characterType = 0;
    // 몬스터 죽일시 경험치 지급
    userStatus.experience += exprience;

    // 유저의 경험치가 100 이상일 경우 레벨업
    if (userStatus.experience >= 100) {
      // 레벨업
      userStatus.level += 1;
      // 경험치 초기화
      userStatus.experience -= 100;
      // 레벨업시 직업별 스탯 증가
      switch (user.character.characterType) {
        case UserCharacterType.PINK_SLIME: // 핑크슬라임 - 보스
          userLevelUp(user, userStatus, 25, 10, 25);
          break;
        case UserCharacterType.MASK: // 가면군 - 마법사
          userLevelUp(user, userStatus, 5, 20, 5);
          break;
        case UserCharacterType.SWIM_GLASSES: // 물안경군 - 궁수
          userLevelUp(user, userStatus, 5, 15, 10);
          break;
        case UserCharacterType.FROGGY: // 개굴군 - 로그
          userLevelUp(user, userStatus, 10, 10, 10);
          break;
        case UserCharacterType.RED: // 빨강이 - 성기사
          userLevelUp(user, userStatus, 10, 5, 15);
          break;
        default: // user.character.characterType이 잘못된 경우 에러 발생
          userStatus.level -= 1; // 레벨 업을 시키면 안되는 에러가 발생 했으므로 유저 레벨 -1
          throw new Error('레벨업시 user.character.characterType이 잘못되었습니다.');
      }
    }

    // 몬스터 죽일시 골드 지급
    userStatus.gold += gold;

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
    if (MAX_MP >= userStatus.mp + manaPointRecoveryAmount) userStatus.mp += manaPointRecoveryAmount;
    // 마나 회복시 마나 값이 최대 마나를 넘어가지 않도록 설정
    else if (MAX_MP < userStatus.mp + manaPointRecoveryAmount) userStatus.mp = MAX_MP;
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
 * @param {userStatusData} userStatus - 스탯을 증가시킬 유저의 스탯
 * @param {number} maxHp - 최대 체력
 * @param {number} attack - 공격력
 * @param {number} armor - 방어력
 * @returns {void} 별도의 반환 값이 존재하지 않는다.
 */
const userLevelUp = (user: User, userStatus: userStatusData, maxHp: number, attack: number, armor: number) => {
  // 레벨업시 스탯 증가
  user.character.maxHp += maxHp;
  userStatus.attack += attack;
  userStatus.armor += armor;
};

/***
 * - 몬스터 처치 보상 실패시 에러 메시지 함수
 *
 * 몬스터 처치 보상 실패시 에러 메시지를 설정하는 함수
 *
 * @param {boolean} success - 보상 성공 여부
 * @param {number} failCode - 실패 코드
 * @returns {MonsterDeathRewardResponse} 반환 값을 통해 보상 성공 여부를 알 수 있다.
 */
const errorMessages = async (success: boolean, failCode: number): Promise<MonsterDeathRewardResponse> => {
  return { success, failCode };
};
