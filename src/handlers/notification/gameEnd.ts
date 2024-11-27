import { config } from '../../config/config.js';
import { Room } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { socketSessions } from '../../session/socketSession.js';
import { monsterAiDatas } from '../coreMethod/monsterMove.js';
import { RoomStateType } from '../enumTyps.js';
import { getRedisData, setRedisData } from '../handlerMethod.js';

// 시간 안에 탈출하지 못했을 경우
export const gameEndNotification = async (roomId: number) => {
  const rooms: Room[] = await getRedisData('roomData');
  let room: Room | null = null;
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].id === roomId) room = rooms[i];
  }
  if (!room) {
    console.log('userSocket 방이 없음');
    return;
  }

  // 이미 탈출하여서 끝난 게임이면 실행 종료
  if (room.state !== RoomStateType.INGAME) {
    return;
  }

  // 몬스터를 roomData에서 삭제
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === 1) room.users.splice(i, 1), i--;
  }
  room.state = RoomStateType.WAIT;
  await setRedisData('roomData', rooms);

  // 승/패 notification과 방으로 돌가가는 sendPacket 보내기
  for (let i = 0; i < room.users.length; i++) {
    const userSocket = socketSessions[room.users[i].id];
    if (userSocket) {
      sendPacket(userSocket, config.packetType.GAME_END_NOTIFICATION, { winners: [i + 1], winType: 2 });
    }
  }

  // characterPositions 삭제하기, monsterAi 삭제하기
  const characterPositions = await getRedisData('characterPositionDatas');
  delete characterPositions[roomId];
  await setRedisData('characterPositionDatas', characterPositions);
  delete monsterAiDatas[roomId];
};
