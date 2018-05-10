const { concurrent, copy, crossEnv, rimraf, series } = require("nps-utils");

function config(name) {
  return `configs/tsconfig-${name}.json`;
}

function rollup(mod, minify) {
  return package(`rollup --c --environment mod:${mod},${minify ? "minify" : ""}`);
}

function tsc(tsconfig) {
  return package(`tsc --project ${config(tsconfig)}`);
}

function setTsNodeProject() {
  return `TS_NODE_PROJECT=\"${config("tsnode")}\"`;
}

function webpack(tool, arg) {
  return crossEnv(`${setTsNodeProject()} ${package(tool)} --config webpack.config.ts ${arg}`);
}

function package(script) {
  return crossEnv(`./node_modules/.bin/${script}`);
}

function karma(single, watch, browsers, transpileOnly, noInfo, coverage, tsconfig, logLevel, devtool) {
  return package(
    `${setTsNodeProject()} ${package("karma")} start`
      .concat(single !== null ? ` --single-run=${single}` : "")
      .concat(watch !== null ? ` --auto-watch=${watch}` : "")
      .concat(browsers !== null ? ` --browsers=${browsers}` : "")
      .concat(transpileOnly !== null ? ` --transpile-only=${transpileOnly}` : "")
      .concat(noInfo !== null ? ` --no-info=${noInfo}` : "")
      .concat(coverage !== null ? ` --coverage=${coverage}` : "")
      .concat(tsconfig !== null ? ` --tsconfig=${tsconfig}` : "")
      .concat(logLevel !== null ? ` --log-level=${logLevel}` : "")
      .concat(devtool !== null ? ` --devtool=${devtool}` : "")
  );
}

function release(version, dry) {
  /**
   * Dry prevents anything irreversible from happening.
   * It will do pretty much do the same thing except it won't push to git or publish to npm.
   * Just remember to "unbump" the version in package.json after a dry run (see explanation below)
   */
  const variant = dry ? "dry" : "default";
  return {
    default: series.nps(
      `release.${version}.${variant}.before`,
      `release.${version}.${variant}.version`,
      `release.${version}.${variant}.after`
    ),
    before: series.nps(
      `release.${version}.${variant}.build`,
      `release.${version}.${variant}.bump`,
      `release.${version}.${variant}.git.stage`
    ),
    after: series.nps(`release.${version}.${variant}.git.push`, `release.${version}.${variant}.npm.publish`),
    bump: crossEnv(`npm --no-git-tag-version version ${version}`),
    /**
     * Normally, standard-version looks for certain keywords in the commit log and automatically assigns
     * major/minor/patch based on the contents of those logs.
     *
     * --first-release disables that behavior and does not change the version, which allows us to manually
     * decide the version and bump it with npm version (see right above) instead.
     *
     * The downside is that we have to bump the version in package.json even in a dry run, because
     * standard-version wouldn't report what it would do otherwise.
     *
     * Therefore, always remember to manually "unbump" the version number in package.json after doing a dry run!
     * If you forget this, you'll end up bumping the version twice which gives you one release without changes.
     */
    version: `${package("standard-version")} --first-release --commit-all${dry ? " --dry-run" : ""}`,
    build: series.nps("test", "build.dist"),
    git: {
      stage: "git add package.json dist",
      push: `git push --follow-tags origin master${dry ? " -n" : ""}`
    },
    npm: {
      publish: `npm ${dry ? "pack" : "publish"}`
    }
  };
}

