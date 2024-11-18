import { config } from '../../config/config.js';
import { RedisUserData, User } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';

export const userUpdateNotification = async (userDatas: RedisUserData[]) => {
  // for (let i = 0; i < userDatas.length; i++) {
  //   const userData = userDatas[i];
  //   const userSocket = await getSocketByUserId(userData);
  //   sendPacket(
  //     userSocket,
  //     config.packetType.USER_UPDATE_NOTIFICATION,
  //     userDatas as User[],
  //   );
  // }
};
