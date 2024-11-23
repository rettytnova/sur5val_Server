import { config } from '../../config/config.js';
import { Room } from '../../interface/interface.js';
import { sendPacket } from '../../packet/createPacket.js';
import { socketSessions } from '../../session/socketSession.js';

export const userUpdateNotification = (room: Room | null) => {
  if (!room) {
    console.log('userUpdateNoti userSocket 방이 없음');
    return;
  }

  room.users.forEach(async (user) => {
    const userSocket = socketSessions[user.id];

    if (userSocket) {
      sendPacket(userSocket, config.packetType.USER_UPDATE_NOTIFICATION, {
        user: room.users
      });
    }
  });

  return;
};
