import {getString, getInteger} from './helpers';


const config = {
    server: {
        host: getString('SERVER_HOST', 'localhost'),
        port: getInteger('PORT', 3333),
        get url() {
            return `http://${this.host}:${this.port}`;
        },
        frontend: getString('FRONTEND_DIR', '../frontend/dist'),
    },
    database: {
        host: getString('DATABASE_HOST', 'localhost'),
        port: getInteger('DATABASE_PORT', 5432),
        name: getString('DATABASE_NAME', 'coucool'),
        user: getString('DATABASE_USER', 'postgres'),
        password: getString('DATABASE_PASSWORD', ''),
        get url() {
            let url = 'postgres://';
            if (this.user) {
                url += this.user;

                if (this.password) {
                    url += `:${this.password}`;
                }
                url += '@';
            }
            url += `${this.host}/${this.name}`;

            return getString('HEROKU_POSTGRESQL_IVORY_URL', url);
        },
    },
    game: {
        period: getInteger('GAME_PERIOD', 500),
        buffer: getInteger('GAME_BUFFER', 50),
    },
    security: {
        tokenLifetime: getInteger('TOKEN_LIFETIME', 8 * 3600 * 1000),
        jwtSecret: getString('JWT_SECRET'),
    }
};

export default config;
