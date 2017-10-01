import * as uuid from 'uuid';
import * as crypto from 'crypto';
import {
    Table, Column, Model, PrimaryKey, Default, IsUUID, IsEmail, IsAlpha, DataType,
    BeforeCreate, BeforeUpdate, Unique, HasMany
} from 'sequelize-typescript';


import config from '../config';
import security from '../security';
import {Permission, defaultPermissions} from './permission';


function title(str: string) {
    return str.replace(
        /\w\S*/g,
        (word) =>  word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
    );
}


@Table({underscored: true})
export default class Account extends Model<Account> {

    @BeforeCreate
    @BeforeUpdate
    public static formatName(account: Account) {
        account.firstname = title(account.firstname);
        account.lastname = title(account.lastname);
    }

    public static async authenticate(email: string, password: string) {
        const account = await Account.findOne({where: {email}}) as Account;

        if (await security.verifyPassword(account.password, password)) {
            return account;
        }
        else {
            throw new Error('Wrong password');
        }
    }

    @IsUUID(4)
    @Default(uuid.v4)
    @PrimaryKey
    @Column
    public readonly id: string;

    @IsAlpha
    @Column
    public firstname: string;

    @IsAlpha
    @Column
    public lastname: string;

    @IsEmail
    @Unique
    @Column
    public email: string;

    @Column
    public birthday: Date;

    @Default(defaultPermissions)
    @Column({type: DataType.JSONB})
    public permissions: Permission[];

    public get name(): string {
        return `${this.firstname} ${this.lastname}`;
    }

    @Default(() => crypto.randomBytes(24).toString('base64'))
    @Column
    private token: string;

    @Column
    private password: string;

    public async changePassword(oldPassword: string, newPassword: string) {
        if (await security.verifyPassword(this.password, oldPassword)) {
            this.password = await security.hashPassword(newPassword);
            this.token = null;
        }
        else {
            throw new Error('Wrong password');
        }

        return this.save({fields: ['token', 'password']});
    }

    public async resetPassword(token: string, newPassword: string) {
        if ((Date.now() - this.updatedAt) > config.security.tokenLifetime) {
            this.token = null;
            await this.save({fields: ['token']});
        }

        if (!this.token) {
            throw new Error('No reset token generated');
        }

        if (this.token === token) {
            this.password = await security.hashPassword(newPassword);
        }
        else {
            throw new Error('Invalid token');
        }

        this.token = null;
        await this.save({fields: ['token', 'password']});
    }

    public async createToken() {
        this.token = crypto.randomBytes(24).toString('base64');

        return (await this.save({fields: ['token']})).token;
    }
}

