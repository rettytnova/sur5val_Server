import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { packetNames } from '../protobuf/packetNames.js';
import protobuf from 'protobufjs';

class Server {
  private protoMessages: { [key: string]: any } = {};
  constructor() {}

  getDir(): string {
    const __filename: string = fileURLToPath(import.meta.url);
    const __dirname: string = path.dirname(__filename);
    const protoDir = path.join(__dirname, '../../src/protobuf');
    //console.log('protoroDir', protoDir);
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

      console.log('filePath : ', protoFiles);

      const root = new protobuf.Root();

      await Promise.all(
        protoFiles.map((file: string) => {
          console.log('file', file);
          root.load(file);
        }),
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
    }
  }
}

export default Server;
