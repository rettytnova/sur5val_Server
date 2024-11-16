import net from 'net';

export interface CustomSocket extends net.Socket {
    buffer: Buffer,
    id?: string
}

export interface CreateRoomPayload {
    roomName: string,
    maxUserNum: Number
}

export interface Card{
    type:Number;
    count:Number;
}

export interface CharacterStateInfo{
    state : Number;
    nextState : Number; 
    nextStateAt : Number;
    stateTargetUserId: Number;
}

export interface Character {
    characterType: Number;
    roleType: Number;
    hp: Number;
    weapon: Number;
    stateInfo:CharacterStateInfo;
    equips: Number[];
    debuffs: Number[];
    handCards: Card[];
    bbangCount: Number;
    handCardsCount: Number;
}

export interface User {
    id: Number;
    nickName: string;
    character: Character;
}

export interface Room{
    id:Number;
    ownerId:Number;
    name:string;
    maxUserNum:Number;
    state:Number;
    users:User[];
}