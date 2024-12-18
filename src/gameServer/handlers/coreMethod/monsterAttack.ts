import { config } from '../../../config/config.js';
import { CharacterPositionData } from '../../../gameServer/interface/interface.js';
import { sendPacket } from '../../../packet/createPacket.js';
import { socketSessions } from '../../session/socketSession.js';
import { animationDelay, monsterAiDatas } from './monsterMove.js';
import { RoleType } from '../enumTyps.js';
import Server from '../../class/server.js';
import { shoppingUserIdSessions } from '../../session/shoppingSession.js';
import GameRoom from '../../class/room.js';
import UserSessions from '../../class/userSessions.js';
import { userUpdateNotification } from '../notification/userUpdate.js';

// 몬스터와 유저의 조합 찾기
export const monsterAttackCheck = (room: GameRoom, rooms: GameRoom[]) => {
  for (let i = 0; i < room.getUsers().length; i++) {
    if (room.getUsers()[i].getCharacter().roleType === RoleType.SUR5VAL && room.getUsers()[i].getCharacter().hp > 0) {
      for (let j = 0; j < room.getUsers().length; j++) {
        if (room.getUsers()[j].getCharacter().roleType === RoleType.WEAK_MONSTER) {
          monsterAttackPlayer(room.getUsers()[i], room.getUsers()[j], room, rooms);
        }
      }
    }
  }
};

