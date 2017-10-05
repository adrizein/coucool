/* tslint:disable:no-console */
import {sample} from 'lodash';
import {Observable} from 'rxjs/Rx';
import {run} from '@cycle/rxjs-run';
import {makeHTTPDriver} from '@cycle/http';
import {makeDOMDriver, h1, div, h, VNode} from '@cycle/dom';

import './style.css';
import {Sources, Sinks} from './types';
import navbar from './components/navbar';
import gameOfLife from './components/game-of-life';
import {makeFacebookDriver} from './drivers/facebook';
import {makeSocketIODriver} from './drivers/socketio';
import Cell from '../../backend/src/model/cell';
import Action from '../../backend/src/model/action';


const drivers = {
    Facebook: makeFacebookDriver(process.env.FB_APP_ID, 'fr_FR', 'facebook'),
    DOM: makeDOMDriver('#app'),
    Socket: makeSocketIODriver(process.env.SERVER_URL),
    HTTP: makeHTTPDriver(),
};


function combine(selector: string, ...nodes: Observable<VNode>[]): Observable<VNode> {
    return Observable.combineLatest(nodes).map((array) => h(selector, array));
}


function main({DOM, Facebook, Socket}: Sources): Sinks {
    const
        logState$ = Facebook
            .filter((event) => ['connected', 'disconnected'].includes(event.type)),
        getUserInfo$ = logState$
            .filter((event) => event.type === 'connected')
            .map((event) => ({type: 'api', path: '/me'})),
        userInfo$ = Facebook
            .filter((event) => (event.type === 'api' && event.request.path === '/me'))
            .map((event) => event.data)
            .startWith(null);

    const grid$ = gameOfLife(
        Socket.get('game:start')
            .map((cells) => cells.map((cell: Cell) => Cell.fromJSON(cell))),
        Observable.of({height: 25, width: 50, size: '30px', x: 0, y: 0}),
        Socket.get('game:update')
            .map((actions) => actions.map(({cell, type}: Action) => ({cell: Cell.fromJSON(cell), type}))),
    );

    return {
        DOM: combine(
            'div',
            navbar(Observable.merge(
                logState$
                    .filter((event) => event.type === 'disconnected')
                    .mapTo(null),
                userInfo$,
            )),
            combine(
                'div#main',
                Observable.of(h1('Coucool !')),
                grid$.startWith(div('.game')),
            ),
        ),

        Socket: Observable.merge(
            DOM
                .select('#main div.game div.cell.off')
                .events('click')
                .flatMap((click: MouseEvent) => {
                    const [x, y] = click.srcElement.id.split('/').map(parseFloat);

                    if (click.shiftKey) {
                        return [{type: 'cell:on', content: {x, y}}];
                    }

                    const
                        cell = Cell.fromJSON({x, y}),
                        cells = cell.neighbours.concat([cell]);

                    return cells
                        .filter(() => sample([true, false]))
                        .map((content) => ({type: 'cell:on', content}));
                }),
            Socket.get('reconnect').map(() => {
                console.log('Socket reconnected, reloading game...');

                return {type: 'game:reload', content: null};
            }),
        ),

        Facebook: getUserInfo$,

        HTTP: Observable.never(),
    };
}

run(main, drivers);
