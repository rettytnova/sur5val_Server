import chalk from 'chalk';
import figlet from 'figlet';
import net from 'net';
import path from 'path';
import fs from 'fs';
import readlineSync from 'readline-sync';
import protobuf from 'protobufjs';
import { fileURLToPath } from 'url';
import { packetNames } from '../protobuf/packetNames.js';
import { chattingPacketMaps, CLIENT_VERSION, config, packetMaps, TOTAL_LENGTH, VERSION_START } from '../config/config.js';
import { chattingPacketNames } from '../chattingProtobuf/chattingPacketNames.js';
import { CustomSocket, Room } from '../gameServer/interface/interface.js';
import { getDummyClientResponseHandlerByPacketType } from './responseHandlers/responseHandlerIndex.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class DummyClientProto {
  private gameProtoMessages: { [key: string]: any } = {};
  private chattingProtoMessage: { [key: string]: any } = {};
  constructor() { }

  getDir(dirPath: string): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const protoDir = path.join(__dirname, dirPath);

    return protoDir;
  }

  getAllFiles(dir: string, findFileName: string, fileList: string[] = []) {
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
      const gameProtoFileDir: string = this.getDir('../../src/protobuf');
      const chattingProtoFileDir: string = this.getDir('../../src/chattingProtobuf');

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
    } catch (error) {
      console.error('Protobuf 파일 로드 중 오류가 발생했습니다.', error);
    }
  }

  getProtoMessages() {
    return { ...this.gameProtoMessages };
  }

  getChattingProtoMessages() {
    return { ...this.chattingProtoMessage };
  }
}

let gDummyClients: UserClient[] = [];
let gDummyGameRooms: DummyGameRoom[] = [];

export const getGDummyGameRooms = () => {
  return gDummyGameRooms;
};

export const setGDummyGameRoomsInit = () => {
  gDummyGameRooms = [];
};

export class DummyGameRoom {
  private roomData: Room;

  constructor(roomData: Room) {
    this.roomData = roomData;
  }

  getRoomData() {
    return this.roomData;
  }
}

let gDummyRegisterClientId = 0;
let gDummyLoginClientId = 0;
let gDummyChattingLoginClientId = 0;
let gDummyRoomId = 0;

let gDummyClientProto: DummyClientProto;

const onDataGameRegisterResponseListener = (socket: CustomSocket, resolve: (value?: void) => void) => (data: Buffer) => {
  socket.buffer = Buffer.concat([socket.buffer, data]);

  const initialHeaderLength = VERSION_START;

  while (socket.buffer.length > initialHeaderLength) {
    let offset: number = 0;

    const packetType = socket.buffer.readUInt16BE(offset);
    offset += config.packet.typeLength;

    const versionLength = socket.buffer.readUInt8(offset);
    offset += config.packet.versionLength;

    const totalHeaderLength = TOTAL_LENGTH + versionLength;

    while (socket.buffer.length >= totalHeaderLength) {
      const version = socket.buffer.toString('utf8', offset, offset + versionLength);
      offset += versionLength;
      if (version !== CLIENT_VERSION) {
        console.error('버전이 다릅니다.');
        break;
      }

      const sequence = socket.buffer.readUInt32BE(offset);
      offset += config.packet.sequenceLength;

      const payloadLength = socket.buffer.readUInt32BE(offset);
      offset += config.packet.payloadLength;

      const length = totalHeaderLength + payloadLength;
      if (socket.buffer.length >= length) {
        let payload = socket.buffer.subarray(offset, offset + payloadLength);

        const gamePacket = gDummyClientProto.getProtoMessages().packet.GamePacket;
        const decodedGamePacket = gamePacket.decode(payload);
        const payloadField = gamePacket.oneofs['payload'].oneof.find(
          (field: any) => decodedGamePacket[field] != null
        );
        const parsedData = decodedGamePacket[payloadField];

        socket.buffer = socket.buffer.subarray(offset + payloadLength);

        switch (packetType) {
          case config.packetType.REGISTER_RESPONSE:
            resolve();
            break;
        }
      }
    }
  }
}

