const path = require("path");

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
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    port: 8080,
  },
};
