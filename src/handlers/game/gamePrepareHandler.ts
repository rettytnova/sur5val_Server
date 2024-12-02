import { GlobalFailCode, RoomStateType, UserCharacterType } from '../enumTyps.js';
import { CustomSocket, Room, User, UserCharacterData } from '../../interface/interface.js';
import { config } from '../../config/config.js';
import { sendPacket } from '../../packet/createPacket.js';
import { getRedisData, getRoomByUserId, getUserIdBySocket, setRedisData } from '../handlerMethod.js';
import { socketSessions } from '../../session/socketSession.js';
import { CardType, RoleType } from '../enumTyps.js';

// DB에 넣을 데이터
export const userCharacterData: UserCharacterData = {
  // 핑크슬라임 - 보스
  [UserCharacterType.PINK_SLIME]: {
    roleType: RoleType.BOSS_MONSTER,
    exp: 10,
    gold: 0,
    hp: 1000,
    mp: 30,
    attack: 10,
    armor: 1,
    handCards: [
      { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
      { type: CardType.MAGICIAN_EXTENDED_SKILL, count: 1 },
      { type: CardType.BASIC_HP_POTION, count: 3 }
    ]
  },
  // 가면군 - 마법사
  [UserCharacterType.MASK]: {
    roleType: RoleType.SUR5VAL,
    exp: 10,
    gold: 0,
    hp: 9,
    mp: 14,
    attack: 3,
    armor: 0,
    handCards: [
      { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
      { type: CardType.MAGICIAN_EXTENDED_SKILL, count: 1 },
      { type: CardType.MAGICIAN_FINAL_SKILL, count: 1 },
      { type: CardType.BASIC_HP_POTION, count: 1 },
      { type: CardType.BASIC_MP_POTION, count: 1 },
      { type: CardType.ADVANCED_HP_POTION, count: 1 },
      { type: CardType.ADVANCED_MP_POTION, count: 1 },
      { type: CardType.MASTER_HP_POTION, count: 1 },
      { type: CardType.MASTER_MP_POTION, count: 1 },
      { type: CardType.BASIC_EXP_POTION, count: 1 },
      { type: CardType.MASTER_EXP_POTION, count: 1 },
      { type: CardType.EXPLORER_WEAPON, count: 1 },
      { type: CardType.EXPLORER_HEAD, count: 1 },
      { type: CardType.EXPLORER_ARMOR, count: 1 },
      { type: CardType.EXPLORER_CLOAK, count: 1 },
      { type: CardType.EXPLORER_GLOVE, count: 1 },
      { type: CardType.HERO_WEAPON, count: 1 },
      { type: CardType.HERO_HEAD, count: 1 },
      { type: CardType.HERO_ARMOR, count: 1 },
      { type: CardType.HERO_CLOAK, count: 1 },
      { type: CardType.HERO_GLOVE, count: 1 },
      { type: CardType.LEGENDARY_WEAPON, count: 1 },
      { type: CardType.LEGENDARY_HEAD, count: 1 },
      { type: CardType.LEGENDARY_ARMOR, count: 1 },
      { type: CardType.LEGENDARY_CLOAK, count: 1 },
      { type: CardType.LEGENDARY_GLOVE, count: 1 }
    ]
  },
  // 물안경군 - 궁수
  [UserCharacterType.SWIM_GLASSES]: {
    roleType: RoleType.SUR5VAL,
    exp: 10,
    gold: 0,
    hp: 11,
    mp: 12,
    attack: 3,
    armor: 0,
    handCards: [
      { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
      { type: CardType.MAGICIAN_EXTENDED_SKILL, count: 1 },
      { type: CardType.MAGICIAN_FINAL_SKILL, count: 1 },
      { type: CardType.BASIC_HP_POTION, count: 1 },
      { type: CardType.BASIC_MP_POTION, count: 1 },
      { type: CardType.ADVANCED_HP_POTION, count: 1 },
      { type: CardType.ADVANCED_MP_POTION, count: 1 },
      { type: CardType.MASTER_HP_POTION, count: 1 },
      { type: CardType.MASTER_MP_POTION, count: 1 },
      { type: CardType.BASIC_EXP_POTION, count: 1 },
      { type: CardType.MASTER_EXP_POTION, count: 1 },
      { type: CardType.EXPLORER_WEAPON, count: 1 },
      { type: CardType.EXPLORER_HEAD, count: 1 },
      { type: CardType.EXPLORER_ARMOR, count: 1 },
      { type: CardType.EXPLORER_CLOAK, count: 1 },
      { type: CardType.EXPLORER_GLOVE, count: 1 },
      { type: CardType.HERO_WEAPON, count: 1 },
      { type: CardType.HERO_HEAD, count: 1 },
      { type: CardType.HERO_ARMOR, count: 1 },
      { type: CardType.HERO_CLOAK, count: 1 },
      { type: CardType.HERO_GLOVE, count: 1 },
      { type: CardType.LEGENDARY_WEAPON, count: 1 },
      { type: CardType.LEGENDARY_HEAD, count: 1 },
      { type: CardType.LEGENDARY_ARMOR, count: 1 },
      { type: CardType.LEGENDARY_CLOAK, count: 1 },
      { type: CardType.LEGENDARY_GLOVE, count: 1 }
    ]
  },
  // 개굴군 - 도적
  [UserCharacterType.FROGGY]: {
    roleType: RoleType.SUR5VAL,
    exp: 10,
    gold: 0,
    hp: 12,
    mp: 13,
    attack: 3,
    armor: 0,
    handCards: [
      { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
      { type: CardType.MAGICIAN_EXTENDED_SKILL, count: 1 },
      { type: CardType.MAGICIAN_FINAL_SKILL, count: 1 },
      { type: CardType.BASIC_HP_POTION, count: 1 },
      { type: CardType.BASIC_MP_POTION, count: 1 },
      { type: CardType.ADVANCED_HP_POTION, count: 1 },
      { type: CardType.ADVANCED_MP_POTION, count: 1 },
      { type: CardType.MASTER_HP_POTION, count: 1 },
      { type: CardType.MASTER_MP_POTION, count: 1 },
      { type: CardType.BASIC_EXP_POTION, count: 1 },
      { type: CardType.MASTER_EXP_POTION, count: 1 },
      { type: CardType.EXPLORER_WEAPON, count: 1 },
      { type: CardType.EXPLORER_HEAD, count: 1 },
      { type: CardType.EXPLORER_ARMOR, count: 1 },
      { type: CardType.EXPLORER_CLOAK, count: 1 },
      { type: CardType.EXPLORER_GLOVE, count: 1 },
      { type: CardType.HERO_WEAPON, count: 1 },
      { type: CardType.HERO_HEAD, count: 1 },
      { type: CardType.HERO_ARMOR, count: 1 },
      { type: CardType.HERO_CLOAK, count: 1 },
      { type: CardType.HERO_GLOVE, count: 1 },
      { type: CardType.LEGENDARY_WEAPON, count: 1 },
      { type: CardType.LEGENDARY_HEAD, count: 1 },
      { type: CardType.LEGENDARY_ARMOR, count: 1 },
      { type: CardType.LEGENDARY_CLOAK, count: 1 },
      { type: CardType.LEGENDARY_GLOVE, count: 1 }
    ]
  },

  // 빨강이 - 전사
  [UserCharacterType.RED]: {
    roleType: RoleType.SUR5VAL,
    exp: 10,
    gold: 0,
    hp: 14,
    mp: 10,
    attack: 3,
    armor: 0,
    handCards: [
      { type: CardType.MAGICIAN_BASIC_SKILL, count: 1 },
      { type: CardType.MAGICIAN_EXTENDED_SKILL, count: 1 },
      { type: CardType.MAGICIAN_FINAL_SKILL, count: 1 },
      { type: CardType.BASIC_HP_POTION, count: 1 },
      { type: CardType.BASIC_MP_POTION, count: 1 },
      { type: CardType.ADVANCED_HP_POTION, count: 1 },
      { type: CardType.ADVANCED_MP_POTION, count: 1 },
      { type: CardType.MASTER_HP_POTION, count: 1 },
      { type: CardType.MASTER_MP_POTION, count: 1 },
      { type: CardType.BASIC_EXP_POTION, count: 1 },
      { type: CardType.MASTER_EXP_POTION, count: 1 },
      { type: CardType.EXPLORER_WEAPON, count: 1 },
      { type: CardType.EXPLORER_HEAD, count: 1 },
      { type: CardType.EXPLORER_ARMOR, count: 1 },
      { type: CardType.EXPLORER_CLOAK, count: 1 },
      { type: CardType.EXPLORER_GLOVE, count: 1 },
      { type: CardType.HERO_WEAPON, count: 1 },
      { type: CardType.HERO_HEAD, count: 1 },
      { type: CardType.HERO_ARMOR, count: 1 },
      { type: CardType.HERO_CLOAK, count: 1 },
      { type: CardType.HERO_GLOVE, count: 1 },
      { type: CardType.LEGENDARY_WEAPON, count: 1 },
      { type: CardType.LEGENDARY_HEAD, count: 1 },
      { type: CardType.LEGENDARY_ARMOR, count: 1 },
      { type: CardType.LEGENDARY_CLOAK, count: 1 },
      { type: CardType.LEGENDARY_GLOVE, count: 1 }
    ]
  }
};

// 게임 준비
export const gamePrepareHandler = async (socket: CustomSocket, payload: Object) => {
  try {
    // requset 보낸 유저
    const userId: number | null = await getUserIdBySocket(socket);

    // 유저가 있는 방 찾기
    if (userId !== null) {
      const room: Room | null = await getRoomByUserId(userId);
      if (room === null) {
        return;
      }
      if (room.users.length <= 1) {
        console.error('게임을 시작 할 수 없습니다(인원 부족).');
        const responseData = {
          success: false,
          failCode: GlobalFailCode.INVALID_REQUEST
        };
        sendPacket(socket, config.packetType.GAME_PREPARE_RESPONSE, responseData);
      } else {
        // 게임준비 시작 요건 충족
        const responseData = {
          success: true,
          failCode: GlobalFailCode.NONE
        };
        sendPacket(socket, config.packetType.GAME_PREPARE_RESPONSE, responseData);

        // 방에있는 유저들 캐릭터 랜덤 배정하기
        room.state = RoomStateType.PREPARE;
        room.users = setCharacterInfoInit(room.users);

        const rooms: Room[] | null = await getRedisData('roomData');
        if (!rooms) {
          return;
        }
        // 변경한 정보 덮어쓰기
        for (let i = 0; i < rooms.length; i++) {
          if (rooms[i].id === room.id) {
            rooms[i] = room;
            break;
          }
        }
        // 레디스에 있는 룸 배열에서 user가 속해 있는 방을 수정하고,
        // 위에서 수정한 방이 포함되어 있는 전체 배열을 넣음
        await setRedisData('roomData', rooms);

        // 방에있는 유저들에게 notifi 보내기
        for (let i = 0; i < room.users.length; i++) {
          const userSocket: CustomSocket = socketSessions[room.users[i].id]; // await getSocketByUserId(room.users[i]) 을 바꿈
          if (!userSocket) {
            console.error('gamePrepareHandler: socket not found');
            return;
          }
          //console.dir(room, { depth: null });
          sendPacket(userSocket, config.packetType.GAME_PREPARE_NOTIFICATION, {
            room
          });
        }
      }
    } else {
      console.error('위치: gamePrepareHandler, 유저를 찾을 수 없습니다.');
      const responseData = {
        success: false,
        failCode: GlobalFailCode.INVALID_REQUEST
      };
      sendPacket(socket, config.packetType.GAME_PREPARE_RESPONSE, responseData);
    }
  } catch (err) {
    const responseData = {
      success: false,
      failCode: GlobalFailCode.INVALID_REQUEST
    };
    sendPacket(socket, config.packetType.GAME_PREPARE_RESPONSE, responseData);
    console.error('gameStartHandler 오류', err);
  }
};

// 유저 캐릭터 초기화
export const setCharacterInfoInit = (users: User[]) => {
  const numbers: number[] = [
    UserCharacterType.PINK_SLIME,
    UserCharacterType.MASK,
    UserCharacterType.SWIM_GLASSES,
    UserCharacterType.FROGGY,
    UserCharacterType.RED
  ];

  // 직업 배열을 랜덤으로 섞기 (Fisher-Yates Shuffle Algorithm)
  for (let i = numbers.length - 1; 0 < i; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  const selectedTypes = numbers.slice(0, users.length);

  // 보스가 무조건 선택되도록 하기
  if (selectedTypes.indexOf(UserCharacterType.PINK_SLIME) === -1) {
    const j = Math.floor(Math.random() * selectedTypes.length);
    selectedTypes[j] = UserCharacterType.PINK_SLIME;
  }

  // 선택된 직업에 따라 초기화
  for (let i = 0; i < selectedTypes.length; i++) {
    users[i].character.characterType = selectedTypes[i];
    users[i].character.roleType = userCharacterData[selectedTypes[i]].roleType;
    users[i].character.coolDown = 0; // 현재 스킬 사용 시간
    users[i].character.level = 1;
    users[i].character.exp = 0;
    users[i].character.gold = userCharacterData[selectedTypes[i]].gold;
    users[i].character.maxHp = userCharacterData[selectedTypes[i]].hp;
    users[i].character.hp = userCharacterData[selectedTypes[i]].hp;
    users[i].character.mp = userCharacterData[selectedTypes[i]].mp;
    users[i].character.attack = userCharacterData[selectedTypes[i]].attack;
    users[i].character.armor = userCharacterData[selectedTypes[i]].armor;
    users[i].character.weapon = CardType.NONE_WEAPON;
    users[i].character.stateInfo.state = 0;
    users[i].character.equips = [CardType.NONE_HEAD, CardType.NONE_ARMOR, CardType.NONE_CLOAK, CardType.NONE_GLOVE];
    users[i].character.handCards = userCharacterData[selectedTypes[i]].handCards;
  }

  return users;
};
