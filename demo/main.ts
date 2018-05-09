import { Aurelia } from "aurelia-framework";
import { PLATFORM } from "aurelia-pal";

export async function configure(au: Aurelia): Promise<void> {
  au.use.standardConfiguration();

  if (PLATFORM.global.debug) {
    au.use.developmentLogging();
    au.use.plugin(PLATFORM.moduleName("aurelia-testing"));
  }

  au.use.feature(PLATFORM.moduleName("resources/index"));

  await au.start();

  const host = document.querySelector("[aurelia-app]");

  await au.setRoot(PLATFORM.moduleName("app"), host);
}
