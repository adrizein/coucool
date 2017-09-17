const
    CleanWebpackPlugin = require('clean-webpack-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    path = require('path');


module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Coucool 2018',
            fbAppId: process.env.FB_APP_ID,
            template: './src/index.ejs',
        }),
        new CleanWebpackPlugin(['./dist']),
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ]
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: '/node_modules/',
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
    }
};
