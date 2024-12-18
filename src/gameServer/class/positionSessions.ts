import { CharacterPositionData } from '../interface/interface.js';

class PositionSessions {
    private roomId: number;
    private characterPositions: CharacterPositionData[]

    constructor(roomId: number, characterPositions: CharacterPositionData[]) {
        this.roomId = roomId;
        this.characterPositions = characterPositions;
    }

    getPositionRoomId() {
        return this.roomId;
    }

    getCharacterPositions() {
        return this.characterPositions;
    }

    setCharacterPositions(positions: CharacterPositionData[]) {
        this.characterPositions = positions
    }
}

export default PositionSessions;