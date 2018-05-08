import { readFileSync } from "fs";
import ts from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";
import commonJS from "rollup-plugin-commonjs";
import uglify from "rollup-plugin-uglify";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));

const { mod, minify } = process.env;

function when(predicate, opts) {
  return predicate ? opts : {};
}

function output(target, format, opts = {}) {
  return {
    input: `src/${pkg.name}.ts`,
    output: { ...{ file: `dist/${mod}/${pkg.name}${minify ? ".min" : ""}.js`, format, name: pkg.name }, ...opts },
    plugins: [
      resolve(),
      commonJS({
        include: "node_modules/**"
      }),
      ts({
        tsconfig: `configs/tsconfig-build-${mod}.json`,
        tsconfigOverride: {
          compilerOptions: {
            target,
            module: target === "es2017" ? "es2015" : target,
            declaration: !minify
          }
        },
        cacheRoot: `.rollupcache/${mod}`
      }),
      when(
        minify,
        uglify({
          compress: {
            sequences: true,
            dead_code: true,
            conditionals: true,
            booleans: true,
            unused: true,
            if_return: true,
            join_vars: true,
            drop_console: true
          },
          output: {
            comments: false
          }
        })
      )
    ],
    external: [
      // add any peerDependencies here that you don't want included in the bundle, for example:
      //"aurelia-framework"
    ]
  };
}

let config;
switch (mod) {
  case "amd":
    config = output("es2015", "amd", { amd: { id: pkg.name } });
    break;
  case "commonjs":
    config = output("es2015", "cjs");
    break;
  case "es2015":
    config = output("es2015", "es");
    break;
  case "es2017":
    config = output("es2017", "es");
    break;
  case "esnext":
    config = output("esnext", "es");
    break;
  case "native-modules":
    config = output("es2015", "es");
    break;
  case "system":
    config = output("es2015", "system");
    break;
  case "umd":
    config = output("es2015", "umd");
    break;
}

export default config;
