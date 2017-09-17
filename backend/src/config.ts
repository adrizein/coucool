import * as _ from 'lodash';


function getFloat(name: string, defaultValue: number = null): number {
    const value = process.env[name];

    if (value) {
        const float = parseFloat(value);
        if (_.isNaN(float)) {
            throw new Error(`The "${name}" environment variable should be a float, instead it is: "${value}"`);
        }

        return float;
    }
    else if (defaultValue !== null) {
        return defaultValue;
    }
    else {
        throw new Error(`The ${name} environment variable is missing`);
    }
}


function getInteger(name: string, defaultValue: number = null): number {
    const value = process.env[name];

    if (value) {
        const integer = parseInt(value);
        if (_.isNaN(integer)) {
            throw new Error(`The "${name}" environment variable should be an integer, instead it is: "${value}"`);
        }

        return integer;
    }
    else if (defaultValue !== null) {
        return _.floor(defaultValue);
    }
    else {
        throw new Error(`The ${name} environment variable is missing`);
    }
}


function getString(name: string, defaultValue: string = null): string {
    const value = process.env[name];

    if (value) {
        return value;
    }
    else if (defaultValue !== null) {
        return defaultValue;
    }
    else {
        throw new Error(`The "${name}" environment variable is missing`);
    }
}


function getBoolean(
    name: string,
    defaultValue: boolean = null,
    trueValues = ['1', 'true'],
    falseValues = ['0', 'false']
): boolean {
    const value = (process.env[name] || '').toLowerCase();

    if (value) {
        if (trueValues.includes(value)) {
            return true;
        }
        else if (falseValues.includes(value)) {
            return false;
        }
        else {
            throw new Error(`The "${name}" environment variable should be a boolean, instead it is "${value}"`);
        }
    }
    else if (defaultValue !== null) {
        return defaultValue;
    }
    else {
        throw new Error(`The "${name}" environment variable is missing`);
    }
}


const config = {
    server: {
        host: getString('SERVER_HOST', 'localhost'),
        port: getInteger('SERVER_PORT', 3333),
        get url() {
            return getString('SERVER_URL', `http://${this.host}:${this.port}`);
        },
        assets: getString('SERVER_ASSETS', '../frontend/dist'),
    },
    database: {
        host: getString('DATABASE_HOST', 'localhost'),
        port: getInteger('DATABASE_PORT', 5432),
        name: getString('DATABASE_NAME', 'coucool'),
        get url() {
            return getString(
                'DATABASE_URL',
                `postgres://${this.user}@${this.host}:${this.port}/${this.name}`,
            );
        }
    },
    game: {
        period: getInteger('GAME_PERIOD', 500),
        buffer: getInteger('GAME_BUFFER', 50),
    },
};

export default config;
