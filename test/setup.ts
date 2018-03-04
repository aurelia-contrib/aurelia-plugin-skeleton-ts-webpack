// tslint:disable
import "aurelia-loader-webpack";
import "aurelia-polyfills";
// tslint:enable

Error.stackTraceLimit = Infinity;

const testContext: any = (require as any).context("./unit", true, /\.spec/);
testContext.keys().forEach(testContext);
