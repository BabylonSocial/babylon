"""
Reward Functions for Training

Computes various reward signals for RL training:
- PnL-based: Raw profit/loss performance
- Risk-adjusted: Sharpe-like reward accounting for variance
- Efficiency: Reward per action taken
- Action quality: Based on success rate and correctness
- Composite: Weighted combination of multiple signals

Also provides utilities for normalizing and comparing rewards.
"""

from dataclasses import dataclass
from typing import Optional
import math


@dataclass
class TrajectoryRewardInputs:
    """Inputs for computing rewards."""

    # Financial Metrics
    final_pnl: float = 0.0
    starting_balance: float = 10000.0
    end_balance: float = 10000.0
    pnl_variance: float = 0.0
    max_drawdown: float = 0.0

    # Risk Metrics
    max_exposure: float = 0.0
    risky_actions_count: int = 0

    # Quality Scores (from quality_utils)
    format_score: float = 0.0
    reasoning_score: float = 0.0

    # Operational Metrics
    num_steps: int = 0
    trades_executed: int = 0
    successful_trades: int = 0
    total_actions: int = 0
    successful_actions: int = 0


def calculate_pnl_reward(start_balance: float, end_balance: float) -> float:
    """
    Calculate PnL Reward.

    Logic:
    - Bankruptcy (<= 0): -10.0 Hard Penalty
    - Positive PnL: +1.0 (Scaled by % return, capped)
    - Negative PnL: -1.0 (Scaled by % loss, capped)
    """
    if end_balance <= 0:
        return -10.0

    if start_balance <= 0:
        return 0.0

    pnl = end_balance - start_balance
    return_pct = pnl / start_balance

    # Scale: 10% return = 1.0 reward
    scaled_reward = return_pct * 10.0

    return max(-1.0, min(1.0, scaled_reward))


def calculate_risk_reward(exposure: float, action_type: str) -> float:
    """
    Calculate Risk Management Reward.

    Returns:
        Penalty (-0.5) if buying when exposure > 80%, else 0.0
    """
    if not action_type:
        return 0.0

    act = action_type.lower()
    is_buying = any(x in act for x in ['buy', 'long', 'open'])

    if exposure > 0.80 and is_buying:
        return -0.5

    return 0.0


def pnl_reward(inputs: TrajectoryRewardInputs) -> float:
    """
    Compute PnL-based reward (Legacy wrapper).
    """
    if inputs.starting_balance <= 0:
        return 0.0

    return_pct = inputs.final_pnl / inputs.starting_balance
    return max(-1.0, min(1.0, return_pct))


def risk_adjusted_reward(inputs: TrajectoryRewardInputs) -> float:
    """
    Compute risk-adjusted reward (Sharpe-like).
    """
    base = pnl_reward(inputs)

    if inputs.pnl_variance > 0:
        sharpe = base / math.sqrt(inputs.pnl_variance)
        base = max(-1.0, min(1.0, sharpe))

    if inputs.max_drawdown > 0 and inputs.starting_balance > 0:
        drawdown_penalty = inputs.max_drawdown / inputs.starting_balance
        base -= drawdown_penalty * 0.5

    return max(-1.0, min(1.0, base))


def efficiency_reward(inputs: TrajectoryRewardInputs) -> float:
    """
    Compute efficiency reward (reward per action).
    """
    base = pnl_reward(inputs)

    if inputs.total_actions > 0:
        efficiency = base / math.log1p(inputs.total_actions)
        return max(-1.0, min(1.0, efficiency))

    return base


def action_quality_reward(inputs: TrajectoryRewardInputs) -> float:
    """
    Compute action quality reward based on success rate.
    """
    if inputs.total_actions == 0:
        return 0.5

    success_rate = inputs.successful_actions / inputs.total_actions
    return success_rate


