import { GlobalFailCode, RoomStateType, UserCharacterType } from '../enumTyps.js';
import { CustomSocket } from '../../../gameServer/interface/interface.js';
import { config } from '../../../config/config.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { convertSendRoomData, getRoomByUserIdTwo, getUserBySocket, setRedisData } from '../handlerMethod.js';
import { socketSessions } from '../../session/socketSession.js';
import { CardType } from '../enumTyps.js';
import Server from '../../class/server.js';
import UserSessions from '../../class/userSessions.js';
import GameRoom from '../../class/room.js';

// 게임 준비
export const gamePrepareHandlerTwo = async (socket: CustomSocket, payload: Object) => {
  try {
    // requset 보낸 유저
    const user = getUserBySocket(socket);
    // 유저가 있는 방 찾기
    if (!user) {
      console.error('위치: gamePrepareHandlerTwo, 유저를 찾을 수 없습니다.');
      const responseData = {
        success: false,
        failCode: GlobalFailCode.INVALID_REQUEST
      };
      sendPacket(socket, config.packetType.GAME_PREPARE_RESPONSE, responseData);
      return;
    }
    const room = getRoomByUserIdTwo(user.getId());
    if (!room) {
      return;
    }
    if (room.getUsers().length <= 1) {
      console.error('gamePrepareHandlerTwo: 게임을 시작 할 수 없습니다(인원 부족).');
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
      room.setRoomState(RoomStateType.PREPARE);
      const data = setCharacterInfoInit(room.getUsers());
      if (data) room.setUsers(data);

      const rooms: GameRoom[] | null = Server.getInstance().getRooms();
      if (!rooms) {
        return;
      }
      // 변경한 정보 덮어쓰기
      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].getRoomId() === room.getRoomId()) {
          rooms[i] = room;
          break;
        }
      }
      // 레디스에 있는 룸 배열에서 user가 속해 있는 방을 수정하고,
      // 위에서 수정한 방이 포함되어 있는 전체 배열을 넣음
      // await setRedisData('roomData', rooms);

      // 방에있는 유저들에게 notifi 보내기
      const notiRoom = convertSendRoomData(room);
      for (let i = 0; i < room.getUsers().length; i++) {
        const userSocket: CustomSocket = socketSessions[room.getUsers()[i].getId()]; // await getSocketByUserId(room.users[i]) 을 바꿈
        if (!userSocket) {
          console.error('gamePrepareHandlerTwo: socket not found');
          return;
        }
        //console.dir(room, { depth: null });
        sendPacket(userSocket, config.packetType.GAME_PREPARE_NOTIFICATION, {
          room: notiRoom
        });
      }
    }
  } catch (err) {
    const responseData = {
      success: false,
      failCode: GlobalFailCode.INVALID_REQUEST
    };
    sendPacket(socket, config.packetType.GAME_PREPARE_RESPONSE, responseData);
    console.error('gamePrepareHandlerTwo 오류', err);
  }
};

// 유저 캐릭터 초기화
export const setCharacterInfoInit = (users: UserSessions[]) => {
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
  const characterDB = Server.getInstance().characterStatInfo;
  if (!characterDB) {
    console.error('데이터베이스에 저장된 캐릭터정보가 없습니다.');
    return;
  }

  for (let i = 0; i < selectedTypes.length; i++) {
    const character = characterDB.find((data) => data.characterType === selectedTypes[i]);
    if (!character) {
      console.error('캐릭터 정보를 찾지 못하였습니다.');
      return;
    }
    users[i].getCharacter().characterType = selectedTypes[i];
    users[i].getCharacter().roleType = character.characterType === UserCharacterType.PINK_SLIME ? 4 : 2;
    users[i].getCharacter().level = 1;
    users[i].getCharacter().maxExp = 10;
    users[i].getCharacter().exp = 0;
    users[i].getCharacter().gold = 0;
    users[i].getCharacter().maxHp = character.hp;
    users[i].getCharacter().hp = character.hp;
    users[i].getCharacter().mp = character.mp;
    users[i].getCharacter().attack = character.attack;
    users[i].getCharacter().armor = character.armor;
    users[i].getCharacter().weapon = CardType.NONE_WEAPON;
    users[i].getCharacter().stateInfo.state = 0;
    users[i].getCharacter().equips = [
      CardType.NONE_HEAD,
      CardType.NONE_ARMOR,
      CardType.NONE_CLOAK,
      CardType.NONE_GLOVE
    ];
    users[i].getCharacter().handCards = [{ type: character.handCards, count: 1 }];
  }

  return users;
};
