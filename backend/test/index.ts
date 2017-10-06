import {expect} from 'chai';
import * as _ from 'lodash';
import * as io from 'socket.io-client';

import config from '../src/config';
import {Server} from '../src/server';
import {Action, ActionType} from '../src/model/action';


describe('Game Of Life', () => {

    const
        server = new Server(config.server.port),
        client = io(config.server.url);

    before('Start server', () => server.start());
    before('Wait for server', (done) => client.once('game:start', () => done()));
    after('Stop server', () => server.stop());


    it('should turn on a cell', (done) => {
        const cell = {x: 0, y: 0};

        client.once('game:update', (actions: Action[]) => {
            try {
                expect(actions).to.eql([{
                    cell,
                    type: ActionType.on,
                }]);

                return done();
            }
            catch (err) {
                return done(err);
            }
        });

        client.emit('cell:on', cell);
    });

    it('should turn on another cell', (done) => {
        const cell = {x: 2, y: 3};

        client.once('game:update', (actions: Action[]) => {
            try {
                expect(actions).to.eql([{
                    cell,
                    type: ActionType.on,
                }]);

                return done();
            }
            catch (err) {
                return done(err);
            }
        });

        client.emit('cell:on', cell);
    });

    it('should turn off the previous cell', (done) => {
        const cell = {x: 2, y: 3};
        client.once('game:update', (actions: Action[]) => {
            try {
                expect(actions).to.eql([{
                    cell,
                    type: ActionType.off,
                }]);

                return done();
            }
            catch (err) {
                return done(err);
            }
        });

        client.emit('cell:off', cell);
    });

    it('should wait for the first cell to turn off', (done) => {
        client.once('game:update', (actions: Action[]) => {
            try {
                expect(actions).to.eql([{
                    cell: {x: 0, y: 0},
                    type: ActionType.off,
                }]);

                return done();
            }
            catch (err) {
                return done(err);
            }
        });
    });

    it('should send love when the same cell is turned on twice', (done) => {
        const cell = {x: -2, y: -3};
        client.once('game:update', (actions: Action[]) => {
            try {
                expect(actions).to.eql([
                    {
                        cell,
                        type: ActionType.on,
                    },
                    {
                        cell,
                        type: ActionType.love,
                    }
                ]);

                return done();
            }
            catch (err) {
                return done(err);
            }
        });

        client.emit('cell:on', cell);
        client.emit('cell:on', cell);
    });

    it('should send love when the same cell is turned off twice', (done) => {
        const cell = {x: -2, y: -3};
        client.once('game:update', (actions: Action[]) => {
            try {
                expect(actions).to.eql([
                    {
                        cell,
                        type: ActionType.off,
                    },
                    {
                        cell,
                        type: ActionType.love,
                    }
                ]);

                return done();
            }
            catch (err) {
                return done(err);
            }
        });

        client.emit('cell:off', cell);
        client.emit('cell:off', cell);
    });

    it('should buffer quickly succeeding cell activations', (done) => {
        const cells = _.flatMap(
            _.range(4).map((x) => ({x})),
            ({x}) => _.range(4).map((y) => ({x, y}))
        );

        client.once('game:update', (actions: Action[]) => {
            try {
                expect(actions).to.eql(cells.map((cell) => ({cell, type: ActionType.on})));

                return done();
            }
            catch (err) {
                return done(err);
            }
        });

        cells.forEach((cell) => {
            client.emit('cell:on', cell);
        });
    });
});
