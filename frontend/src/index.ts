/* tslint:disable:no-console */
import {Observable} from 'rxjs/Rx';
import {makeHTTPDriver} from '@cycle/http';
import {makeDOMDriver, h1, div, VNode} from '@cycle/dom';
import {run} from '@cycle/rxjs-run';

import './style.css';
import {Sources, Sinks} from './types';
import navbar from './components/navbar';
import {makeFacebookDriver} from './drivers/facebook';
import {makeSocketIODriver} from './drivers/socketio';


const drivers = {
    Facebook: makeFacebookDriver(process.env.FB_APP_ID, 'fr_FR'),
    DOM: makeDOMDriver('#app'),
    Socket: makeSocketIODriver(process.env.SERVER_URL),
    HTTP: makeHTTPDriver(),
};


function combine(...nodes: Observable<VNode>[]): Observable<VNode> {
    return Observable.combineLatest(nodes).map((array) => div(array));
}


function main({DOM, Facebook}: Sources): Sinks {
    const
        logState$ = Facebook
            .filter((event) => ['connected', 'disconnected'].includes(event.type)),
        logAction$ = DOM
            .select('#fb')
            .events('click')
            .map((click) => ({type: (click.target as Element).classList[0]}))
            .throttleTime(50),
        getUserInfo$ = logState$
            .filter((event) => event.type === 'connected')
            .map((event) => ({type: 'api', path: '/me'})),
        userInfo$ = Facebook
            .filter((event) => (event.type === 'api' && event.request.path === '/me'))
            .map((event) => event.data);

    return {
        DOM: combine(
            navbar(logState$, logAction$, userInfo$),
            Observable.of(div('#main', [h1('Coucool !')])),
        ),

        Socket: Observable.of({type: 'cell:on', content: {x: 0, y: 0}}),

        Facebook: Observable.merge(logAction$, getUserInfo$),

        HTTP: Observable.never(),
    };
}

run(main, drivers);
