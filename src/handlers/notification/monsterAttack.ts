import { config } from '../../config/config.js';
import { Room, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { getRedisData, getSocketByUser } from '../handlerMethod.js';
import { monsterAiDatas } from './monsterMove.js';
import { monsterDatas } from './monsterSpawn.js';
import { userUpdateNotification } from './userUpdate.js';

// 공격가능 상태인지 대상인지 확인
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
    monsterData.attackCool = monsterDatas[monster.character.characterType].attackCool;
    // player.character.hp -= 1;
    monster.character.hp -= 1;
    if (monster.character.hp <= 0)
      (monster.character.hp = 5), (monsterPosition.x = -monsterPosition.x), (monsterPosition.y = -monsterPosition.y);
    if (player.character.hp <= 0) {
      // 유저 사망 시 발동되야하는 함수 여기로 연결
    }
    userUpdateNotification(room);
    // for (let i = 0; i < room.users.length; i++) {
    //   const roomUserSocket = await getSocketByUser(room.users[i]);
    //   if (roomUserSocket) {
    //     sendPacket(roomUserSocket, config.packetType.ANIMATION_NOTIFICATION, { userId: monster.id, animationType: 1 });
    //     sendPacket(roomUserSocket, config.packetType.ANIMATION_NOTIFICATION, { userId: player.id, animationType: 2 });
    //   }
    // }
  }
};
