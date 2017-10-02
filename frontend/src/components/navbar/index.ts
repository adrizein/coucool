/* tslint:disable:no-console */
import {Observable} from 'rxjs/Observable';
import {VNode, nav, span} from '@cycle/dom';

import './style.css';


interface UserInfo {
    id: string;
    name: string;
}


export default function navbar(userInfo$: Observable<UserInfo>): Observable<VNode> {
    return userInfo$.map((userInfo) => {
        let name = '';

        if (userInfo) {
            name = userInfo.name;
        }

        return nav([span(name)]);
    });
}
