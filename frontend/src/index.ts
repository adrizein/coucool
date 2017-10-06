/* tslint:disable:no-console */
import {sample} from 'lodash';
import {Observable} from 'rxjs/Rx';
import {run} from '@cycle/rxjs-run';
import {makeHTTPDriver} from '@cycle/http';
import {makeDOMDriver, h1, div, h, VNode} from '@cycle/dom';

import './style.css';
import {Sources, Sinks} from './types';
import navbar from './components/navbar';
import gameOfLife, {GridDimensions} from './components/game-of-life';
import {makeFacebookDriver} from './drivers/facebook';
import {makeSocketIODriver} from './drivers/socketio';
import Cell from '../../backend/src/model/cell';
import Action from '../../backend/src/model/action';
import {Subscriber} from 'rxjs/Subscriber';


const drivers = {
    Facebook: makeFacebookDriver(process.env.FB_APP_ID, 'fr_FR', 'facebook'),
    DOM: makeDOMDriver('#app'),
    Socket: makeSocketIODriver(process.env.SERVER_URL),
    HTTP: makeHTTPDriver(),
};


function combine(selector: string, ...nodes: Observable<VNode>[]): Observable<VNode> {
    return Observable.combineLatest(nodes).map((array) => h(selector, array));
}


function compare([x0, y0]: number[], [x1, y1]: number[]) {
    return x0 === x1 && y0 === y1;
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
            .startWith(null),
        wheel$ = Observable.fromEvent(window, 'wheel', {passive: true}),
        zoom$ = wheel$
            .filter((wheel: WheelEvent) => wheel.shiftKey)
            .pluck('deltaY'),
        scroll$ = wheel$
            .filter((wheel: WheelEvent) => !(wheel.shiftKey || wheel.metaKey || wheel.ctrlKey || wheel.altKey))
            .map((wheel: WheelEvent) => [wheel.deltaX, wheel.deltaY])
            .startWith([0, 0]),
        gridSize$ = Observable
            .fromEvent(window, 'resize', {passive: true})
            .startWith(null)
            .switchMap(() => DOM
                .select('#game')
                .elements()
                .filter((element: Element[]) => element.length > 0)
                .map(([element]: Element[]) => [element.clientHeight, element.clientWidth])
                .distinctUntilChanged(compare)
            ),
        gridDimensions = new GridDimensions(20, 20, 0, 0, 20),
        gridDimension$ = Observable.create((subscriber: Subscriber<GridDimensions>) => {
            zoom$.subscribe((zoom: number) => {
                gridDimensions.zoom(zoom);

                subscriber.next(gridDimensions);
            });

            scroll$.subscribe(([dx, dy]) => {
                gridDimensions.translate(dx, dy);

                subscriber.next(gridDimensions);
            });

            gridSize$.subscribe(([height, width]) => {
                gridDimensions.resize(height, width);

                subscriber.next(gridDimensions);
            });
        });

    const grid$ = gameOfLife(
        Socket.get('game:start')
            .map((cells) => cells.map((cell: Cell) => Cell.fromJSON(cell))),
        gridDimension$,
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
                .select('#game div.cell.off')
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
