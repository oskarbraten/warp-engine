const path = require('path');
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

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
                    test: /\.(glsl|gltf)$/,
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
            new CleanWebpackPlugin('dist', {}),
        ]
    },
    {
        mode: process.env.WEBPACK_SERVE ? 'development' : 'production',
        entry: [
            './example/demo.js',
            'webpack-plugin-serve/client'
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
                    test: /\.(glsl|gltf)$/,
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
            new Serve({ static: path.join(process.cwd(), '/example/build') })
        ],
        watch: true
    }
];