// 몬스터가 유저를 공격가능한 조건인지 모두 검사 실행
export const monsterAttackPlayer = (player: UserSessions, monster: UserSessions, room: GameRoom, rooms: GameRoom[]) => {
  // 죽은 몬스터일 경우 skip
  for (let i = 0; i < rooms.length; i++) {
    for (let j = 0; j < rooms[i].getUsers().length; j++) {
      if (rooms[i].getUsers()[j].getId() === monster.getId()) {
        if (rooms[i].getUsers()[j].getCharacter().hp <= 0) return;
        break;
      }
    }
  }

  // 죽은 유저일 경우 skip
  for (let i = 0; i < rooms.length; i++) {
    for (let j = 0; j < rooms[i].getUsers().length; j++) {
      if (rooms[i].getUsers()[j].getId() === player.getId()) {
        if (rooms[i].getUsers()[j].getCharacter().hp <= 0) return;
        break;
      }
    }
  }

  // 몬스터 정보 skillCool 찾아서 검사하기
  let monsterData;
  if (!monsterAiDatas[room.getRoomId()]) return;
  for (let i = 0; i < monsterAiDatas[room.getRoomId()].length; i++) {
    if (monsterAiDatas[room.getRoomId()][i].id === monster.getId()) {
      if (monsterAiDatas[room.getRoomId()][i].attackCool > 0) return;
      else monsterData = monsterAiDatas[room.getRoomId()][i];
      break;
    }
  }
  if (!monsterData) {
    console.error('존재하지 않는 monsterAiDatas를 찾고 있습니다.', monsterAiDatas[room.getRoomId()], monster);
    return;
  }

  // 몬스터 위치 정보 찾기
  const positionSessions = Server.getInstance()
    .getPositions()
    .find((PositionSessions) => PositionSessions.getPositionRoomId() === room.getRoomId());
  if (!positionSessions) return;
  if (!positionSessions.getCharacterPositions()) return;
  const characterPositions = positionSessions.getCharacterPositions();
  let monsterPosition;
  for (let i = 0; i < characterPositions.length; i++) {
    if (characterPositions[i].id === monster.getId()) {
      monsterPosition = characterPositions[i];
      break;
    }
  }
  if (!monsterPosition) {
    console.error(
      '존재하지 않는 monsterPosition를 찾고 있습니다.',
      characterPositions[room.getRoomId()],
      room.getUsers()
    );
    return;
  }

  // 유저 위치 정보 찾기
  let playerPosition;
  for (let i = 0; i < characterPositions.length; i++) {
    if (characterPositions[i].id === player.getId()) {
      playerPosition = characterPositions[i];
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
    // 유저가 범위 안에 들어와 있지만 공격 불가능한 위치일 경우 skip
    for (let i = 0; i < characterPositions.length; i++) {
      let characterPos: CharacterPositionData = characterPositions[i];
      if (player !== null && characterPos.id === player.getId()) {
        if (
          (-23 <= characterPos.x && characterPos.x <= -12 && 5 <= characterPos.y && characterPos.y <= 10) || // 건물 1
          (-7 <= characterPos.x && characterPos.x <= 0 && 5 <= characterPos.y && characterPos.y <= 10) || // 건물 2
          (3 <= characterPos.x && characterPos.x <= 13 && 5 <= characterPos.y && characterPos.y <= 10) || // 건물 3
          (16 <= characterPos.x && characterPos.x <= 23 && 5 <= characterPos.y && characterPos.y <= 10) || // 건물 4
          (-23 <= characterPos.x && characterPos.x <= -14 && -9 <= characterPos.y && characterPos.y <= -2.5) || // 건물 5
          (-12 <= characterPos.x && characterPos.x <= -2.5 && -9 <= characterPos.y && characterPos.y <= -2.5) || // 건물 6
          (6 <= characterPos.x && characterPos.x <= 13 && -9 <= characterPos.y && characterPos.y <= -2.5) || // 건물 7
          (16 <= characterPos.x && characterPos.x <= 23 && -9 <= characterPos.y && characterPos.y <= -2.5) || // 건물 8
          (-21 <= characterPos.x && characterPos.x <= -20 && 2.5 <= characterPos.y && characterPos.y <= 3.5) || // 부쉬 1
          (-15 <= characterPos.x && characterPos.x <= -14 && 2.5 <= characterPos.y && characterPos.y <= 3.5) || // 부쉬 2
          (11 <= characterPos.x && characterPos.x <= 12 && 0.5 <= characterPos.y && characterPos.y <= 1.5) || // 부쉬 3
          (21 <= characterPos.x && characterPos.x <= 22 && 0.5 <= characterPos.y && characterPos.y <= 1.5) || // 부쉬 4
          (-2 <= characterPos.x && characterPos.x <= -1 && -8.5 <= characterPos.y && characterPos.y <= -7.5) || // 부쉬 5
          (4 <= characterPos.x && characterPos.x <= 5 && -8.5 <= characterPos.y && characterPos.y <= -7.5) // 부쉬 6
        ) {
          //console.log('유저가 공격 불가능한 위치에 있어 몬스터가 공격할 수 없습니다.');
          return;
        }
      }
    }
    // DB의 몬스터 attackeCool 값 가져오기
    const monsterDBInfo = Server.getInstance().monsterInfo;
    if (!monsterDBInfo) {
      console.error('monsterInfo 정보를 불러오는데 실패하였습니다.');
      return;
    }
    const attackCool = monsterDBInfo.find(
      (data) => data.monsterType === monster.getCharacter().characterType && data.level === monster.getCharacter().level
    )?.attackCool;
    if (!attackCool) {
      console.error('몬스터의 attackeCool DB정보를 찾지 못하였습니다.');
      return;
    }
    monsterData.attackCool = attackCool;

    // 공격 실행
    for (let i = 0; i < rooms.length; i++) {
      for (let j = 0; j < rooms[i].getUsers().length; j++) {
        if (rooms[i].getUsers()[j].getId() === player.getId()) {
          rooms[i].getUsers()[j].getCharacter().hp -= Math.max(
            monster.getCharacter().attack - player.getCharacter().armor,
            0
          );
          if (rooms[i].getUsers()[j].getCharacter().hp <= 0) {
            rooms[i].getUsers()[j].getCharacter().aliveState = false;
            rooms[i].getUsers()[j].getCharacter().stateInfo.state = 15;
            rooms[i].getUsers()[j].getCharacter().hp = 0;
            for (let i = 0; i < shoppingUserIdSessions[room.getRoomId()].length; i++) {
              if (shoppingUserIdSessions[room.getRoomId()][i][0] === player.getId()) {
                shoppingUserIdSessions[room.getRoomId()].splice(i, 1);
                break;
              }
            }
          }
          userUpdateNotification(rooms[i]);
        }
      }
    }

    // 몬스터 딜레이 만들기
    for (let i = 0; i < monsterAiDatas[room.getRoomId()].length; i++) {
      if (monsterAiDatas[room.getRoomId()][i].id === monster.getId()) {
        monsterAiDatas[room.getRoomId()][i].animationDelay = animationDelay;
        break;
      }
    }

    // 애니메이셔 효과 보내기
    for (let i = 0; i < room.getUsers().length; i++) {
      if (socketSessions[room.getUsers()[i].getId()]) {
        sendPacket(socketSessions[room.getUsers()[i].getId()], config.packetType.ANIMATION_NOTIFICATION, {
          userId: player.getId(),
          animationType: 2
        });
      }
    }
  }
};
