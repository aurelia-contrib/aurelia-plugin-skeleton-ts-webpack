import ts from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";
import commonJS from "rollup-plugin-commonjs";

function output(config, format, opts = {}) {
  return {
    input: "src/aurelia-plugin-skeleton-ts-webpack.ts",
    output: { ...{ file: `dist/${config}/aurelia-plugin-skeleton-ts-webpack.js`, format }, ...opts },
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
  output("amd", "amd", { amd: { id: "aurelia-plugin-skeleton-ts-webpack" } }),
  output("commonjs", "cjs"),
  output("es2017", "es"),
  output("es2015", "es"),
  output("native-modules", "es"),
  output("system", "system")
];

export default outputs;
