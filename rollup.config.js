import { readFileSync } from "fs";
import ts from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";
import commonJS from "rollup-plugin-commonjs";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));

function output(config, format, opts = {}) {
  return {
    input: `src/${pkg.name}.ts`,
    output: { ...{ file: `dist/${config}/${pkg.name}.js`, format }, ...opts },
    plugins: [
      resolve(),
      commonJS({
        include: "node_modules/**"
      }),
      ts({
        tsconfig: `configs/tsconfig-build-${config}.json`,
        tsconfigOverride: {
          compilerOptions: {
            module: "ES2015"
          }
        },
        cacheRoot: ".rollupcache"
      })
    ],
    external: [
      // add any peerDependencies here that you don't want included in the bundle, for example:
      //"aurelia-framework"
    ]
  };
}

const outputs = [
  output("amd", "amd", { amd: { id: pkg.name } }),
  output("commonjs", "cjs"),
  output("es2017", "es"),
  output("es2015", "es"),
  output("native-modules", "es"),
  output("system", "system")
];

export default outputs;
