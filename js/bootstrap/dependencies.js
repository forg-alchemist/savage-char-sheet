window.DEADLANDS_BOOT = window.DEADLANDS_BOOT || {};

window.DEADLANDS_BOOT.assertFunctions = function assertFunctions(scope, names) {
  const missing = names.filter((name) => typeof window[name] !== "function");
  if (missing.length) {
    throw new Error(`[boot] ${scope}: missing required functions: ${missing.join(", ")}`);
  }
};
