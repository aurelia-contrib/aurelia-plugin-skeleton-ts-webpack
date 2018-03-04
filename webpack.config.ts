// tslint:disable:no-implicit-dependencies
// tslint:disable:import-name
import { AureliaPlugin, ModuleDependenciesPlugin } from "aurelia-webpack-plugin";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import * as path from "path";
import * as webpack from "webpack";

const title = "Router Metadata Demo";

export interface IConfiguration extends webpack.Configuration {
  mode: "development" | "production";
}

interface IEnv {
  server?: boolean;
  production?: boolean;
}

const devBaseUrl: string = "/";
const prodBaseUrl: string = "/aurelia-router-metadata/";
const config = (env: IEnv = {}): IConfiguration => {
  return {
    mode: "development",
    resolve: {
      extensions: [".ts", ".js"],
      modules: ["src", "demo", "node_modules"],
      alias: {
        bluebird: path.resolve(__dirname, "node_modules/bluebird/js/browser/bluebird.core"),
        "aurelia-router-metadata": path.resolve(__dirname, "src/aurelia-router-metadata.ts")
      }
    },
    entry: {
      app: ["aurelia-bootstrapper"],
      vendor: ["bluebird"]
    },
    output: {
      path: path.resolve(__dirname),
      publicPath: env.production ? prodBaseUrl : devBaseUrl,
      filename: "[name].[hash].bundle.js",
      sourceMapFilename: "[name].[hash].bundle.map"
    },
    devtool: "cheap-module-eval-source-map",
    devServer: {
      historyApiFallback: true
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: [{ loader: "css-loader" }]
          }),
          issuer: [{ not: [{ test: /\.html$/i }] }]
        },
        {
          test: /\.css$/,
          use: [{ loader: "css-loader" }],
          issuer: [{ test: /\.html$/i }]
        },
        {
          test: /\.html$/,
          use: [{ loader: "html-loader" }]
        },
        {
          test: /\.ts$/,
          loader: "ts-loader",
          exclude: /node_modules/,
          options: {
            configFile: path.resolve(__dirname, "configs/tsconfig-demo.json")
          }
        },
        {
          test: /[\/\\]node_modules[\/\\]bluebird[\/\\].+\.js$/,
          use: [{ loader: "expose-loader?Promise" }]
        }
      ]
    },
    plugins: [
      new AureliaPlugin(),
      new webpack.ProvidePlugin({
        Promise: "bluebird"
      }),
      new ModuleDependenciesPlugin({
        "aurelia-testing": ["./compile-spy", "./view-spy"]
      }),
      new HtmlWebpackPlugin({
        template: "demo/index.ejs",
        metadata: {
          title,
          server: env.server,
          baseUrl: env.production ? prodBaseUrl : devBaseUrl
        }
      })
    ]
  };
};

export default config;
