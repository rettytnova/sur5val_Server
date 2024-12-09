﻿export const packetNames = {
  packet: {
    GamePacket: 'packet.GamePacket'
  },
  request: {
    C2SRegisterRequest: 'request.C2SRegisterRequest',
    C2SLoginRequest: 'request.C2SLoginRequest',
    C2SCreateRoomRequest: 'request.C2SCreateRoomRequest',
    C2SJoinRoomRequest: 'request.C2SJoinRoomRequest',
    C2SJoinRandomRoomRequest: 'request.C2SJoinRandomRoomRequest',
    C2SGetRoomListRequest: 'request.C2SGetRoomListRequest',
    C2SLeaveRoomRequest: 'request.C2SLeaveRoomRequest',
    C2SGamePrepareRequest: 'request.C2SGamePrepareRequest',
    C2SGameStartRequest: 'request.C2SGameStartRequest',
    C2SPositionUpdateRequest: 'request.C2SPositionUpdateRequest',
    C2SUseCardRequest: 'request.C2SUseCardRequest',
    C2SFleaMarketPickRequest: 'request.C2SFleaMarketPickRequest',
    C2SFleaMarketCardPickRequest: 'request.C2SFleaMarketCardPickRequest',
    C2SReactionRequest: 'request.C2SReactionRequest',
    C2SPassDebuffRequest: 'request.C2SPassDebuffRequest',
    C2SDestroyCardRequest: 'request.C2SDestroyCardRequest',
    C2SCardSelectRequest: 'request.C2SCardSelectRequest'
  },
  response: {
    S2CRegisterResponse: 'response.S2CRegisterResponse',
    S2CLoginResponse: 'response.S2CLoginResponse',
    S2CCreateRoomResponse: 'response.S2CCreateRoomResponse',
    S2CGetRoomListResponse: 'response.S2CGetRoomListResponse',
    S2CJoinRoomResponse: 'response.S2CJoinRoomResponse',
    S2CJoinRandomRoomResponse: 'response.S2CJoinRandomRoomResponse',
    S2CLeaveRoomResponse: 'response.S2CLeaveRoomResponse',
    S2CGamePrepareResponse: 'response.S2CGamePrepareResponse',
    S2CGameStartResponse: 'response.S2CGameStartResponse',
    S2CUseCardResponse: 'response.S2CUseCardResponse',
    S2CFleaMarketPickResponse: 'response.S2CFleaMarketPickResponse',
    S2CFleaMarketCardPickResponse: 'response.S2CFleaMarketCardPickResponse',
    S2CReactionResponse: 'response.S2CReactionResponse',
    S2CDestroyCardResponse: 'response.S2CDestroyCardResponse',
    S2CCardSelectResponse: 'response.S2CCardSelectResponse',
    S2CPassDebuffResponse: 'response.S2CPassDebuffResponse',
    S2CGlobalMessageResponse: 'response.S2CGlobalMessageResponse'
  },
  notification: {
    S2CJoinRoomNotification: 'notification.S2CJoinRoomNotification',
    S2CLeaveRoomNotification: 'notification.S2CLeaveRoomNotification',
    S2CGamePrepareNotification: 'notification.S2CGamePrepareNotification',
    S2CGameStartNotification: 'notification.S2CGameStartNotification',
    S2CPositionUpdateNotification: 'notification.S2CPositionUpdateNotification',
    S2CUseCardNotification: 'notification.S2CUseCardNotification',
    S2CEquipCardNotification: 'notification.S2CEquipCardNotification',
    S2CCardEffectNotification: 'notification.S2CCardEffectNotification',
    S2CFleaMarketNotification: 'notification.S2CFleaMarketNotification',
    S2CUserUpdateNotification: 'notification.S2CUserUpdateNotification',
    S2CPhaseUpdateNotification: 'notification.S2CPhaseUpdateNotification',
    S2CGameEndNotification: 'notification.S2CGameEndNotification',
    S2CWarningNotification: 'notification.S2CWarningNotification',
    S2CAnimationNotification: 'notification.S2CAnimationNotification'
  }
};
