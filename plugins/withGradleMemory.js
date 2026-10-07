// Config plugin: raise the Gradle JVM heap so the Android build doesn't get
// OOM-killed on EAS builders (the build was dying mid-Gradle with no error,
// which is the signature of the daemon running out of memory).
const { withGradleProperties } = require('@expo/config-plugins');

const PROPS = {
  'org.gradle.jvmargs': '-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8',
  'org.gradle.daemon': 'false',
  'org.gradle.parallel': 'false',
};

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(PROPS)) {
      const idx = cfg.modResults.findIndex((p) => p.type === 'property' && p.key === key);
      const entry = { type: 'property', key, value };
      if (idx >= 0) cfg.modResults[idx] = entry;
      else cfg.modResults.push(entry);
    }
    return cfg;
  });
};
