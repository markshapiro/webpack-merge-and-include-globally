
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
      files:{
        'vendor.js':[
          'node_modules/jquery/dist/jquery.js',
          'node_modules/classnames/index.js',
          'node_modules/humps/humps.js'
        ]
      },
      transform:{
        'vendor.js': code => require("uglify-js").minify(code).code
      }
    })
  ],
  module: {
    loaders: [
      { test: /\.html$/, loader: 'raw-loader' },
    ]
  }
};

module.exports = webpackConfig;
