import * as crypto from 'crypto';
import {Column, Table, Model, IsUUID, Default, PrimaryKey, DataType} from 'sequelize-typescript';


class FacebookCredentials {

    public constructor(public accessToken: string) {}
}

class PasswordCredentials {

    private token: string;

    public constructor(private password: string) {
        this.token = crypto.randomBytes(24).toString('base64');
    }
}


@Table
export default class Credentials extends Model<Credentials> {

    @PrimaryKey
    @Column
    public id: string;

    @Column({type: DataType.STRING})
    public provider: 'password' | 'facebook';

    @Column({type: DataType.JSONB})
    public data: FacebookCredentials | PasswordCredentials;
}
