const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === "development";

  return {
    entry: "./src/index.tsx",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.[contenthash].js",
      publicPath: isDevelopment ? "http://localhost:8080/" : "./",
    },
    target: "electron-renderer",
    mode: argv.mode || "development",
    devtool: isDevelopment ? "source-map" : false,

    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                "@babel/preset-react",
                "@babel/preset-typescript",
              ],
              plugins: [
                "react-native-web",
                [
                  "module-resolver",
                  {
                    alias: {
                      "^react-native$": "react-native-web",
                      "@learnup/mobile": path.resolve(
                        __dirname,
                        "../mobile/application"
                      ),
                      "@learnup/shared": path.resolve(
                        __dirname,
                        "../../packages/shared/src"
                      ),
                    },
                  },
                ],
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpe?g|gif|svg|ttf|otf|woff|woff2)$/i,
          type: "asset/resource",
        },
      ],
    },

    resolve: {
      extensions: [
        ".web.tsx",
        ".web.ts",
        ".web.jsx",
        ".web.js",
        ".tsx",
        ".ts",
        ".jsx",
        ".js",
      ],
      alias: {
        "react-native$": "react-native-web",
        "react-native-linear-gradient": "react-native-web-linear-gradient",
        "@learnup/mobile": path.resolve(__dirname, "../mobile/application"),
        "@learnup/shared": path.resolve(__dirname, "../../packages/shared/src"),
      },
      fallback: {
        crypto: false,
        stream: false,
        buffer: false,
      },
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        title: "LearnApp Desktop",
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "public",
            to: ".",
            globOptions: {
              ignore: ["**/index.html"],
            },
          },
        ],
      }),
    ],

    devServer: {
      port: 8080,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, "public"),
      },
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },

    optimization: {
      minimize: !isDevelopment,
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 10,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    },

    performance: {
      hints: isDevelopment ? false : "warning",
      maxAssetSize: 5000000, // 5MB
      maxEntrypointSize: 5000000, // 5MB
    },
  };
};
