# NPC Qualia Batch Planner

> Status: MVP behind feature flags. Shadow-first rollout recommended.

## Why This Exists

The historical NPC cron path runs a full `MultiStepExecutor` loop per selected NPC. That gives each character rich agency, but the worst case is expensive: every NPC can spend many LLM decision iterations before taking a small number of visible actions.

The qualia batch planner reduces that cost by turning one cron window into a compact shared planning problem:

1. Build an objective event ledger for the current tick window.
2. Derive each NPC's subjective "qualia" row: what they can perceive, mood/personality hints, exposure, and recent cooldown state.
3. Deterministically prune agent-event pairs to the highest-signal opportunities.
4. Ask one small LLM planner for one plan per NPC.
5. Validate the plan strictly.
6. In execute mode, run only the validated direct actions.

The design goal is not to replace all NPC intelligence. It is to batch the common cron decisions that are naturally shared across NPCs: "Did anything happen this window, and which NPCs should trade, post, comment, or skip?"

## Related: per-agent MultiStep LLM caps (env)

**Why this is separate:** Qualia batch changes *how many planner calls* you make for a **cohort**. **`MultiStepExecutor`** still runs for fallback NPCs, user `agent-tick`, and non-batch actions — and each run can still invoke the decision LLM many times (iterations × validation passes × inner retries). **Why env vars:** hardcoded ceilings meant ops could not lower autonomous LLM spend without shipping code; **why three knobs:** NPC iteration is NPC-only (`NPC_MAX_ITERATIONS`), while inner/outer retry loops are shared with user agents (`MULTISTEP_*`), so names must not imply “NPC-only” for the latter.

Full rationale, worst-case formula, rollout, and relationship to this README: **[docs/autonomous-multistep-llm-caps.md](../../../../../docs/autonomous-multistep-llm-caps.md)** (repo root `docs/`).

## Pipeline

```text
npc-tick route
  -> select active NPC cohort
  -> optional per-NPC locks for execute mode
  -> buildTickSimulationEventBatch()
  -> buildAgentQualiaRows()
  -> pruneAgentEventOpportunities()
  -> canInvokeNpcQualiaPlanner()
  -> invokeBatchQualiaPlanner()
  -> validateAndCapBatchPlans()
  -> executeValidatedBatchPlans() when execute is enabled
  -> optional fallback to MultiStepExecutor
```

### Why the Event Ledger Is Small

The event builder only includes recent world events, top-level posts, and large perp moves in the configured time window. The planner does not need a whole-feed transcript to decide whether a cron batch should act; smaller prompts are cheaper, easier to validate, and less likely to drift into unrelated behavior.

### Why Qualia Is Separate From Events

Events are objective. Qualia is subjective. Keeping those concepts separate lets the system answer two different questions:

- What happened globally?
- Which parts of that does this NPC plausibly notice?

That split is what lets validation reject plans for events an NPC could not perceive.

### Why Validation Is Strict

Planner output is untrusted. `validateAndCapBatchPlans()` rejects:

- missing, duplicate, or unknown agents;
- non-SKIP actions without an event;
- events not perceived by the target NPC;
- trades that do not target `market_move`;
- comments that do not target `post`;
- too many total or per-action plans.

This keeps the LLM as a proposer, not an authority.

## Feature Flags

All flags are read by `getAutonomousBatchTickConfig()`.

| Env var | Default | Why |
| --- | ---: | --- |
| `AUTONOMOUS_BATCH_TICK_PLANNER_SHADOW` | `false` | Runs planner and validation without executing actions. This is the safest way to measure parse rate, validation rate, and proposed action mix. |
| `AUTONOMOUS_BATCH_TICK_PLANNER` | `false` | Enables execution of validated plans. Ignored when shadow is true, because shadow must never produce side effects. |
| `AUTONOMOUS_BATCH_TICK_PLANNER_FALLBACK` | `true` | Falls back to `MultiStepExecutor` after planner invoke/parse/validation failure. This avoids silently starving NPCs during rollout. |
| `AUTONOMOUS_BATCH_TICK_PLANNER_MAX_AGENTS` | `50` | Bounds prompt size and blast radius. |
| `AUTONOMOUS_BATCH_TICK_PLANNER_MAX_OPPORTUNITIES` | `40` | Bounds the agent-event pairs shown to the planner. |
| `AUTONOMOUS_BATCH_TICK_MIN_INTERVAL_MS` | `300000` | Prevents retry storms and limits LLM spend. |
| `AUTONOMOUS_BATCH_TICK_MAX_ACTIONS` | `12` | Caps visible actions from one batch. |
| `AUTONOMOUS_BATCH_TICK_EVENT_WINDOW_MS` | `180000` | Keeps the event ledger tied to the current cron window. |

