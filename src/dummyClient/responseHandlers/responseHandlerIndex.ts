import { config } from "../../config/config.js";
import { gamePrepareNotificationHandler } from "./game/gamePrepareNotificationHandler.js";
import { gamePrepareResponseHandler } from "./game/gamePrepareResponseHandler.js";
import { gameStartNotificationHandler } from "./game/gameStartNotificationHandler.js";
import { gameStartResponseHandler } from "./game/gameStartResponseHandler.js";
import { positionUpdateNotificationHandler } from "./position/positionUpdateNotification.js";
import { createRoomResponseHandler } from "./room/createRoomResponseHandler.js";
import { getRoomListResponseHandler } from "./room/getRoomListResponseHandler.js";
import { joinRandomRoomResponseHandler } from "./room/joinRandomRoomResponseHandler.js";
import { joinRoomResponseHandler } from "./room/joinRoomResponseHandler.js";
import { leaveRoomNotificationHandler } from "./room/leaveRoomNotificationHandler.js";
import { leaveRoomResponseHandler } from "./room/leaveRoomResponseHandler.js";
import { gameLoginResponseHandler } from "./user/gameLoginResponseHandler.js";
import { gameRegisterResponseHandler } from "./user/gameRegisterResponse.js";

const responseHandlers = {
    [config.packetType.REGISTER_RESPONSE]: {
        responseHandler: gameRegisterResponseHandler
    },
    [config.packetType.LOGIN_RESPONSE]: {
        responseHandler: gameLoginResponseHandler
    },
    [config.packetType.CREATE_ROOM_RESPONSE]: {
        responseHandler: createRoomResponseHandler
    },
    [config.packetType.GET_ROOM_LIST_RESPONSE]: {
        responseHandler: getRoomListResponseHandler
    },
    [config.packetType.JOIN_ROOM_RESPONSE]: {
        responseHandler: joinRoomResponseHandler
    },
    [config.packetType.JOIN_RANDOM_ROOM_RESPONSE]: {
        responseHandler: joinRandomRoomResponseHandler
    },
    [config.packetType.LEAVE_ROOM_RESPONSE]: {
        responseHandler: leaveRoomResponseHandler
    },
    [config.packetType.LEAVE_ROOM_NOTIFICATION]: {
        responseHandler: leaveRoomNotificationHandler
    },
    [config.packetType.GAME_PREPARE_RESPONSE]: {
        responseHandler: gamePrepareResponseHandler
    },
    [config.packetType.GAME_PREPARE_NOTIFICATION]: {
        responseHandler: gamePrepareNotificationHandler
    },
    [config.packetType.GAME_START_RESPONSE]: {
        responseHandler: gameStartResponseHandler
    },
    [config.packetType.GAME_START_NOTIFICATION]: {
        responseHandler: gameStartNotificationHandler
    },
    [config.packetType.POSITION_UPDATE_NOTIFICATION]: {
        responseHandler: positionUpdateNotificationHandler
    }
}

export const getDummyClientResponseHandlerByPacketType = (packetType: number) => {
    if (!responseHandlers[packetType]) {
        return;
    }

    return responseHandlers[packetType].responseHandler;
}