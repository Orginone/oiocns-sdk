const path = require("path");
/** @type {import("webpack").Configuration} */
module.exports = {
    entry: './src/index.ts',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['babel-loader', 'ts-loader'],
                exclude: /node_modules/
            }
        ]
    },
    externals: {
        "lodash": "_"
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    output: {
        filename: 'sdk.umd.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'ACSDK',
        libraryTarget: 'umd',
        umdNamedDefine: true
    }
};
