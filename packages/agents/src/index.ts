/**
 * @babylon/agents - Babylon Agent System
 *
 * This package provides the core agent infrastructure for Babylon:
 * - Agent services (creation, management, points)
 * - Autonomous behaviors (trading, posting, commenting, messaging)
 * - Agent identity and wallet management
 * - Plugin system for extending agent capabilities
 * - Agent0 integration for on-chain reputation
 */

// Agent0 integration (feedback/reputation)
export * from './agent0';
// Autonomous services
export * from './autonomous';
// Communication
export * from './communication/CommunicationHub';
export * from './communication/EventBus';
// Errors
export * from './errors';
// External agent adapter
export {
  type AgentResponse,
  AuthMethod,
  ExternalAgentAdapter,
  type ExternalAgentConnection,
  type ExternalAgentMessage,
  getExternalAgentAdapter,
  type Protocol,
} from './external/ExternalAgentAdapter';
// Identity and wallet management
export * from './identity/AgentIdentityService';
export * from './identity/AgentWalletService';
// LLM integrations
export * from './llm';
// Plugins - Babylon plugin is the main export
export {
  babylonPlugin,
  initializeAgentA2AClient,
  initializeBabylonPlugin,
} from './plugins/babylon';
export type { BabylonRuntime } from './plugins/babylon/types';
// Plugin utilities
export { groqPlugin } from './plugins/groq';
export * from './plugins/plugin-agent-core/src';
export * from './plugins/plugin-autonomy/src';
export * from './plugins/plugin-experience/src';
// Plugin sub-exports for trajectory logging, autonomy, experience
export * from './plugins/plugin-trajectory-logger/src';
// Runtime
export * from './runtime/AgentRuntimeManager';
// Services
export * from './services';
// Shared utilities
export {
  getAgentConfig,
  getAutonomousFeatures,
  hasAnyAutonomousFeature,
  isAutonomousCommentingEnabled,
  isAutonomousDMsEnabled,
  isAutonomousGroupChatsEnabled,
  isAutonomousPostingEnabled,
  isAutonomousTradingEnabled,
} from './shared/agent-config';
// Templates loader
export * from './templates-loader';
// Training utilities (RL model fetching, config)
export * from './training';
// Core types
export * from './types';
export * from './types/agent-template';
export * from './types/goals';
// Utils
export * from './utils/createTestAgent';
export * from './utils/prompt-builder';
