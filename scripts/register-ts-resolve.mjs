import { register } from "node:module";

// Separate from ts-resolve-hook.mjs because Node runs a resolver hook on its
// own thread; this file is the main-thread registration shim.
register("./ts-resolve-hook.mjs", import.meta.url);
