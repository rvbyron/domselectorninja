/// <reference types="node" />
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    background: './src/background/index.ts',
    content: './src/content/index.ts',
    popup: './src/popup/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader', // This injects CSS into the DOM
          'css-loader',   // This interprets @import and url() in CSS
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@background': path.resolve(__dirname, 'src/background/'),
      '@content': path.resolve(__dirname, 'src/content/'),
      '@ui': path.resolve(__dirname, 'src/ui/'),
      '@services': path.resolve(__dirname, 'src/services/'),
      '@utils': path.resolve(__dirname, 'src/utils/'),
    },
  },
  stats: {
    errorDetails: true,
    // ...other stats options...
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '.' },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/html/popup.html'),
      filename: 'popup.html',
      chunks: ['popup'], // This ensures popup.js and its imported CSS are included
    }),
    // Comment out this plugin if you don't need selector.html or create the file
    // new HtmlWebpackPlugin({
    //   template: 'public/html/selector.html',
    //   filename: 'selector.html',
    //   chunks: ['selector'],
    // }),
  ],
};