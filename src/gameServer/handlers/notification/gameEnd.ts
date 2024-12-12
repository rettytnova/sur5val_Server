import { config } from '../../../config/config.js';
import { Room, User } from '../../../gameServer/interface/interface.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { socketSessions } from '../../session/socketSession.js';
import { monsterAiDatas } from '../coreMethod/monsterMove.js';
import { RoomStateType, RoleType } from '../enumTyps.js';
import { getRedisData, setRedisData } from '../handlerMethod.js';
import { addgRoomId, getgRoomId } from '../room/createRoomHandler.js';

// 시간 안에 탈출하지 못했을 경우
export const gameEndNotification = async (roomId: number, winRType: number) => {
  const rooms: Room[] = await getRedisData('roomData');
  let room: Room | null = null;
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].id === roomId) room = rooms[i];
  }
  if (!room) return;

  // 이미 탈출하여서 끝난 게임이면 실행 종료
  if (room.state !== RoomStateType.INGAME) {
    return;
  }

  // 몬스터를 roomData에서 삭제
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === RoleType.WEAK_MONSTER) room.users.splice(i, 1), i--;
  }
  room.state = RoomStateType.WAIT;

  // 승리한 팀의 유저 Id 찾기
  const winnerRoleType = winRType === 4 ? 4 : 2;
  const winnersUserId: number[] = [];
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === winnerRoleType) {
      winnersUserId.push(room.users[i].id);
    }
  }

  // 승/패 notification과 방으로 돌가가는 sendPacket 보내기
  for (let i = 0; i < room.users.length; i++) {
    const userSocket = socketSessions[room.users[i].id];
    if (userSocket) {
      sendPacket(userSocket, config.packetType.GAME_END_NOTIFICATION, {
        winners: winnersUserId,
        winType: winRType - 2
      });
    }
  }

  // characterPositions, fleaMarketCards, monsterAi, shoppingUserIdSessions 삭제하기, 방Id 변경하기
  const characterPositions = await getRedisData('characterPositionDatas');
  delete characterPositions[roomId];
  await setRedisData('characterPositionDatas', characterPositions);

  const fleaMarketCards = await getRedisData('fleaMarketCards');
  delete fleaMarketCards[roomId];
  await setRedisData('fleaMarketCards', fleaMarketCards);

  delete monsterAiDatas[roomId];
  delete shoppingUserIdSessions[roomId];

  // 게임 끝나는 시점에 이미 게임 종료한 유저 방에서 내쫒기
  const userDatas: User[] = await getRedisData('userData');
  if (userDatas) {
    const userIds = userDatas.map((user) => user.id);
    room.users = room.users.filter((user) => userIds.includes(user.id));
  }

  // 내쫒은 시점에 방에 인원이 0명인지 검사 - 방 폭파
  let isDeleteRoom: boolean = false;
  if (room.users.length <= 0) {
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].id === room.id) {
        rooms.splice(i, 1);
        isDeleteRoom = true;
        break;
      }
    }
  }

  // 내쫒은 시점에 방장 검사 - 방장 넘기기
  if (!isDeleteRoom) {
    let haveOwner: boolean = false;
    for (let i = 0; i < room.users.length; i++) {
      if (room.users[i].id === room.ownerId) {
        haveOwner = true;
        break;
      }
    }
    if (!haveOwner) room.ownerId = room.users[0].id;
  }

  addgRoomId();
  room.id = getgRoomId();
  await setRedisData('roomData', rooms);
};
