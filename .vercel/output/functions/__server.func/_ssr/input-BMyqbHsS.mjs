import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { o as cn } from "./use-sessions-DQZyv5Hb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/input-BMyqbHsS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-11 w-full rounded-md border border-input bg-card px-3 text-base text-foreground shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props,
		suppressHydrationWarning: true
	});
});
Input.displayName = "Input";
//#endregion
export { Input as t };
