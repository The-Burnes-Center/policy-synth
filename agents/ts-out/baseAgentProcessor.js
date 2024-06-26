import ioredis from "ioredis";
import { PolicySynthAgentBase } from "./baseAgent.js";
const redis = new ioredis(process.env.REDIS_MEMORY_URL || "redis://localhost:6379");
export class BaseAgentProcessor extends PolicySynthAgentBase {
    job;
    getRedisKey(groupId) {
        return `st_mem:${groupId}:id`;
    }
    async setup(job) {
        this.job = job;
        const jobData = job.data;
        try {
            const memoryData = (await redis.get(this.getRedisKey(jobData.groupId)));
            if (memoryData) {
                this.memory = JSON.parse(memoryData);
            }
            else {
                console.error("No project data found, user createNewCustomProject script in tools");
                //await this.initializeMemory(job);
                //this.logger.debug(`Initialized memory for ${JSON.stringify(jobData)}`);
            }
        }
        catch (error) {
            this.logger.error("Error initializing memory");
            this.logger.error(error);
        }
    }
    async saveMemory() {
        if (this.memory) {
            this.memory.lastSavedAt = Date.now();
            await redis.set(this.memory.redisKey, JSON.stringify(this.memory));
        }
        else {
            this.logger.error("No memory to save");
        }
    }
}
//# sourceMappingURL=baseAgentProcessor.js.map