import fs from 'fs';
import path from 'path';
import net from 'net';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { packetNames } from '../../protobuf/packetNames.js';
import protobuf from 'protobufjs';
import { config } from '../../config/config.js';
import { onData } from '../events/onData.js';

import { onError } from '../events/onError.js';
import {
  CustomSocket,
  equipItemDBData,
  consumableItemDBData,
  MonsterDBData,
  initGameDBData,
  shopListDBData,
  CharacterInitStatDBData,
  CharacterLevelUpStatDBData,
  SpawnPositionData
} from '../interface/interface.js';
import DatabaseManager from '../../database/databaseManager.js';
import { connectRedis } from '../../database/redis.js';
import { onClose } from '../events/onClose.js';
import { onEnd } from '../events/onEnd.js';
import { onChattingServerOnData } from '../events/onChattingServerOnData.js';
import { sendChattingPacket } from '../../packet/createPacket.js';
import { chattingPacketNames } from '../../chattingProtobuf/chattingPacketNames.js';
import GameRoom from './room.js';
import UserSessions from './userSessions.js';
import PositionSessions from './positionSessions.js';
import MarketSessions from './marketSessions.js';
/**
 *   const bossSpawnPositionList: SpawnPositionData[] = await dbManager.spawnPositionInfo(1, 'boss');
  const monsterSpawnPositionList: SpawnPositionData[] = await dbManager.spawnPositionInfo(1, 'monster');
  const playerSpawnPositionList: SpawnPositionData[] = await dbManager.spawnPositionInfo(1, 'player');
 */
class Server {
  private static gInstance: Server | null = null;
  private gameProtoMessages: { [key: string]: any } = {};
  private chattingProtoMessage: { [key: string]: any } = {};
  private server: net.Server;

  public characterStatInfo: CharacterInitStatDBData[] | undefined;
  public characterLevelUpStatInfo: CharacterLevelUpStatDBData[] | undefined;
  public consumableItemInfo: consumableItemDBData[] | undefined;
  public equipItemInfo: equipItemDBData[] | undefined;
  public monsterInfo: MonsterDBData[] | undefined;
  public shopListInfo: shopListDBData[] | undefined;
  public initGameInfo: initGameDBData[] | undefined;
  public bossSpawnPositionList: SpawnPositionData[] | undefined;
  public monsterSpawnPositionList: SpawnPositionData[] | undefined;
  public playerSpawnPositionList: SpawnPositionData[] | undefined;

  private chattingServerSocket: net.Socket;
  private chattingServerReconnect: number;

  private users: UserSessions[];
  private rooms: GameRoom[];
  private characterPositions: PositionSessions[];
  private markets: MarketSessions[];

  public connectingClientCount: number;

  private constructor() {
    this.connectingClientCount = 0;
    this.server = net.createServer(this.clientConnection.bind(this));
    this.chattingServerSocket = new net.Socket();
    this.chattingServerReconnect = 0;

    this.users = [];
    this.rooms = [];
    this.characterPositions = [];
    this.markets = [];
  }

  static getInstance() {
    if (Server.gInstance === null) {
      Server.gInstance = new Server();
    }

    return Server.gInstance;
  }

  getUsers() {
    return this.users;
  }

  setUsers(users: UserSessions[]) {
    this.users = [];
    this.users = users;
  }

  getRooms() {
    return this.rooms;
  }

  getMarkets() {
    return this.markets;
  }

  setRooms(rooms: GameRoom[]) {
    this.rooms = [];
    this.rooms = rooms;
  }

  setMarkets(markets: MarketSessions[]) {
    this.markets = markets;
  }

  getRoomByRoomId(findRoomId: number) {
    return this.rooms.find((room: GameRoom) => room.getRoomId() === findRoomId);
  }

  getUser(id: number) {
    return this.users.find((user: UserSessions) => user.getId() === id);
  }

  getPositions() {
    return this.characterPositions;
  }

  setPositions(characterPositions: PositionSessions[]) {
    this.characterPositions = [];
    this.characterPositions = characterPositions;
  }

