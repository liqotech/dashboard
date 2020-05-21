const HtmlWebpackPlugin = require('html-webpack-plugin');
const RobotstxtPlugin = require('robotstxt-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: ['@babel/polyfill', './src/index.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  devServer: {
    host: '0.0.0.0',
    port: 80,
    historyApiFallback: {
      disableDotRule: true
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              esModule: false
            }
          }
        ]
      },
      {
        test: /\.less$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true
            }
          }
        ]
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff'
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      title: 'LiqoDash',
      meta: {
        viewport: 'width=device-width, initial-scale=1',
        'theme-color': '#000000',
        description: 'Liqo dashboard'
      },
      favicon: 'src/assets/k8s-2.png'
    }),
    new RobotstxtPlugin({
      'User-agent': '*',
      Disallow: ''
    })
  ]
};
