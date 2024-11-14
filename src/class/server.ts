import fs from 'fs';
import path from 'path';
import net from "net";
import { fileURLToPath } from 'url';
import { packetNames } from '../protobuf/packetNames.js';
import protobuf from 'protobufjs';
import { config } from '../config/config.js';
import { onData } from '../events/onData.js';
import { onEnd } from '../events/onEnd.js';
import { onError } from '../events/onError.js';

interface SocketWithBuffer extends net.Socket { buffer: Buffer }

class Server {
  private protoMessages: { [key: string]: any } = {};  
  private server: net.Server;

  constructor() {
    this.server = net.createServer();
  }

  getDir(): string {
    const __filename: string = fileURLToPath(import.meta.url);
    const __dirname: string = path.dirname(__filename);
    const protoDir = path.join(__dirname, '../../src/protobuf');

    return protoDir;
  }

  getAllFiles(
    dir: string,
    findFileName: string,
    fileList: string[] = [],
  ): string[] {
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
      await Promise.all(protoFiles.map((file: string) => { return root.load(file) }));

      for (const [packetName, types] of Object.entries(packetNames)) {
        this.protoMessages[packetName] = {};
        for (const [type, typeName] of Object.entries(types)) {
          this.protoMessages[packetName][type] = root.lookupType(typeName);
        }
      }
      console.log('Protobuf 파일이 로드되었습니다.');
    } catch (err) {
      console.error('Protobuf 파일 로드 중 오류가 발생했습니다.', err);
    }
  }
  
  clientConnection(socket : net.Socket)
  {
    console.log(`Client connected from: ${socket.remoteAddress}:${socket.remotePort}`);
    
    const customSocket = socket as SocketWithBuffer;
    customSocket.buffer = Buffer.alloc(0);

    socket.on('data', onData(customSocket));
    socket.on('end', onEnd(customSocket));
    socket.on('error', onError(customSocket));
  }

  listen () {
    this.server.listen(config.server.port, config.server.host, () => {
      console.log(`서버가 ${config.server.host}:${config.server.port}에서 실행 중입니다.`);
      console.log(this.server.address());
    });
  }

  start()
  {
    this.initializeProto();
    
    this.listen();
  }
}

export default Server;
