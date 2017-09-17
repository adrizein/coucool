const
    merge = require('webpack-merge'),
    UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const
    common = require('./webpack.common');


module.exports = merge(common, {
    plugins: [
        new UglifyJSPlugin({compress: true}),
    ]
});
