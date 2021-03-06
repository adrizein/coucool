global.Promise = require('bluebird');

if (process.env.NODE_ENV !== 'production') {
    require('winston').level = 'debug';
}


import config from './config';
import {Server} from './server';
import {stopSignals} from './helpers';


const server = new Server(config.server.port);

stopSignals.forEach((signame) => {
    process.on(signame, async () => {
        await server.stop();

        process.exit(0);
    });
});

server.start();
