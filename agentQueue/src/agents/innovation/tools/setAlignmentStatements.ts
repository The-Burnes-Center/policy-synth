import { Queue } from "bullmq";
import ioredis from "ioredis";

const redis = new ioredis.default(
  process.env.REDIS_MEMORY_URL || "redis://localhost:6379"
);

const myQueue = new Queue("agent-innovation");

const output = await redis.get("st_mem:1:id");

const memory = JSON.parse(output!) as IEngineInnovationMemoryData;
memory.customInstructions = {} as any;
memory.customInstructions.createSolutions = `
  1. Never create solutions in the form of frameworks or holistic approaches
  2. Solutions should include only one core idea.
  3. The solution title should indicate the benefits or results of implementing the solution.
  4. Remember that the main facilitator for implementation will be civil society working with governments.
  5. Frame solutions with the intention of convincing politicians and governments to put them into action.
  6. Avoid blockchain solutions
`;

memory.customInstructions.rankSolutions = `
  1. Assess the solutions based on:
  - Importance to the problem
  - How innovation they are
  - How practical they are
  2. Favor simple, easy to understand ideas
`;

await redis.set("st_mem:1:id", JSON.stringify(memory));

console.log("After saving");

process.exit(0);
