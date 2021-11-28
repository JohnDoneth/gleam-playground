const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./main.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  experiments: {
    asyncWebAssembly: true,
  },
  resolve: {
    fallback: { path: require.resolve("path-browserify") },
    preferRelative: true,
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
  ],
};
