import { BabylonGameAgent } from './index';
import { BabylonA2AClient } from '../plugins/babylon/integration-a2a-sdk';
import { A2AClient } from '@a2a-js/sdk/client';

// Load environment variables
const path = require('path');
const fs = require('fs');

// Try to find .env in common locations
const possiblePaths = [
    path.resolve(__dirname, '../../../../.env'), // From source file
    path.resolve(process.cwd(), '../../.env'),   // From packages/agents
    path.resolve(process.cwd(), '.env'),         // From current dir
];

let envPath = "";
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        envPath = p;
        break;
    }
}

if (envPath) {
    console.log(`Loading .env from: ${envPath}`);
    require('dotenv').config({ path: envPath });
} else {
    console.warn("WARNING: Could not find .env file in any common location.");
}

async function main() {
    console.log("Starting Babylon Game Agent Full Integration Test...");

    // Check if API key is provided
    const apiKey = process.env.GAME_API_KEY;
    if (!apiKey) {
        console.error("ERROR: GAME_API_KEY not found in environment variables.");
        console.error("Searched locations:", possiblePaths);
        console.error("Please ensure your .env file exists and contains GAME_API_KEY.");
        process.exit(1);
    }

    console.log(`API Key found: ${apiKey.substring(0, 8)}...`);

    // Initialize real A2A Client
    const baseUrl = process.env.BABYLON_A2A_ENDPOINT || 'http://localhost:3000';
    console.log(`Connecting to A2A at: ${baseUrl}`);

    // biome-ignore lint/suspicious/noExplicitAny: Runtime is partially mocked here
    let runtime: any = undefined;

    try {
        const agentCardUrl = `${baseUrl}/.well-known/agent-card.json`;
        console.log(`Fetching agent card from: ${agentCardUrl}`);
        const sdkClient = await A2AClient.fromCardUrl(agentCardUrl);
        const a2aClient = new BabylonA2AClient(sdkClient, "test-agent-integration");

        runtime = {
            a2aClient,
            agentId: "test-agent-integration"
        };
        console.log("Successfully connected to A2A Client");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn("WARNING: Failed to connect to A2A Client:", errorMessage);
        console.warn("Running in disconnected mode (some features will be unavailable)");
    }

    const agent = new BabylonGameAgent(
        apiKey,
        "Test Agent",
        "Verify full integration of Trading and Social functions",
        "A test agent for Babylon G.A.M.E. SDK integration",
        {
            runtime,
            llmConfig: {
                model: process.env.GAME_LLM_MODEL || "Llama-3.3-70B-Instruct",
                apiKey: process.env.OPENAI_API_KEY, // Optional, only if using custom model
                baseUrl: process.env.OPENAI_API_KEY ? "https://api.openai.com/v1" : undefined,
            },
        }
    );

    console.log("Agent initialized successfully.");

    // Access private agent property for testing (using any cast to bypass TS)
    // biome-ignore lint/suspicious/noExplicitAny: Testing private property
    const gameAgent = (agent as any).agent;

    console.log("\n--- Verifying Workers ---");
    const workers = gameAgent.workers;
    console.log(`Total Workers: ${workers.length}`);

    // biome-ignore lint/suspicious/noExplicitAny: Testing private property
    const tradingWorker = workers.find((w: any) => w.id === "trading_worker");
    console.log(`Trading Worker found: ${!!tradingWorker}`);
    if (tradingWorker) {
        // biome-ignore lint/suspicious/noExplicitAny: Testing private property
        console.log(`Trading Functions: ${tradingWorker.functions.map((f: any) => f.name).join(", ")}`);
    }

    // biome-ignore lint/suspicious/noExplicitAny: Testing private property
    const socialWorker = workers.find((w: any) => w.id === "social_worker");
    console.log(`Social Worker found: ${!!socialWorker}`);
    if (socialWorker) {
        // biome-ignore lint/suspicious/noExplicitAny: Testing private property
        console.log(`Social Functions: ${socialWorker.functions.map((f: any) => f.name).join(", ")}`);
    }

    console.log("\n--- Verifying State Management ---");
    const state = await gameAgent.getAgentState();
    console.log("Agent State:", state);

    console.log("\n--- Running Remote Execution ---");
    try {
        console.log("Initializing agent...");
        await agent.init();
        console.log("Agent initialized.");

        const ROUNDS = 3;
        const DELAY_MS = 65000; // 65 seconds to be safe (limit is often 60s)

        for (let i = 1; i <= ROUNDS; i++) {
            console.log(`\n--- Round ${i}/${ROUNDS} ---`);
            console.log(`Executing step...`);
            await agent.step();
            console.log(`Step ${i} executed successfully.`);

            if (i < ROUNDS) {
                console.log(`Waiting ${DELAY_MS / 1000} seconds to respect rate limits...`);
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }
        // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
    } catch (error: any) {
        console.error("Execution failed:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        }
    }

    console.log("\nTest Complete.");
}

main().catch(console.error);
