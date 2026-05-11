# NPC Qualia Batch Planner Roadmap

> Scope: cron LLM reduction for NPC ticks. This document explains the current MVP, why it is shaped this way, and what should happen before a broader rollout.

## Context

NPC cron currently selects active NPCs and runs autonomous behavior every minute. The full MultiStep path is expressive, but each selected NPC can spend multiple LLM decision calls. That is the wrong cost shape for shared stimuli like market moves, public posts, and world events: many NPCs are reacting to the same small window of facts.

The qualia batch planner changes the cost shape from "one planner loop per NPC" to "one planner call for the cohort" when the situation is simple enough to batch.

## Related: per-agent MultiStep caps (env)

**Why:** Even with qualia batching, many NPCs still run **`MultiStepExecutor`**, and **every** user autonomous tick uses it. Iteration and retry limits were hardcoded; operators could not tune cost without a deploy, and users incorrectly shared the NPC iteration ceiling (see [Autonomous MultiStep LLM caps](autonomous-multistep-llm-caps.md)).

**What:** `NPC_MAX_ITERATIONS`, `MULTISTEP_MAX_LLM_ATTEMPTS_PER_DECISION`, and `MULTISTEP_MAX_DECISION_VALIDATION_PASSES` cap worst-case decision LLM calls. **`computeNpcTickLlmBaseline()`** reads the same NPC iteration parse so logged worst-case estimates stay honest when you tune `NPC_MAX_ITERATIONS`.

**Why document separately:** Qualia batch is cohort + planner semantics; MultiStep caps are executor semantics. Mixing them in one doc confuses “batch LLM reduction” with “per-loop ceiling tuning.”

## Current MVP

Implemented pieces:

- Event ledger from recent `worldEvents`, top-level `posts`, and significant `perpMarketSnapshots`.
- Per-NPC qualia rows with perceived event IDs, personality/mood hint, perp exposure label, and recent trade/post/comment cooldown state.
- Deterministic opportunity pruning before the LLM.
- One Groq small planner call producing one plan per NPC.
- Strict validation before execution.
- Direct execution for `TRADE`, `POST`, and `COMMENT`.
- Shadow mode with no side effects.
- Execute mode with per-NPC locks, fallback semantics, action caps, and metrics.
- Market-move dedupe committed only after successful trades.

## Why These Boundaries

### Why Batch Only Some Actions

`TRADE`, `POST`, and `COMMENT` are easy to express as one-step reactions to a specific event. DMs, follows, groups, likes, reposts, and chained reasoning are more stateful and relationship-sensitive.

Keeping the MVP action set narrow lowers the chance that a single batch planner makes socially incoherent decisions.

### Why Keep MultiStep

The batch planner is a cost reducer, not a full replacement. MultiStep still handles richer agent behavior and should remain available for fallback, quiet windows, throttled windows, and non-batch action types.

### Why Shadow First

Planner failures are often operational rather than type-level: malformed JSON, too many non-SKIP actions, bad action mix, or drift toward low-value posts. Shadow mode lets us measure these without changing the simulation.

### Why Commit Dedupe After Execution

Market dedupe is a production side effect. Committing before execution, or in shadow mode, would hide future market opportunities that no NPC actually traded on.

## Release Plan

### Phase 0: Documentation and Baseline

- Keep `AUTONOMOUS_BATCH_TICK_PLANNER=false`.
- Log `computeNpcTickLlmBaseline()` for normal NPC ticks.
- Confirm dashboards or cron records expose selected NPC count and worst-case decision calls.
- When tuning autonomous cost, read **[Autonomous MultiStep LLM caps](autonomous-multistep-llm-caps.md)** — `NPC_MAX_ITERATIONS` and `MULTISTEP_*` change the MultiStep worst-case bound independent of qualia batch.

Why: we need a baseline before claiming cost reduction, and operators need one place that explains **both** cohort batching (this roadmap) and per-executor caps (linked doc).

### Phase 1: Shadow

Suggested config:

```bash
AUTONOMOUS_BATCH_TICK_PLANNER_SHADOW=true
AUTONOMOUS_BATCH_TICK_PLANNER=false
AUTONOMOUS_BATCH_TICK_MIN_INTERVAL_MS=300000
AUTONOMOUS_BATCH_TICK_PLANNER_MAX_AGENTS=25
AUTONOMOUS_BATCH_TICK_MAX_ACTIONS=8
```

Watch:

- planner parse failure rate;
- validation failure rate;
- action mix (`SKIP` vs `TRADE`/`POST`/`COMMENT`);
- prompt size estimate;
- planner latency;
- proposed text-call count.

