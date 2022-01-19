/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  entry: {
    app: "./src/index.ts",
    "editor.worker": "monaco-editor/esm/vs/editor/editor.worker.js",
    "ts.worker": "monaco-editor/esm/vs/language/typescript/ts.worker",
  },
  output: {
    globalObject: "self",
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /\.(png|ttf)$/,
        use: ["file-loader"],
      },
      {
        test: /\.(gleam|mjs)$/,
        use: ["raw-loader"],
      },
    ],
  },
  experiments: {
    asyncWebAssembly: true,
  },
  resolve: {
    fallback: { path: require.resolve("path-browserify") },
    preferRelative: true,
    extensions: [".ts", ".js"],
    alias: {
      "@gleam-wasm": path.resolve(__dirname, "./gleam-wasm"),
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    port: 8080,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "public/index.html",
    }),
    new CopyPlugin({
      patterns: [{ from: "static", to: "." }],
    }),
    new MiniCssExtractPlugin(),
    new CompressionPlugin(),
    new webpack.optimize.MinChunkSizePlugin({
      minChunkSize: 10000,
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 10,
    }),
  ],
};
