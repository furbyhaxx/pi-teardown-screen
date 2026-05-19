import type {
	ExtensionAPI,
	ExtensionContext,
	Theme,
	ThemeColor,
} from "@earendil-works/pi-coding-agent";
import { buildResumeCommand, resolvePieEnvironmentInfo } from "./pie-env.js";

// Sections rendered, in order. Mirrors the source extension's default
// `session.teardown.sections` configuration.
const SECTIONS = [
	"project",
	"environment",
	"session",
	"title",
	"resume",
	"stats",
] as const;

type Section = (typeof SECTIONS)[number];

// Baked-in defaults (source: shared/config DEFAULT_PI_CONFIG.session.teardown).
// `title` and `detailed` layout are intentionally omitted: the source default
// is `layout: "compact"`, which never renders the title.
const LOGO_TEXT = "Pi";

export type SessionStats = {
	cwd: string;
	sessionId: string;
	sessionName: string | undefined;
	environmentName?: string;
	launchedThroughPie: boolean;
	turns: number;
	totalTokens: number;
	totalCost: number;
	models: string[];
	toolCalls: number;
	toolBreakdown: Record<string, number>;
	durationMs: number;
};

function formatCwd(cwd: string): string {
	const home = process.env.HOME;
	if (home && cwd.startsWith(home)) return `~${cwd.slice(home.length)}`;
	return cwd;
}

function formatDuration(ms: number): string {
	if (ms < 0) return "0s";
	const totalSec = Math.floor(ms / 1000);
	const hours = Math.floor(totalSec / 3600);
	const minutes = Math.floor((totalSec % 3600) / 60);
	const seconds = totalSec % 60;
	if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
	if (minutes > 0) return `${minutes}m ${seconds}s`;
	return `${seconds}s`;
}

function formatTokens(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
	return `${value}`;
}

function formatCost(value: number): string {
	if (value === 0) return "$0.00";
	if (value < 0.01) return `$${value.toFixed(4)}`;
	return `$${value.toFixed(2)}`;
}

export function gatherStats(ctx: ExtensionContext): SessionStats {
	const sm = ctx.sessionManager;
	const entries = sm.getBranch();
	const cwd = sm.getCwd();
	const sessionId = sm.getSessionId();
	const sessionName = sm.getSessionName() ?? undefined;
	const environment = resolvePieEnvironmentInfo(process.env);

	let turns = 0;
	let totalTokens = 0;
	let totalCost = 0;
	const modelSet = new Set<string>();
	let toolCalls = 0;
	const toolBreakdown: Record<string, number> = {};
	let firstTimestamp = Date.now();
	let foundFirst = false;

	for (const entry of entries) {
		if (!foundFirst && entry.timestamp) {
			firstTimestamp = new Date(entry.timestamp).getTime();
			foundFirst = true;
		}
		if (entry.type !== "message") continue;
		const msg = entry.message;
		if (msg.role === "assistant") {
			turns++;
			if (msg.usage) {
				totalTokens += msg.usage.totalTokens ?? 0;
				totalCost += msg.usage.cost?.total ?? 0;
			}
			if (msg.model) {
				const provider =
					"provider" in msg && msg.provider ? `${msg.provider}/` : "";
				modelSet.add(`${provider}${msg.model}`);
			}
		}
		if (msg.role === "toolResult") {
			toolCalls++;
			const name = msg.toolName ?? "unknown";
			toolBreakdown[name] = (toolBreakdown[name] ?? 0) + 1;
		}
	}

	return {
		cwd,
		sessionId,
		sessionName,
		environmentName: environment.environmentName,
		launchedThroughPie: environment.launchedThroughPie,
		turns,
		totalTokens,
		totalCost,
		models: [...modelSet],
		toolCalls,
		toolBreakdown,
		durationMs: Date.now() - firstTimestamp,
	};
}

// Default-style "box" logo, mirroring the source's `logo.style: "box"`.
function logoLines(): string[] {
	const text = LOGO_TEXT.slice(0, 8);
	const innerWidth = Math.max(4, text.length + 2);
	const leftPad = Math.floor((innerWidth - text.length) / 2);
	const rightPad = innerWidth - text.length - leftPad;
	return [
		`╭${"─".repeat(innerWidth)}╮`,
		`│${" ".repeat(leftPad)}${text}${" ".repeat(rightPad)}│`,
		`╰${"─".repeat(innerWidth)}╯`,
	];
}

