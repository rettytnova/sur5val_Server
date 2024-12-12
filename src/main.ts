import Server from './gameServer/class/server.js';
import { deleteRedisData } from './gameServer/handlers/handlerMethod.js';

function main() {
  Server.getInstance().start();
}
main();
deleteRedisData('roomData');
deleteRedisData('userData');
deleteRedisData('characterPositionDatas');
deleteRedisData('fleaMarketCards');
deleteRedisData('userStatusData');
