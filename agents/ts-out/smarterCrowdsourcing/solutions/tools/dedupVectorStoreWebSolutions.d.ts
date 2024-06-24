import { BaseProblemSolvingAgent } from "../../../base/baseProblemSolvingAgent.js";
import { WebPageVectorStore } from "../../../vectorstore/webPage.js";
export declare class RemoveDuplicateVectorStoreWebSolutions extends BaseProblemSolvingAgent {
    webPageVectorStore: WebPageVectorStore;
    allUrls: Set<string>;
    duplicateUrls: string[];
    constructor(memory: PsSmarterCrowdsourcingMemoryData);
    removeDuplicates(subProblemIndex: number): Promise<void>;
    process(): Promise<void>;
}
//# sourceMappingURL=dedupVectorStoreWebSolutions.d.ts.map