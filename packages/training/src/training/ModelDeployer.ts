/**
 * Model Deployer Service
 *
 * Automatically deploys trained models from Vercel Blob to agents.
 * Handles gradual rollout and rollback if needed.
 */

import { eq } from '@babylon/db';
import { db, trainedModels, users } from '@babylon/db/runtime';
import { getAgentRuntimeManager } from '../dependencies';
import { logger } from '../utils/logger';

export interface DeploymentOptions {
  modelVersion: string;
  strategy: 'immediate' | 'gradual' | 'test';
  rolloutPercentage?: number; // For gradual deployment (default: 10%)
  testAgentIds?: string[]; // For test deployment
}

export interface DeploymentResult {
  success: boolean;
  agentsUpdated: number;
  deploymentId: string;
  error?: string;
}

export class ModelDeployer {
  /**
   * Deploy model to agents
   */
  async deploy(options: DeploymentOptions): Promise<DeploymentResult> {
    logger.info('Starting model deployment', {
      version: options.modelVersion,
      strategy: options.strategy,
    });

    // Get model
    const modelResult = await db
      .select()
      .from(trainedModels)
      .where(eq(trainedModels.version, options.modelVersion))
      .limit(1);

    const model = modelResult[0];

    if (!model) {
      throw new Error(`Model ${options.modelVersion} not found`);
    }

    // Get target agents
    const targetAgents = await this.getTargetAgents(options);

    logger.info(`Deploying to ${targetAgents.length} agents`);

    const deploymentId = `deploy-${Date.now()}`;

    // Update model status
    await db
      .update(trainedModels)
      .set({
        status: 'deployed',
        deployedAt: new Date(),
        agentsUsing: targetAgents.length,
      })
      .where(eq(trainedModels.modelId, model.modelId));

    // Clear agent runtimes so they pick up the new model
    for (const agent of targetAgents) {
      getAgentRuntimeManager().resetRuntime(agent.id);
    }

    logger.info('Model deployed successfully', {
      version: options.modelVersion,
      agentsUpdated: targetAgents.length,
      deploymentId,
      runtimesCleared: targetAgents.length,
    });

    return {
      success: true,
      agentsUpdated: targetAgents.length,
      deploymentId,
    };
  }

  /**
   * Get target agents based on deployment strategy
   */
  private async getTargetAgents(options: DeploymentOptions) {
    const agents = await db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(eq(users.isAgent, true));

    switch (options.strategy) {
      case 'immediate':
        return agents;

      case 'gradual':
        const percentage = options.rolloutPercentage || 10;
        const count = Math.ceil(agents.length * (percentage / 100));
        return agents.slice(0, count);

      case 'test':
        if (options.testAgentIds) {
          return agents.filter((a: (typeof agents)[number]) =>
            options.testAgentIds!.includes(a.id)
          );
        }
        return agents.slice(0, 1); // Just first agent

      default:
        return agents;
    }
  }

  /**
   * Rollback to previous model version
   */
  async rollback(
    currentVersion: string,
    targetVersion: string
  ): Promise<DeploymentResult> {
    logger.info('Rolling back model', {
      from: currentVersion,
      to: targetVersion,
    });

    // Simply deploy the target version
    return await this.deploy({
      modelVersion: targetVersion,
      strategy: 'immediate',
    });
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<{
    status: string;
    agentsUpdated: number;
    agentsFailed: number;
    performance: Record<string, number>;
  } | null> {
    // Since we don't have modelDeployment table, return basic status
    const timestampPart = deploymentId.split('-')[1];
    if (!timestampPart) {
      return null;
    }

    // Return a placeholder status
    return {
      status: 'deployed',
      agentsUpdated: 0,
      agentsFailed: 0,
      performance: {},
    };
  }
}

// Singleton
export const modelDeployer = new ModelDeployer();
