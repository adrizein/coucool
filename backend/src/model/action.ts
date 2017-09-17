import {Cell} from './cell';


export enum ActionType {
    off,
    on,
    love,
}

export interface Action {
    type: ActionType;
    cell: Cell;
}

