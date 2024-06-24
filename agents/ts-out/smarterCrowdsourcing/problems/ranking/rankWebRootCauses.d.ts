import { BaseProblemSolvingAgent } from "../../../base/baseProblemSolvingAgent.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { RootCauseWebPageVectorStore } from "../../../vectorstore/rootCauseWebPage.js";
export declare class RankWebRootCausesProcessor extends BaseProblemSolvingAgent {
    rootCauseWebPageVectorStore: RootCauseWebPageVectorStore;
    renderProblemPrompt(rootCausesToRank: string[], rootCauseType: keyof PSRootCauseRawWebPageData): Promise<(SystemMessage | HumanMessage)[]>;
    rankWebRootCauses(): Promise<void>;
    process(): Promise<void>;
}
//# sourceMappingURL=rankWebRootCauses.d.ts.map