const onDataGameLoginResponseListener = (socket: CustomSocket, resolve: (value?: void) => void) => (data: Buffer) => {
  socket.buffer = Buffer.concat([socket.buffer, data]);

  const initialHeaderLength = VERSION_START;

  while (socket.buffer.length > initialHeaderLength) {
    let offset: number = 0;

    const packetType = socket.buffer.readUInt16BE(offset);
    offset += config.packet.typeLength;

    const versionLength = socket.buffer.readUInt8(offset);
    offset += config.packet.versionLength;

    const totalHeaderLength = TOTAL_LENGTH + versionLength;

    while (socket.buffer.length >= totalHeaderLength) {
      const version = socket.buffer.toString('utf8', offset, offset + versionLength);
      offset += versionLength;
      if (version !== CLIENT_VERSION) {
        console.error('버전이 다릅니다.');
        break;
      }

      const sequence = socket.buffer.readUInt32BE(offset);
      offset += config.packet.sequenceLength;

      const payloadLength = socket.buffer.readUInt32BE(offset);
      offset += config.packet.payloadLength;

      const length = totalHeaderLength + payloadLength;
      if (socket.buffer.length >= length) {
        let payload = socket.buffer.subarray(offset, offset + payloadLength);

        const gamePacket = gDummyClientProto.getProtoMessages().packet.GamePacket;
        const decodedGamePacket = gamePacket.decode(payload);
        const payloadField = gamePacket.oneofs['payload'].oneof.find(
          (field: any) => decodedGamePacket[field] != null
        );
        const parsedData = decodedGamePacket[payloadField];

        socket.buffer = socket.buffer.subarray(offset + payloadLength);

        switch (packetType) {
          case config.packetType.LOGIN_RESPONSE:
            resolve();
            break;
        }
      }
    }
  }
}

export class UserClient {
  private id: number;
  private email: string | null;
  private nickname: string | null;

  private character: CharacterData | null;

  public gameClientSocket: any;
  public chattingClientSocket: any;

  private gameRoomId: number;
  private chattingRoomId: number;

  private gameDataListener: ((data: Buffer) => void) | null;
  private chattingDataListener: ((data: Buffer) => void) | null;

  constructor() {
    this.id = 0;
    this.email = null;
    this.nickname = null;
    this.character = null;

    this.gameRoomId = 0;
    this.chattingRoomId = 0;

    this.gameDataListener = null;
    this.chattingDataListener = null;
  }

  getId() {
    return this.id;
  }

  setId(id: number) {
    this.id = id;
  }

  getEmail() {
    return this.email;
  }

  setEmail(email: string) {
    this.email = email;
  }

  getNickname() {
    return this.nickname;
  }

  setNickname(nickname: string) {
    this.nickname = nickname;
  }

  CreateGamePacket(gamePacketType: number, version: string, sequence: number, payload: object) {
    let versionLength = version.length;

    const typeBuffer = Buffer.alloc(config.packet.typeLength);
    typeBuffer.writeUInt16BE(gamePacketType, 0);

    const versionLengthBuf = Buffer.alloc(config.packet.versionLength);
    versionLengthBuf.writeUInt8(versionLength, 0);

    const versionBuffer = Buffer.from(version, 'utf-8');

    const sequenceBuffer = Buffer.alloc(config.packet.sequenceLength);
    sequenceBuffer.writeUint32BE(sequence, 0);

    const gamePacket = gDummyClientProto.getProtoMessages().packet.GamePacket;
    const packet: { [key: string]: object } = {};

    packet[packetMaps[gamePacketType]] = payload;
    const payloadBuffer = gamePacket.encode(packet).finish();

    const payloadLengthBuffer = Buffer.alloc(config.packet.payloadLength);
    payloadLengthBuffer.writeUInt32BE(payloadBuffer.length, 0);

    return Buffer.concat([
      typeBuffer,
      versionLengthBuf,
      versionBuffer,
      sequenceBuffer,
      payloadLengthBuffer,
      payloadBuffer
    ]);
  }

