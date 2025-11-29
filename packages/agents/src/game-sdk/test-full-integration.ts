import { BabylonGameAgent } from './index';

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


    const agent = new BabylonGameAgent(
        apiKey || "mock-api-key",
        "Test Agent",
        "Verify full integration of Trading and Social functions",
        "A test agent for Babylon G.A.M.E. SDK integration",
        {
            model: process.env.GAME_LLM_MODEL || "Llama-3.3-70B-Instruct",
            apiKey: process.env.OPENAI_API_KEY, // Optional, only if using custom model
            baseUrl: process.env.OPENAI_API_KEY ? "https://api.openai.com/v1" : undefined,
        }
    );

    console.log("Agent initialized successfully.");

    // Access private agent property for testing (using any cast to bypass TS)
    const gameAgent = (agent as any).agent;

    console.log("\n--- Verifying Workers ---");
    const workers = gameAgent.workers;
    console.log(`Total Workers: ${workers.length}`);

    const tradingWorker = workers.find((w: any) => w.id === "trading_worker");
    console.log(`Trading Worker found: ${!!tradingWorker}`);
    if (tradingWorker) {
        console.log(`Trading Functions: ${tradingWorker.functions.map((f: any) => f.name).join(", ")}`);
    }

    const socialWorker = workers.find((w: any) => w.id === "social_worker");
    console.log(`Social Worker found: ${!!socialWorker}`);
    if (socialWorker) {
        console.log(`Social Functions: ${socialWorker.functions.map((f: any) => f.name).join(", ")}`);
    }

    console.log("\n--- Verifying State Management ---");
    const state = await gameAgent.getAgentState();
    console.log("Agent State:", state);

    console.log("\n--- Running Remote Execution (with provided/mock key) ---");
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
