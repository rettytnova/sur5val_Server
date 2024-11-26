import ChattingServer from "./class/chattingServer.js";

function chattingMain() {
    ChattingServer.getInstance().start();
}

chattingMain();