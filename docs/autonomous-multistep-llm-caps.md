# Autonomous MultiStep LLM caps

> **Scope:** `MultiStepExecutor` in `packages/agents` — how many decision LLM calls a single autonomous tick can make for **user** vs **NPC** agents, and how operators tune that without code changes.

## Why this exists

Autonomous ticks (`agent-tick`, `npc-tick`) drive the **`MultiStepExecutor`** loop: each iteration the agent gathers context, asks the LLM for a JSON decision, may normalize parameters, validate, execute an action, and repeat until `FINISH` or the iteration cap.

**Why cost explodes:** worst-case decision LLM usage scales roughly as:

```text
effectiveMaxIterations × validationPassesPerIteration × llmAttemptsPerDecision
```

Previously, **iteration count and retry limits were hardcoded** in code. Operators could not lower ceilings in staging or production without a deploy. Worse, **`effectiveMaxIterations` always used the NPC budget** (`npcMaxIterations`), so **user-controlled agents also ran up to 12 iterations** even though the constructor’s first argument defaulted to **5** — that argument was never applied to the loop. That inflated user-tick LLM cost and made “NPC-only” tuning impossible without silently affecting users.

**Why env vars (not flags):** numeric caps allow gradual ops tuning (`NPC_MAX_ITERATIONS=4` in staging, defaults in prod) without boolean “off switches” that hide behavior.

**Why two different env prefixes:**

- **`NPC_MAX_ITERATIONS`** — Only applies when `isNpc === true`. NPCs need a higher ceiling than typical users to chain trade + post + engage in one tick; product can still cap cost here.
- **`MULTISTEP_MAX_*`** — Apply to **both** NPC and user paths because the inner JSON/retry loop and outer validation loop are the same machinery for all agents. The `MULTISTEP_` prefix avoids implying those knobs are NPC-only.

## What was fixed (behavior)

| Path | Before | After |
|------|--------|--------|
| **User** (`isNpc === false`) | Up to **12** iterations (bug: always `npcMaxIterations`) | Up to **5** (constructor default `DEFAULT_USER_MAX_ITERATIONS`) |
| **NPC** (`isNpc === true`) | Up to **12** (hardcoded default) | Up to **`NPC_MAX_ITERATIONS`** (default **12** when unset) |

**Why ship the user fix:** it aligns runtime with `computeAgentTickLlmBaseline` and documented intent, and reduces user autonomous LLM ceiling. **`USER_MAX_ITERATIONS`** (optional) now tunes the user ceiling without code changes when product wants it independent of the default **5**.

## Environment variables

| Variable | Default (unset) | Applies to | Purpose |
|----------|-----------------|------------|---------|
| `NPC_MAX_ITERATIONS` | `12` | NPCs only | Max outer iterations per NPC tick |
| `MULTISTEP_MAX_LLM_ATTEMPTS_PER_DECISION` | `3` | NPC + user | Inner `getDecision` attempts (parse / concrete-action retries) per validation pass |
| `MULTISTEP_MAX_DECISION_VALIDATION_PASSES` | `2` | NPC + user | Outer passes per iteration when normalized decision fails validation |
| `USER_MAX_ITERATIONS` | `5` | User agents only (`isNpc === false`) | Max outer MultiStep iterations per user tick |
| `MULTISTEP_SKIP_EMPTY_ITERATIONS` | off | NPC + user | When `true`/`1`, skip the first-iteration decision LLM if gathered context has **no** actionable hooks and the trace is still empty |

Invalid or sub-minimum values fall back to defaults (see `multistep-executor-limits.ts`).

**Why separate inner vs outer caps:** they guard different failure modes — malformed JSON vs invalid IDs after normalization. One combined “retry” knob would couple unrelated behavior and confuse operators.

## Worst-case formula (for capacity planning)

For an agent that never early-exits:

```text
decisionLLMs ≈ effectiveMaxIterations × MULTISTEP_MAX_DECISION_VALIDATION_PASSES × MULTISTEP_MAX_LLM_ATTEMPTS_PER_DECISION
```

Use **`effectiveMaxIterations`** = `NPC_MAX_ITERATIONS` for NPCs, **`USER_MAX_ITERATIONS`** (default **5**) for users. Real ticks are usually lower (`FINISH`, skipped iterations).

**Why document the formula:** SRE and finance need a deterministic upper bound for cron LLM budgeting; the same shape appears in `.env.example` comments.

## Code map

| Piece | Location |
|-------|----------|
| Env parse + defaults | `packages/agents/src/autonomous/multistep-executor-limits.ts` |
| Loop + branching | `packages/agents/src/autonomous/MultiStepExecutor.ts` (`execute`, `getDecision`) |
| NPC tick baseline (same NPC iteration parse) | `packages/agents/src/autonomous/qualia-batch/autonomous-tick-baseline.ts` → `getNpcMaxIterationsForBaseline()` |
| Public export of baseline helper | `packages/agents/src/autonomous/qualia-batch/index.ts` |

## Relationship to NPC qualia batch

The **qualia batch planner** reduces LLM calls by batching **cohort** decisions into one planner call when enabled (`docs/npc-qualia-batch-roadmap.md`).

**Why both exist:** batching changes the cost shape for *shared stimuli*; MultiStep caps bound *per-agent* cost when MultiStep still runs (fallback NPCs, user agents, or actions outside the batch vocabulary). They are complementary, not duplicates.

## Rollout (recommended)

1. **Land with defaults unset** — NPC iteration/retry behavior matches historical hardcoded values; user path drops from 12 → 5 iterations (bugfix).
2. **Staging** — Optionally set `NPC_MAX_ITERATIONS=4` (or similar); watch trace depth, `FINISH` rate, and cost.
3. **Production** — Change caps deliberately; note in release notes so support expects shallower user chains if they relied on the old bug.

## Roadmap / follow-ups

| Item | Why |
|------|-----|
| `USER_MAX_ITERATIONS` env | If product needs user ceiling **independent** of the fixed **5** default |
| Per-tick token budget across agents | Fair scheduling when many agents run the same minute |
| Markets-tick LLM cap at true generation sites | Avoid consuming a “slot” when no LLM ran (separate cron concern) |

## Verification

```bash
bunx tsc -b packages/agents
bun test packages/agents/src/autonomous/__tests__/MultiStepExecutor.test.ts
```

NPC baseline in cron logs should match `getNpcMaxIterationsForBaseline()` after changing `NPC_MAX_ITERATIONS`.
