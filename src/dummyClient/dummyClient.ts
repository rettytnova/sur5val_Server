// import chalk from 'chalk';
// import figlet from 'figlet';
// import net from 'net';
// import path from 'path';
// import fs from 'fs';
// import readlineSync from 'readline-sync';
// import protobuf from 'protobufjs';
// import { fileURLToPath } from 'url';
// import { packetNames } from '../protobuf/packetNames.js';
// import { CLIENT_VERSION, config, packetMaps, TOTAL_LENGTH, VERSION_START } from '../config/config.js';
// import { chattingPacketNames } from '../chattingProtobuf/chattingPacketNames.js';
// import { Room } from '../gameServer/interface/interface.js';

// class DummyClientProto {
//   private gameProtoMessages: { [key: string]: any } = {};
//   private chattingProtoMessage: { [key: string]: any } = {};
//   constructor() {}

//   getDir(dirPath: string): string {
//     const __filename = fileURLToPath(import.meta.url);
//     const __dirname = path.dirname(__filename);
//     const protoDir = path.join(__dirname, dirPath);

//     return protoDir;
//   }

//   getAllFiles(dir: string, findFileName: string, fileList: string[] = []) {
//     const files = fs.readdirSync(dir);
//     files.forEach((file) => {
//       const filePath = path.join(dir, file);

//       if (fs.statSync(filePath).isDirectory()) {
//         this.getAllFiles(filePath, findFileName, fileList);
//       } else if (path.extname(file) === findFileName) {
//         fileList.push(filePath);
//       }
//     });

//     return fileList;
//   }

//   async initializeProto() {
//     try {
//       const gameProtoFileDir: string = this.getDir('../../src/protobuf');
//       const chattingProtoFileDir: string = this.getDir('../../src/chattingProtobuf');

//       const gameProtoFiles: string[] = this.getAllFiles(gameProtoFileDir, '.proto');
//       const chattingProtoFiles: string[] = this.getAllFiles(chattingProtoFileDir, '.proto');

//       const root = new protobuf.Root();

//       // {} return 해줘야함
//       await Promise.all(
//         gameProtoFiles.map((file: string) => {
//           return root.load(file);
//         })
//       );

//       await Promise.all(
//         chattingProtoFiles.map((file: string) => {
//           return root.load(file);
//         })
//       );

//       for (const [packetName, types] of Object.entries(packetNames)) {
//         this.gameProtoMessages[packetName] = {};
//         for (const [type, typeName] of Object.entries(types)) {
//           this.gameProtoMessages[packetName][type] = root.lookupType(typeName);
//         }
//       }

//       for (const [packetName, types] of Object.entries(chattingPacketNames)) {
//         this.chattingProtoMessage[packetName] = {};
//         for (const [type, typeName] of Object.entries(types)) {
//           this.chattingProtoMessage[packetName][type] = root.lookupType(typeName);
//         }
//       }

//       console.log('Protobuf 파일이 로드되었습니다.');
//     } catch (error) {
//       console.error('Protobuf 파일 로드 중 오류가 발생했습니다.', error);
//     }
//   }

//   getProtoMessages() {
//     return { ...this.gameProtoMessages };
//   }

//   getChattingProtoMessages() {
//     return { ...this.chattingProtoMessage };
//   }
// }

// const gDummyClients: UserClient[] = [];
// let gDummyGameRooms: DummyGameRoom[] = [];

// class DummyGameRoom {
//   private roomData: Room;

//   constructor(roomData: Room) {
//     this.roomData = roomData;
//   }

//   getRoomData() {
//     return this.roomData;
//   }
// }

// let gDummyRegisterClientId = 0;
// let gDummyLoginClientId = 0;
// let gDummyRoomId = 0;

// class UserClient {
//   private id: number;
//   private email: string | null;
//   private nickname: string | null;
//   private character: CharacterData | null;

//   private gameClientSocket: any;
//   private chattingClientSocket: any;

//   private gameRoomId: number;
//   private chattingRoomId: number;

//   private dummyClientProto: DummyClientProto;

//   constructor() {
//     this.id = 0;
//     this.email = null;
//     this.nickname = null;
//     this.character = null;

