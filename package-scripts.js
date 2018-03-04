const { concurrent, copy, crossEnv, nps, rimraf, series } = require("nps-utils");

function config(name) {
  return `configs/tsconfig-${name}.json`;
}

function tslint(tsconfig) {
  return package(`tslint --project ${config(tsconfig)}`);
}

function tsc(tsconfig) {
  return package(`tsc --project ${config(tsconfig)}`);
}

function bumpVersion(version) {
  return crossEnv(`npm --no-git-tag-version version ${version}`);
}

function webpack(tool, arg) {
  return crossEnv(`TS_NODE_ENV=\"${config("webpack")}\" ${tool} --config webpack.config.ts ${arg}`);
}

function package(script) {
  return crossEnv(`./node_modules/.bin/${script}`);
}

function karma(single, watch, browsers, transpileOnly, noInfo, coverage, tsconfig, logLevel, devtool) {
  return package(
    "karma start"
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

function release(version) {
  return {
    default: series.nps(`release.${version}.before`, `release.version`, `release.${version}.after`),
    before: series.nps(`release.build`, `release.${version}.bump`, `release.git.stage`),
    after: series.nps(`release.git.push`, `release.npm.publish`),
    bump: bumpVersion(version)
  };
}

module.exports = {
  scripts: {
    lint: tslint("build"),
    test: {
      default: "nps test.single",
      single: karma(true, false, "ChromeHeadless", true, true, true, config("test"), null, null),
      watch: {
        default: "nps test.watch.dev",
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
        default: series.nps("build.dist.before", "build.dist.all"),
        before: series.nps("lint", "build.dist.clean"),
        all: concurrent.nps(
          "build.dist.amd",
          "build.dist.commonjs",
          "build.dist.es2017",
          "build.dist.es2015",
          "build.dist.nativeModules",
          "build.dist.system"
        ),
        clean: rimraf("dist"),
        amd: tsc("build-amd"),
        commonjs: tsc("build-commonjs"),
        es2017: tsc("build-es2017"),
        es2015: tsc("build-es2015"),
        nativeModules: tsc("build-native-modules"),
        system: tsc("build-system")
      }
    },
    release: {
      patch: release("patch"),
      minor: release("minor"),
      major: release("major"),
      version: "standard-version --first-release --commit-all",
      build: series.nps("test", "build.dist"),
      git: {
        stage: "git add package.json dist",
        push: "git push --follow-tags origin master"
      },
      npm: {
        publish: "npm publish"
      }
    },
    ghpages: series(
      "git checkout gh-pages",
      "git merge master --no-edit",
      rimraf("*.bundle.js"),
      "nps build.demo.production",
      "git add index.html *.bundle.js",
      'git commit -m "doc(demo): build demo"',
      "git push",
      "git checkout master"
    )
  }
};