  CreateChattingPacket(chattingPacketType: number, version: string, sequence: number, payload: object) {
    const versionLength = version.length;

    const typeBuffer = Buffer.alloc(config.packet.typeLength);
    typeBuffer.writeUInt16BE(chattingPacketType, 0);

    const versionLengthBuf = Buffer.alloc(config.packet.versionLength);
    versionLengthBuf.writeUInt8(versionLength, 0);

    const versionBuffer = Buffer.from(version, 'utf-8');

    const sequenceBuffer = Buffer.alloc(config.packet.sequenceLength);
    sequenceBuffer.writeUint32BE(sequence, 0);

    const chattingPacket = gDummyClientProto.getChattingProtoMessages().packet.ChattingPacket;

    const packet: { [key: string]: object } = {};

    packet[chattingPacketMaps[chattingPacketType]] = payload;
    const payloadBuffer = chattingPacket.encode(packet).finish();

    const payloadLengthBuffer = Buffer.alloc(config.packet.payloadLength);
    payloadLengthBuffer.writeUInt32BE(payloadBuffer.length, 0);

    return Buffer.concat([
      typeBuffer,
      versionLengthBuf,
      versionBuffer,
      sequenceBuffer,
      payloadLengthBuffer,
      payloadBuffer
    ]);
  }

  RemoveGameDataListener() {
    this.gameClientSocket.removeListener('data', this.gameDataListener);
    this.gameDataListener = null;
    // const dataListeners = this.gameClientSocket.listenerCount('data');
    // console.log("dataListener Count", dataListeners);
  }

  RemoveChatingDataListener() {
    this.chattingClientSocket.removeListener('data', this.chattingDataListener);
    this.chattingDataListener = null;
    // const dataListeners = this.chattingClientSocket.listenerCount('data');
    // console.log("dataListener Count", dataListeners);
  }

