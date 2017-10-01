/* tslint:disable:no-console */
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {VNode, button, nav, span} from '@cycle/dom';

import './style.css';


interface UserInfo {
    id: string;
    name: string;
}


export default function navbar(
    logState$: Observable<{type: string, data: any}>,
    logAction$: Observable<{type: string}>,
    userInfo$: Observable<UserInfo>,
): Observable<VNode> {
    const output: Subject<VNode> = new Subject();

    let logged = false, userInfo: UserInfo = null;

    logState$
        .subscribe(({type, data = {}}) => {
            logged = type === 'connected';

            if (!logged) {
                userInfo = null;
            }
            output.next(buildNavbar(logged, userInfo, false));
        });

    logAction$.subscribe((action) => {
        if (action.type === 'logout' && logged) {
            userInfo = null;
            output.next(buildNavbar(logged, userInfo, true));
        }
        else if (action.type === 'login' && !logged) {
            output.next(buildNavbar(logged, userInfo, true));
        }
        else {
            // Not supposed to happen
            console.error('Not supposed to happen:', action, logged);
        }
    });


    userInfo$.subscribe((info) => {
        userInfo = info;

        return output.next(buildNavbar(logged, userInfo, false));
    });

    return output;
}


function buildNavbar(logged: boolean, userInfo: UserInfo, waiting: boolean): VNode {
    let selector = '#fb', text: string, attrs = {}, name = '';
    if (logged) {
        selector += '.logout';
        text = 'Logout';
    }
    else {
        selector += '.login';
        text = 'Login with Facebook';
    }

    if (waiting) {
        attrs = {disabled: true};
    }

    if (userInfo) {
        name = userInfo.name;
    }

    return nav([span(name), button(selector, {attrs}, text)]);
}
