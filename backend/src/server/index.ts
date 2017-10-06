import * as express from 'express';
import * as io from 'socket.io';
import {createServer} from 'http';
import * as Bromise from 'bluebird';
import * as winston from 'winston';

import {robustJoin} from '../helpers';
import Controller from '../controller';
import config from '../config';


export class Server {

    private readonly app = express();
    private readonly server = createServer(this.app);
    private readonly sockets = io(this.server);
    private readonly controller = new Controller(this.sockets);

    public constructor(public readonly port: number) {
        this.app.use('/', express.static(config.server.frontend));
    }

    public async start() {
        return new Bromise((resolve, reject) => {
            this.server.listen(this.port, (err: any) => {
                if (err) {
                    winston.error(err);

                    return reject(err);
                }

                winston.info(`HTTP and SocketIO servers are listening on port ${this.port}`);

                return resolve();
            });
        });
    }


    public async stop() {
        winston.warn('Stopping server NOW');

        this.controller.stop();

        const [, ok] = await robustJoin(
            new Bromise((resolve, reject) => {
                try {
                    return this.sockets.close(() => resolve());
                }
                catch (err) {
                    return reject(err);
                }
            }),
            new Bromise((resolve, reject) => {
                this.server.close((err: Error) => {
                    if (err) {
                        if (err.message === 'Not running') {
                            winston.error('Server not running');

                            return resolve(false);
                        }

                        return reject(err);
                    }

                    return resolve(true);
                });
            })
        );

        winston.info('Server stopped');

        return ok;
    }
}
