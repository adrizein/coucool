import {VNode} from '@cycle/dom';
import {RequestInput} from '@cycle/http';
import {Observable} from 'rxjs/Observable';
import {DOMSource} from '@cycle/dom/rxjs-typings';
import {HTTPSource} from '@cycle/http/rxjs-typings';


import {FacebookSource} from './drivers/facebook';
import {SocketIOSource, Message} from './drivers/socketio';


interface Sources {
    Facebook: FacebookSource;
    DOM: DOMSource;
    Socket: SocketIOSource;
    HTTP: HTTPSource;
}

interface Sinks {
    Facebook: Observable<any>;
    DOM: Observable<VNode>;
    Socket: Observable<Message>;
    HTTP: Observable<RequestInput>;
}


interface Component {
    (...sources: Observable<any>[]): Observable<VNode>;
}
