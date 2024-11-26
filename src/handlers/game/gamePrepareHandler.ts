import { GlobalFailCode, RoomStateType, UserCharacterType } from '../enumTyps.js';
import { Card, CustomSocket, RedisUserData, Room, User, userStatusData } from '../../interface/interface.js';
import { config } from '../../config/config.js';
import { sendPacket } from '../../packet/createPacket.js';
import { getRedisData, getRoomByUserId, getUserBySocket, setRedisData } from '../handlerMethod.js';
import { socketSessions } from '../../session/socketSession.js';

// DB에 넣을 데이터
export const userCharacterData: {
  [types: number]: { hp: number; weapon: number; roleType: number; handCards: Card[] };
} = {
  // 핑크슬라임 - 보스
  [UserCharacterType.PINK_SLIME]: {
    hp: 5,
    weapon: 0,
    roleType: 4,
    // equips: 20,
    handCards: [
      { type: 1, count: 1 },
      { type: 2, count: 1 },
      { type: 3, count: 1 },
      { type: 4, count: 1 },
      { type: 5, count: 1 },
      { type: 6, count: 1 },
      { type: 7, count: 1 },
      { type: 8, count: 1 },
      { type: 9, count: 1 },
      { type: 10, count: 1 },
      { type: 11, count: 1 },
      { type: 12, count: 1 },
      { type: 13, count: 1 },
      { type: 14, count: 1 }
    ]
  },
  // 탱커 - 물안경군
  [UserCharacterType.SWIM_GLASSES]: {
    hp: 5,
    weapon: 0,
    roleType: 2,
    // equips: 14,
    handCards: [
      { type: 1, count: 1 },
      { type: 2, count: 1 },
      { type: 3, count: 1 },
      { type: 4, count: 1 },
      { type: 5, count: 1 },
      { type: 6, count: 1 },
      { type: 7, count: 1 },
      { type: 8, count: 1 },
      { type: 9, count: 1 },
      { type: 10, count: 1 },
      { type: 11, count: 1 },
      { type: 12, count: 1 },
      { type: 13, count: 1 },
      { type: 14, count: 1 }
    ]
  },
  // 로그 - 개굴군(근딜)
  [UserCharacterType.FROGGY]: {
    hp: 5,
    weapon: 4,
    roleType: 2,
    // equips: 12,
    handCards: [
      { type: 1, count: 1 }, //5
      { type: 18, count: 1 },
      { type: 21, count: 3 },
      { type: 22, count: 1 }
    ]
  },
  // 가면군 - 마법사(원딜)
  [UserCharacterType.MASK]: {
    hp: 5,
    weapon: 7,
    roleType: 2,
    // equips: 16,
    handCards: [
      { type: 1, count: 1 }, //8
      { type: 19, count: 1 },
      { type: 21, count: 3 },
      { type: 22, count: 1 }
    ]
  },
  // 빨강이 - 서포터
  [UserCharacterType.RED]: {
    hp: 5,
    weapon: 10,
    roleType: 2,
    // equips: 15,
    handCards: [
      { type: 1, count: 1 }, //11
      { type: 19, count: 1 },
      { type: 21, count: 3 },
      { type: 22, count: 1 }
    ]
  }
};

// 게임 준비
export const gamePrepareHandler = async (socket: CustomSocket, payload: Object) => {
  try {
    // requset 보낸 유저
    const user: RedisUserData = await getUserBySocket(socket);

    // 유저가 있는 방 찾기
    if (user !== undefined) {
      const room: Room | null = await getRoomByUserId(user.id);
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

        // 방에있는 유저들 캐릭터 초기 능력치 세팅하기
        let userStatusDatas: { [roomId: number]: { [userId: number]: userStatusData } } | undefined =
          await getRedisData('userStatusData');
        if (userStatusDatas === undefined) {
          userStatusDatas = { [room.id]: {} };
        }
        const userStatusData = userStatusDatas[room.id];

        for (let i = 0; i < room.users.length; i++) {
          userStatusData[room.users[i].id] = { level: 1, experience: 0, attack: 1, armor: 0, mp: 10, gold: 0 };
        }
        await setRedisData('userStatusData', userStatusDatas);

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
    UserCharacterType.SWIM_GLASSES,
    UserCharacterType.FROGGY,
    UserCharacterType.MASK,
    UserCharacterType.RED
  ];

  // 배열을 랜덤으로 섞기 (Fisher-Yates Shuffle Algorithm)
  for (let i = users.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  const selectedTypes = numbers.slice(0, users.length);

  // 직업 부여 랜덤 로직
  for (let i = 0; i < users.length; i++) {
    users[i].character.characterType = selectedTypes[i];
    users[i].character.roleType = userCharacterData[selectedTypes[i]].roleType;
    users[i].character.hp = userCharacterData[selectedTypes[i]].hp;
    users[i].character.weapon = userCharacterData[selectedTypes[i]].weapon; // 무기 아닙니다 기획 따라 바뀌어서 스킬입니다
    //users[i].character.equips = userCharacterData[selectedTypes[i]].equips;
    users[i].character.handCards = userCharacterData[selectedTypes[i]].handCards;
  }
  return users;
};
