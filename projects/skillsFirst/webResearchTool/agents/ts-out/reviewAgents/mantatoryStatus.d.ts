import { PsAiModelSize } from "@policysynth/agents/aiModelTypes.js";
import { PolicySynthAgent } from "@policysynth/agents/base/agent.js";
import { PsAgent } from "@policysynth/agents/dbModels/agent.js";
export declare class DetermineMandatoryStatusAgent extends PolicySynthAgent {
    memory: JobDescriptionMemoryData;
    modelSize: PsAiModelSize;
    maxModelTokensOut: number;
    modelTemperature: number;
    constructor(agent: PsAgent, memory: JobDescriptionMemoryData, startProgress: number, endProgress: number);
    processJobDescription(jobDescription: JobDescription): Promise<void>;
    private determineMandatoryStatusExplanations;
}
//# sourceMappingURL=mantatoryStatus.d.ts.map