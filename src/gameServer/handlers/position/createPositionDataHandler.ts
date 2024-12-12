import { dbManager } from '../../../database/user/user.db.js';
import { CustomSocket, positionType, SpawnPositionData } from '../../interface/interface.js';

export const createPositionDataHandler = async (socket: CustomSocket, payload: object) => {
  const { spawnPositionX, spawnPositionY, roleType } = payload as positionType; // spawnPositionX, spawnPositionY, roleType
  const positionList: SpawnPositionData[] = await dbManager.spawnPositionInfo(1, roleType);

  console.log(positionList);

  const newSpawnPosition = await dbManager.createSpawnPosition(
    1,
    positionList.length + 1,
    spawnPositionX,
    spawnPositionY,
    roleType
  );

  console.info(`새로운 스폰위치 정보 생성 완료: ${newSpawnPosition}`);
};
