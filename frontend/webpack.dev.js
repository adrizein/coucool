const
    merge = require('webpack-merge');

const
    common = require('./webpack.common');


module.exports = merge(common, {
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
        compress: true,
        proxy: {
            "/socket.io": {
                target: "http://localhost:3333/socket.io",
            }
        }
    },
});
