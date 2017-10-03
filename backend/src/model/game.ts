import Cell from './cell';
import {Counter} from '../helpers';
import {Observable, Subject} from 'rxjs/Rx';
import {Action, ActionType} from './action';


export default class GameOfLife {

    public readonly action$: Subject<Action> = new Subject();

    private readonly cells: Map<string, Cell> = new Map();
    private readonly tick$: Observable<number>;

    public constructor(period: number) {
        this.tick$ = Observable.interval(period);

        this.tick$.subscribe(() => {
            this._next();
        });
    }

    public turnOn(cell: Cell) {
        const key = cell.toString();

        if (this.cells.has(key)) {
            this.action$.next({type: ActionType.love, cell});
        }
        else {
            this.cells.set(key, cell);
            this.action$.next({type: ActionType.on, cell});
        }
    }

    public turnOff(cell: Cell) {
        const key = cell.toString();

        if (this.cells.has(key)) {
            this.cells.delete(key);
            this.action$.next({type: ActionType.off, cell});
        }
        else {
            this.action$.next({type: ActionType.love, cell});
        }
    }

    public toJSON(): Cell[] {
        const cells: Cell[] = [];

        this.cells.forEach((cell) => cells.push(cell));

        return cells;
    }

    private _next() {
        const counter = new Counter<string>();
        const possibleCells = new Set<string>();

        this.cells.forEach((cell) => {
            possibleCells.add(cell.toString());

            cell.neighbours.forEach((neighbour) => {
                const key = neighbour.toString();

                counter.add(key);
                possibleCells.add(key);
            });
        });

        possibleCells.forEach((key) => {
            let cell = this.cells.get(key);
            const neighbourCount = counter.get(key);

            if (neighbourCount === 3 || (neighbourCount === 2 && cell)) {
                if (!cell) {
                    cell = Cell.fromString(key);
                    this.cells.set(key, cell);
                    this.action$.next({type: ActionType.on, cell});
                }
            }
            else if (cell) {
                this.cells.delete(key);
                this.action$.next({type: ActionType.off, cell});
            }
        });
    }
}
