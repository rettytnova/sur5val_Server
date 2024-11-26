class Queue<T> {
    private items: T[];

    constructor() {
        this.items = [];
    }

    isEmpty(): boolean {
        if (this.items.length == 0) {
            return true;
        }

        return false;
    }

    size(): number {
        return this.items.length;
    }

    front(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }

        return this.items[0];
    }


    enque(item: T): void {
        this.items.push(item);
    }

    deque(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }

        return this.items.shift()!;
    }
}

export default Queue;