import { config } from '../../config/config.js';
import { Room, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { getRedisData, getSocketByUser, setRedisData } from '../handlerMethod.js';
import { monsterAiDatas } from './monsterMove.js';
import { userUpdateNotification } from './userUpdate.js';

// 공격가능 상태인지
export const monsterAttackCheck = async (room: Room) => {
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === 0) {
      for (let j = 0; j < room.users.length; j++) {
        if (room.users[j].character.roleType === 2) {
          await monsterAttackPlayer(room.users[i], room.users[j], room);
        }
      }
    }
  }
};

export const monsterAttackPlayer = async (player: User, monster: User, room: Room) => {
  // 몬스터 정보 skillCool 찾아서 check하기
  let monsterData;
  for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
    if (monsterAiDatas[room.id][i].id === monster.id) {
      if (monsterAiDatas[room.id][i].attackCool > 0) return;
      else monsterData = monsterAiDatas[room.id][i];
      break;
    }
  }

  if (!monsterData) {
    console.error('존재하지 않는 monsterAiDatas를 찾고 있습니다.');
    return;
  }

  // 몬스터 위치 정보 찾기
  const characterPositionDatas: { [key: number]: { id: number; x: number; y: number }[] } =
    await getRedisData('characterPositionDatas');
  let monsterPosition;
  for (let i = 0; i < characterPositionDatas[room.id].length; i++) {
    if (characterPositionDatas[room.id][i].id === monster.id) {
      monsterPosition = characterPositionDatas[room.id][i];
      break;
    }
  }
  if (!monsterPosition) {
    console.error('존재하지 않는 monsterPosition를 찾고 있습니다.');
    return;
  }

  // 유저 위치 정보 찾기
  let playerPosition;
  for (let i = 0; i < characterPositionDatas[room.id].length; i++) {
    if (characterPositionDatas[room.id][i].id === player.id) {
      playerPosition = characterPositionDatas[room.id][i];
      break;
    }
  }
  if (!playerPosition) {
    console.error('존재하지 않는 playerPosition를 찾고 있습니다.');
    return;
  }

  // 유저가 범위 안에 들어와있는지 검사 후 공격하기
  if (
    (monsterPosition.x - playerPosition.x) ** 2 + (monsterPosition.y - playerPosition.y) ** 2 <
    monsterData.attackRange ** 2
  ) {
    console.log(`${player.nickname}을 ${monster.nickname}이 공격함`);
    monsterData.attackCool = 1000;
    player.character.hp -= 1;
    if (player.character.hp === 0) {
      console.log('부활띠!');
      player.nickname = '나는 죽었다';
      player.character.hp = 5;
      await setRedisData('characterPositionDatas', characterPositionDatas);
      console.log('characterPositionDatas', characterPositionDatas);
      for (let i = 0; i < room.users.length; i++) {
        const userSocket = await getSocketByUser(room.users[i]);
        const now = Date.now() + 300000;
        const gameStateData = { phaseType: 3, nextPhaseAt: now };
        const notifiData = {
          gameState: gameStateData,
          users: room.users,
          characterPositions: characterPositionDatas[room.id]
        };

        if (userSocket) sendPacket(userSocket, config.packetType.GAME_START_NOTIFICATION, notifiData);
      }
    }
    userUpdateNotification(room);
  }
};
