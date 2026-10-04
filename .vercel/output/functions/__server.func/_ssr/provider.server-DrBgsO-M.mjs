//#region node_modules/.nitro/vite/services/ssr/assets/provider.server-DrBgsO-M.js
function clean(key) {
	return process.env[key]?.trim() || void 0;
}
function getProvider() {
	const gemini = clean("GEMINI_API_KEY") ?? clean("GOOGLE_API_KEY");
	const xai = clean("XAI_API_KEY");
	const forced = clean("AI_PROVIDER")?.toLowerCase();
	if ((forced === "gemini" ? Boolean(gemini) : forced === "xai" ? false : Boolean(gemini)) && gemini) {
		const model = clean("GEMINI_MODEL") ?? "gemini-2.5-flash";
		return {
			provider: "gemini",
			apiKey: gemini,
			baseUrl: clean("AI_BASE_URL_GEMINI") ?? "https://generativelanguage.googleapis.com/v1beta",
			textModel: model,
			sttModel: model
		};
	}
	if (xai) return {
		provider: "xai",
		apiKey: xai,
		baseUrl: clean("AI_BASE_URL_XAI") ?? "https://api.x.ai/v1",
		textModel: clean("XAI_TEXT_MODEL") ?? "grok-4.5",
		sttModel: "grok-voice-transcribe-2.0"
	};
	return null;
}
var NO_KEY_MESSAGE = "No AI key found. Add GEMINI_API_KEY (or XAI_API_KEY) to the .env file and restart.";
/** Models sometimes send null for optional fields; schemas expect them absent. */
function stripNulls(value) {
	if (Array.isArray(value)) return value.map(stripNulls);
	if (value && typeof value === "object") {
		const out = {};
		for (const [k, v] of Object.entries(value)) {
			if (v === null || v === void 0) continue;
			out[k] = stripNulls(v);
		}
		return out;
	}
	return value;
}
/** Pull the first JSON object out of a model reply, tolerating ``` fences. */
function extractJson(raw) {
	return stripNulls(extractJsonRaw(raw));
}
function extractJsonRaw(raw) {
	const text = raw.trim();
	try {
		return JSON.parse(text);
	} catch {}
	const fenced = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
	try {
		return JSON.parse(fenced);
	} catch {
		const start = fenced.indexOf("{");
		const end = fenced.lastIndexOf("}");
		if (start >= 0 && end > start) return JSON.parse(fenced.slice(start, end + 1));
		throw new Error("No JSON in reply");
	}
}
function geminiText(body) {
	return (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
}
//#endregion
export { getProvider as i, extractJson as n, geminiText as r, NO_KEY_MESSAGE as t };
