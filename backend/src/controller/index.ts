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
                    const client = new Client(socket);
                    client.start(this.game);
                    winston.info(`Client ${client.id} connected`);

                    return client.action$;
                }));

        clientAction$.subscribe((action) => {
            switch (action.type) {
                case ActionType.on: this.game.turnOn(action.cell); break;
                case ActionType.off: this.game.turnOff(action.cell); break;
                case ActionType.love: winston.error('What is love?'); break;
            }
        });
    }

    public stop() {
        this.game.action$.complete();
    }
}
