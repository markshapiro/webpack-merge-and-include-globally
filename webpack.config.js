
const MergeIntoSingle = require('./index.js');


var webpack = require('webpack');
var path = require('path');

// Webpack Config
var webpackConfig = {
  entry: ['./example/main.js'],
  devtool: 'cheap-module-source-map',
  output: {
    filename:'bundle.js',
    path: './dist',
  },
  resolve: {
    extensions: ['', '.js']
  },
  plugins: [
    new MergeIntoSingle({
      'vendor.js':[
          __dirname+'/node_modules/jquery/dist/jquery.js',
          __dirname+'/node_modules/classnames/index.js',
          __dirname+'/node_modules/humps/humps.js'
      ]
    })
  ],
  module: {
    loaders: [
      { test: /\.html$/, loader: 'raw-loader' },
    ]
  }
};

module.exports = webpackConfig;
