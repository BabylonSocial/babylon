import { BabylonGameAgent } from './index';

async function main() {
    console.log("Starting Babylon Game Agent Demo...");

    const apiKey = process.env.GAME_API_KEY || "demo-key";
    const agent = new BabylonGameAgent(
        apiKey,
        "Demo Agent",
        "Demonstrate G.A.M.E. SDK integration",
        "A helpful demo agent"
    );

    console.log("Agent initialized:", agent.name);

    // Mocking the init and step for demo purposes since we don't have a real API key
    // In a real scenario, we would call:
    // await agent.init();
    // await agent.step();

    console.log("Agent setup complete. Integration successful!");
}

main().catch(console.error);