function visibleLen(value: string): number {
	return value.replace(/\x1b\[[0-9;]*m/g, "").length;
}

// Safe wrapper around `Theme.fg` — falls back to plain text if the token is
// somehow not present in the active theme.
function paint(theme: Theme, color: ThemeColor, text: string): string {
	if (text.length === 0) return "";
	try {
		return theme.fg(color, text);
	} catch {
		return text;
	}
}

function labelForSection(section: Section): string {
	switch (section) {
		case "project":
			return "Project:";
		case "environment":
			return "Environment:";
		case "session":
			return "Session:";
		case "title":
			return "Title:";
		case "resume":
			return "Resume:";
		case "stats":
			return "Stats:";
	}
}

function renderRows(
	stats: SessionStats,
	key: (text: string) => string,
	val: (text: string) => string,
): { infoLines: string[]; postLines: string[] } {
	const infoLines: string[] = [];
	const postLines: string[] = [];
	const keyWidth = Math.max(
		7,
		...SECTIONS.map((section) => labelForSection(section).length),
	);
	const row = (label: string, value: string) =>
		`${key(`${label}${" ".repeat(Math.max(0, keyWidth - label.length))}`)} ${val(value)}`;

	for (const section of SECTIONS) {
		switch (section) {
			case "project":
				infoLines.push(row("Project:", formatCwd(stats.cwd)));
				break;
			case "environment":
				if (stats.environmentName) {
					infoLines.push(row("Environment:", stats.environmentName));
				}
				break;
			case "session":
				infoLines.push(row("Session:", stats.sessionId));
				break;
			case "title":
				if (stats.sessionName) infoLines.push(row("Title:", stats.sessionName));
				break;
			case "resume":
				postLines.push(
					row(
						"Resume:",
						buildResumeCommand(stats.sessionId, {
							environmentName: stats.environmentName,
							launchedThroughPie: stats.launchedThroughPie,
						}),
					),
				);
				break;
			case "stats": {
				const parts: string[] = [];
				if (stats.turns > 0)
					parts.push(`${stats.turns} turn${stats.turns === 1 ? "" : "s"}`);
				if (stats.totalTokens > 0)
					parts.push(`${formatTokens(stats.totalTokens)} tokens`);
				if (stats.totalCost > 0) parts.push(formatCost(stats.totalCost));
				if (stats.durationMs > 0) parts.push(formatDuration(stats.durationMs));
				if (parts.length > 0) postLines.push(parts.map(val).join(key(" · ")));
				break;
			}
		}
	}
	return { infoLines, postLines };
}

export function renderTeardown(theme: Theme, stats: SessionStats): string {
	// Pi default theme tokens (no custom theme registration required).
	const key = (text: string) => paint(theme, "muted", text);
	const val = (text: string) => paint(theme, "text", text);
	const logoColor = (text: string) => paint(theme, "accent", text);

	const logo = logoLines().map(logoColor);
	const { infoLines, postLines } = renderRows(stats, key, val);
	const output: string[] = [""];

	// Compact layout (source default).
	const logoWidth = Math.max(0, ...logo.map(visibleLen));
	const gap = logo.length > 0 ? "  " : "";
	const rows = Math.max(logo.length, infoLines.length);
	for (let i = 0; i < rows; i++) {
		const logoPart = logo[i] ?? " ".repeat(logoWidth);
		const pad = " ".repeat(Math.max(0, logoWidth - visibleLen(logoPart)));
		output.push(`${logoPart}${pad}${gap}${infoLines[i] ?? ""}`);
	}
	if (postLines.length > 0) {
		output.push("");
		const indent = logo.length > 0 ? " ".repeat(logoWidth + gap.length) : "";
		for (const line of postLines) output.push(`${indent}${line}`);
	}
	output.push("");
	return output.join("\n");
}

export default function piTeardownExtension(pi: ExtensionAPI): void {
	pi.on("session_shutdown", async (event, ctx) => {
		if (event.reason !== "quit") return;
		if (!ctx.hasUI) return;
		const stats = gatherStats(ctx);
		process.stderr.write(renderTeardown(ctx.ui.theme, stats));
	});
}
