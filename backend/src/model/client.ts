import Socket = SocketIO.Socket;
import * as winston from 'winston';
import {Observable, Subscription} from 'rxjs/Rx';

import Cell from './cell';
import GameOfLife from './game';
import {Action, ActionType} from './action';
import {Subscriber} from 'rxjs/Subscriber';


export default class Client {

    public readonly action$: Observable<Action>;

    private subscription: Subscription;

    public constructor(private socket: Socket, game: GameOfLife) {
        socket.on('game:reload', () => {
            winston.info(`Client ${this.id} reloading game`);
            socket.emit('game:start', game.toJSON());
        });

        this.action$ = Observable.create((subscriber: Subscriber<Action>) => {
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
                            cell,
                            type: ActionType.off,
                        });
                    }
                    catch (err) {
                        subscriber.error(err);
                    }
                }
            );

            socket.on('error', (err) => {
                winston.error(err);
                subscriber.error(err);
            });

            socket.on('disconnect', () => {
                winston.info(`Client ${this.id} disconnected`);
                subscriber.complete();
                this.stop();
            });

            socket.on('close', () => {
                winston.info(`Client ${this.id} closed its connection`);
                subscriber.complete();
                this.stop();
            });
        });

        {
            const gaem = game.toJSON();
            winston.debug('game:start', gaem);
            this.socket.emit('game:start', gaem);
        }

        this.subscription = game.action$
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
            );
    }

    public get id() {
        return this.socket.id;
    }

    public stop() {
        this.socket.removeAllListeners();
        this.socket.emit('game:stop');
        this.socket.disconnect(true);
        this.subscription.unsubscribe();
        winston.info(`Client ${this.id} stopped`);
    }
}
