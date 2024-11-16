import net from 'net';

export interface CustomSocket extends net.Socket {
  buffer: Buffer;
  id?: string;
}