//     this.gameClientSocket = new net.Socket();
//     this.chattingClientSocket = new net.Socket();
//     this.dummyClientProto = new DummyClientProto();
//     this.gameRoomId = 0;
//     this.chattingRoomId = 0;
//   }

//   async ProtoGet() {
//     await this.dummyClientProto.initializeProto();
//   }

//   CreateGamePacket(gamePacketType: number, version: string, sequence: number, payload: object) {
//     let versionLength = version.length;

//     const typeBuffer = Buffer.alloc(config.packet.typeLength);
//     typeBuffer.writeUInt16BE(gamePacketType, 0);

//     const versionLengthBuf = Buffer.alloc(config.packet.versionLength);
//     versionLengthBuf.writeUInt8(versionLength, 0);

//     const versionBuffer = Buffer.from(version, 'utf-8');

//     const sequenceBuffer = Buffer.alloc(config.packet.sequenceLength);
//     sequenceBuffer.writeUint32BE(sequence, 0);

//     const gamePacket = this.dummyClientProto.getProtoMessages().packet.GamePacket;
//     const packet: { [key: string]: object } = {};

//     packet[packetMaps[gamePacketType]] = payload;
//     const payloadBuffer = gamePacket.encode(packet).finish();

//     const payloadLengthBuffer = Buffer.alloc(config.packet.payloadLength);
//     payloadLengthBuffer.writeUInt32BE(payloadBuffer.length, 0);

//     return Buffer.concat([
//       typeBuffer,
//       versionLengthBuf,
//       versionBuffer,
//       sequenceBuffer,
//       payloadLengthBuffer,
//       payloadBuffer
//     ]);
//   }

//   CreateChattingPacket(chattingPacketType: number, version: string, sequence: number, payload: object) {
//     const versionLength = version.length;

//     const typeBuffer = Buffer.alloc(config.packet.typeLength);
//     typeBuffer.writeUInt16BE(chattingPacketType, 0);

//     const versionLengthBuf = Buffer.alloc(config.packet.versionLength);
//     versionLengthBuf.writeUInt8(versionLength, 0);

//     const versionBuffer = Buffer.from(version, 'utf-8');

//     const sequenceBuffer = Buffer.alloc(config.packet.sequenceLength);
//     sequenceBuffer.writeUint32BE(sequence, 0);

//     const chattingPacket = this.dummyClientProto.getChattingProtoMessages().packet.ChattingPacket;
//     const packet: { [key: string]: object } = {};

//     packet[packetMaps[chattingPacketType]] = payload;
//     const payloadBuffer = chattingPacket.encode(packet).finish();

//     const payloadLengthBuffer = Buffer.alloc(config.packet.payloadLength);
//     payloadLengthBuffer.writeUInt32BE(payloadBuffer.length, 0);

//     return Buffer.concat([
//       typeBuffer,
//       versionLengthBuf,
//       versionBuffer,
//       sequenceBuffer,
//       payloadLengthBuffer,
//       payloadBuffer
//     ]);
//   }

//   Connect() {
//     return new Promise<void>((resolve, reject) => {
//       // 게임 서버 연결
//       this.gameClientSocket.connect(5555, '127.0.0.1', () => {
//         console.log('게임 서버와 연결');

//         this.gameClientSocket.buffer = Buffer.alloc(0);

//         this.gameClientSocket.on('data', (data: Buffer) => {
//           this.gameClientSocket.buffer = Buffer.concat([this.gameClientSocket.buffer, data]);

//           const initialHeaderLength = VERSION_START;

//           while (this.gameClientSocket.buffer.length > initialHeaderLength) {
//             let offset: number = 0;

//             const packetType = this.gameClientSocket.buffer.readUInt16BE(offset);
//             offset += config.packet.typeLength;

//             const versionLength = this.gameClientSocket.buffer.readUInt8(offset);
//             offset += config.packet.versionLength;

//             const totalHeaderLength = TOTAL_LENGTH + versionLength;

//             while (this.gameClientSocket.buffer.length >= totalHeaderLength) {
//               const version = this.gameClientSocket.buffer.toString('utf8', offset, offset + versionLength);
//               offset += versionLength;
//               if (version !== CLIENT_VERSION) {
//                 console.error('버전이 다릅니다.');
//                 break;
//               }

