import net from "net";

class Client {
    private clientSocket: any;    

    constructor() {
        this.clientSocket = new net.Socket();        
    }

    connect(){
        this.clientSocket.connect(5555, "127.0.0.1", async () => {
            console.log(`"127.0.0.1" : 5555 서버와 연결`);
            
            this.clientSocket.on('data', (data:Buffer) => {

            });           
        });
    }
}

const dummyClient = new Client();
dummyClient.connect();