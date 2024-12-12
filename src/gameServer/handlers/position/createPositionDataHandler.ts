import { dbManager } from '../../../database/user/user.db.js';
import { CustomSocket, positionType, SpawnPositionData } from '../../interface/interface.js';

export const createPositionDataHandler = async (socket: CustomSocket, payload: object) => {
  const { x, y, roleType } = payload as positionType; // spawnPositionX, spawnPositionY, roleType
  const positionList: SpawnPositionData[] = await dbManager.spawnPositionInfo();

  let positionAmount = 1;
  for (let i = 0; i < positionList.length; i++) {
    if (positionList[i].roleType === roleType) {
      positionAmount++;
    }
  }

  const newSpawnPosition = await dbManager.createSpawnPosition(1, positionAmount, x, y, roleType);

  console.info(`새로운 스폰위치 정보 생성 완료: ${newSpawnPosition}`);
};
