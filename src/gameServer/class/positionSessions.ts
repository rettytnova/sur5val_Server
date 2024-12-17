import { CharacterPositionData } from '../interface/interface.js';

class PositionSessions {
    private roomId: number;
    private characterPositons: CharacterPositionData[]

    constructor(roomId: number, characterPositions: CharacterPositionData[]) {
        this.roomId = roomId;
        this.characterPositons = characterPositions;
    }

    getPositionUserId() {
        return this.roomId;
    }

    getCharacterPosition() {
        return this.characterPositons;
    }
}

export default PositionSessions;