## Rollout Semantics

### Shadow

Shadow mode runs event collection, qualia, pruning, planner invocation, and validation. It does not execute actions and does not commit market-move dedupe signatures.

Why: shadow mode should be observational. If it mutates dedupe state, it can hide production opportunities and make the rollout look safer than it is.

### Execute

Execute mode runs validated `TRADE`, `POST`, and `COMMENT` actions directly. The batch cohort is removed from `MultiStepExecutor` only when batch execution actually happened.

Why: if the batch planner is quiet or throttled, no replacement work occurred. Those NPCs should still get the normal MultiStep pass so DMs, follows, pending replies, and other non-batch actions are not delayed.

### Market Dedupe

Market move signatures are committed only after at least one successful `TRADE` for that ticker.

Why: a planner might choose to post about a market without trading it. Committing all market signatures after any success would suppress future trade opportunities for tickers that were never actually acted on.

## Failure Behavior

| Failure | Behavior | Why |
| --- | --- | --- |
| No cohort | Skip batch | Nothing to plan. |
| No events or no opportunities | Quiet window | Avoid spending an LLM call on empty context. |
| Cadence throttled | Skip planner | Keeps cost bounded and avoids retry storms. |
| Planner throws | Mark cadence and return failure | Prevents hot-looping a broken LLM provider. |
| Parse failure | No execution | Invalid JSON is not recoverable safely. |
| Validation failure | No execution | The validator is the safety boundary. |
| Row execution failure | Continue other rows | One bad action should not erase already-successful side effects or block independent actions. |

## Verification

Focused checks:

```bash
cd packages/agents
bun run typecheck
bun test --isolate src/autonomous/qualia-batch/*.test.ts
bunx biome lint \
  src/autonomous/qualia-batch/tick-opportunity-pruner.ts \
  src/autonomous/qualia-batch/batch-qualia-planner.ts \
  src/autonomous/qualia-batch/batch-plan-executor.ts \
  src/autonomous/qualia-batch/batch-plan-executor.test.ts \
  src/autonomous/qualia-batch/npc-qualia-planner-cadence.ts \
  src/autonomous/qualia-batch/npc-qualia-batch-orchestrator.ts \
  src/autonomous/qualia-batch/npc-qualia-batch-orchestrator.test.ts \
  src/autonomous/qualia-batch/qualia-batch-multi-step.ts \
  src/autonomous/qualia-batch/qualia-batch-multi-step.test.ts \
  src/autonomous/qualia-batch/autonomous-batch-tick-config.test.ts \
  src/autonomous/qualia-batch/validate-batch-plans.test.ts \
  ../../apps/web/src/app/api/cron/npc-tick/route.ts
```

**Why `--isolate`**: `npc-qualia-batch-orchestrator.test.ts` mocks `./batch-plan-executor`; without isolation that mock can leak into `batch-plan-executor.test.ts` in the same process. Isolation matches CI safety and keeps each file’s module graph clean.

**Why `*.test.ts`**: validation, config, orchestrator, MultiStep cohort helper, and executor row isolation are all covered; running one file misses regressions.

For broad release, also run the repository quality gates from `CLAUDE.md`.

## Unit tests (this package)

| File | What it guards |
| --- | --- |
| `validate-batch-plans.test.ts` | `validateAndCapBatchPlans` rules (e.g. TRADE must target `market_move`). |
| `autonomous-batch-tick-config.test.ts` | Env parsing; shadow disables execute when both flags are set; defaults. |
| `npc-qualia-batch-orchestrator.test.ts` | Shadow: no executor or `commitMarketMoveSignatures`; quiet/throttle: no LLM; execute: dedupe only after successful `TRADE` tickers. |
| `qualia-batch-multi-step.test.ts` | `computeMultiStepNpcsAfterQualiaBatch`: execute strips cohort; quiet/fallback paths. |
| `batch-plan-executor.test.ts` | Partial TRADE failure and thrown errors do not abort remaining rows. |

**Not covered here**: `apps/web/.../npc-tick/route.ts` now delegates MultiStep cohort math to `computeMultiStepNpcsAfterQualiaBatch` (same semantics as before). Add a route-level test only if the wiring around it grows beyond a single call.

## Known Limits

- The MVP action set is `TRADE`, `POST`, `COMMENT`, and `SKIP`. MultiStep remains the richer path for DMs, groups, follows, likes, reposts, and deeper sequential reasoning.
- Planner output capacity is sized for the default cohort. Very large cohorts should either raise the token cap or lower `AUTONOMOUS_BATCH_TICK_PLANNER_MAX_AGENTS`.
