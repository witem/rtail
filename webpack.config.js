const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const CopyPlugin = require('copy-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const webpackConfig = {}; // init object
const isProduction = process.env.NODE_ENV === 'production'; // production environment

webpackConfig.mode = isProduction ? 'production' : 'development';

// input
webpackConfig.entry = {
  app: './src/app.js', // main
};

// output
webpackConfig.output = {
  path: path.resolve(__dirname, 'dist'),
  publicPath: '/',
  filename: isProduction ? '[name].[hash].js' : '[name].js',
};

// loader
webpackConfig.module = {
  rules: [
    {
      test: /\.css$/,
      use: [{
        loader: MiniCssExtractPlugin.loader,
        options: {
          hmr: !isProduction,
          reloadAll: true,
        },
      }, 'css-loader'],
    },
    {
      test: /\.vue$/,
      loader: 'vue-loader',
    },
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    },
    {
      test: /\.(eot(|\?v=.*)|woff(|\?v=.*)|woff2(|\?v=.*)|ttf(|\?v=.*)|svg(|\?v=.*))$/,
      loader: 'file-loader',
      options: { name: 'fonts/[name].[ext]' },
    },
    {
      test: /\.(png|jpg|gif)$/,
      loader: 'file-loader',
    },
  ],
};

webpackConfig.plugins = [
  new VueLoaderPlugin(),
  new HtmlWebpackPlugin({ template: './src/index.html' }),
  new MiniCssExtractPlugin(),
  /*
  new CopyPlugin({
    patterns: [
      { context: 'src/images', from: '*', to: path.join(__dirname, 'dist', 'images') },
    ],
  }),
  */
];

if (!isProduction) {
  webpackConfig.devServer = {
    contentBase: path.resolve(__dirname, 'dist'),
    compress: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  };
}

module.exports = webpackConfig;
