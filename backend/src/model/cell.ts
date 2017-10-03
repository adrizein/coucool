import {isSafeInteger} from 'lodash';


export default class Cell {

    public static fromJSON({x, y}: {x: number, y: number}): Cell {
        if (isSafeInteger(x) && isSafeInteger(y)) {
            return new Cell(x, y);
        }
        else {
            throw new TypeError(`x and y must be integers, received (${x}, ${y}) instead`);
        }
    }

    public static fromString(key: string) {
        const [x, y] = JSON.parse(key);

        return Cell.fromJSON({x, y});
    }

    public constructor(public x: number, public y: number) {}

    public toString(): string {
        return JSON.stringify([this.x, this.y]);
    }

    public get neighbours(): Cell[] {
        return [
            new Cell(this.x - 1, this.y - 1),
            new Cell(this.x - 1, this.y),
            new Cell(this.x - 1, this.y + 1),
            new Cell(this.x, this.y + 1),
            new Cell(this.x + 1, this.y + 1),
            new Cell(this.x + 1, this.y),
            new Cell(this.x + 1, this.y - 1),
            new Cell(this.x, this.y - 1),
        ];
    }
}
