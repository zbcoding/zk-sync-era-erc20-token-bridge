// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

const env = dotenv.config().parsed;

module.exports = {
  mode: 'development',
  entry: './src/deposit.js',
  devtool: 'source-map',
  devServer: {
    static: path.join(__dirname, 'public'),
    compress: true,
    port: 8080,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new webpack.EnvironmentPlugin(env),
  ],
  output: {
    filename: 'main.js',
    path: `${__dirname}/dist`,
  },
  resolve: {
    fallback: {
      fs: false, // Use false if you don't need the "fs" module
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        //exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};
