import {Stream} from 'xstream';
import {Observable} from 'rxjs/Observable';
import {Subscriber} from 'rxjs/Subscriber';


export type FacebookSource = Observable<any>;
export type FacebookDriver = (stream: Stream<any>) => FacebookSource;


declare global {
    interface Window {
        fbAsyncInit: Function;
    }
}


export function makeFacebookDriver(appId: string, locale: string): FacebookDriver {
    return function facebookDriver(stream: Stream<any>) {
        const event$: Observable<any> = Observable.from(stream);

        function subscribe(subscriber: Subscriber<any>) {
            FB.getLoginStatus((response) => {
                if (response.status === 'connected') {
                    subscriber.next({type: 'connected', data: response.authResponse});
                }
                else {
                    subscriber.next({type: 'disconnected', reason: response.status});
                }

                event$.subscribe((payload) => {
                    switch (payload.type) {
                        case 'login':
                            FB.login((res) => {
                                switch (res.status) {
                                    case 'connected':
                                        return subscriber.next({type: 'connected', data: res.authResponse});
                                    default:
                                        return subscriber.next({type: 'disconnected', reason: res.status});
                                }
                            }, {scope: payload.scope});
                            break;

                        case 'logout':
                            FB.logout(() => {
                                return subscriber.next({type: 'disconnected', reason: 'logout'});
                            });
                            break;

                        case 'api':
                            FB.api(payload.path, payload.method, payload.params, (data: any) => {
                                if (data.error) {
                                    return subscriber.error(data.error);
                                }

                                return subscriber.next({type: 'api', data, request: payload});
                                // TODO: specialize each api method
                            });
                            break;

                        case 'ui':
                            FB.ui(payload.params, (res) => {
                                if (res.error_message) {
                                    return subscriber.error(res.error_message);
                                }

                                return subscriber.next({type: 'ui', response: res, request: payload});
                                // TODO: specialize each ui method
                            });
                            break;
                    }
                });
            });
        }

        let init = false;
        const earlySubscribers: Subscriber<any>[] = [];

        return new Observable<any>((subscriber) => {
            if (!init) {
                earlySubscribers.push(subscriber);
                if (!window.fbAsyncInit) {
                    window.fbAsyncInit = () => {
                        FB.init({
                            appId,
                            cookie: true,
                            xfbml: true,
                            version: 'v2.8'
                        });

                        FB.AppEvents.logPageView();

                        earlySubscribers.forEach((sub) => {
                            subscribe(sub);
                        });

                        earlySubscribers.length = 0;

                        init = true;
                    };
                }

                if (!document.getElementById('facebook-jssdk')) {
                    const sdk = document.createElement('script');

                    sdk.id = 'facebook-jssdk';
                    sdk.src = `//connect.facebook.net/${locale}/sdk.js`;
                    document.body.appendChild(sdk);
                }
            }
            else {
                subscribe(subscriber);
            }
        });
    };
}
