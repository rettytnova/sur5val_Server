import net from 'net';

// 게임 종료
export const gameEndHandler = (socket: net.Socket) => {
  console.log('게임 종료');
};
