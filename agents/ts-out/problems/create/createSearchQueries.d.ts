import { BaseProblemSolvingAgent } from "../../baseProblemSolvingAgent.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
export declare class CreateSearchQueriesProcessor extends BaseProblemSolvingAgent {
    renderCommonPromptSection(): string;
    renderProblemPrompt(problem: string): Promise<(HumanMessage | SystemMessage)[]>;
    renderEntityPrompt(problem: string, entity: IEngineAffectedEntity): Promise<(HumanMessage | SystemMessage)[]>;
    process(): Promise<void>;
}
//# sourceMappingURL=createSearchQueries.d.ts.map