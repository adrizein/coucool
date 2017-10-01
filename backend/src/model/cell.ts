import * as _ from 'lodash';


export default class Cell {

    public static fromJSON({x, y}: any): Cell {
        if (_.isSafeInteger(x) && _.isSafeInteger(y)) {
            return new Cell(x, y);
        }
        else {
            throw new TypeError(`x and y must be integers, received (${x}, ${y}) instead`);
        }
    }

    public constructor(public x: number, public y: number) {}

    public toString(): string {
        return JSON.stringify(this);
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
