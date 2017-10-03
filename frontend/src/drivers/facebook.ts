import {Stream} from 'xstream';
import {Observable} from 'rxjs/Observable';
import {Subscriber} from 'rxjs/Subscriber';
import AuthResponse = facebook.AuthResponse;


export type FacebookSource = Observable<any>;
export type FacebookDriver = (stream: Stream<any>) => FacebookSource;


declare global {
    interface Window {
        fbAsyncInit: Function;
    }
}


export function makeFacebookDriver(appId: string, locale: string, buttonId: string): FacebookDriver {
    return function facebookDriver(stream: Stream<any>) {
        const event$: Observable<any> = Observable.from(stream);

        let init = false;
        const subscribers: Subscriber<any>[] = [];

        return Observable.create((subscriber: Subscriber<any>) => {
            subscribers.push(subscriber);

            if (!init) {
                if (!window.fbAsyncInit) {
                    window.fbAsyncInit = () => {
                        FB.init({
                            appId,
                            cookie: true,
                            xfbml: true,
                            version: 'v2.8'
                        });

                        FB.AppEvents.logPageView();

                        drive();

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
        });


        ////////////

        function statusCallback(response: AuthResponse, loginButton: HTMLButtonElement) {
            loginButton.disabled = false;

            if (response.status === 'connected') {
                loginButton.classList.remove('login');
                loginButton.classList.add('logout');
                subscribers.forEach((subscriber) =>
                    subscriber.next({type: 'connected', data: response.authResponse})
                );
            }
            else {
                loginButton.classList.remove('logout');
                loginButton.classList.add('login');
                subscribers.forEach((subscriber) =>
                    subscriber.next({type: 'disconnected', status: response.status})
                );
            }
        }

        function loginCallback(res: AuthResponse, loginButton: HTMLButtonElement) {
            loginButton.disabled = false;

            if (res.status === 'connected') {
                loginButton.classList.remove('login');
                loginButton.classList.add('logout');

                return subscribers.forEach((subscriber) =>
                    subscriber.next({type: 'connected', data: res.authResponse})
                );
            }
            else {
                return subscribers.forEach((subscriber) =>
                    subscriber.error({type: 'login', error: res})
                );
            }
        }

        function logoutCallback(res: AuthResponse, loginButton: HTMLButtonElement) {
            loginButton.disabled = false;

            if (res.status !== 'connected') {
                loginButton.classList.remove('logout');
                loginButton.classList.add('login');

                return subscribers.forEach((subscriber) =>
                    subscriber.next({type: 'disconnected', reason: 'logout'})
                );
            }
            else {
                return subscribers.forEach((subscriber) =>
                    subscriber.error({type: 'logout', error: res})
                );
            }
        }

        function drive() {
            FB.getLoginStatus((response) => {
                const loginButton = document.getElementById(buttonId) as HTMLButtonElement;

                statusCallback(response, loginButton);

                loginButton.onclick = () => {
                    loginButton.disabled = true;

                    if (loginButton.classList.contains('login')) {
                        FB.login((res) => {
                            loginCallback(res, loginButton);
                        });
                    }
                    else if (loginButton.classList.contains('logout')) {
                        FB.logout((res) => {
                            logoutCallback(res, loginButton);
                        });
                    }
                    else {
                        // tslint:disable:no-console
                        console.error(`button#${buttonId} has no logout or login class: `, loginButton);
                        FB.getLoginStatus((res) => {
                            statusCallback(response, loginButton);
                        });
                    }
                };

                event$.subscribe((payload) => {
                    switch (payload.type) {
                        case 'login':
                            // tslint:disable:no-console
                            console.error('The login action should be bound the onlick attribute of a button');
                            loginButton.disabled = true;
                            return FB.login(
                                (res) => loginCallback(res, loginButton),
                                {scope: payload.scope}
                            );

                        case 'logout':
                            loginButton.disabled = true;
                            return FB.logout((res) => logoutCallback(res, loginButton));

                        case 'api':
                            return FB.api(payload.path, payload.method, payload.params, (data: any) => {
                                if (data.error) {
                                    return subscribers.forEach((subscriber) =>
                                        subscriber.error({type: 'api', error: data.error, request: payload})
                                    );
                                }

                                // TODO: specialize each api method
                                return subscribers.forEach((subscriber) =>
                                    subscriber.next({type: 'api', data, request: payload})
                                );
                            });

                        case 'ui':
                            return FB.ui(payload.params, (res) => {
                                if (res.error_message) {
                                    return subscribers.forEach((subscriber) =>
                                        subscriber.error({type: 'ui', error: res.error_message, request: payload})
                                    );
                                }

                                // TODO: specialize each ui method
                                return subscribers.forEach((subscriber) =>
                                    subscriber.next({type: 'ui', response: res, request: payload})
                                );
                            });
                    }
                });
            });
        }
    };
}
