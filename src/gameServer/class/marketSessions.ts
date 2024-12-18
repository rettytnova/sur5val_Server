class MarketSessions {
  private roomId: number;
  private marketItemsLists: number[];

  constructor(roomId: number, marketItemsLists: number[]) {
    this.roomId = roomId;
    this.marketItemsLists = marketItemsLists;
  }

  getRoomId() {
    return this.roomId;
  }

  getItemLists() {
    return this.marketItemsLists;
  }

  setItemList(itemLists: number[]) {
    this.marketItemsLists = itemLists;
  }
}

export default MarketSessions;