//               const sequence = this.gameClientSocket.buffer.readUInt32BE(offset);
//               offset += config.packet.sequenceLength;

//               const payloadLength = this.gameClientSocket.buffer.readUInt32BE(offset);
//               offset += config.packet.payloadLength;

//               const length = totalHeaderLength + payloadLength;
//               if (this.gameClientSocket.buffer.length >= length) {
//                 let payload = this.gameClientSocket.buffer.subarray(offset, offset + payloadLength);

//                 const protoGameMessages = this.dummyClientProto.getProtoMessages();
//                 const gamePacket = protoGameMessages.packet.GamePacket;
//                 const decodedGamePacket = gamePacket.decode(payload);
//                 const payloadField = gamePacket.oneofs['payload'].oneof.find(
//                   (field: any) => decodedGamePacket[field] != null
//                 );
//                 const parsedData = decodedGamePacket[payloadField];

//                 this.gameClientSocket.buffer = this.gameClientSocket.buffer.subarray(offset + payloadLength);

//                 //console.log(parsedData);
//                 switch (packetType) {
//                   case config.packetType.REGISTER_RESPONSE:
//                     if (!parsedData.success) {
//                       console.log(`회원가입 실패 ${parsedData.message}`);
//                     } else {
//                       console.log(`회원가입 성공 ${parsedData.message}`);
//                     }
//                     break;
//                   case config.packetType.LOGIN_RESPONSE:
//                     if (parsedData.success === true) {
//                       this.GameServerGetRoomList();

//                       this.id = parsedData.myInfo.id;
//                       this.email = parsedData.myInfo.email;
//                       this.nickname = parsedData.myInfo.nickname;

//                       console.log(`더미 로그인 성공 id : ${this.id} email ${this.email} nickName ${this.nickname}`);
//                     }
//                     break;
//                   case config.packetType.CREATE_ROOM_RESPONSE:
//                     if (parsedData.success === true) {
//                       console.log('방 생성 성공', parsedData.room.id);
//                     } else {
//                       console.log('방 생성 실패');
//                     }
//                     break;
//                   case config.packetType.GET_ROOM_LIST_RESPONSE:
//                     gDummyGameRooms = [];

//                     const rooms = parsedData.rooms;
//                     if (rooms.length === 0) {
//                       this.GameServerCreateRoom();
//                     } else {
//                       rooms.forEach((room: any) => {
//                         const dummyGameRoom = new DummyGameRoom(room);
//                         gDummyGameRooms.push(dummyGameRoom);
//                       });
//                     }
//                     break;
//                   case config.packetType.JOIN_ROOM_RESPONSE:
//                     break;
//                   case config.packetType.JOIN_RANDOM_ROOM_RESPONSE:
//                     break;
//                   case config.packetType.JOIN_ROOM_NOTIFICATION:
//                     break;
//                   case config.packetType.LEAVE_ROOM_RESPONSE:
//                     break;
//                   case config.packetType.LEAVE_ROOM_NOTIFICATION:
//                     break;
//                   case config.packetType.GAME_PREPARE_RESPONSE:
//                     break;
//                   case config.packetType.GAME_PREPARE_NOTIFICATION:
//                     break;
//                   case config.packetType.GAME_START_RESPONSE:
//                     break;
//                   case config.packetType.GAME_START_NOTIFICATION:
//                     break;
//                   case config.packetType.POSITION_UPDATE_NOTIFICATION:
//                     break;
//                   case config.packetType.USE_CARD_RESPONSE:
//                     break;
//                   case config.packetType.USER_UPDATE_NOTIFICATION:
//                     break;
//                   case config.packetType.EQUIP_CARD_NOTIFICATION:
//                     break;
//                   case config.packetType.CARD_EFFECT_NOTIFICATION:
//                     break;
//                   case config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE:
//                     break;
//                   case config.packetType.FLEA_MARKET_PICK_RESPONSE:
//                     break;
//                   case config.packetType.FLEA_MARKET_CARD_PICK_RESPONSE:
//                     break;
//                   case config.packetType.USER_UPDATE_NOTIFICATION:
//                     break;
//                   case config.packetType.PHASE_UPDATE_NOTIFICATION:
//                     break;
//                   case config.packetType.REACTION_RESPONSE:
//                     break;
//                   case config.packetType.DESTORY_CARD_RESPONSE:
//                     break;
//                   case config.packetType.GAME_END_NOTIFICATION:
//                     break;
//                   case config.packetType.CARD_SELECT_RESPONSE:
//                     break;
//                   case config.packetType.PASS_DEBUFF_RESPONSE:
//                     break;
//                   case config.packetType.WARNING_NOTIFICATION:
//                     break;
//                   case config.packetType.ANIMATION_NOTIFICATION:
//                     break;
//                   case config.packetType.GLOBAL_MESSAGE_RESPONSE:
//                     break;
//                 }
//               }
//             }
//           }
//         });

