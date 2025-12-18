"""
Babylon RLAIF Environment for Atropos

This environment implements Reinforcement Learning from AI Feedback (RLAIF)
for training Babylon trading agents. It uses an LLM judge to score agent
trajectories and provides the scored data to the Atropos training loop.

Key features:
- Loads trajectories from PostgreSQL database
- Uses LLM-as-judge for RLAIF scoring (relative comparison within groups)
- Supports multi-turn agent interactions
- Integrates with Atropos's async rollout system
- Optional Tinker integration for cloud-based training

Based on: https://github.com/NousResearch/atropos/blob/main/environments/rlaif_server.py
Tinker integration: https://tinker-docs.thinkingmachines.ai/
"""

import asyncpg
import copy
import json
import logging
import os
import random
from typing import Dict, List, Optional, Tuple, TYPE_CHECKING

import openai
import wandb
from dotenv import load_dotenv
from pydantic import Field

# Atropos imports
from atroposlib.envs.base import (
    APIServerConfig,
    BaseEnv,
    BaseEnvConfig,
    EvalHandlingEnum,
    ScoredDataGroup,
)

from .rewards import TrajectoryRewardInputs, composite_reward
from .quality_utils import calculate_detailed_tick_quality
from ..models import Action

# Optional Tinker support
if TYPE_CHECKING:
    from .tinker_client import BabylonTinkerClient

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


class BabylonEnvConfig(BaseEnvConfig):
    """Configuration for Babylon RLAIF environment"""

    # Database settings
    database_url: str = Field(
        default_factory=lambda: os.getenv("DATABASE_URL", ""),
        description="PostgreSQL connection URL"
    )

    # Training window settings
    lookback_hours: int = Field(
        default=72,
        description="Hours to look back for trajectories"
    )
    min_agents_per_window: int = Field(
        default=2,
        description="Minimum agents required per window"
    )
    min_actions_per_trajectory: int = Field(
        default=3,
        description="Minimum actions required in a trajectory"
    )
    max_steps_per_trajectory: int = Field(
        default=20,
        description="Maximum steps to include from each trajectory"
    )

    # RLAIF Judge settings (Legacy - kept for config compatibility)
    judge_model: str = Field(
        default="gpt-4o-mini",
        description="Model to use for LLM judge scoring (Deprecated by Deterministic Judge)"
    )
    judge_temperature: float = Field(
        default=0.3,
        description="Temperature for judge model"
    )
    judge_max_tokens: int = Field(
        default=2000,
        description="Max tokens for judge response"
    )

    # Scoring preferences
    scoring_rubric: str = Field(
        default="""You are evaluating trading agent performance in a prediction market simulation.

SCORING CRITERIA (0.0 to 1.0):
- Profitability: Higher P&L should receive higher scores
- Risk Management: Balanced positions and avoiding excessive losses
- Efficiency: Achieving goals with fewer actions is better
- Decision Quality: Good reasoning and analysis before actions

SCORING GUIDELINES:
- 0.8-1.0: Excellent performance, consistent profits, good risk management
- 0.6-0.8: Good performance, positive P&L, reasonable decisions
- 0.4-0.6: Average performance, mixed results
- 0.2-0.4: Below average, some losses, questionable decisions
- 0.0-0.2: Poor performance, significant losses, poor decision making

Compare trajectories RELATIVE to each other within this group.
If one trajectory is significantly better, reflect that in score differences.""",
        description="Rubric for LLM judge scoring"
    )


