const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const _ = require('lodash');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

const hmw = isProd ? [] : ['webpack-hot-middleware/client'];

module.exports = {
  entry: {
    main: _.flatten([hmw, './src/ui/index.jsx']),
  },
  output: {
    filename: 'build/[name]-bundle-[hash].js'
  },
  plugins: (isProd ? [] : [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ]).concat([
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'html-loader?interpolate=require!src/assets/index.html',
      chunks: ['main']
    })
  ], isProd ? [
    new UglifyJSPlugin()
  ] : []),
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(jpe?g|png|gif|svg|eot|woff|woff2|ttf)$/i,
        use: 'file-loader?name=[name].[ext]'
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
          test: /\.(gif|jpg|png|mp3|aac|ogg|wav)$/,
          loader: 'file-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
}