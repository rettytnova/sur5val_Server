var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { packetNames } from '../protobuf/packetNames.js';
import protobuf from 'protobufjs';
class Server {
  constructor() {
    this.protoMessages = {};
  }
  getDir() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return __dirname;
  }
  getAllFiles(dir, findFileName, fileList = []) {
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
  initializeProto() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const protoFileDir = this.getDir();
        const protoFiles = this.getAllFiles(protoFileDir, '.proto');
        const root = new protobuf.Root();
        yield Promise.all(protoFiles.map((file) => root.load(file)));
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
    });
  }
}
export default Server;
