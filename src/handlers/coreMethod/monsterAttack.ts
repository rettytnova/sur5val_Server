import { config } from '../../config/config.js';
import { Room, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { socketSessions } from '../../session/socketSession.js';
import { getRedisData, setRedisData } from '../handlerMethod.js';
import { animationDelay, monsterAiDatas } from './monsterMove.js';
import { userUpdateNotification } from '../notification/userUpdate.js';
import { RoleType } from '../enumTyps.js';
import Server from '../../class/server.js';

// 몬스터와 유저의 조합 찾기
export const monsterAttackCheck = async (room: Room, rooms: Room[]) => {
  for (let i = 0; i < room.users.length; i++) {
    if (room.users[i].character.roleType === RoleType.SUR5VAL && room.users[i].character.hp > 0) {
      for (let j = 0; j < room.users.length; j++) {
        if (room.users[j].character.roleType === RoleType.WEAK_MONSTER) {
          await monsterAttackPlayer(room.users[i], room.users[j], room, rooms);
        }
      }
    }
  }
};

// 몬스터가 유저를 공격가능한 조건인지 모두 검사 실행
export const monsterAttackPlayer = async (player: User, monster: User, room: Room, rooms: Room[]) => {
  // 죽은 몬스터일 경우 skip
  for (let i = 0; i < rooms.length; i++) {
    for (let j = 0; j < rooms[i].users.length; j++) {
      if (rooms[i].users[j].id === monster.id) {
        if (rooms[i].users[j].character.hp <= 0) return;
        break;
      }
    }
  }

  // 죽은 유저일 경우 skip
  for (let i = 0; i < rooms.length; i++) {
    for (let j = 0; j < rooms[i].users.length; j++) {
      if (rooms[i].users[j].id === player.id) {
        if (rooms[i].users[j].character.hp <= 0) return;
        break;
      }
    }
  }

  // 몬스터 정보 skillCool 찾아서 검사하기
  let monsterData;
  if (!monsterAiDatas[room.id]) return;
  for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
    if (monsterAiDatas[room.id][i].id === monster.id) {
      if (monsterAiDatas[room.id][i].attackCool > 0) return;
      else monsterData = monsterAiDatas[room.id][i];
      break;
    }
  }
  if (!monsterData) {
    console.error('존재하지 않는 monsterAiDatas를 찾고 있습니다.', monsterAiDatas[room.id], monster);
    return;
  }

  // 몬스터 위치 정보 찾기
  const characterPositions = await getRedisData('characterPositionDatas');
  if (!characterPositions) return;
  if (!characterPositions[room.id]) return;
  let monsterPosition;
  for (let i = 0; i < characterPositions[room.id].length; i++) {
    if (characterPositions[room.id][i].id === monster.id) {
      monsterPosition = characterPositions[room.id][i];
      break;
    }
  }
  if (!monsterPosition) {
    console.error('존재하지 않는 monsterPosition를 찾고 있습니다.', characterPositions[room.id], room.users);
    return;
  }

  // 유저 위치 정보 찾기
  let playerPosition;
  for (let i = 0; i < characterPositions[room.id].length; i++) {
    if (characterPositions[room.id][i].id === player.id) {
      playerPosition = characterPositions[room.id][i];
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
    // DB의 몬스터 attackeCool 값 가져오기
    const monsterDBInfo = Server.getInstance().monsterInfo;
    if (!monsterDBInfo) {
      console.error('monsterInfo 정보를 불러오는데 실패하였습니다.');
      return;
    }
    const attackCool = monsterDBInfo.find(
      (data) => data.monsterType === monster.character.characterType && data.level === monster.character.level
    )?.attackCool;
    if (!attackCool) {
      console.error('몬스터의 attackeCool DB정보를 찾지 못하였습니다.');
      return;
    }
    monsterData.attackCool = attackCool;

    // 공격 실행
    for (let i = 0; i < rooms.length; i++) {
      for (let j = 0; j < rooms[i].users.length; j++) {
        if (rooms[i].users[j].id === player.id) {
          rooms[i].users[j].character.hp -= Math.max(monster.character.attack - player.character.armor, 0);
          if (rooms[i].users[j].character.hp <= 0) {
            rooms[i].users[j].character.aliveState = false;
            rooms[i].users[j].character.stateInfo.state = 15;
            rooms[i].users[j].character.hp = 0;
          }
          await userUpdateNotification(rooms[i]);
          await setRedisData('roomData', rooms);
        }
      }
    }

    // 애니메이션 효과 보내기
    if (socketSessions[player.id]) {
      for (let i = 0; i < monsterAiDatas[room.id].length; i++) {
        if (monsterAiDatas[room.id][i].id === monster.id) {
          monsterAiDatas[room.id][i].animationDelay = animationDelay;
          break;
        }
      }
      sendPacket(socketSessions[player.id], config.packetType.ANIMATION_NOTIFICATION, {
        userId: player.id,
        animationType: 2
      });
    }

    // 에러 찾기 임시 함수
    if (room.users.length !== characterPositions[room.id].length) {
      throw new Error(`monsterAttack에서 에러 발생 ${room.users}, ${characterPositions[room.id]}`);
    }
  }
};
