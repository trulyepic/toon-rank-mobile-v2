const { withAppBuildGradle } = require("expo/config-plugins");

const DEFAULT_RULES = 'getDefaultProguardFile("proguard-android.txt")';
const OPTIMIZED_RULES = 'getDefaultProguardFile("proguard-android-optimize.txt")';

module.exports = function withAndroidR8Optimization(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== "groovy") {
      throw new Error("Android R8 optimization requires a Groovy app build.gradle file.");
    }

    const contents = gradleConfig.modResults.contents;
    if (contents.includes(OPTIMIZED_RULES)) {
      return gradleConfig;
    }
    if (!contents.includes(DEFAULT_RULES)) {
      throw new Error("Could not find the default Android ProGuard configuration.");
    }

    gradleConfig.modResults.contents = contents.replace(DEFAULT_RULES, OPTIMIZED_RULES);
    return gradleConfig;
  });
};