//         resolve(); // 연결이 완료되면 resolve 호출
//       });

//       this.gameClientSocket.on('error', (err: NodeJS.ErrnoException) => {
//         console.log(`게임 서버 소켓에러 ${err.message}`);
//       });

//       // 채팅 서버 연결
//       this.chattingClientSocket.connect(5556, '127.0.0.1', () => {
//         console.log('채팅 서버와 연결');
//         resolve(); // 연결이 완료되면 resolve 호출
//       });

//       this.chattingClientSocket.on('error', (err: NodeJS.ErrnoException) => {
//         console.log(`채팅 서버 소켓에러 ${err.message}`);
//       });
//     });
//   }

//   GameServerRegisterSend() {
//     setTimeout(() => {
//       const registerGameServerPacket = this.CreateGamePacket(config.packetType.REGISTER_REQUEST, '1.0.0', 1, {
//         email: `dummy_${gDummyRegisterClientId}@naver.com`,
//         nickname: `dummy_${gDummyRegisterClientId}`,
//         password: `!Dummy${gDummyRegisterClientId}`
//       });

//       gDummyRegisterClientId++;

//       this.gameClientSocket.write(registerGameServerPacket);
//     }, 1000);
//   }

//   GameServerLoginSend() {
//     setTimeout(() => {
//       const registerGameServerPacket = this.CreateGamePacket(config.packetType.LOGIN_REQUEST, '1.0.0', 1, {
//         email: `dummy_${gDummyLoginClientId}@naver.com`,
//         password: `!Dummy${gDummyLoginClientId}`
//       });

//       gDummyLoginClientId++;

//       this.gameClientSocket.write(registerGameServerPacket);
//     }, 2000);
//   }

//   GameServerGetRoomList() {
//     setInterval(() => {
//       const getRoomListGameServerPacket = this.CreateGamePacket(
//         config.packetType.GET_ROOM_LIST_REQUEST,
//         '1.0.0',
//         1,
//         {}
//       );

//       this.gameClientSocket.write(getRoomListGameServerPacket);
//     }, 1000);
//   }

//   GameServerCreateRoom() {
//     const createRoomGameServerPacket = this.CreateGamePacket(config.packetType.CREATE_ROOM_REQUEST, '1.0.0', 1, {
//       name: `더미 방_${gDummyRoomId}`,
//       maxUserNum: 5
//     });

//     gDummyRoomId++;

//     this.gameClientSocket.write(createRoomGameServerPacket);
//   }

//   ChattingLoginSend() {
//     setTimeout(() => {
//       const registerChattingServerPacket = this.CreateChattingPacket(
//         config.chattingPacketType.CHATTING_LOGIN_REQUEST,
//         '1.0.0',
//         1,
//         {
//           email: 'test01'
//         }
//       );

//       this.chattingClientSocket.write(registerChattingServerPacket);
//     }, 2000);
//   }

//   ChattingRoomCreate() {
//     const ChattingRoomCreatePacket = this.CreateChattingPacket(
//       config.chattingPacketType.CHATTING_CREATE_ROOM_REQUEST,
//       '1.0.0',
//       1,
//       {}
//     );

//     this.chattingClientSocket.write(ChattingRoomCreatePacket);
//   }

//   ChattingRoomJoin() {
//     const ChattingJoinRoomPacket = this.CreateChattingPacket(
//       config.chattingPacketType.CHATTING_JOIN_ROOM_REQUEST,
//       '1.0.0',
//       1,
//       { ownerEmail: 'test01' }
//     );

