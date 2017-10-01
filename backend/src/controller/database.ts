import {Sequelize} from 'sequelize-typescript';

import Account from '../model/account';


export default class Database extends Sequelize {

    public constructor(url: string) {
        super({url});

        this.addModels([Account]);
    }
}