  Connect() {
    return new Promise<void>((resolve, reject) => {
      const promises: Promise<void>[] = [];

      promises.push(
        new Promise<void>((res, rej) => {
          this.gameClientSocket = new net.Socket();

          this.gameClientSocket.connect(5555, '127.0.0.1', () => {
            //console.log('게임 서버와 연결');

            this.gameClientSocket.buffer = Buffer.alloc(0);

            this.gameClientSocket.on('data', (data: Buffer) => {
              this.gameClientSocket.buffer = Buffer.concat([this.gameClientSocket.buffer, data]);

              const initialHeaderLength = VERSION_START;

              while (this.gameClientSocket.buffer.length > initialHeaderLength) {
                let offset: number = 0;

                const packetType = this.gameClientSocket.buffer.readUInt16BE(offset);
                offset += config.packet.typeLength;

                const versionLength = this.gameClientSocket.buffer.readUInt8(offset);
                offset += config.packet.versionLength;

                const totalHeaderLength = TOTAL_LENGTH + versionLength;

                while (this.gameClientSocket.buffer.length >= totalHeaderLength) {
                  const version = this.gameClientSocket.buffer.toString('utf8', offset, offset + versionLength);
                  offset += versionLength;
                  if (version !== CLIENT_VERSION) {
                    console.error('버전이 다릅니다.');
                    break;
                  }

                  const sequence = this.gameClientSocket.buffer.readUInt32BE(offset);
                  offset += config.packet.sequenceLength;

                  const payloadLength = this.gameClientSocket.buffer.readUInt32BE(offset);
                  offset += config.packet.payloadLength;

                  const length = totalHeaderLength + payloadLength;
                  if (this.gameClientSocket.buffer.length >= length) {
                    let payload = this.gameClientSocket.buffer.subarray(offset, offset + payloadLength);

                    const gamePacket = gDummyClientProto.getProtoMessages().packet.GamePacket;
                    const decodedGamePacket = gamePacket.decode(payload);
                    const payloadField = gamePacket.oneofs['payload'].oneof.find(
                      (field: any) => decodedGamePacket[field] != null
                    );
                    const parsedData = decodedGamePacket[payloadField];

                    this.gameClientSocket.buffer = this.gameClientSocket.buffer.subarray(offset + payloadLength);

                    try {
                      const responseHandler = getDummyClientResponseHandlerByPacketType(packetType);
                      responseHandler?.(this, parsedData);
                    }
                    catch (error) {
                      console.error(error);
                    }
                  }
                }
              }
            });

            // const dataListeners = this.gameClientSocket.listenerCount('data');
            // const endListeners = this.gameClientSocket.listenerCount('end');
            // const errorListeners = this.gameClientSocket.listenerCount('error');
            // const closeListeners = this.gameClientSocket.listenerCount('close');
            // console.log(`d ${dataListeners} en ${endListeners} c ${closeListeners} er ${errorListeners}`);

            res();
          });

          this.gameClientSocket.on('close', () => {
          });

          this.gameClientSocket.on('error', (err: NodeJS.ErrnoException) => {
            console.log(`게임 서버 소켓에러 ${err.message}`);
            rej(err);
          });
        })
      )

      promises.push(
        new Promise<void>((res, rej) => {
          this.chattingClientSocket = new net.Socket();
          // 채팅 서버 연결
          this.chattingClientSocket.connect(5556, '127.0.0.1', () => {
            //console.log('채팅 서버와 연결');

            this.chattingClientSocket.buffer = Buffer.alloc(0);

            this.chattingClientSocket.on('data', (data: Buffer) => {
              this.chattingClientSocket.buffer = Buffer.concat([this.chattingClientSocket.buffer, data]);

              const initialHeaderLength = VERSION_START;

              while (this.chattingClientSocket.buffer.length > initialHeaderLength) {
                let offset: number = 0;

                const packetType = this.chattingClientSocket.buffer.readUInt16BE(offset);
                offset += config.packet.typeLength;

                const versionLength = this.chattingClientSocket.buffer.readUInt8(offset);
                offset += config.packet.versionLength;

                const totalHeaderLength = TOTAL_LENGTH + versionLength;

                while (this.chattingClientSocket.buffer.length >= totalHeaderLength) {
                  const version = this.chattingClientSocket.buffer.toString('utf8', offset, offset + versionLength);
                  offset += versionLength;
                  if (version !== CLIENT_VERSION) {
                    console.error('버전이 다릅니다.');
                    break;
                  }

                  const sequence = this.chattingClientSocket.buffer.readUInt32BE(offset);
                  offset += config.packet.sequenceLength;

                  const payloadLength = this.chattingClientSocket.buffer.readUInt32BE(offset);
                  offset += config.packet.payloadLength;

                  const length = totalHeaderLength + payloadLength;
                  if (this.chattingClientSocket.buffer.length >= length) {
                    let payload = this.chattingClientSocket.buffer.subarray(offset, offset + payloadLength);

                    const chattingPacket = gDummyClientProto.getChattingProtoMessages().packet.ChattingPacket;
                    const decodedChattingPacket = chattingPacket.decode(payload);
                    const payloadField = chattingPacket.oneofs['payload'].oneof.find(
                      (field: any) => decodedChattingPacket[field] != null
                    );

                    const parsedData = decodedChattingPacket[payloadField];

                    this.chattingClientSocket.buffer = this.chattingClientSocket.buffer.subarray(offset + payloadLength);

                    switch (packetType) {
                      case config.chattingPacketType.CHATTING_LOGIN_RESPONSE:
                        console.log("로그인 응답 옴");
                        break;
                    }
                  }
                }
              }
            });

            res();
          });

          this.chattingClientSocket.on('close', () => {
          });

          this.chattingClientSocket.on('error', (err: NodeJS.ErrnoException) => {
            console.log(`채팅 서버 소켓에러 ${err.message}`);
            rej(err);
          });
        })
      )

      Promise.all(promises).then(() => resolve()).catch((err) => reject(err));
    });
  }

