import {range, merge, floor} from 'lodash';
import {VNode, div} from '@cycle/dom';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';

import './style.css';
import Cell from '../../../../backend/src/model/cell';
import {Action, ActionType} from '../../../../backend/src/model/action';


export class GridDimensions {

    private pixelHeight: number;
    private pixelWidth: number;

    public constructor(
        public height: number,
        public width: number,
        public x: number,
        public y: number,
        private _size: number) {}

    public get size(): string {
        return `${this._size}px`;
    }

    public translate(dx: number, dy: number) {
        this.x = floor(this.x + dx / this._size);
        this.y = floor(this.y + dy / this._size);
    }

    public resize(height: number, width: number) {
        this.pixelHeight = height;
        this.pixelWidth = width;

        this.height = floor(height / this._size);
        this.width = floor(width / this._size);
    }

    public zoom(zoom: number) {
        this._size = Math.max(12, this._size + zoom / 20);

        this.resize(this.pixelHeight, this.pixelWidth);
    }
}


export default function gameOfLife(
    gameState$: Observable<Cell[]>,
    gridDimension$: Observable<GridDimensions>,
    gameAction$: Observable<Action[]>,
    ): Observable<VNode> {

    const
        cells: Map<string, Cell> = new Map(),
        gridDimensions = new GridDimensions(20, 20, 0, 0, 20),
        grid$ = new Subject<VNode>();


    gridDimension$.subscribe((dims) => {
        merge(gridDimensions, dims);

        grid$.next(cellsToGrid(cells, gridDimensions, new Set()));
    });

    gameState$.subscribe((game) => {
        cells.clear();
        game.forEach((cell: Cell) => {
            cells.set(cell.toString(), cell);
        });

        grid$.next(cellsToGrid(cells, gridDimensions, new Set()));
    });

    gameAction$.subscribe((actions) => {
        const loveCells: Set<string> = new Set();

        actions.forEach(({cell, type}: Action) => {
            const key = cell.toString();
            switch (type) {
                case ActionType.on: {
                    if (!cells.has(key)) {
                        cells.set(key, cell);
                    }
                    break;
                }
                case ActionType.off: {
                    if (cells.has(key)) {
                        cells.delete(key);
                    }
                    break;
                }
                case ActionType.love: {
                    loveCells.add(key);
                }
            }
        });

        grid$.next(cellsToGrid(cells, gridDimensions, loveCells));
    });

    return grid$;
}


function cellsToGrid(cells: Map<string, Cell>, grid: GridDimensions, loveCells: Set<string>): VNode {
    return div('#game',
        range(grid.y, grid.y + grid.height)
            .map((y) => div('.line',
                range(grid.x, grid.x + grid.width)
                    .map((x) => {
                        const key = JSON.stringify([x, y]);

                        let selector = `#${x}/${y}.cell`;

                        if (cells.has(key)) {
                            selector += '.on';
                        }
                        else {
                            selector += '.off';
                        }

                        if (loveCells.has(key)) {
                            selector += '.love';
                        }

                        return div(selector, {style: {height: grid.size, width: grid.size}});
                    })
                )
            )
    );
}