module.exports = {
  scripts: {
    lint: package(`tslint --project ${config("build")}`),
    test: {
      default: package("nps test.single"),
      single: karma(true, false, "ChromeHeadless", true, true, true, config("test"), null, null),
      watch: {
        default: package("nps test.watch.dev"),
        dev: karma(false, true, "ChromeHeadless", true, true, true, config("test"), null, null),
        debug: karma(false, true, "ChromeDebugging", true, false, null, config("test"), "debug", null)
      }
    },
    build: {
      demo: {
        default: "nps build.demo.development",
        development: {
          default: webpack("webpack-dev-server", "--hot --env.server")
        },
        production: {
          default: webpack("webpack", "--env.production")
        }
      },
      dist: {
        default: "nps build.dist.rollup",
        before: series.nps("lint", "build.dist.clean"),
        clean: rimraf("dist"),
        rollup: {
          default: series.nps("build.dist.before", "build.dist.rollup.all.default"),
          minify: series.nps("build.dist.rollup.all.minify"),
          all: {
            default: concurrent.nps(
              "build.dist.rollup.amd.default",
              "build.dist.rollup.commonjs.default",
              "build.dist.rollup.es2015.default",
              "build.dist.rollup.es2017.default",
              "build.dist.rollup.esnext.default",
              "build.dist.rollup.nativeModules.default",
              "build.dist.rollup.system.default",
              "build.dist.rollup.umd.default"
            ),
            minify: concurrent.nps(
              "build.dist.rollup.amd.minify",
              "build.dist.rollup.commonjs.minify",
              "build.dist.rollup.es2015.minify",
              "build.dist.rollup.es2017.minify",
              "build.dist.rollup.esnext.default",
              "build.dist.rollup.nativeModules.minify",
              "build.dist.rollup.system.minify",
              "build.dist.rollup.umd.minify"
            )
          },
          amd: {
            default: rollup("amd"),
            minify: rollup("amd", true)
          },
          commonjs: {
            default: rollup("commonjs"),
            minify: rollup("commonjs", true)
          },
          es2015: {
            default: rollup("es2015"),
            minify: rollup("es2015", true)
          },
          es2017: {
            default: rollup("es2017"),
            minify: rollup("es2017", true)
          },
          esnext: {
            default: rollup("esnext"),
            minify: rollup("esnext", true)
          },
          nativeModules: {
            default: rollup("native-modules"),
            minify: rollup("native-modules", true)
          },
          system: {
            default: rollup("system"),
            minify: rollup("system", true)
          },
          umd: {
            default: rollup("umd"),
            minify: rollup("umd", true)
          }
        },
        tsc: {
          default: series.nps("build.dist.before", "build.dist.tsc.all"),
          all: concurrent.nps(
            "build.dist.tsc.amd",
            "build.dist.tsc.commonjs",
            "build.dist.tsc.es2015",
            "build.dist.tsc.es2017",
            "build.dist.tsc.esnext",
            "build.dist.tsc.nativeModules",
            "build.dist.tsc.system",
            "build.dist.tsc.umd"
          ),
          amd: tsc("build-amd"),
          commonjs: tsc("build-commonjs"),
          es2015: tsc("build-es2015"),
          es2017: tsc("build-es2017"),
          esnext: tsc("build-esnext"),
          nativeModules: tsc("build-native-modules"),
          system: tsc("build-system"),
          umd: tsc("build-umd")
        }
      }
    },
    release: {
      patch: {
        default: release("patch"),
        dry: release("patch", true)
      },
      minor: {
        default: release("minor"),
        dry: release("minor", true)
      },
      major: {
        default: release("major"),
        dry: release("major", true)
      }
    },
    /**
     * Make sure to run "npm run ghpages-setup" before "npm run ghpages" the very first time,
     * or manually create the gh-pages branch and set the remote.
     *
     * There is no dry run variant for this because it's not really that harmful if the demo page goes bad
     * and it doesn't affect the master branch.
     */
    ghpages: {
      default: series(
        "git checkout gh-pages",
        "git merge master --no-edit",
        rimraf("*.bundle.js"),
        rimraf("*.bundle.map"),
        package("nps build.demo.production"),
        "git add index.html *.bundle.js *.bundle.map",
        'git commit -m "doc(demo): build demo"',
        "git push",
        "git checkout master"
      ),
      setup: series("git checkout -b gh-pages", "git push -u origin gh-pages", "git checkout master")
    }
  }
};
