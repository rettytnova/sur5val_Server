import Server from './class/server.js';
import { deleteRedisData } from './handlers/handlerMethod.js';

function main() {
  Server.getInstance().start();
}
main();
deleteRedisData('roomData');
deleteRedisData('userData');
deleteRedisData('characterPositionDatas');
deleteRedisData('fleaMarketCards');