def composite_reward(
    inputs: TrajectoryRewardInputs,
    pnl_weight: float = 0.5,
    format_weight: float = 0.3,
    reasoning_weight: float = 0.2,
    # Legacy weights
    risk_weight: float = 0.0,
    efficiency_weight: float = 0.0,
    quality_weight: float = 0.0,
) -> float:
    """
    Compute weighted composite reward.

    If 'format_score' or 'reasoning_score' are present, uses the new weighting:
    - PnL: 50%
    - Format: 30%
    - Reasoning: 20%

    Otherwise falls back to legacy weighting.
    """

    # 1. Calculate PnL Score
    if inputs.end_balance != inputs.starting_balance:
        pnl_score = calculate_pnl_reward(
            inputs.starting_balance, inputs.end_balance)
    else:
        # Fallback if specific balances aren't tracked separately
        end_bal = inputs.starting_balance + inputs.final_pnl
        pnl_score = calculate_pnl_reward(inputs.starting_balance, end_bal)

    # Bankruptcy override
    if pnl_score <= -5.0:
        return pnl_score

    # 2. Risk Penalty
    if inputs.risky_actions_count > 0:
        pnl_score -= (inputs.risky_actions_count * 0.5)

    # 3. Scoring System
    if inputs.format_score != 0 or inputs.reasoning_score != 0:
        total_weight = pnl_weight + format_weight + reasoning_weight
        if total_weight == 0:
            return 0.0

        composite = (
            (pnl_score * pnl_weight) +
            (inputs.format_score * format_weight) +
            (inputs.reasoning_score * reasoning_weight)
        ) / total_weight

        return max(-1.0, min(1.0, composite))

    # 4. Legacy Scoring System (Fallback)
    # If using legacy, we need non-zero weights
    if risk_weight == 0 and efficiency_weight == 0 and quality_weight == 0:
        # Defaults for legacy system
        l_pnl = 0.4
        l_risk = 0.3
        l_eff = 0.15
        l_qual = 0.15
    else:
        l_pnl = pnl_weight
        l_risk = risk_weight
        l_eff = efficiency_weight
        l_qual = quality_weight

    total_weight = l_pnl + l_risk + l_eff + l_qual
    if total_weight == 0:
        return 0.0

    composite = (
        l_pnl * pnl_reward(inputs)
        + l_risk * risk_adjusted_reward(inputs)
        + l_eff * efficiency_reward(inputs)
        + l_qual * action_quality_reward(inputs)
    ) / total_weight

    return max(-1.0, min(1.0, composite))


def relative_scores(rewards: list[float]) -> list[float]:
    """
    Convert absolute rewards to relative scores.

    Maps rewards to [0, 1] based on their rank within the group.

    Args:
        rewards: List of reward values

    Returns:
        List of relative scores in [0, 1]
    """
    if len(rewards) < 2:
        return [0.5] * len(rewards)

    sorted_indices = sorted(range(len(rewards)), key=lambda i: rewards[i])
    n = len(rewards)

    scores = [0.0] * n
    for rank, idx in enumerate(sorted_indices):
        scores[idx] = rank / (n - 1)

    return scores


def ranking_to_scores(rankings: list[int]) -> list[float]:
    """
    Convert rankings to normalized scores.

    Args:
        rankings: List of rankings (1 = best)

    Returns:
        List of scores in [0, 1] where higher = better
    """
    if len(rankings) < 2:
        return [0.5] * len(rankings)

    n = len(rankings)
    return [(n - r) / (n - 1) for r in rankings]


def pairwise_preferences_to_scores(
    n_items: int, preferences: list[tuple[int, int]]
) -> list[float]:
    """
    Convert pairwise preferences to scores via Bradley-Terry model.

    Args:
        n_items: Number of items being compared
        preferences: List of (winner, loser) pairs

    Returns:
        List of scores in [0, 1]
    """
    if n_items < 2 or not preferences:
        return [0.5] * n_items

    wins = [0] * n_items
    comparisons = [0] * n_items

    for winner, loser in preferences:
        if 0 <= winner < n_items:
            wins[winner] += 1
            comparisons[winner] += 1
        if 0 <= loser < n_items:
            comparisons[loser] += 1

    scores = []
    for i in range(n_items):
        if comparisons[i] > 0:
            scores.append(wins[i] / comparisons[i])
        else:
            scores.append(0.5)

    return scores


class RewardNormalizer:
    """
    Online reward normalizer using running statistics.

    Maintains mean and variance for reward normalization.
    """

    def __init__(self, epsilon: float = 1e-8):
        """
        Initialize normalizer.

        Args:
            epsilon: Small value to prevent division by zero
        """
        self.mean = 0.0
        self.var = 1.0
        self.count = 0
        self.epsilon = epsilon

    def update(self, reward: float) -> None:
        """
        Update statistics with new reward.

        Uses Welford's online algorithm for numerical stability.

        Args:
            reward: New reward value
        """
        self.count += 1
        delta = reward - self.mean
        self.mean += delta / self.count
        delta2 = reward - self.mean
        self.var += delta * delta2

    def normalize(self, reward: float) -> float:
        """
        Normalize a reward using current statistics.

        Args:
            reward: Reward to normalize

        Returns:
            Normalized reward (approximately zero-mean, unit variance)
        """
        if self.count < 2:
            return reward

        std = math.sqrt(self.var / (self.count - 1) + self.epsilon)
        return (reward - self.mean) / std

    def update_batch(self, rewards: list[float]) -> None:
        """
        Update statistics with batch of rewards.

        Args:
            rewards: List of reward values
        """
        for r in rewards:
            self.update(r)

    def normalize_batch(self, rewards: list[float]) -> list[float]:
        """
        Normalize batch of rewards.

        Args:
            rewards: List of rewards to normalize

        Returns:
            List of normalized rewards
        """
        return [self.normalize(r) for r in rewards]
