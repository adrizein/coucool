import {Observable} from 'rxjs/Rx';
import {run} from '@cycle/rxjs-run';
import {makeDOMDriver, h1, DOMSource, VNode, div} from '@cycle/dom';

import {makeSocketIODriver, Message, SocketIOSource} from './socketio-driver';
import './style.css';


type Sources = {
    DOM: DOMSource,
    Socket: SocketIOSource,
};

type Sinks = {
    DOM: Observable<VNode>,
    Socket: Observable<Message>
};


const drivers = {
    DOM: makeDOMDriver('#app'),
    Socket: makeSocketIODriver('https://localhost:3333'),
};


function main({DOM, Socket}: Sources): Sinks {
    return {
        DOM: Observable.of(div([
            h1('Coucool !'),
        ])),

        Socket: Observable.of({type: 'cell:on', content: {x: 0, y: 0}}),
    };
}

run(main, drivers);