//     this.chattingClientSocket.write(ChattingJoinRoomPacket);
//   }

//   ChattingRoomLeave() {
//     const ChattingRoomLeavePacket = this.CreateChattingPacket(
//       config.chattingPacketType.CHATTING_LEAVE_ROOM_REQUEST,
//       '1.0.0',
//       1,
//       {}
//     );
//     this.chattingClientSocket.write(ChattingRoomLeavePacket);
//   }

//   ChattingSend(chatMessage: string) {
//     const ChattingSendPacket = this.CreateChattingPacket(
//       config.chattingPacketType.CHATTING_CHAT_SEND_REQUEST,
//       '1.0.0',
//       1,
//       {
//         chatMessage
//       }
//     );
//     this.chattingClientSocket.write(ChattingSendPacket);
//   }
// }

// function displayLobby() {
//   console.log(
//     chalk.cyanBright(
//       figlet.textSync('Dummy Client', {
//         font: 'Standard',
//         horizontalLayout: 'default',
//         verticalLayout: 'default'
//       })
//     )
//   );

//   const line = chalk.magentaBright('='.repeat(68));
//   console.log(line);

//   console.log(chalk.yellowBright.bold('더미 클라이언트 작동 시작'));
//   console.log('');
//   console.log(chalk.red('1. ') + chalk.white('더미 클라 생성'));
//   console.log(chalk.red('2. ') + chalk.white('더미 클라 서버 접속'));
//   console.log(chalk.red('3. ') + chalk.white('더미 클라 회원가입'));
//   console.log(chalk.red('4. ') + chalk.white('더미 클라 로그인'));
// }

// function handleUserInput() {
//   const choice = readlineSync.question('입력 : ');

//   switch (choice) {
//     case '1':
//       DummyClientCreate();
//       break;
//     case '2':
//       DummyClientConnect();
//       break;
//     case '3':
//       DummyClientRegister();
//       break;
//     case '4':
//       DummyClientLogin();
//       break;
//   }
// }

// async function DummyClientCreate() {
//   console.clear();
//   console.log(chalk.white('[더미 클라를 생성 합니다.]'));
//   console.log(chalk.white('[더미 클라의 개수를 입력하세요.]'));
//   const dummyClientCount = readlineSync.question('클라 개수 : ');

//   console.log(chalk.green('더미 생성중 ... '));

//   await Promise.all(
//     Array.from({ length: parseInt(dummyClientCount) }, async (_, i) => {
//       const newDummyClient = new UserClient();
//       await newDummyClient.ProtoGet();
//       gDummyClients.push(newDummyClient);
//     })
//   ).then(() => {
//     console.log(chalk.green(`더미 생성완료 ... [${gDummyClients.length}]`));
//     setTimeout(() => {
//       DummyClientStart();
//     }, 1000);
//   });
// }

// function DummyClientConnect() {
//   console.clear();
//   console.log(chalk.white('[생성한 더미 클라로 게임서버와 채팅서버에 접속합니다.]'));

//   setTimeout(async () => {
//     await Promise.all(gDummyClients.map((dummy: UserClient) => dummy.Connect()));
//     console.log(`더미 클라 [${gDummyClients.length}] 접속 완료`);
//     console.clear();
//     DummyClientStart();
//   }, 2000);
// }

// function DummyClientRegister() {
//   console.clear();
//   console.log(chalk.white('[생성한 더미 클라로 회원가입을 진행합니다.]'));

//   setTimeout(() => {
//     gDummyClients.forEach((dummy: UserClient) => {
//       dummy.GameServerRegisterSend();
//     });
//   }, 2000);

//   setTimeout(() => {
//     DummyClientStart();
//   }, 5000);
// }

// function DummyClientLogin() {
//   console.clear();
//   console.log(chalk.white('[생성한 더미 클라로 로그인을 진행합니다.]'));

//   setTimeout(() => {
//     gDummyClients.forEach((dummy: UserClient) => {
//       dummy.GameServerLoginSend();
//     });
//   }, 2000);

//   setTimeout(() => {
//     DummyClientStart();
//   }, 5000);
// }

// function DummyClientStart() {
//   displayLobby();
//   handleUserInput();
// }

// DummyClientStart();