  connect() {
    // 기존 connect, error 핸들러 초기화
    this.chattingServerSocket.removeAllListeners('connect');
    this.chattingServerSocket.removeAllListeners('error');

    // 연결 시도
    this.chattingServerSocket.connect(config.chattingServer.chattingServerPort, '127.0.0.1', async () => {
      console.log('채팅서버와 연결');

      this.chattingServerReconnect = 0;

      const customSocket = this.chattingServerSocket as CustomSocket;
      customSocket.on('data', onChattingServerOnData(customSocket));
    });

    // error 핸들러 등록
    this.chattingServerSocket.on('error', (err: NodeJS.ErrnoException) => {
      switch (err.code) {
        case 'ECONNREFUSED':
          if (this.chattingServerReconnect < 20) {
            console.log(`채팅 서버와 연결 시도중.. 재시도 횟수: ${this.chattingServerReconnect + 1}`);
            this.chattingServerReconnect++;
            setTimeout(() => {
              this.connect();
            }, 2000);
          } else {
            console.error('최대 연결 시도 횟수 초과. 채팅서버와 연결 시도 종료');
          }
          break;
      }
    });
  }

  chattingServerSend(chattingPacketType: number, data: Object) {
    const chattingPacket = this.chattingProtoMessage.packet.ChattingPacket;
    sendChattingPacket(chattingPacket, this.chattingServerSocket, chattingPacketType, data);
  }

  getDir(dirPath: string): string {
    const __filename: string = fileURLToPath(import.meta.url);
    const __dirname: string = path.dirname(__filename);
    const protoDir = path.join(__dirname, dirPath);

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
      const gameProtoFileDir: string = this.getDir('../../../src/protobuf');
      const chattingProtoFileDir: string = this.getDir('../../../src/chattingProtobuf');

      const gameProtoFiles: string[] = this.getAllFiles(gameProtoFileDir, '.proto');
      const chattingProtoFiles: string[] = this.getAllFiles(chattingProtoFileDir, '.proto');

      const root = new protobuf.Root();

      // {} return 해줘야함
      await Promise.all(
        gameProtoFiles.map((file: string) => {
          return root.load(file);
        })
      );

      await Promise.all(
        chattingProtoFiles.map((file: string) => {
          return root.load(file);
        })
      );

      for (const [packetName, types] of Object.entries(packetNames)) {
        this.gameProtoMessages[packetName] = {};
        for (const [type, typeName] of Object.entries(types)) {
          this.gameProtoMessages[packetName][type] = root.lookupType(typeName);
        }
      }

      for (const [packetName, types] of Object.entries(chattingPacketNames)) {
        this.chattingProtoMessage[packetName] = {};
        for (const [type, typeName] of Object.entries(types)) {
          this.chattingProtoMessage[packetName][type] = root.lookupType(typeName);
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
    return { ...this.gameProtoMessages };
  }

  getChattingProtoMesages() {
    return { ...this.chattingProtoMessage };
  }

  clientConnection(socket: net.Socket) {
    const customSocket = socket as CustomSocket;

    this.connectingClientCount++;

    console.log(
      `Game 클라 연결 from: ${socket.remoteAddress}:${socket.remotePort} 연결 중인 클라 ${this.connectingClientCount}`
    );

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
    this.bossSpawnPositionList = await DatabaseManager.getInstance().spawnPositionInfo(1, 'boss');
    if (!this.bossSpawnPositionList) throw new Error('bossSpawnPositionList 정보를 불러오는데 실패하였습니다.');
    this.monsterSpawnPositionList = await DatabaseManager.getInstance().spawnPositionInfo(1, 'monster');
    if (!this.monsterSpawnPositionList) throw new Error('monsterSpawnPositionList 정보를 불러오는데 실패하였습니다.');
    this.playerSpawnPositionList = await DatabaseManager.getInstance().spawnPositionInfo(1, 'player');
    if (!this.playerSpawnPositionList) throw new Error('playerSpawnPositionList 정보를 불러오는데 실패하였습니다.');
    this.connect();
  }
}

export default Server;
