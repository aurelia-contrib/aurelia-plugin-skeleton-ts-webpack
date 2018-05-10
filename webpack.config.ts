// tslint:disable:no-implicit-dependencies
// tslint:disable:import-name
import { AureliaPlugin, ModuleDependenciesPlugin } from "aurelia-webpack-plugin";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import { readFileSync } from "fs";
import HtmlWebpackPlugin from "html-webpack-plugin";
import * as path from "path";
import * as webpack from "webpack";
import autoprefixer from "autoprefixer";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));

const paths = {
  base: path.resolve(__dirname),
  src: path.resolve(__dirname, "src"),
  demo: path.resolve(__dirname, "demo"),
  nodeModules: path.resolve(__dirname, "node_modules"),
  bluebird: path.resolve(__dirname, "node_modules", "bluebird", "js", "browser", "bluebird"),
  tsconfig: path.resolve(__dirname, "configs/tsconfig-demo.json")
};

const load = {
  style: { loader: "style-loader" },
  css: { loader: "css-loader" },
  postcss: {
    loader: "postcss-loader",
    options: { plugins: () => [autoprefixer({ browsers: ["last 2 versions"] })] }
  },
  html: { loader: "html-loader" },
  sass: { loader: "sass-loader" },
  ts: {
    loader: "ts-loader",
    options: { configFile: paths.tsconfig }
  },
  file: { loader: "file-loader", options: { name: "[path][name].[ext]" } },
  expose: { loader: "expose-loader?Promise" }
};

const minifyOpts = {
  removeComments: true,
  collapseWhitespace: true,
  collapseInlineTagWhitespace: true,
  collapseBooleanAttributes: true,
  removeAttributeQuotes: true,
  minifyCSS: true,
  minifyJS: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  ignoreCustomFragments: [/\${.*?}/g]
};

function configure(env: { server?: boolean; production?: boolean } = {}): webpack.Configuration {
  const { server, production } = env;
  const baseUrl = production ? `/${pkg.repository.url}/` : "/";
  const filename = "[name].[hash].bundle";

  return {
    mode: production ? "production" : "development",
    resolve: {
      extensions: [".ts", ".js"],
      modules: [paths.src, paths.demo, paths.nodeModules],
      alias: {
        bluebird: paths.bluebird,
        "@src": paths.src
      }
    },
    entry: {
      app: ["aurelia-bootstrapper"],
      vendor: ["bluebird"]
    },
    output: {
      path: paths.base,
      publicPath: baseUrl,
      filename: `${filename}.js`,
      sourceMapFilename: `${filename}.map`
    },
    devtool: production ? "nosources-source-map" : "cheap-module-eval-source-map",
    performance: { hints: false },
    devServer: {
      historyApiFallback: true,
      open: true,
      lazy: false
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [load.style, load.css, load.postcss],
          issuer: [{ not: [{ test: /\.html?$/i }] }]
        },
        {
          test: /\.css$/i,
          use: [load.css, load.postcss],
          issuer: [{ test: /\.html?$/i }]
        },
        {
          test: /\.html?$/i,
          use: [load.html]
        },
        {
          test: /\.scss$/i,
          use: [load.style, load.css, load.postcss, load.sass],
          issuer: /\.[tj]s$/i
        },
        {
          test: /\.scss$/i,
          use: [load.css, load.postcss, load.sass],
          issuer: /\.html?$/i
        },
        {
          test: /\.ts$/i,
          use: [load.ts],
          exclude: /node_modules/i
        },
        {
          test: /[\/\\]node_modules[\/\\]bluebird[\/\\].+\.js$/i,
          use: [load.expose]
        },
        {
          test: /\.(jpe?g|png|gif|svg|tff|eot|otf|woff2?)$/i,
          use: [load.file]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "demo/index.ejs",
        metadata: { title: pkg.name, server, baseUrl, debug: !production },
        minify: !!production && minifyOpts
      }),
      new AureliaPlugin(),
      new webpack.ProvidePlugin({ Promise: "bluebird" }),
      new ModuleDependenciesPlugin({ "aurelia-testing": ["./compile-spy", "./view-spy"] })
    ]
  };
}

export default configure;
