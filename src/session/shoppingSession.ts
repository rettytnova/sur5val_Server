// shopping중인 유저의 id를 담고있는 세션 , {key: room.id, value: [user.id]}
export const shoppingUserIdSessions: { [roomId: number]: number[] } = {};
