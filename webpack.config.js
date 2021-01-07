const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const fs = require("fs");
const webpack = require('webpack');
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin');
const AntDesignThemePlugin = require('antd-theme-webpack-plugin');
const { getLessVars } = require('antd-theme-generator');
const themeVariables = getLessVars(path.join(__dirname, './src/styles/variables.less'));
const lightVars = { ...getLessVars('./src/themes/light-theme.less') };
fs.writeFileSync('./src/themes/dark.json', JSON.stringify(themeVariables));
fs.writeFileSync('./src/themes/light.json', JSON.stringify(lightVars));

const options = {
  antDir: path.join(__dirname, './node_modules/antd'),
  stylesDir: path.join(__dirname, './src/styles'),
  varFile: path.join(__dirname, './src/styles/variables.less'),
  themeVariables: Array.from(new Set([
    ...Object.keys(themeVariables)
  ])),
  generateOnce: false,
  indexFileName: 'index.html'
}

const themePlugin = new AntDesignThemePlugin(options);

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
    port: 8000,
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
              lessOptions: {
                javascriptEnabled: true
              }
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
      favicon: 'src/assets/logo_4.png'
    }),
    themePlugin,
    new AntdDayjsWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.PUBLIC_PATH': JSON.stringify(''),
      OIDC_PROVIDER_URL: JSON.stringify(process.env.OIDC_PROVIDER_URL),
      OIDC_CLIENT_ID: JSON.stringify(process.env.OIDC_CLIENT_ID),
      OIDC_REDIRECT_URI: JSON.stringify(process.env.OIDC_REDIRECT_URI),
      OIDC_CLIENT_SECRET: JSON.stringify(process.env.OIDC_CLIENT_SECRET)
    })
  ]
};
