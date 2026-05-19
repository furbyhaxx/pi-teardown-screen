import assert from "node:assert/strict";
import { gatherStats, renderTeardown, type SessionStats } from "./index.js";
import { resolvePieEnvironmentInfo } from "./pie-env.js";

function baseStats(overrides: Record<string, unknown> = {}): SessionStats {
  return {
    cwd: "/work/example",
    sessionId: "01JTEST",
    sessionName: "auth cleanup",
    environmentName: undefined,
    launchedThroughPie: false,
    turns: 4,
    totalTokens: 12_300,
    totalCost: 0.04,
    models: [],
    toolCalls: 0,
    toolBreakdown: {},
    durationMs: 137_000,
    ...overrides,
  } as SessionStats;
}

async function main(): Promise<void> {
  const theme = {
    fg(_color: string, text: string) {
      return text;
    },
  };

  const wrapped = renderTeardown(
    theme as never,
    baseStats({ environmentName: "auto", launchedThroughPie: true }),
  );
  assert.match(wrapped, /Environment:\s+auto/);
  assert.match(wrapped, /Resume:\s+pie auto --session 01JTEST/);

  const managedOnly = renderTeardown(
    theme as never,
    baseStats({ environmentName: "auto", launchedThroughPie: false }),
  );
  assert.match(managedOnly, /Environment:\s+auto/);
  assert.match(managedOnly, /Resume:\s+pi --session 01JTEST/);

  const derived = resolvePieEnvironmentInfo({
    PI_CODING_AGENT_DIR: "/home/arnold/.pi/agent/environments/auto",
  });
  assert.equal(derived.environmentName, "auto");
  assert.equal(derived.launchedThroughPie, false);

  const previousPieEnv = process.env.PI_PIE_ENV;
  const previousPieRoot = process.env.PI_PIE_ROOT;
  try {
    process.env.PI_PIE_ENV = "auto";
    process.env.PI_PIE_ROOT = "/home/arnold/.pi/agent";

    const stats = gatherStats({
      sessionManager: {
        getBranch() {
          return [];
        },
        getCwd() {
          return "/work/example";
        },
        getSessionId() {
          return "01JTEST";
        },
        getSessionName() {
          return "auth cleanup";
        },
      },
    } as never) as SessionStats & {
      environmentName?: string;
      launchedThroughPie?: boolean;
    };

    assert.equal(stats.environmentName, "auto");
    assert.equal(stats.launchedThroughPie, true);
  } finally {
    if (previousPieEnv === undefined) delete process.env.PI_PIE_ENV;
    else process.env.PI_PIE_ENV = previousPieEnv;
    if (previousPieRoot === undefined) delete process.env.PI_PIE_ROOT;
    else process.env.PI_PIE_ROOT = previousPieRoot;
  }

  console.log("teardown screen tests passed");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
