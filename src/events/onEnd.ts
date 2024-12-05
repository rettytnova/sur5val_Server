import { CustomSocket } from '../interface/interface.js';

export const onEnd = (socket: CustomSocket) => async () => {
  console.log('onEnd 함수에 누구 들어옴');
};
