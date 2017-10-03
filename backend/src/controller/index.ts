import * as winston from 'winston';
import {Observable, Subscriber} from 'rxjs/Rx';
import Socket = SocketIO.Socket;
import Sockets = SocketIO.Server;

import config from '../config';
import Client from '../model/client';
import GameOfLife from '../model/game';
import {Action, ActionType} from '../model/action';

import Database from './database';


export default class Controller {

    private readonly game: GameOfLife = new GameOfLife(config.game.period);
    private readonly database: Database = new Database(config.database.url);

    public constructor(sockets: Sockets) {
        const clientAction$: Observable<Action> =
            Observable
                .create((subscriber: Subscriber<Socket>) => {
                     sockets.on('connection', (socket: Socket) => subscriber.next(socket));
                })
                .flatMap(((socket: Socket) => {
                    const client = new Client(socket, this.game);
                    winston.info(`Client ${client.id} connected`);

                    return client.action$;
                }));

        winston.debug('Subscribing to client actions');
        clientAction$.subscribe((action) => {
            switch (action.type) {
                case ActionType.on: return this.game.turnOn(action.cell);
                case ActionType.off: return this.game.turnOff(action.cell);
                case ActionType.love: return winston.error('What is love?');
            }
        });
    }

    public stop() {
        this.game.action$.complete();
    }
}
