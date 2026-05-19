import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

type EnvLike = Record<string, string | undefined>;

export interface PieEnvironmentInfo {
	environmentName?: string;
	launchedThroughPie: boolean;
}

function expandTilde(input: string, home = homedir()): string {
	if (input === "~") return home;
	if (input.startsWith("~/")) return join(home, input.slice(2));
	return input;
}

function normalizeDir(input: string, home = homedir()): string {
	return resolve(expandTilde(input, home));
}

function getEnvironmentNameFromAgentDir(agentDir: string | undefined): string | undefined {
	if (!agentDir) return undefined;
	const normalized = normalizeDir(agentDir);
	return basename(dirname(normalized)) === "environments"
		? basename(normalized)
		: undefined;
}

export function resolvePieEnvironmentInfo(env: EnvLike = process.env): PieEnvironmentInfo {
	const envDir = env.PI_PIE_ENV_DIR || env.PI_CODING_AGENT_DIR;
	return {
		environmentName: env.PI_PIE_ENV || getEnvironmentNameFromAgentDir(envDir),
		launchedThroughPie: Boolean(env.PI_PIE_ENV || env.PI_PIE_ROOT),
	};
}

export function buildResumeCommand(sessionId: string, environment: PieEnvironmentInfo): string {
	if (environment.launchedThroughPie && environment.environmentName) {
		return `pie ${environment.environmentName} --session ${sessionId}`;
	}
	return `pi --session ${sessionId}`;
}