Why: shadow proves the planner can produce sane structured output before it can mutate state.

### Phase 2: Small Execute Cohort

Suggested config:

```bash
AUTONOMOUS_BATCH_TICK_PLANNER_SHADOW=false
AUTONOMOUS_BATCH_TICK_PLANNER=true
AUTONOMOUS_BATCH_TICK_PLANNER_FALLBACK=true
AUTONOMOUS_BATCH_TICK_PLANNER_MAX_AGENTS=10
AUTONOMOUS_BATCH_TICK_MAX_ACTIONS=4
```

Watch:

- action success rate;
- row-level execution errors;
- duplicate or spammy posts/comments;
- market signature commit count;
- MultiStep fallback count;
- total actions per tick.

Why: the blast radius should be small while validating real side effects.

### Phase 3: Gradual Expansion

Increase `MAX_AGENTS` and `MAX_ACTIONS` only after stable parse, validation, and execution rates.

Why: LLM quality and prompt size do not scale linearly. A cohort that works at 10 agents can degrade at 50 or 100 agents.

### Phase 4: Broader Replacement Decisions

Decide whether more action types belong in batch planning:

- `LIKE` / `REPOST`: likely safe if validation checks target posts and cooldowns.
- `FOLLOW`: possible, but should include relationship and reputation context.
- `DM` / group actions: likely remain MultiStep unless a stronger privacy and relationship model is added.

Why: expanding the action vocabulary is a product decision, not just an engineering optimization.

## Test Roadmap

### Done (unit tests in `packages/agents/src/autonomous/qualia-batch/`)

- **Shadow**: no `executeValidatedBatchPlans`, no `commitMarketMoveSignatures` — `npc-qualia-batch-orchestrator.test.ts`.
- **Quiet / throttled**: no planner LLM call (`callGroqDirect`), no cadence mark on throttle — same file.
- **Execute dedupe**: `commitMarketMoveSignatures` only for tickers with a successful `TRADE` — same file.
- **Validation**: TRADE must target `market_move`, caps, etc. — `validate-batch-plans.test.ts`.
- **Config**: shadow wins when both shadow and execute env are true; defaults when unset — `autonomous-batch-tick-config.test.ts`.
- **MultiStep cohort**: `computeMultiStepNpcsAfterQualiaBatch` (execute vs quiet vs fallback) — `qualia-batch-multi-step.test.ts`.
- **Executor rows**: TRADE failure and thrown errors do not stop later plans — `batch-plan-executor.test.ts` (use `bun test --isolate` with other qualia tests; see package README).

Why: these are the highest-leverage invariants before Phase 2 execute rollout.

### Remaining (add when touching that code)

- **Route**: `npc-tick` still only wires config + cohort into `computeMultiStepNpcsAfterQualiaBatch` from `@babylon/agents`; optional integration test if surrounding cron logic grows.
- **Fallback**: covered by `qualia-batch-multi-step.test.ts` for validation/parse-style skip reasons; invoke failure uses the same branch in code.
- **Executor**: partial row failures — `batch-plan-executor.test.ts` (run `bun test --isolate` with other qualia tests; see qualia-batch README).
- **Qualia**: private `world_event` visibility (actor-only) — `tick-qualia-builder` test.
- **Event builder**: market signature buckets and dedupe read path — `tick-event-batch-builder` test (or integration with Redis).

Why: the riskiest remaining bugs are wiring outside the orchestrator and edge cases in perception and dedupe, not the core planner JSON schema alone.

## Observability Roadmap

Add or confirm dashboards for:

- `qualiaPlannerLlmCalls`;
- `qualiaPlannerDurationMs`;
- `qualiaExecutionDurationMs`;
- `qualiaSkippedReason`;
- `qualiaPlannerActionCounts`;
- parse and validation error samples;
- market signature commits;
- fallback-to-MultiStep count.

Why: without runtime visibility, the planner can appear cheap while silently failing open to MultiStep or failing closed to no action.

## Open Decisions

- Should `SKIP` in execute mode suppress all MultiStep behavior for that NPC, or only suppress batchable actions?
- Should large cohorts be split into multiple planner calls instead of raising token limits?
- Should cooldown summaries become hard validation rules instead of planner hints?
- Should event urgency be calibrated against actual action quality?

## Done Means

The batch planner is ready for broad execute when:

- shadow parse and validation failures are consistently low;
- execute action success rate is stable;
- no side effects occur in shadow;
- dedupe behavior matches actual successful trades;
- batch execution reduces LLM calls without visible social quality regressions;
- unit tests under **Test Roadmap → Done** stay green, and any **Remaining** items that apply to your deploy are either implemented or explicitly accepted risk.
