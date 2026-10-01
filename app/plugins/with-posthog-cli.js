const path = require("node:path");

const { CodeGenerator, withAppBuildGradle } = require("expo/config-plugins");

/**
 * The native upload plugin only searches android/ and its parent for a local CLI.
 * Resolve npm workspace dependencies during prebuild and keep the generated path portable.
 */
module.exports = function withPostHogCli(config) {
  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== "groovy") {
      throw new Error("PostHog CLI configuration requires a Groovy app/build.gradle.");
    }

    const projectRoot = modConfig.modRequest.projectRoot;
    const cliPackagePath = require.resolve("@posthog/cli/package.json", {
      paths: [projectRoot],
    });
    const cliScriptPath = path.join(path.dirname(cliPackagePath), "run-posthog-cli.js");
    const relativeCliPath = path
      .relative(path.join(projectRoot, "android"), cliScriptPath)
      .split(path.sep)
      .join("/")
      .replace(/'/g, "\\'");

    modConfig.modResults.contents = CodeGenerator.mergeContents({
      src: modConfig.modResults.contents,
      newSrc: `tasks.withType(com.posthog.android.PostHogCliExecTask).configureEach {
    postHogExecutable.set(rootProject.file('${relativeCliPath}').absolutePath)
}`,
      tag: "posthog-workspace-cli",
      anchor: /^android\s*\{/m,
      offset: 0,
      comment: "//",
    }).contents;

    return modConfig;
  });
};