class BabylonRLAIFEnv(BaseEnv):
    """
    Babylon RLAIF Environment for Atropos

    This environment:
    1. Loads trading agent trajectories from PostgreSQL
    2. Groups them by scenario/window for relative comparison
    3. Uses 'The Judge' (Deterministic Python) to score trajectories
    4. Sends scored trajectories to Atropos API for training

    Tinker Integration:
    When use_tinker=True, uses Tinker's SamplingClient for inference
    instead of local vLLM, enabling cloud-based training.
    """

    name = "babylon-rlaif"
    env_config_cls = BabylonEnvConfig

    def __init__(
        self,
        config: BabylonEnvConfig,
        server_configs: List[APIServerConfig],
        slurm: bool = False,
        testing: bool = False,
    ):
        super().__init__(config, server_configs, slurm, testing)
        self.config: BabylonEnvConfig = config
        self.db_pool: Optional[asyncpg.Pool] = None
        self.trajectory_cache: List[Dict] = []
        self.current_window_idx: int = 0
        self.windows_processed: int = 0
        self.eval_metrics: List[Dict] = []
        self.judgement_samples: List[Tuple[str, str, str]] = []

        # Initialize OpenAI client (Legacy/Fallback)
        self.judge_client = openai.AsyncOpenAI()

        # Optional Tinker client (set externally for Tinker-based training)
        self._tinker_client: Optional["BabylonTinkerClient"] = None

    @property
    def tinker_client(self) -> Optional["BabylonTinkerClient"]:
        """Get Tinker client if available"""
        return self._tinker_client

    @tinker_client.setter
    def tinker_client(self, client: "BabylonTinkerClient") -> None:
        """Set Tinker client for cloud-based inference"""
        self._tinker_client = client
        logger.info("Tinker client attached to environment")

    @property
    def use_tinker(self) -> bool:
        """Check if using Tinker for inference"""
        return self._tinker_client is not None and self._tinker_client.is_initialized

    @classmethod
    def config_init(cls) -> Tuple[BabylonEnvConfig, List[APIServerConfig]]:
        """Initialize configuration with defaults"""
        env_config = BabylonEnvConfig(
            tokenizer_name="Qwen/Qwen2.5-3B-Instruct",
            group_size=4,  # Compare 4 trajectories at a time
            use_wandb=True,
            max_num_workers=64,
            rollout_server_url="http://localhost:8000",
            total_steps=1000,
            batch_size=16,
            steps_per_eval=100,
            max_token_length=4096,
            wandb_name="babylon-rlaif",
            eval_handling=EvalHandlingEnum.LIMIT_TRAIN,
            eval_limit_ratio=0.1,
            database_url=os.getenv("DATABASE_URL", ""),
        )

        # Server config for the training model (will be updated by vLLM)
        server_configs = [
            APIServerConfig(
                model_name="Qwen/Qwen2.5-3B-Instruct",
                base_url="http://localhost:9001/v1",
                api_key="x",
                num_requests_for_eval=64,
            ),
        ]

        return env_config, server_configs

    async def setup(self):
        """Initialize database connection and load trajectories"""
        logger.info("Setting up Babylon RLAIF Environment...")

        # Connect to database
        if not self.config.database_url:
            raise ValueError("DATABASE_URL not set in environment or config")

        self.db_pool = await asyncpg.create_pool(
            self.config.database_url,
            min_size=2,
            max_size=10,
            command_timeout=60
        )
        logger.info("Connected to PostgreSQL database")

        # Load available trajectories
        await self._load_trajectories()
        logger.info(f"Loaded {len(self.trajectory_cache)} trajectory groups")

    async def _load_trajectories(self):
        """Load trajectories from database and group by scenario/window"""
        if not self.db_pool:
            raise RuntimeError("Database not connected")

        async with self.db_pool.acquire() as conn:
            # Get trajectories with valid steps from recent windows
            rows = await conn.fetch("""
                SELECT 
                    t."trajectoryId",
                    t."agentId",
                    t."windowId",
                    t."scenarioId",
                    t."stepsJson",
                    t."finalPnL",
                    t."episodeLength",
                    t."totalReward",
                    u.username as agent_name
                FROM trajectories t
                LEFT JOIN "User" u ON t."agentId" = u.id
                WHERE 
                    t."createdAt" > NOW() - $1::interval
                    AND t."stepsJson" IS NOT NULL
                    AND t."stepsJson"::text != 'null'
                    AND t."stepsJson"::text != '[]'
                    AND t."episodeLength" >= $2
                ORDER BY t."windowId", t."scenarioId", t."createdAt"
            """, f"{self.config.lookback_hours} hours", self.config.min_actions_per_trajectory)

        # Group trajectories by window/scenario
        groups: Dict[str, List[Dict]] = {}
        for row in rows:
            # Create group key from window and scenario
            group_key = f"{row['windowId']}_{row['scenarioId'] or 'default'}"

            if group_key not in groups:
                groups[group_key] = []

            # Parse steps JSON
            steps = json.loads(row['stepsJson'] or '[]')
            if len(steps) < self.config.min_actions_per_trajectory:
                continue

            groups[group_key].append({
                'trajectory_id': row['trajectoryId'],
                'agent_id': row['agentId'],
                'agent_name': row['agent_name'] or row['agentId'][:8],
                'window_id': row['windowId'],
                'scenario_id': row['scenarioId'],
                'steps': steps,
                'final_pnl': float(row['finalPnL'] or 0),
                'episode_length': row['episodeLength'] or len(steps),
                'total_reward': float(row['totalReward'] or 0),
            })

        # Filter groups with enough trajectories
        self.trajectory_cache = [
            {'group_key': k, 'trajectories': v}
            for k, v in groups.items()
            if len(v) >= self.config.min_agents_per_window
        ]

        # Shuffle for variety
        random.shuffle(self.trajectory_cache)

    async def wandb_log(self, wandb_metrics: Optional[Dict] = None):
        """Log metrics to wandb including judgement samples"""
        if wandb_metrics is None:
            wandb_metrics = {}

        # Add judgement samples table if available (only if wandb is active)
        if len(self.judgement_samples) > 0 and self.config.use_wandb and wandb.run is not None:
            table = wandb.Table(
                columns=["trajectory_a", "trajectory_b", "judge_reasoning"])
            for item in self.judgement_samples[-10:]:  # Keep last 10
                table.add_data(item[0][:500], item[1][:500], item[2][:500])
            wandb_metrics["train/judgement_samples"] = table

        # Add eval metrics
        if len(self.eval_metrics) > 0:
            wandb_metrics["eval/windows_processed"] = self.windows_processed
            wandb_metrics["eval/avg_pnl"] = sum(
                m.get('avg_pnl', 0) for m in self.eval_metrics
            ) / len(self.eval_metrics) if self.eval_metrics else 0

        self.judgement_samples = []  # Clear after logging
        await super().wandb_log(wandb_metrics)

    async def get_next_item(self) -> Optional[Tuple]:
        """Get next trajectory group for scoring"""
        if not self.trajectory_cache:
            # Reload trajectories if cache is empty
            await self._load_trajectories()

        if not self.trajectory_cache:
            logger.warning("No trajectories available")
            return None

        # Get next group (circular)
        group = self.trajectory_cache[self.current_window_idx % len(
            self.trajectory_cache)]
        self.current_window_idx += 1

        # Sample trajectories for this batch
        trajs = group['trajectories']
        if len(trajs) > self.config.group_size:
            sampled = random.sample(trajs, self.config.group_size)
        else:
            sampled = trajs

        return (group['group_key'], sampled)

    async def collect_trajectories(self, item: Tuple) -> Tuple[Optional[ScoredDataGroup], List]:
        """
        Collect and score trajectories using RLAIF.

        1. Convert trajectories to chat format
        2. Generate model completions
        3. Score using The Judge (Deterministic Python Logic)
        """
        group_key, trajectory_group = item

        if len(trajectory_group) < 2:
            logger.warning(f"Group {group_key} has insufficient trajectories")
            return None, []

        # Collect responses from the training model for each trajectory
        rollout_data = []

        async with self.server.managed_server(tokenizer=self.tokenizer) as managed:
            for traj in trajectory_group:
                # Build chat messages from trajectory
                messages = self._trajectory_to_messages(traj)

                if len(messages) < 2:
                    continue

                # Truncate to max length
                if len(self.tokenizer.apply_chat_template(messages)) > self.config.max_token_length - 512:
                    # Keep system + last N messages
                    messages = [messages[0]] + \
                        messages[-(self.config.max_steps_per_trajectory * 2):]

                # Generate completion from training model
                completion = await managed.chat_completion(
                    messages=messages,
                    n=1,
                    max_tokens=self.config.max_token_length // 3,
                )

                state = managed.get_state()
                nodes = state["nodes"]

                if not nodes:
                    continue

                node = nodes[0]
                response_content = completion.choices[0].message.content if completion.choices else ""

                # Build full conversation with response
                full_messages = copy.deepcopy(messages)
                full_messages.append({
                    "role": "assistant",
                    "content": response_content
                })

                rollout_data.append({
                    "trajectory": traj,
                    "generated_response": response_content,  # NEW: Store explicitly for Judge
                    "messages": full_messages,
                    "tokens": node.tokens,
                    "masks": node.masked_tokens,
                    "logprobs": node.logprobs,
                    "finish_reason": completion.choices[0].finish_reason if completion.choices else "stop",
                })

        if len(rollout_data) < 2:
            logger.warning(f"Insufficient rollouts for group {group_key}")
            return None, []

        # Score using The Judge (Deterministic)
        scored_data = await self._score_with_judge(rollout_data)

        self.windows_processed += 1
        return scored_data, []

    def _trajectory_to_messages(self, traj: Dict) -> List[Dict[str, str]]:
        """
        Convert a Babylon trajectory to chat messages.

        IMPORTANT: This captures the FULL agent tick including:
        - All LLM calls (reasoning, planning, action)
        - Complete reasoning chains (not truncated)
        - Environment context

        For training, we want to capture exactly what the agent saw and thought.
        """
        messages = []

        # System message with full context
        system_content = f"""You are a trading agent in Babylon prediction markets.

Agent: {traj.get('agent_name', 'Agent')}
Window: {traj.get('window_id', 'Unknown')}
Scenario: {traj.get('scenario_id', 'General Trading')}
Final P&L: ${traj.get('final_pnl', 0):.2f}
Episode Length: {traj.get('episode_length', 0)} steps

Your goal is to make profitable trading decisions based on market analysis.
You receive market updates and must analyze, reason, and then act."""

        messages.append({
            "role": "system",
            "content": system_content
        })

        # Convert steps to user/assistant exchanges
        steps = traj.get('steps', [])
        max_steps = self.config.max_steps_per_trajectory

        # Take most recent steps if too many
        if len(steps) > max_steps:
            steps = steps[-max_steps:]

        for step_idx, step in enumerate(steps):
            if not isinstance(step, dict):
                continue

            # PRIORITY 1: Use actual LLM calls if available
            # This captures the REAL prompts and responses the agent used
            llm_calls = step.get('llmCalls', step.get('llm_calls', []))

            if llm_calls:
                # Include ALL LLM calls from this step
                for call_idx, llm_call in enumerate(llm_calls):
                    purpose = llm_call.get('purpose', 'action')

                    # Build rich user content from the actual prompt
                    user_prompt = llm_call.get(
                        'userPrompt', llm_call.get('user_prompt', ''))

                    # Combine system context with user prompt for training
                    user_content = f"[Step {step_idx + 1}, {purpose.upper()}]\n"

                    # Add environment state context
                    env_state = step.get(
                        'environmentState', step.get('environment_state', {}))
                    if env_state:
                        balance = env_state.get(
                            'agentBalance', env_state.get('agent_balance', 0))
                        pnl = env_state.get(
                            'agentPnL', env_state.get('agent_pnl', 0))
                        positions = env_state.get(
                            'openPositions', env_state.get('open_positions', 0))
                        user_content += f"State: Balance=${balance:.2f}, P&L=${pnl:.2f}, Positions={positions}\n\n"

                    # Add the actual user prompt
                    if user_prompt:
                        user_content += user_prompt

                    messages.append({
                        "role": "user",
                        "content": user_content
                    })

                    # Assistant response - use FULL response, not truncated
                    response = llm_call.get('response', '')
                    reasoning = llm_call.get('reasoning', '')

                    # Build comprehensive assistant response
                    assistant_content = ""

                    # Include reasoning if available
                    if reasoning:
                        assistant_content += f"<thinking>\n{reasoning}\n</thinking>\n\n"

                    # Include the actual response
                    if response:
                        assistant_content += response

                    if assistant_content.strip():
                        messages.append({
                            "role": "assistant",
                            "content": assistant_content
                        })
            else:
                # FALLBACK: Build messages from environment state and action
                env_state = step.get('environmentState',
                                     step.get('environment_state', {}))
                balance = env_state.get(
                    'agentBalance', env_state.get('agent_balance', 0))
                pnl = env_state.get('agentPnL', env_state.get('agent_pnl', 0))
                positions = env_state.get(
                    'openPositions', env_state.get('open_positions', 0))

                user_content = f"[Step {step_idx + 1}]\nMarket Update:\n- Balance: ${balance:.2f}\n- P&L: ${pnl:.2f}\n- Open Positions: {positions}"

                # Add any observations
                if 'observation' in step:
                    obs = step['observation']
                    if isinstance(obs, dict):
                        user_content += f"\n- Markets: {len(obs.get('markets', []))}"
                        user_content += f"\n- News: {len(obs.get('news', []))}"

                messages.append({
                    "role": "user",
                    "content": user_content
                })

                # Agent action as assistant message
                action = step.get('action', {})
                action_type = action.get(
                    'actionType', action.get('action_type', 'wait'))
                params = action.get('parameters', {})
                reasoning = action.get('reasoning', '')

                # Build comprehensive assistant response
                assistant_content = ""

                # Include FULL reasoning (not truncated!)
                if reasoning:
                    assistant_content += f"<thinking>\n{reasoning}\n</thinking>\n\n"

                assistant_content += f"Action: {action_type}"
                if params:
                    assistant_content += f"\nParameters: {json.dumps(params, indent=2)}"

                messages.append({
                    "role": "assistant",
                    "content": assistant_content
                })

        return messages

    async def _score_with_judge(self, rollout_data: List[Dict]) -> Optional[ScoredDataGroup]:
        """
        Score rollouts using Deterministic Judge logic (rewards.py).
        Replaces OpenAI calls with robust Python logic for PnL, Format, and Reasoning verification.
        """
        scores = []

        for item in rollout_data:
            traj = item["trajectory"]
            generated_response = item["generated_response"]

            # 1. Quality Scores (Format & Reasoning)
            # We treat the generated response as a single 'tick' of output to be judged.
            # Create a mock structure for the detailed quality calculation.
            mock_calls = [{"response": generated_response,
                           "reasoning": generated_response}]
            mock_action = Action(action_type="unknown", parameters={
            }, success=True)  # Fallback action

            # Calculate granular scores
            fmt_score, rsn_score = calculate_detailed_tick_quality(
                llm_calls=mock_calls,
                action=mock_action,
                feedback=None,
                archetype="default"  # Could pull from traj if available
            )

            # 2. Financial Context (from trajectory history)
            # In RLAIF, we attribute the Trajectory's final PnL to this generation step as a proxy.
            final_pnl = traj.get("final_pnl", 0.0)

            reward_inputs = TrajectoryRewardInputs(
                final_pnl=final_pnl,
                starting_balance=10000.0,  # Baseline Assumption
                format_score=fmt_score,
                reasoning_score=rsn_score,
                # Cannot determine instantaneous risk from text alone without sim state, so 0
                risky_actions_count=0
            )

            # 3. Compute Composite Score
            final_score = composite_reward(reward_inputs)
            scores.append(final_score)

            # Logging sample for WandB
            if len(self.judgement_samples) < 10:
                self.judgement_samples.append((
                    str(final_pnl),
                    generated_response[:100],
                    f"Score: {final_score:.2f} (Fmt: {fmt_score}, Rsn: {rsn_score})"
                ))

        # Normalize scores to mean 0 for GRPO stability
        mean_score = sum(scores) / len(scores) if scores else 0
        centered_scores = [s - mean_score for s in scores]

        # Build ScoredDataGroup
        scored_group = ScoredDataGroup()
        scored_group["tokens"] = []
        scored_group["masks"] = []
        scored_group["scores"] = []
        scored_group["inference_logprobs"] = []

        for i, rollout in enumerate(rollout_data):
            scored_group["tokens"].append(rollout["tokens"])
            scored_group["masks"].append(rollout["masks"])
            scored_group["scores"].append(centered_scores[i])
            scored_group["inference_logprobs"].append(rollout["logprobs"])

        return scored_group

    async def evaluate(self, *args, **kwargs):
        """Evaluate current model performance"""
        logger.info("Running evaluation...")

        # Sample some trajectories for evaluation
        eval_results = []

        for _ in range(min(10, len(self.trajectory_cache))):
            if not self.trajectory_cache:
                break

            group = random.choice(self.trajectory_cache)
            trajs = group["trajectories"]

            avg_pnl = sum(t.get("final_pnl", 0) for t in trajs) / len(trajs)
            avg_length = sum(t.get("episode_length", 0)
                             for t in trajs) / len(trajs)

            eval_results.append({
                "group_key": group["group_key"],
                "trajectory_count": len(trajs),
                "avg_pnl": avg_pnl,
                "avg_length": avg_length,
            })

        self.eval_metrics = eval_results

        if eval_results:
            overall_pnl = sum(r["avg_pnl"]
                              for r in eval_results) / len(eval_results)
            logger.info(
                f"Evaluation complete: {len(eval_results)} groups, avg P&L: ${overall_pnl:.2f}")

    def save_checkpoint(self, step, data=None):
        """Save environment checkpoint"""
        if data is None:
            data = {}
        data["current_window_idx"] = self.current_window_idx
        data["windows_processed"] = self.windows_processed
        super().save_checkpoint(step, data)

    async def cleanup(self):
        """Clean up resources"""
        if self.db_pool:
            logger.info("Closing database connection pool...")
            await self.db_pool.close()
            self.db_pool = None
        await super().cleanup() if hasattr(super(), 'cleanup') else None


# CLI entry point
if __name__ == "__main__":
    BabylonRLAIFEnv.cli()
