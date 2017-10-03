import {Stream} from 'xstream';
import * as io from 'socket.io-client';
import {Observable} from 'rxjs/Observable';
import {Subscriber} from 'rxjs/Subscriber';


export type Message = {type: string, content: any};
export type SocketIODriver = (stream: Stream<Message>) => SocketIOSource;
export type SocketIOSource = {get: (eventName: string) => Observable<any>};


export function makeSocketIODriver(url: string): SocketIODriver {
    const socket = io(url);

    return function socketIODriver(stream: Stream<Message>) {
        const event$: Observable<Message> = Observable.from(stream);

        event$.subscribe(({type, content}: Message) => {
            socket.emit(type, content);
        });

        return {
            get(eventName: string) {
                return Observable.create((subscriber: Subscriber<any>) => {
                    socket.on(eventName, (event: any) => {
                        subscriber.next(event);
                    });
                });
            },
        };
    };
}
