import Socket = SocketIO.Socket;
import * as winston from 'winston';
import {Observable, Subscription} from 'rxjs/Rx';

import Cell from './cell';
import GameOfLife from './game';
import {Action, ActionType} from './action';


export default class Client {

    public readonly action$: Observable<Action>;

    private readonly subscriptions: Subscription[] = [];

    public constructor(private socket: Socket) {
        this.action$ = new Observable((subscriber) => {
            winston.debug(`Client ${this.id} is being subscribed to`);
            socket.on(
                'cell:on',
                (data) => {
                    try {
                        const cell = Cell.fromJSON(data);
                        subscriber.next({
                            cell,
                            type: ActionType.on,
                        });
                    }
                    catch (err) {
                        subscriber.error(err);
                    }
                }
            );

            socket.on(
                'cell:off',
                (data) => {
                    try {
                        const cell = Cell.fromJSON(data);
                        subscriber.next({
                            cell: Cell.fromJSON(data),
                            type: ActionType.off,
                        });
                    }
                    catch (err) {
                        subscriber.error(err);
                    }
                }
            );

            socket.on('error', (err) => subscriber.error(err));
            socket.on('disconnected', () => subscriber.complete());
        });
    }

    public get id() {
        return this.socket.id;
    }

    public start(game: GameOfLife) {
        {
            const gaem = game.toJSON();
            winston.debug('game:start', gaem);
            this.socket.emit('game:start', gaem);
        }

        this.subscriptions.push(
            game.action$
                .bufferTime(50)
                .filter((actions) => actions.length > 0)
                .subscribe(
                    (actions) => {
                        winston.debug('game:update', actions);
                        this.socket.emit('game:update', actions);
                    },
                    (err) => {
                        winston.error('game:error', err.message);
                        this.socket.emit('game:error', err.message);
                    },
                    () => {
                        this.stop();
                    }
                )
        );

        this.subscriptions.push(Observable
            .interval(60000)
            .subscribe(() => {
                    const gaem = game.toJSON();
                    winston.debug('game:start', gaem);
                    this.socket.emit('game:start', gaem);
                },
                (err) => {
                    winston.error('game:error', err.message);
                    this.socket.emit('game:error', err.message);
                },
                () => {
                    this.stop();
                }
            )
        );
    }

    public stop() {
        this.socket.emit('game:stop');
        this.socket.disconnect(true);
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        winston.info(`Client ${this.id} stopped`);
    }
}