  Disconnect() {
    return new Promise<void>((resolve, reject) => {
      const promises: Promise<void>[] = [];

      if (this.gameClientSocket) {
        promises.push(
          new Promise<void>((res, rej) => {
            this.gameClientSocket.on("close", () => {
              console.log("게임 서버 소켓 연결이 종료되었습니다.");
              // const dataListeners = this.gameClientSocket.listenerCount('data');
              // const endListeners = this.gameClientSocket.listenerCount('end');
              // const closeListeners = this.gameClientSocket.listenerCount('close');
              // console.log(`d ${dataListeners} e ${endListeners} c ${closeListeners}`);
              res();
            });

            this.gameClientSocket.end();
          })
        )
      } else {
        console.log("게임 서버 소켓이 이미 종료된 상태입니다.");
      }

      if (this.chattingClientSocket) {
        promises.push(
          new Promise<void>((res, rej) => {
            this.chattingClientSocket.on("close", () => {
              console.log("채팅 서버 소켓 연결이 종료되었습니다.");
              res();
            });

            this.chattingClientSocket.end();
          })
        )
      } else {
        console.log("채팅 서버 소켓이 이미 종료된 상태입니다.");
      }

      Promise.all(promises).then(() => resolve());
    });
  }

  GameServerRegisterSend() {
    return new Promise<void>((resolve, reject) => {
      const registerGameServerPacket = this.CreateGamePacket(config.packetType.REGISTER_REQUEST, '1.0.0', 1, {
        email: `dummy_${gDummyRegisterClientId}@naver.com`,
        nickname: `dummy_${gDummyRegisterClientId}`,
        password: `!Dummy${gDummyRegisterClientId}`
      });

      gDummyRegisterClientId++;

      this.gameClientSocket.write(registerGameServerPacket);

      this.gameDataListener = onDataGameRegisterResponseListener(this.gameClientSocket, resolve);

      this.gameClientSocket.on('data', this.gameDataListener);
    });
  }

  ServerLoginSend() {
    return new Promise<void>((resolve, reject) => {
      const loginGameServerPacket = this.CreateGamePacket(config.packetType.LOGIN_REQUEST, '1.0.0', 1, {
        email: `dummy_${gDummyLoginClientId}@naver.com`,
        password: `!Dummy${gDummyLoginClientId}`
      });

      gDummyLoginClientId++;

      this.gameClientSocket.write(loginGameServerPacket);

      this.gameDataListener = onDataGameLoginResponseListener(this.gameClientSocket, resolve);
      this.gameClientSocket.on('data', this.gameDataListener);

      const loginChattingServerPacket = this.CreateChattingPacket(
        config.chattingPacketType.CHATTING_LOGIN_REQUEST, '1.0.0', 1, {
        email: `dummy_${gDummyChattingLoginClientId}@naver.com`,
      });

      gDummyChattingLoginClientId++;

      this.chattingClientSocket.write(loginChattingServerPacket);
    });
  }

  GameServerGetRoomList() {
    setInterval(() => {
      const getRoomListGameServerPacket = this.CreateGamePacket(
        config.packetType.GET_ROOM_LIST_REQUEST,
        '1.0.0',
        1,
        {}
      );

      this.gameClientSocket.write(getRoomListGameServerPacket);
    }, 1000);
  }
}

async function dummyClientProtoInit() {
  gDummyClientProto = new DummyClientProto();
  await gDummyClientProto.initializeProto();
}

function displayLobby() {
  console.log(
    chalk.cyanBright(
      figlet.textSync('Dummy Client', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      })
    )
  );

  const line = chalk.magentaBright('='.repeat(68));
  console.log(line);

  console.log(chalk.yellowBright.bold('더미 클라이언트 작동 시작'));
  console.log('');
  console.log(chalk.red('1. ') + chalk.white('더미 클라 생성'));
  console.log(chalk.red('2. ') + chalk.white('더미 클라 회원가입'));
  console.log(chalk.red('3. ') + chalk.white('더미 클라 로그인'));
  console.log(chalk.red('4. ') + chalk.white('더미 클라 시작'));
  console.log(chalk.red('5. ') + chalk.white('더미 클라 접속 종료'));
}

