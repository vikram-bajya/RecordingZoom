import { a as string, i as object, r as number, t as array } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/schemas-mb19utWK.js
var BriefSchema = object({
	purpose: string(),
	summary: string(),
	topics: array(object({
		title: string(),
		explanation: string()
	})).default([]),
	decisions: array(string()).default([]),
	actionItems: array(object({
		task: string(),
		owner: string().optional(),
		due: string().optional()
	})).default([]),
	links: array(object({
		url: string(),
		context: string()
	})).default([]),
	quotes: array(object({
		text: string(),
		speaker: string().optional()
	})).default([]),
	participants: array(string()).default([]),
	screenshotCaptions: array(object({
		index: number(),
		caption: string()
	})).optional()
});
var InputSchema = object({
	title: string(),
	platform: string(),
	url: string(),
	durationLabel: string(),
	transcript: string(),
	notes: string().optional(),
	screenshotCount: number().int().min(0).max(24),
	extraLinks: array(string()).optional()
});
//#endregion
export { InputSchema as n, BriefSchema as t };
