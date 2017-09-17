import {Observable, Subscription} from 'rxjs/Rx';
import * as winston from 'winston';
import Socket = SocketIO.Socket;

import {Cell} from './cell';
import {Action, ActionType} from './action';
import {GameOfLife} from './game';


export class Client {

    public readonly action$: Observable<Action>;

    private subscription: Subscription;

    public constructor(private socket: Socket) {
        this.action$ = new Observable((subscriber) => {
            socket.on(
                'cell:on',
                (data) => subscriber.next({
                    cell: Cell.fromJSON(data),
                    type: ActionType.on,
                })
            );

            socket.on(
                'cell:off',
                (data) => subscriber.next({
                    cell: Cell.fromJSON(data),
                    type: ActionType.off,
                })
            );

            socket.on('error', (err) => subscriber.error(err));
            socket.on('disconnected', () => subscriber.complete());
        });
    }

    public get id() {
        return this.socket.id;
    }

    public start(game: GameOfLife) {
        this.socket.emit('game:start', game.toJSON());

        this.subscription =
            game.action$
                .bufferTime(50)
                .filter((actions) => actions.length > 0)
                .subscribe(
                    (actions) => {
                        this.socket.emit('game:update', actions);
                    },
                    (err) => {
                        this.socket.emit('game:error', err.message);
                    },
                    () => {
                        this.stop();
                    }
                );
    }

    public stop() {
        this.socket.emit('game:stop');
        this.socket.disconnect(true);
        this.subscription.unsubscribe();
        winston.info(`Client ${this.id} stopped`);
    }
}
