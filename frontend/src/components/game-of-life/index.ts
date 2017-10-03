import {range, merge} from 'lodash';
import {VNode, div} from '@cycle/dom';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';

import './style.css';
import Cell from '../../../../backend/src/model/cell';
import {Action, ActionType} from '../../../../backend/src/model/action';


interface GridDimensions {
    height: number;
    width: number;
    x: number;
    y: number;
}


export default function gameOfLife(
    gameState$: Observable<Cell[]>,
    gridDimension$: Observable<GridDimensions>,
    gameAction$: Observable<Action[]>,
    ): Observable<VNode> {

    let cells: any = {};
    const
        gridDimensions: GridDimensions = {height: 100, width: 100, x: -50, y: -50},
        grid$ = new Subject<VNode>();


    gridDimension$.subscribe((dims) => {
        merge(gridDimensions, dims);

        const grid = cellsToGrid(cells, gridDimensions, {});

        grid$.next(grid);
    });

    gameState$.subscribe((game) => {
        cells = {};
        game.forEach((cell) => {
            cells[JSON.stringify(cell)] = cell;
        });

        grid$.next(cellsToGrid(cells, gridDimensions, {}));
    });

    gameAction$.subscribe((actions) => {
        const loveCells: any = {};

        actions.forEach(({cell, type}) => {
            const key = JSON.stringify(cell);
            switch (type) {
                case ActionType.on: {
                    if (!cells[key]) {
                        cells[key] = cell;
                    }
                    break;
                }
                case ActionType.off: {
                    if (cells[key]) {
                        delete cells[key];
                    }
                    break;
                }
                case ActionType.love: {
                    loveCells[key] = true;
                }
            }
        });

        grid$.next(cellsToGrid(cells, gridDimensions, loveCells));
    });

    return grid$;
}


function cellsToGrid(cells: any, grid: GridDimensions, loveCells: any): VNode {
    return div('.game',
        range(grid.y, grid.y + grid.height)
            .map((y) => div('.line',
                range(grid.x, grid.x + grid.width)
                    .map((x) => {
                        const key = JSON.stringify({x, y});

                        let selector = `#${x}/${y}.cell`;

                        if (cells[key]) {
                            selector += '.on';
                        }
                        else {
                            selector += '.off';
                        }

                        if (loveCells[key]) {
                            selector += '.love';
                        }

                        return div(selector);
                    })
                )
            )
    );
}
