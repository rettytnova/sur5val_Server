import { config } from '../../config/config.js';
import { Room } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { getSocketByUser } from '../handlerMethod.js';

export const userUpdateNotification = (room: Room | null) => {
  if (!room) {
    console.log('userUpdateNoti userSocket 방이 없음');
    return;
  }

  room.users.forEach(async (user) => {
    const userSocket = await getSocketByUser(user);

    if (userSocket) {
      sendPacket(userSocket, config.packetType.USER_UPDATE_NOTIFICATION, {
        user: room.users
      });
    }
    // else {
    //     console.log('`userUpdateNoti userSocket이 없음');
    //     return;
    // }
  });

  return;
};
