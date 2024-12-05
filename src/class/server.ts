import fs from 'fs';
import path from 'path';
import net from 'net';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { packetNames } from '../protobuf/packetNames.js';
import protobuf from 'protobufjs';
import { config } from '../config/config.js';
import { onData } from '../events/onData.js';

import { onError } from '../events/onError.js';
import {
  CustomSocket,
  equipItemDBData,
  consumableItemDBData,
  MonsterDBData,
  initGameDBData,
  shopListDBData,
  CharacterInitStatDBData
} from '../interface/interface.js';
import DatabaseManager from '../database/databaseManager.js';
import { connectRedis } from '../database/redis.js';
import { onClose } from '../events/onClose.js';
import { onEnd } from '../events/onEnd.js';

class Server {
  private static gInstance: Server | null = null;
  private protoMessages: { [key: string]: any } = {};
  private server: net.Server;

  public characterStatInfo: CharacterInitStatDBData[] | undefined;
  public characterLevelUpStatInfo: any;
  public consumableItemInfo: consumableItemDBData[] | undefined;
  public equipItemInfo: equipItemDBData[] | undefined;
  public monsterInfo: MonsterDBData[] | undefined;
  public shopListInfo: shopListDBData[] | undefined;
  public initGameInfo: initGameDBData[] | undefined;

  private constructor() {
    this.server = net.createServer(this.clientConnection);
  }

  static getInstance() {
    if (Server.gInstance === null) {
      Server.gInstance = new Server();
    }

    return Server.gInstance;
  }

  getDir(): string {
    const __filename: string = fileURLToPath(import.meta.url);
    const __dirname: string = path.dirname(__filename);
    const protoDir = path.join(__dirname, '../../src/protobuf');

    return protoDir;
  }

  getAllFiles(dir: string, findFileName: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);

      if (fs.statSync(filePath).isDirectory()) {
        this.getAllFiles(filePath, findFileName, fileList);
      } else if (path.extname(file) === findFileName) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  async initializeProto() {
    try {
      const protoFileDir: string = this.getDir();
      const protoFiles: string[] = this.getAllFiles(protoFileDir, '.proto');

      const root = new protobuf.Root();

      // {} return 해줘야함
      await Promise.all(
        protoFiles.map((file: string) => {
          return root.load(file);
        })
      );

      for (const [packetName, types] of Object.entries(packetNames)) {
        this.protoMessages[packetName] = {};
        for (const [type, typeName] of Object.entries(types)) {
          this.protoMessages[packetName][type] = root.lookupType(typeName);
        }
      }

      console.log('Protobuf 파일이 로드되었습니다.');
    } catch (err) {
      console.error('Protobuf 파일 로드 중 오류가 발생했습니다.', err);
    } finally {
      connectRedis();
    }
  }

  getProtoMessages() {
    return { ...this.protoMessages };
  }

  clientConnection(socket: net.Socket) {
    const customSocket = socket as CustomSocket;

    console.log(`Client connected from: ${socket.remoteAddress}:${socket.remotePort}`);

    customSocket.id = uuidv4();
    customSocket.buffer = Buffer.alloc(0);

    customSocket.on('data', onData(customSocket));
    customSocket.on('end', onEnd(customSocket));
    customSocket.on('close', onClose(customSocket));
    customSocket.on('error', onError(customSocket));
  }

  listen() {
    this.server.listen(config.server.port, config.server.host, () => {
      console.log(`서버가 ${config.server.host}:${config.server.port}에서 실행 중입니다.`);
      console.log(this.server.address());
    });
  }

  async start() {
    DatabaseManager.getInstance().testAllDBConnection();

    this.initializeProto();

    this.listen();

    this.characterStatInfo = await DatabaseManager.getInstance().characterInitStatInfo();
    if (!this.characterStatInfo) throw new Error('characterStatInfo 정보를 불러오는데 실패하였습니다.');
    this.characterLevelUpStatInfo = await DatabaseManager.getInstance().characterLevelUpStatInfo();
    if (!this.characterLevelUpStatInfo) throw new Error('characterLevelUpStatInfo 정보를 불러오는데 실패하였습니다.');
    this.consumableItemInfo = await DatabaseManager.getInstance().consumableItemInfo();
    if (!this.consumableItemInfo) throw new Error('consumableItemInfo 정보를 불러오는데 실패하였습니다.');
    this.equipItemInfo = await DatabaseManager.getInstance().equipItemInfo();
    if (!this.equipItemInfo) throw new Error('equipItemInfo 정보를 불러오는데 실패하였습니다.');
    this.monsterInfo = await DatabaseManager.getInstance().monsterInfo();
    if (!this.monsterInfo) throw new Error('monsterInfo 정보를 불러오는데 실패하였습니다.');
    this.shopListInfo = await DatabaseManager.getInstance().shopListInfo();
    if (!this.shopListInfo) throw new Error('shopListInfo 정보를 불러오는데 실패하였습니다.');
    this.initGameInfo = await DatabaseManager.getInstance().initGameInfo();
    if (!this.initGameInfo) throw new Error('initGameInfo 정보를 불러오는데 실패하였습니다.');
  }
}

export default Server;