function handleUserInput() {
  const choice = readlineSync.question('Select : ');

  switch (choice) {
    case '1':
      DummyClientCreate();
      break;
    case '2':
      DummyClientRegister();
      break;
    case '3':
      DummyClientLogin();
      break;
    case '4':
      break;
    case '5':
      DummyClientDisconnect();
      break;
  }
}

async function GameDataListenerRemove() {
  await Promise.all(gDummyClients.map((dummy: UserClient) => dummy.RemoveGameDataListener()));
}

async function ChattingDataListenerRemove() {
  await Promise.all(gDummyClients.map((dummy: UserClient) => dummy.RemoveChatingDataListener()));
}

async function DummyClientCreate() {
  console.clear();

  if (gDummyClients.length === 0) {
    console.log(chalk.white('[더미 클라를 생성 합니다.]'));
    console.log(chalk.white('[더미 클라의 개수를 입력하세요.]'));
    const dummyClientCount = readlineSync.question('Client Count : ');

    console.log(chalk.green('더미 생성중 ... '));

    await Promise.all(
      Array.from({ length: parseInt(dummyClientCount) }, async (_, i) => {
        const newDummyClient = new UserClient();
        gDummyClients.push(newDummyClient);
      })
    ).then(() => {
      console.log(chalk.green(`더미 생성완료 ... [${gDummyClients.length}]`));
      DummyClientConnect();
    });
  }
  else {
    console.log(`생성한 더미 [${gDummyClients}]의 접속을 종료하고 생성하세요`);
    DummyClientConnect();
  }
}

function DummyClientConnect() {
  console.clear();
  console.log(chalk.white('[생성한 더미 클라로 게임서버와 채팅서버에 접속합니다.]'));

  setTimeout(async () => {
    try {
      await Promise.all(gDummyClients.map((dummy: UserClient) => dummy.Connect()));
    }
    catch (err: any) {

    }

    DummyClientLobbyScreen();
  }, 500);
}

function DummyClientRegister() {
  console.clear();
  console.log(chalk.white('[생성한 더미 클라로 회원가입을 진행합니다.]'));

  setTimeout(async () => {
    await Promise.all(gDummyClients.map((dummy: UserClient) => dummy.GameServerRegisterSend()));
    console.log(`더미 클라 회원가입 전송 완료`);
    await GameDataListenerRemove();
    DummyClientLobbyScreen();
  }, 500);
}

function DummyClientLogin() {
  console.clear();
  console.log(chalk.white(`[생성한 더미 클라로 로그인을 진행합니다.] ${gDummyClients.length}`));

  setTimeout(async () => {
    await Promise.all(gDummyClients.map((dummy: UserClient) => dummy.ServerLoginSend()));
    console.log(chalk.green(`[더미 클라 로그인 전송 완료]`));
    await GameDataListenerRemove();

    DummyClientLobbyScreen();
  }, 500);
}

async function DummyClientDisconnect() {
  console.clear();

  if (gDummyClients.length > 0) {
    console.log(chalk.white('[서버와 접속을 종료합니다.]'));

    await Promise.all(
      gDummyClients.map(async (dummy: UserClient, index: number) => {
        //console.log(`[클라 ${index}] Disconnect 시작`);
        await dummy.Disconnect();
        //console.log(`[클라 ${index}] Disconnect 완료`);
      })
    );
    gDummyClients = [];

    gDummyRegisterClientId = 0;
    gDummyLoginClientId = 0;
    gDummyChattingLoginClientId = 0;

    console.log(chalk.green('[모든 클라이언트의 접속 종료 완료.]'));

  } else {
    console.log(chalk.redBright("더미를 생성하고 접속을 종료하세요"));
  }

  DummyClientLobbyScreen();
}

function DummyClientLobbyScreen() {
  displayLobby();
  handleUserInput();
}

async function DummyClientLobbyStart() {
  await dummyClientProtoInit();
  DummyClientLobbyScreen();
}

DummyClientLobbyStart();
