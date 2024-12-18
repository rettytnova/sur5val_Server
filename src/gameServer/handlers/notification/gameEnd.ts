import { config } from '../../../config/config.js';
import { sendPacket } from '../../../packet/createPacket.js';
import MarketSessions from '../../class/marketSessions.js';
import PositionSessions from '../../class/positionSessions.js';
import GameRoom from '../../class/room.js';
import Server from '../../class/server.js';
import UserSessions from '../../class/userSessions.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import { socketSessions } from '../../session/socketSession.js';
import { monsterAiDatas } from '../coreMethod/monsterMove.js';
import { RoomStateType, RoleType } from '../enumTyps.js';

// 시간 안에 탈출하지 못했을 경우
export const gameEndNotification = (roomId: number, winRType: number) => {
  console.log('winRType: ', winRType);
  const rooms = Server.getInstance().getRooms();
  const endRoom = rooms.find((room: GameRoom) => room.getRoomId() === roomId);
  if (!endRoom) {
    console.log('gameEndNotification room이 없음');
    return;
  }

  // 이미 탈출해서 끝난 게임이면 실행 종료
  if (endRoom.getRoomState() !== RoomStateType.INGAME) {
    return;
  }

  // 몬스터를 room에서 삭제
  const remainUsers = endRoom
    .getUsers()
    .filter((user: UserSessions) => user.getCharacter().roleType !== RoleType.WEAK_MONSTER);
  endRoom.setUsers(remainUsers);
  endRoom.setRoomState(RoomStateType.WAIT);
  const roomUsers = endRoom.getUsers();

  // 승리한 팀의 유저 Id 찾기
  const winnerRoleType = winRType === 4 ? 4 : 2;
  const winnerUserId: number[] = [];
  roomUsers.forEach((roomUser: UserSessions) => {
    if (roomUser.getCharacter().roleType === winnerRoleType) {
      winnerUserId.push(roomUser.getId());
    }
  });

  // 승/패 notification과 방으로 돌아가는 sendPacket 보내기
  for (let i = 0; i < roomUsers.length; i++) {
    const userSocket = socketSessions[roomUsers[i].getId()];
    if (userSocket) {
      sendPacket(userSocket, config.packetType.GAME_END_NOTIFICATION, {
        winners: winnerUserId,
        winType: winRType - 2
      });
    }
  }

  const characterPositions = Server.getInstance().getPositions();
  const remainCharacterPositions = characterPositions.filter(
    (characterPosition: PositionSessions) => characterPosition.getPositionRoomId() !== roomId
  );
  Server.getInstance().setPositions(remainCharacterPositions);

  const fleaMarketCards = Server.getInstance().getMarkets();
  const remainFleaMarketCards = fleaMarketCards.filter(
    (fleaMarketCard: MarketSessions) => fleaMarketCard.getRoomId() !== roomId
  );
  Server.getInstance().setMarkets(remainFleaMarketCards);

  // // 게임 끝나는 시점에 이미 게임 종료한 유저 방에서 내쫒기
  const userDatas = Server.getInstance().getUsers();
  const userIds = userDatas.map((user) => user.getId());
  const remainEndUser = endRoom.getUsers().filter((user: UserSessions) => userIds.includes(user.getId()));
  endRoom.setUsers(remainEndUser);

  delete monsterAiDatas[roomId];
  delete shoppingUserIdSessions[roomId];

  // 내쫓은 시점에 방에 인원이 0명이면 방을 삭제
  if (roomUsers.length === 0) {
    const newRooms = Server.getInstance()
      .getRooms()
      .filter((room) => room.getRoomId() === roomId);
    Server.getInstance().setRooms(newRooms);
  } else {
    const isHaveOwner = endRoom
      .getUsers()
      .some((endRoomUser: UserSessions) => endRoomUser.getId() === endRoom.getRoomOwnerId());
    if (!isHaveOwner) {
      endRoom.setRoomOwnerId(endRoom.getUsers()[0].getId());
      endRoom.setRoomOwnerEmail(endRoom.getUsers()[0].getEmail());
    }
  }
};
