const path = require('path');
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = [
    {
        mode: process.env.WEBPACK_SERVE ? 'development' : 'production',
        entry: {
            warp: './src/index.js'
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
            library: 'warp',
            libraryTarget: 'umd'
        },
        devtool: 'source-map',
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    loader: 'eslint-loader',
                    options: {
                        failOnWarning: false,
                        failOnError: true,
                    },
                },
                {
                    test: /\.(glsl)$/,
                    use: 'raw-loader'
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin('dist', {}),
        ],
        optimization: {
            minimize: false
        }
    },
    {
        mode: process.env.WEBPACK_SERVE ? 'development' : 'production',
        entry: [
            './example/demo.js'
        ],
        output: {
            path: path.resolve(__dirname, 'example/build'),
            filename: '[name].js'
        },
        devtool: 'source-map',
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    loader: 'eslint-loader',
                    options: {
                        failOnWarning: false,
                        failOnError: true,
                    },
                },
                {
                    test: /\.(glsl)$/,
                    use: 'raw-loader'
                },
                {
                    test: /\.(png|jpg|gif)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {}
                        }
                    ]
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin('example/build', {}),
            new HtmlWebpackPlugin({
                inject: true,
                hash: false,
                template: './example/index.html',
                filename: 'index.html'
            }),
            new CopyWebpackPlugin([
                {
                    from: 'example/misc/',
                    to: 'assets'
                }
            ]),
            new Serve({
                static: path.join(process.cwd(), '/example/build'),
                hmr: false
            })
        ],
        watch: true,
        optimization: {
            minimize: false
        },
        performance: {
            hints: false
        }
    }
];