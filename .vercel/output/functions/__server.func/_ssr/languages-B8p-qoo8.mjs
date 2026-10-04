import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as Root } from "../_libs/@radix-ui/react-label+[...].mjs";
import { o as cn } from "./use-sessions-DQZyv5Hb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/languages-B8p-qoo8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FileDrop({ accept, label, hint, onFile, disabled, className }) {
	const [over, setOver] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: cn("flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm transition-colors duration-150", over ? "border-brand bg-muted text-foreground" : "border-input bg-muted/50 text-muted-foreground hover:bg-muted", disabled && "pointer-events-none opacity-50", className),
		onDragEnter: (e) => {
			e.preventDefault();
			setOver(true);
		},
		onDragOver: (e) => {
			e.preventDefault();
			setOver(true);
		},
		onDragLeave: () => setOver(false),
		onDrop: (e) => {
			e.preventDefault();
			setOver(false);
			const file = e.dataTransfer.files?.[0];
			if (file) onFile(file);
		},
		children: [
			label,
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 text-xs text-muted-foreground",
				children: hint
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "file",
				accept,
				className: "sr-only",
				disabled,
				onChange: (e) => {
					const file = e.target.files?.[0];
					if (file) onFile(file);
					e.target.value = "";
				}
			})
		]
	});
}
var Card = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("rounded-xl bg-card text-card-foreground shadow-[var(--shadow-border)]", className),
	...props
}));
Card.displayName = "Card";
var CardHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex flex-col gap-1.5 p-6", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("font-serif text-xl leading-tight text-foreground", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("p-6 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center p-6 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
var Label = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn("text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className),
	...props
}));
Label.displayName = Root.displayName;
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-36 w-full rounded-lg border border-input bg-card px-3 py-3 text-base text-foreground shadow-[var(--shadow-border)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
var fileHandoff = /* @__PURE__ */ new Map();
var SESSION_LANGUAGES = [
	{
		id: "en",
		speech: "en-US",
		label: "English"
	},
	{
		id: "es",
		speech: "es-ES",
		label: "Spanish"
	},
	{
		id: "hi",
		speech: "hi-IN",
		label: "Hindi"
	},
	{
		id: "fr",
		speech: "fr-FR",
		label: "French"
	},
	{
		id: "de",
		speech: "de-DE",
		label: "German"
	},
	{
		id: "pt",
		speech: "pt-BR",
		label: "Portuguese"
	},
	{
		id: "ja",
		speech: "ja-JP",
		label: "Japanese"
	},
	{
		id: "ko",
		speech: "ko-KR",
		label: "Korean"
	},
	{
		id: "ar",
		speech: "ar-SA",
		label: "Arabic"
	},
	{
		id: "it",
		speech: "it-IT",
		label: "Italian"
	},
	{
		id: "nl",
		speech: "nl-NL",
		label: "Dutch"
	},
	{
		id: "tr",
		speech: "tr-TR",
		label: "Turkish"
	},
	{
		id: "zh",
		speech: "zh-CN",
		label: "Chinese"
	}
];
function speechLang(id) {
	return SESSION_LANGUAGES.find((l) => l.id === id)?.speech ?? "en-US";
}
//#endregion
export { Textarea as a, SESSION_LANGUAGES as i, FileDrop as n, fileHandoff as o, Label as r, speechLang as s, Card as t };
